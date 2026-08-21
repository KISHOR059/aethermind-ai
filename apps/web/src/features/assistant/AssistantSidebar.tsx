import type { Conversation } from "./assistant.types";
import ConversationList from "./ConversationList";
import { cn } from "@/shared/lib/cn";

export interface AssistantSidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function AssistantSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  className,
}: AssistantSidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border/70 bg-card/50 p-3 shadow-2xs",
        className,
      )}
    >
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
        onNew={onNew}
        onRename={onRename}
        onDelete={onDelete}
      />
    </div>
  );
}

export default AssistantSidebar;
