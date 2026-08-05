import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { notify } from "@/shared/lib/notifications";

import { useCreateTask } from "./task.hooks";
import { createTaskSchema, type CreateTaskFormValues } from "./task.validation";
import { TASK_PRIORITIES } from "./task.types";

export interface CreateTaskDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  trigger,
}: CreateTaskDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (isControlled) {
      externalOnOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }
  };

  const createTask = useCreateTask();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { title: "", description: "", priority: "MEDIUM", dueDate: "" },
  });

  const onSubmit = (values: CreateTaskFormValues) => {
    createTask.mutate(values, {
      onSuccess: () => {
        reset();
        setOpen(false);
        notify.success("Task created", "Your task has been added to the workspace.");
      },
      onError: (error) => notify.error("Unable to create task", error.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button className="gap-1.5 shadow-2xs font-semibold">
            <Plus className="size-4" />
            Create Task
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>
            Add a new task to your workspace queue.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="task-title">
              Title
            </label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground" htmlFor="task-description">
              Description
            </label>
            <textarea
              id="task-description"
              className="flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
              placeholder="Add context or notes (optional)"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                {...register("priority")}
              >
                {TASK_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="task-due-date">
                Due date
              </label>
              <Input id="task-due-date" type="date" {...register("dueDate")} />
            </div>
          </div>

          {createTask.isError && (
            <p className="text-xs text-destructive">{createTask.error.message}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={createTask.isPending} className="w-full sm:w-auto">
              {createTask.isPending ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTaskDialog;
