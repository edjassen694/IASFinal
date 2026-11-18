import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import type { ChatMessage } from '../types';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Loader2, 
  RotateCcw, 
  HelpCircle, 
  Compass, 
  ListOrdered,
  Lightbulb
} from 'lucide-react';

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your **TaskMate AI Assistant**.\n\nI have direct access to your current tasks stored in your database. I can help you:\n- **Summarize** your pending deadlines\n- **Recommend** which task to tackle next\n- **Suggest** priority rankings based on due dates\n- **Provide** productivity advice and strategies (Pomodoro, Eisenhower Matrix, etc.)\n\nHow can I assist you with your tasks today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const quickPrompts = [
    { label: 'Summarize my pending tasks', icon: ListOrdered },
    { label: 'What task should I work on next?', icon: Compass },
    { label: 'Suggest priorities for my tasks', icon: HelpCircle },
    { label: 'Productivity advice for my workload', icon: Lightbulb },
  ];

  const handleSend = async (messageText = input) => {
    const text = messageText.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      // Build history for context (exclude welcome)
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.askAi(text, history);

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      const errorObj = err as Error;
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error communicating with AI:**\n${errorObj.message || 'Unable to contact backend AI service. Please verify your connection or backend configuration.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Chat cleared! I'm ready to help you analyze and prioritize your tasks. What would you like to know?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Simple Markdown renderer for basic bold, lists, and links
  const renderMessageContent = (content: string) => {
    return (
      <div className="space-y-2 text-sm leading-relaxed whitespace-pre-wrap">
        {content.split('\n').map((line, idx) => {
          // Bold formatting **text**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx} className={line.startsWith('- ') ? 'pl-3 relative' : ''}>
              {line.startsWith('- ') && (
                <span className="absolute left-0 text-indigo-500 font-bold">•</span>
              )}
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-semibold text-slate-900">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">TaskMate AI Assistant</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected to Database
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Real AI assistant with secure backend integration and live task awareness
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          title="Reset conversation"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-xs overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-indigo-600 text-white shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm shadow-2xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span
                    className={`text-[11px] font-semibold ${
                      isUser ? 'text-indigo-200' : 'text-slate-500'
                    }`}
                  >
                    {isUser ? 'You' : 'TaskMate AI'}
                  </span>
                  <span
                    className={`text-[10px] ${
                      isUser ? 'text-indigo-300' : 'text-slate-400'
                    }`}
                  >
                    {message.timestamp}
                  </span>
                </div>

                {isUser ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  renderMessageContent(message.content)
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-50 border border-slate-200 text-slate-500 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>TaskMate AI is analyzing your tasks...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Suggestions:
        </span>
        {quickPrompts.map((qp, idx) => {
          const Icon = qp.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSend(qp.label)}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Icon className="w-3.5 h-3.5 text-indigo-500" />
              <span>{qp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input Box */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your tasks, priorities, or productivity advice..."
            rows={2}
            className="flex-1 resize-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg shadow-2xs transition cursor-pointer shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 px-1">
          TaskMate AI provides recommendations only and will never automatically modify or delete tasks in your database.
        </p>
      </div>
    </div>
  );
};
