<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * List tasks for the authenticated user with search and status filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->tasks();

        if ($request->filled('status')) {
            $status = $request->query('status');
            if (in_array($status, ['Pending', 'In Progress', 'Completed'])) {
                $query->where('status', $status);
            }
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'tasks' => $tasks,
        ]);
    }

    /**
     * Store a new task for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['nullable', 'in:Pending,In Progress,Completed'],
            'due_date' => ['nullable', 'date'],
        ]);

        $task = $request->user()->tasks()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? 'Pending',
            'due_date' => $validated['due_date'] ?? null,
        ]);

        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task,
        ], 201);
    }

    /**
     * Show a specific task.
     */
    public function show(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to task'], 403);
        }

        return response()->json([
            'task' => $task,
        ]);
    }

    /**
     * Update an existing task.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to task'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', 'required', 'in:Pending,In Progress,Completed'],
            'due_date' => ['nullable', 'date'],
        ]);

        $task->update($validated);

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task,
        ]);
    }

    /**
     * Delete an existing task.
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        if ($task->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized access to task'], 403);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Get dashboard statistics for the authenticated user.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        $total = $user->tasks()->count();
        $pending = $user->tasks()->where('status', 'Pending')->count();
        $inProgress = $user->tasks()->where('status', 'In Progress')->count();
        $completed = $user->tasks()->where('status', 'Completed')->count();

        $recentTasks = $user->tasks()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'stats' => [
                'total' => $total,
                'pending' => $pending,
                'in_progress' => $inProgress,
                'completed' => $completed,
            ],
            'recent_tasks' => $recentTasks,
        ]);
    }
}
