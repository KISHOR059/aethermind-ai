import { useState } from "react";
import { MessageSquare, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
    <div className="flex h-full flex-col space-y-3">
      <Button
        onClick={onNew}
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 rounded-xl border-border/80 bg-background hover:bg-accent hover:text-foreground text-xs font-medium shadow-2xs"
      >
        <Plus className="size-3.5 text-primary" />
        <span>New Conversation</span>
      </Button>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        <div className="px-2 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Recent Chats
          </span>
        </div>

        {conversations.length === 0 ? (
          <div className="px-2 py-6 text-center text-xs text-muted-foreground/70">
            No past conversations
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv._id === activeId;
            const isEditing = conv._id === editingId;

            return (
              <div
                key={conv._id}
                className={cn(
                  "group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-all duration-150",
                  isActive
                    ? "bg-accent/80 text-foreground font-medium shadow-2xs"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(conv._id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(conv._id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                    className="h-6 text-xs py-0 px-1.5 rounded"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(conv._id)}
                    className="flex flex-1 items-center gap-2 truncate text-left"
                  >
                    <MessageSquare
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{conv.title}</span>
                  </button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Conversation actions"
                      className="size-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground rounded-md"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32 text-xs">
                    <DropdownMenuItem onClick={() => handleStartEdit(conv)} className="gap-2">
                      <Pencil className="size-3 text-muted-foreground" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(conv._id)}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-3 text-destructive" />
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
