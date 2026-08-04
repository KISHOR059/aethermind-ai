import { useState } from "react";
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
import PageHeader from "@/shared/components/PageHeader";

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="AI Assistant"
        description="Chat with your personal AetherMind productivity coach to plan tasks, analyze bottlenecks, and optimize your work."
      />

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Sidebar - Recent Conversations */}
        <div className="col-span-12 lg:col-span-3 hidden lg:block h-[calc(100vh-14rem)]">
          <AssistantSidebar
            conversations={conversations}
            activeId={activeConversationId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onRename={handleRenameConversation}
            onDelete={handleDeleteConversation}
          />
        </div>

        {/* Main Chat Interface */}
        <div className="col-span-12 lg:col-span-9">
          <ChatWindow
            messages={messages}
            title={activeConv?.title ?? "AI Productivity Assistant"}
            userName={userName}
            isSending={sendMessageMutation.isPending}
            onSendMessage={handleSendMessage}
            onNewConversation={handleNewConversation}
            onClearChat={activeConversationId ? handleNewConversation : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default AssistantPage;
