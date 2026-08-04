import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assistantService } from "./assistant.service";

export const assistantKeys = {
  conversations: ["assistant", "conversations"] as const,
  messages: (id: string) => ["assistant", "messages", id] as const,
};

export function useConversations() {
  return useQuery({
    queryKey: assistantKeys.conversations,
    queryFn: assistantService.getConversations,
  });
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: assistantKeys.messages(conversationId ?? ""),
    queryFn: () => assistantService.getMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => assistantService.createConversation(title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assistantKeys.conversations });
    },
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      assistantService.renameConversation(id, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assistantKeys.conversations });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assistantService.deleteConversation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assistantKeys.conversations });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
      assistantService.sendMessage(message, conversationId),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: assistantKeys.conversations });
      if (data?.conversation?._id) {
        void queryClient.invalidateQueries({
          queryKey: assistantKeys.messages(data.conversation._id),
        });
      }
    },
  });
}
