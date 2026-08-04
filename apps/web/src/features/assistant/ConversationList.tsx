import { useState } from "react";
import { MessageSquare, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import type { Conversation } from "./assistant.types";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

export interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv._id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={onNew}
        className="w-full justify-start gap-2 text-sm shadow-sm"
        size="sm"
      >
        <Plus className="size-4" />
        New Conversation
      </Button>

      <div className="space-y-1">
        <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Recent Chats
        </p>

        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground text-center">
            No past conversations yet.
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeId;
            const isEditing = conv._id === editingId;

            return (
              <div
                key={conv._id}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent text-muted-foreground hover:text-foreground",
                )}
              >
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(conv._id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(conv._id);
                    }}
                    autoFocus
                    className="h-7 text-xs py-0 px-1.5"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(conv._id)}
                    className="flex flex-1 items-center gap-2 truncate text-left"
                  >
                    <MessageSquare className="size-3.5 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={() => handleStartEdit(conv)}>
                      <Pencil className="mr-2 size-3.5" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(conv._id)}
                      className="text-rose-600 focus:text-rose-600"
                    >
                      <Trash2 className="mr-2 size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
