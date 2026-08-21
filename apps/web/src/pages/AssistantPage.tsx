import { useState } from "react";
import { Bot, PanelLeftClose, PanelLeftOpen, Plus, History } from "lucide-react";
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
import { Button } from "@/shared/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/shared/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

export function AssistantPage() {
  const { user } = useAuth();
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [lastSentText, setLastSentText] = useState<string>("");

  const { data: conversations = [] } = useConversations();
  const { data: messages = [] } = useConversationMessages(activeConversationId);

  const renameConvMutation = useRenameConversation();
  const deleteConvMutation = useDeleteConversation();
  const sendMessageMutation = useSendMessage();

  const activeConv = conversations.find((c) => c._id === activeConversationId);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileDrawerOpen(false);
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    setMobileDrawerOpen(false);
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
    setLastSentText(messageText);
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

  const handleRetry = () => {
    if (lastSentText) {
      handleSendMessage(lastSentText);
    }
  };

  const userName = user ? `${user.firstName} ${user.lastName}` : undefined;

  return (
    <div className="flex h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-8rem)] lg:h-[calc(100vh-8.5rem)] flex-col gap-3">
      {/* Modern, Minimal Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-3">
          {/* Desktop Sidebar Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Hide conversations sidebar" : "Show conversations sidebar"}
                className="hidden lg:flex size-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{sidebarOpen ? "Collapse history" : "Expand history"}</p>
            </TooltipContent>
          </Tooltip>

          {/* Mobile History Drawer Sheet */}
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open conversation history"
                className="lg:hidden size-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <History className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-3">
              <SheetTitle className="sr-only">Conversation History</SheetTitle>
              <div className="h-full pt-4">
                <AssistantSidebar
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={handleSelectConversation}
                  onNew={handleNewConversation}
                  onRename={handleRenameConversation}
                  onDelete={handleDeleteConversation}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Bot className="size-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold leading-tight tracking-tight text-foreground">
                AI Assistance
              </h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Your intelligent workspace
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewConversation}
                className="h-8 gap-1.5 rounded-lg text-xs font-medium border-border/80 hover:bg-accent hover:text-foreground shadow-2xs"
              >
                <Plus className="size-3.5 text-primary" />
                <span>New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Start a fresh conversation</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 lg:gap-4">
        {/* Desktop Collapsible Sidebar */}
        {sidebarOpen && (
          <div className="col-span-3 hidden h-full min-h-0 lg:block transition-all duration-200">
            <AssistantSidebar
              conversations={conversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              onNew={handleNewConversation}
              onRename={handleRenameConversation}
              onDelete={handleDeleteConversation}
            />
          </div>
        )}

        {/* Central Workspace Chat Window */}
        <div
          className={cn(
            "col-span-12 h-full min-h-0 transition-all duration-200",
            sidebarOpen ? "lg:col-span-9" : "lg:col-span-12",
          )}
        >
          <ChatWindow
            messages={messages}
            title={activeConv?.title ?? "AI Assistance"}
            userName={userName}
            isSending={sendMessageMutation.isPending}
            error={sendMessageMutation.error}
            onSendMessage={handleSendMessage}
            onRetry={handleRetry}
            onClearChat={activeConversationId ? handleNewConversation : undefined}
          />
        </div>
      </div>
    </div>
  );
}

export default AssistantPage;
