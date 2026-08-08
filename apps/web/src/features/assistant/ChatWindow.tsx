import { useEffect, useRef, useState } from "react";
import { Bot, Trash2, Cpu } from "lucide-react";
import type { Message } from "./assistant.types";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import SuggestionChips from "./SuggestionChips";
import TypingIndicator from "./TypingIndicator";
import { Button } from "@/shared/components/ui/button";
import { VoiceControls, useOfflineVoiceAssistant } from "@/features/voice";

export interface ChatWindowProps {
  messages: Message[];
  title?: string;
  userName?: string;
  isSending: boolean;
  onSendMessage: (text: string) => Promise<string> | void;
  onClearChat?: () => void;
}

export function ChatWindow({
  messages,
  title = "AI Productivity Assistant",
  userName,
  isSending,
  onSendMessage,
  onClearChat,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showOfflineVoicePanel, setShowOfflineVoicePanel] = useState(false);

  const offlineVoice = useOfflineVoiceAssistant();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleOfflineSendToAssistant = async (text: string): Promise<string> => {
    const result = onSendMessage(text);
    if (result instanceof Promise) {
      return await result;
    }
    // Return last assistant message content if available
    const lastMsg = messages.filter((m) => m.role === "assistant").pop();
    return lastMsg?.content ?? "Task updated successfully.";
  };

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="size-4 shrink-0 text-primary" />
          <h2 className="truncate text-sm font-semibold">{title}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant={showOfflineVoicePanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOfflineVoicePanel(!showOfflineVoicePanel)}
            className="gap-1.5 text-xs h-8"
            title="Toggle Offline AI Voice Controls (Whisper.cpp & Piper TTS)"
          >
            <Cpu className="size-3.5 text-amber-300" />
            Offline Voice
          </Button>

          {onClearChat && (
            <Button variant="ghost" size="sm" onClick={onClearChat} className="gap-1.5 text-xs h-8 text-muted-foreground">
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-1">
        {/* Offline Voice Active Visualizer Panel */}
        {showOfflineVoicePanel && (
          <div className="mb-3">
            <VoiceControls
              voiceState={offlineVoice.voiceState}
              audioLevel={offlineVoice.audioLevel}
              responseAudioBuffer={offlineVoice.responseAudioBuffer}
              metrics={offlineVoice.metrics}
              onStartListen={offlineVoice.startVoiceInput}
              onStopListen={() =>
                offlineVoice.stopVoiceInputAndProcess(handleOfflineSendToAssistant)
              }
              onCancelListen={offlineVoice.cancelVoiceInput}
              onAudioEnded={offlineVoice.stopAudioPlayback}
            />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center max-w-md mx-auto">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">How can I help you today?</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ask about tasks, schedules, or productivity.
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
      <div className="border-t p-3 bg-background/50 rounded-b-xl">
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
