import { useEffect, useRef } from "react";
import { Bot, Plus, Trash2 } from "lucide-react";
import type { Message } from "./assistant.types";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import TypingIndicator from "./TypingIndicator";
import { Button } from "@/shared/components/ui/button";

export interface ChatWindowProps {
  messages: Message[];
  title?: string;
  userName?: string;
  isSending: boolean;
  onSendMessage: (text: string) => void;
  onNewConversation: () => void;
  onClearChat?: () => void;
}

export function ChatWindow({
  messages,
  title = "AI Productivity Assistant",
  userName,
  isSending,
  onSendMessage,
  onNewConversation,
  onClearChat,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">
            Your intelligent productivity coach. Ask about tasks, schedules, or performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewConversation} className="gap-1.5 text-xs">
            <Plus className="size-3.5" />
            New Conversation
          </Button>
          {onClearChat && (
            <Button variant="ghost" size="sm" onClick={onClearChat} className="gap-1.5 text-xs text-muted-foreground">
              <Trash2 className="size-3.5" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 text-center max-w-md mx-auto py-12">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold text-base">How can I help you today?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select a suggestion below or type your own question to start analyzing tasks and schedules.
              </p>
            </div>
            <SuggestionChips onSelectSuggestion={onSendMessage} disabled={isSending} />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg._id} message={msg} userName={userName} />
            ))}

            {isSending && <TypingIndicator />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 space-y-2 bg-background/50 rounded-b-xl">
        {messages.length > 0 && (
          <SuggestionChips onSelectSuggestion={onSendMessage} disabled={isSending} />
        )}
        <ChatInput
          onSendMessage={onSendMessage}
          disabled={isSending}
          lastAssistantMessage={
            messages.filter((m) => m.role === "assistant").pop()?.content
          }
        />
      </div>
    </div>
  );
}

export default ChatWindow;
