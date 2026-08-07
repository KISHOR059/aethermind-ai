import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { calendarService } from "../calendar.service";
import { calendarKeys } from "../calendar.hooks";
import type {
  CalendarEvent,
  CalendarEventsResult,
  CalendarRescheduleInput,
  CalendarRescheduleResult,
} from "../calendar.types";
import { formatShortDate } from "../calendar.utils";
import { taskKeys } from "@/features/tasks/task.hooks";
import type { TaskListData } from "@/features/tasks/task.types";
import { aiService } from "@/features/ai/ai.service";
import { invalidateWorkspaceTaskQueries } from "@/shared/lib/query.utils";
import { notify } from "@/shared/lib/notifications";

const DEFAULT_DURATION_MINUTES = 60;

export type RescheduleVariables = CalendarRescheduleInput & {
  previous?: { dueDate: string; estimatedMinutes?: number | null };
};

type CacheSnapshots = {
  calendar: [queryKey: readonly unknown[], data: CalendarEventsResult | undefined][];
  tasks: [queryKey: readonly unknown[], data: TaskListData | undefined][];
};

function eventDurationMinutes(event: CalendarEvent): number {
  if (event.allDay) return DEFAULT_DURATION_MINUTES;
  return Math.max(
    (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000,
    30,
  );
}

function buildOptimisticEvent(
  original: CalendarEvent,
  input: CalendarRescheduleInput,
): CalendarEvent {
  const estimatedMinutes =
    input.estimatedMinutes === null ||
    (input.estimatedMinutes === undefined && original.allDay)
      ? null
      : input.estimatedMinutes ?? eventDurationMinutes(original);
  const start = new Date(input.dueDate);
  const end = estimatedMinutes
    ? new Date(start.getTime() + estimatedMinutes * 60_000)
    : start;

  return {
    ...original,
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: estimatedMinutes == null,
  };
}

function snapshotCaches(queryClient: QueryClient): CacheSnapshots {
  return {
    calendar: queryClient.getQueriesData<CalendarEventsResult>({
      queryKey: calendarKeys.all,
    }),
    tasks: queryClient.getQueriesData<TaskListData>({
      queryKey: taskKeys.all,
    }),
  };
}

function restoreCaches(
  queryClient: QueryClient,
  snapshots: CacheSnapshots,
): void {
  snapshots.calendar.forEach(([key, data]) => {
    if (data) queryClient.setQueryData(key, data);
  });
  snapshots.tasks.forEach(([key, data]) => {
    if (data) queryClient.setQueryData(key, data);
  });
}

function applyOptimisticUpdate(
  queryClient: QueryClient,
  input: CalendarRescheduleInput,
): void {
  const calendarQueries = queryClient.getQueriesData<CalendarEventsResult>({
    queryKey: calendarKeys.all,
  });
  calendarQueries.forEach(([key, data]) => {
    if (!data) return;
    const original = data.events.find((event) => event.id === input.taskId);
    if (!original) return;
    const updated = buildOptimisticEvent(original, input);
    queryClient.setQueryData(key, {
      ...data,
      events: data.events.map((event) =>
        event.id === input.taskId ? updated : event,
      ),
    });
  });

  const taskQueries = queryClient.getQueriesData<TaskListData>({
    queryKey: taskKeys.all,
  });
  taskQueries.forEach(([key, data]) => {
    if (!data) return;
    queryClient.setQueryData(key, {
      ...data,
      items: data.items.map((task) =>
        task.id === input.taskId
          ? {
              ...task,
              dueDate: input.dueDate,
              estimatedMinutes:
                input.estimatedMinutes === null
                  ? undefined
                  : input.estimatedMinutes ?? task.estimatedMinutes,
            }
          : task,
      ),
    });
  });
}

export function useRescheduleTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    CalendarRescheduleResult,
    Error,
    RescheduleVariables,
    CacheSnapshots
  >({
    mutationFn: (input) =>
      calendarService.reschedule({
        taskId: input.taskId,
        dueDate: input.dueDate,
        ...(input.estimatedMinutes !== undefined && {
          estimatedMinutes: input.estimatedMinutes,
        }),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: calendarKeys.all });
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const snapshots = snapshotCaches(queryClient);
      applyOptimisticUpdate(queryClient, input);
      return snapshots;
    },
    onError: (error, _input, snapshots) => {
      if (snapshots) restoreCaches(queryClient, snapshots);
      notify.error(
        "Unable to move task",
        error instanceof Error ? error.message : undefined,
      );
    },
    onSuccess: (_result, input) => {
      if (!input.previous) return;
      toast("Task moved.", {
        description: `Moved to ${formatShortDate(new Date(input.dueDate))}.`,
        duration: 10_000,
        action: {
          label: "Undo",
          onClick: () => {
            void mutation.mutate({
              taskId: input.taskId,
              dueDate: input.previous!.dueDate,
              ...(input.previous!.estimatedMinutes !== undefined && {
                estimatedMinutes: input.previous!.estimatedMinutes,
              }),
            });
          },
        },
      });
    },
    onSettled: () => {
      void invalidateWorkspaceTaskQueries(queryClient);
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}

function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  if (a.allDay || b.allDay) return false;
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();
  return aStart < bEnd && bStart < aEnd;
}

function findConflicts(
  queryClient: QueryClient,
  taskId: string,
): CalendarEvent[] {
  const calendarQueries = queryClient.getQueriesData<CalendarEventsResult>({
    queryKey: calendarKeys.all,
  });

  const moved = calendarQueries.flatMap(([, data]) => data?.events ?? []).find(
    (event) => event.taskId === taskId,
  );
  if (!moved || moved.status === "COMPLETED") return [];

  const conflicts: CalendarEvent[] = [];
  const seen = new Set<string>();

  calendarQueries.forEach(([, data]) => {
    for (const event of data?.events ?? []) {
      if (event.taskId === taskId || seen.has(event.taskId)) continue;
      if (event.status === "COMPLETED") continue;
      if (eventsOverlap(moved, event)) {
        seen.add(event.taskId);
        conflicts.push(event);
      }
    }
  });

  return conflicts;
}

function formatSuggestionDate(dateOnly: string): string {
  const date = new Date(`${dateOnly}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export type RescheduleSuggestion = {
  taskId: string;
  title: string;
  suggestedDate: string | null;
  reason: string;
  conflictTitles: string[];
};

export type RescheduleEvaluationInput = {
  taskId: string;
  title: string;
  dueDate: string;
  estimatedMinutes?: number | null;
};

export function useRescheduleSuggestion() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "evaluating" | "ready">(
    "idle",
  );
  const [suggestion, setSuggestion] = useState<RescheduleSuggestion | null>(
    null,
  );

  const evaluate = useCallback(
    (input: RescheduleEvaluationInput) => {
      const conflicts = findConflicts(queryClient, input.taskId);

      if (conflicts.length === 0) {
        setStatus("idle");
        setSuggestion(null);
        return;
      }

      const conflictTitles = conflicts.map((conflict) => conflict.title);
      const fallbackReason = `Moving ${input.title} overlaps with ${conflictTitles
        .map((title) => `"${title}"`)
        .join(", ")}. Consider a different time slot.`;

      setStatus("evaluating");
      setSuggestion(null);

      aiService
        .smartReschedule()
        .then((result) => {
          const moved = result.data.movedTasks.find(
            (item) => item.taskId === input.taskId,
          );
          const reason = moved
            ? `Moving ${input.title} to ${formatSuggestionDate(moved.newDate)}. ${moved.reason}`
            : result.data.recommendations[0] ?? fallbackReason;

          setSuggestion({
            taskId: input.taskId,
            title: input.title,
            suggestedDate: moved?.newDate ?? null,
            reason,
            conflictTitles,
          });
          setStatus("ready");
        })
        .catch(() => {
          setSuggestion({
            taskId: input.taskId,
            title: input.title,
            suggestedDate: null,
            reason: fallbackReason,
            conflictTitles,
          });
          setStatus("ready");
        });
    },
    [queryClient],
  );

  const dismiss = useCallback(() => {
    setStatus("idle");
    setSuggestion(null);
  }, []);

  return { status, suggestion, evaluate, dismiss };
}
