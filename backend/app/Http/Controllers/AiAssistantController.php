<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantController extends Controller
{
    /**
     * Process an AI chat message with user's task context.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'history' => ['nullable', 'array'],
            'history.*.role' => ['required_with:history', 'string', 'in:user,assistant,model'],
            'history.*.content' => ['required_with:history', 'string'],
        ]);

        $user = $request->user();
        $tasks = $user->tasks()->orderBy('due_date', 'asc')->get();

        // Build context about user's tasks
        $taskSummaryList = [];
        $pendingCount = 0;
        $inProgressCount = 0;
        $completedCount = 0;

        foreach ($tasks as $task) {
            if ($task->status === 'Pending') {
                $pendingCount++;
            } elseif ($task->status === 'In Progress') {
                $inProgressCount++;
            } elseif ($task->status === 'Completed') {
                $completedCount++;
            }

            $due = $task->due_date ? $task->due_date->format('Y-m-d') : 'No due date';
            $taskSummaryList[] = sprintf(
                '- [#%d] "%s" | Status: %s | Due: %s | Description: %s',
                $task->id,
                $task->title,
                $task->status,
                $due,
                $task->description ? str_replace(["\r", "\n"], ' ', $task->description) : 'None'
            );
        }

        $tasksContextText = empty($taskSummaryList)
            ? 'The user currently has no tasks recorded in the database.'
            : implode("\n", $taskSummaryList);

        $systemInstruction = <<<TEXT
You are TaskMate AI, an intelligent, helpful productivity assistant embedded directly in the TaskMate Task Management System.
You have direct read access to the authenticated user's current tasks stored in their actual database.

USER PROFILE:
- User Name: {$user->name}
- User Email: {$user->email}
- Current Date/Time: now

USER'S LIVE TASKS DATA:
- Total Tasks: {$tasks->count()}
- Pending: {$pendingCount}
- In Progress: {$inProgressCount}
- Completed: {$completedCount}

TASK LIST:
{$tasksContextText}

GUIDELINES & INSTRUCTIONS:
1. Answer general questions knowledgeably and concisely.
2. Provide actionable productivity advice (e.g. Eisenhower Matrix, Pomodoro technique, prioritizing urgent/important tasks).
3. Suggest task priorities based on actual deadlines and status from the user's task list.
4. Accurately summarize pending and in-progress tasks whenever asked.
5. Recommend specific tasks to tackle next (e.g. tasks with closest due dates, pending status, or high impact).
6. Ground all task answers strictly in the user's live task data provided above.
7. Tone: Professional, encouraging, clear, and structured (use markdown bullets and bold text where appropriate).
8. Boundary: You are an advisory assistant only. You cannot directly create, update, or delete tasks in the database; advise the user to perform those actions via the UI.
TEXT;

        $apiKey = env('GEMINI_API_KEY');
        $openaiKey = env('OPENAI_API_KEY');
        $groqKey = env('GROQ_API_KEY');

        // Check if any real AI key is configured
        if (! $apiKey && ! $openaiKey && ! $groqKey) {
            return response()->json([
                'reply' => "### ⚙️ AI API Key Configuration Required\n\nTaskMate AI connects to a **real AI model** (Google Gemini) through the backend, but no API key is configured yet.\n\n**How to obtain and configure your free Gemini API key:**\n1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and sign in with your Google account.\n2. Click **\"Create API key\"** (it is 100% free with no credit card required).\n3. Open `backend/.env` and add your key:\n   ```env\n   GEMINI_API_KEY=AIzaSy...\n   ```\n4. Once saved, send your message again and TaskMate AI will respond using the live model!\n\n*(Your current database tasks: **{$tasks->count()} total** — {$pendingCount} pending, {$inProgressCount} in progress, {$completedCount} completed.)*",
                'configured' => false,
            ]);
        }

        try {
            // Priority 1: Gemini API
            if ($apiKey) {
                return $this->callGemini($apiKey, $systemInstruction, $validated['message'], $validated['history'] ?? []);
            }

            // Priority 2: OpenAI API
            if ($openaiKey) {
                return $this->callOpenAI($openaiKey, $systemInstruction, $validated['message'], $validated['history'] ?? []);
            }

            // Priority 3: Groq API
            if ($groqKey) {
                return $this->callGroq($groqKey, $systemInstruction, $validated['message'], $validated['history'] ?? []);
            }
        } catch (\Throwable $e) {
            Log::error('AI Assistant Error: '.$e->getMessage());

            return response()->json([
                'reply' => 'TaskMate AI encountered an error contacting the AI service: '.$e->getMessage(),
                'error' => true,
            ], 500);
        }

        return response()->json([
            'reply' => 'No active AI provider configured.',
        ], 500);
    }

    /**
     * Call Google Gemini API
     */
    protected function callGemini(string $apiKey, string $systemInstruction, string $message, array $history): JsonResponse
    {
        $contents = [];

        // Add history
        foreach ($history as $item) {
            $role = ($item['role'] === 'assistant' || $item['role'] === 'model') ? 'model' : 'user';
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => $item['content']]],
            ];
        }

        // Add user current message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $message]],
        ];

        // Use gemini-2.0-flash or fallback to gemini-1.5-flash
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";

        $payload = [
            'system_instruction' => [
                'parts' => [
                    ['text' => $systemInstruction],
                ],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 1500,
            ],
        ];

        $response = Http::timeout(30)->post($url, $payload);

        if (! $response->successful()) {
            // Try gemini-1.5-flash as fallback if 2.0 returns error
            $fallbackUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}";
            $fallbackResponse = Http::timeout(30)->post($fallbackUrl, $payload);

            if (! $fallbackResponse->successful()) {
                $err = $response->json()['error']['message'] ?? $response->body();

                return response()->json([
                    'reply' => "Google Gemini API error: {$err}",
                    'error' => true,
                ], 502);
            }

            $data = $fallbackResponse->json();
        } else {
            $data = $response->json();
        }

        $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response received from AI.';

        return response()->json([
            'reply' => $reply,
            'configured' => true,
        ]);
    }

    /**
     * Call OpenAI API
     */
    protected function callOpenAI(string $apiKey, string $systemInstruction, string $message, array $history): JsonResponse
    {
        $messages = [
            ['role' => 'system', 'content' => $systemInstruction],
        ];

        foreach ($history as $item) {
            $role = $item['role'] === 'user' ? 'user' : 'assistant';
            $messages[] = ['role' => $role, 'content' => $item['content']];
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        $response = Http::withToken($apiKey)->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-4o-mini',
            'messages' => $messages,
            'temperature' => 0.7,
        ]);

        if (! $response->successful()) {
            $err = $response->json()['error']['message'] ?? $response->body();

            return response()->json(['reply' => "OpenAI API error: {$err}", 'error' => true], 502);
        }

        $reply = $response->json()['choices'][0]['message']['content'] ?? 'No response received.';

        return response()->json([
            'reply' => $reply,
            'configured' => true,
        ]);
    }

    /**
     * Call Groq API
     */
    protected function callGroq(string $apiKey, string $systemInstruction, string $message, array $history): JsonResponse
    {
        $messages = [
            ['role' => 'system', 'content' => $systemInstruction],
        ];

        foreach ($history as $item) {
            $role = $item['role'] === 'user' ? 'user' : 'assistant';
            $messages[] = ['role' => $role, 'content' => $item['content']];
        }

        $messages[] = ['role' => 'user', 'content' => $message];

        $response = Http::withToken($apiKey)->timeout(30)->post('https://api.groq.com/openai/v1/chat/completions', [
            'model' => 'llama-3.3-70b-versatile',
            'messages' => $messages,
            'temperature' => 0.7,
        ]);

        if (! $response->successful()) {
            $err = $response->json()['error']['message'] ?? $response->body();

            return response()->json(['reply' => "Groq API error: {$err}", 'error' => true], 502);
        }

        $reply = $response->json()['choices'][0]['message']['content'] ?? 'No response received.';

        return response()->json([
            'reply' => $reply,
            'configured' => true,
        ]);
    }
}
