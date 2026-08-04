import { Bot, User as UserIcon } from "lucide-react";
import type { Message } from "./assistant.types";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/lib/cn";

export interface MessageBubbleProps {
  message: Message;
  userName?: string;
}

export function MessageBubble({ message, userName }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3",
        isUser ? "flex-row-reverse text-right" : "flex-row text-left",
      )}
    >
      <Avatar
        className={cn(
          "size-8 shrink-0 border",
          isUser
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary/20 bg-primary/10 text-primary",
        )}
      >
        <AvatarFallback
          className={
            isUser
              ? "bg-primary text-primary-foreground text-xs font-semibold"
              : "bg-primary/10 text-primary"
          }
        >
          {isUser ? (
            userName ? (
              userName.slice(0, 2).toUpperCase()
            ) : (
              <UserIcon className="size-4" />
            )
          ) : (
            <Bot className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm space-y-1.5",
          isUser
            ? "rounded-tr-none bg-primary text-primary-foreground"
            : "rounded-tl-none bg-card border text-card-foreground",
        )}
      >
        <div className="text-xs font-medium opacity-70">
          {isUser ? "You" : "AetherMind"}
        </div>

        {/* Content Body */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Execution Metrics Footer for Assistant */}
        {!isUser && message.metrics && (
          <div className="pt-2 mt-2 border-t border-border/50 text-[10px] text-muted-foreground flex flex-wrap items-center gap-2">
            <span>
              {message.metrics.provider} • {message.metrics.model} •{" "}
              {message.metrics.executionTime}ms
            </span>
            {message.metrics.tokenUsage && (
              <span>• {message.metrics.tokenUsage.totalTokens} tokens</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
