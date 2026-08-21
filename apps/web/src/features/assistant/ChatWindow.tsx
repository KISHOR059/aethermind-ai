import { useEffect, useRef } from "react";
import { Bot, Trash2, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import type { Message } from "./assistant.types";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import AIThinkingIndicator from "./AIThinkingIndicator";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

export interface ChatWindowProps {
  messages: Message[];
  title?: string;
  userName?: string;
  isSending: boolean;
  onSendMessage: (text: string) => Promise<string> | void;
  onClearChat?: () => void;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

export function ChatWindow({
  messages,
  title = "AI Assistance",
  userName,
  isSending,
  onSendMessage,
  onClearChat,
  error,
  onRetry,
  className,
}: ChatWindowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom smoothly on message change or typing
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isSending]);

  const isEmpty = messages.length === 0;

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col rounded-2xl border border-border/70 bg-card/40 backdrop-blur-xs overflow-hidden shadow-2xs",
        className,
      )}
    >
      {/* Workspace Sub-Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 bg-background/50">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="size-3.5" />
          </div>
          <h2 className="truncate text-xs font-semibold text-foreground tracking-tight">{title}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {onClearChat && !isEmpty && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearChat}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground rounded-lg px-2"
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Start a new conversation</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Messages / Conversation Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 space-y-4"
      >
        <div className="mx-auto w-full max-w-3xl space-y-4">

          {/* Empty State */}
          {isEmpty ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-center py-8 space-y-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
                <Bot className="size-6" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  How can I help you today?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ask about your tasks, schedule, projects, or anything you need help with.
                </p>
              </div>

              <SuggestionChips onSelectSuggestion={onSendMessage} disabled={isSending} />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble key={msg._id} message={msg} userName={userName} />
              ))}

              {isSending && <AIThinkingIndicator />}

              {/* Inline Error State */}
              {error && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error.message || "Failed to generate AI response. Please try again."}</span>
                  </div>
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="h-6 text-[11px] gap-1 border-destructive/30 hover:bg-destructive/10"
                    >
                      <RefreshCw className="size-3" />
                      Retry
                    </Button>
                  )}
                </div>
              )}

              <div ref={bottomRef} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Floating Composer Area */}
      <div className="shrink-0 p-3 sm:p-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="mx-auto w-full max-w-3xl">
          <ChatInput
            onSendMessage={onSendMessage}
            disabled={isSending}
            lastAssistantMessage={
              messages.filter((m) => m.role === "assistant").pop()?.content
            }
          />
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
