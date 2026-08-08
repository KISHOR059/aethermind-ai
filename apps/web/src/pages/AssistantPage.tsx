import { useState } from "react";
import { Bot } from "lucide-react";
import {
  useConversationMessages,
  useConversations,
  useDeleteConversation,
  useRenameConversation,
  useSendMessage,
} from "@/features/assistant/assistant.hooks";
import AssistantSidebar from "@/features/assistant/AssistantSidebar";
import ChatWindow from "@/features/assistant/ChatWindow";
import { useAuth } from "@/features/auth/hooks/auth.context";

export function AssistantPage() {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);

  const { data: conversations = [] } = useConversations();
  const { data: messages = [] } = useConversationMessages(activeConversationId);

  const renameConvMutation = useRenameConversation();
  const deleteConvMutation = useDeleteConversation();
  const sendMessageMutation = useSendMessage();

  const activeConv = conversations.find((c) => c._id === activeConversationId);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
  };

  const handleRenameConversation = (id: string, title: string) => {
    renameConvMutation.mutate({ id, title });
  };

  const handleDeleteConversation = (id: string) => {
    deleteConvMutation.mutate(id, {
      onSuccess: () => {
        if (activeConversationId === id) {
          setActiveConversationId(undefined);
        }
      },
    });
  };

  const handleSendMessage = (messageText: string) => {
    sendMessageMutation.mutate(
      {
        message: messageText,
        conversationId: activeConversationId,
      },
      {
        onSuccess: (data) => {
          if (data?.conversation?._id && !activeConversationId) {
            setActiveConversationId(data.conversation._id);
          }
        },
      },
    );
  };

  const userName = user ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-3 sm:h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)]">
      <header className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Your personal AetherMind productivity coach.</p>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-4">
        <div className="col-span-3 hidden h-full min-h-0 lg:block">
          <AssistantSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onRename={handleRenameConversation}
            onDelete={handleDeleteConversation}
          />
        </div>

        <div className="col-span-12 h-full min-h-0 lg:col-span-9">
          <ChatWindow
            messages={messages}
            title={activeConv?.title ?? "AI Productivity Assistant"}
            userName={userName}
            isSending={sendMessageMutation.isPending}
            onSendMessage={handleSendMessage}
            onClearChat={activeConversationId ? handleNewConversation : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default AssistantPage;
