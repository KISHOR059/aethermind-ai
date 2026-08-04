import type { ChangeEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="relative flex items-end gap-2 p-2 rounded-xl border bg-background shadow-md focus-within:ring-2 focus-within:ring-primary/20">
      <Textarea
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask AetherMind anything about your tasks, schedule, or productivity..."
        disabled={disabled}
        rows={1}
        className="min-h-[44px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0 text-sm py-2.5 px-3"
      />
      <Button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        size="icon"
        className="size-9 shrink-0 rounded-lg gap-1"
      >
        {disabled ? (
          <Sparkles className="size-4 animate-spin text-amber-300" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );
}

export default ChatInput;
