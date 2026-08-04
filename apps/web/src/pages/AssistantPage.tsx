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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
      {/* Sidebar - Recent Conversations */}
      <div className="lg:col-span-1 hidden lg:block h-[calc(100vh-10rem)]">
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
      <div className="lg:col-span-3">
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
  );
}

export default AssistantPage;
