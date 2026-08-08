import { Bot } from "lucide-react";
import type { Conversation } from "./assistant.types";
import ConversationList from "./ConversationList";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export interface AssistantSidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function AssistantSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: AssistantSidebarProps) {
  return (
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="py-2.5 px-4 border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          Conversations
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto p-2.5">
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onNew={onNew}
          onRename={onRename}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}

export default AssistantSidebar;
