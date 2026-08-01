import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { notify } from "@/shared/lib/notifications";

import { useCreateTask } from "./task.hooks";
import { createTaskSchema, type CreateTaskFormValues } from "./task.validation";
import { TASK_PRIORITIES } from "./task.types";

function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateTaskFormValues>({
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
      <DialogTrigger asChild><Button>New task</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create task</DialogTitle><DialogDescription>Add a task to your workspace.</DialogDescription></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor="task-title">Title</label><Input id="task-title" placeholder="What needs to be done?" {...register("title")} />{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}</div>
          <div className="space-y-2"><label className="text-sm font-medium" htmlFor="task-description">Description</label><textarea id="task-description" className="flex min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" placeholder="Add context (optional)" {...register("description")} />{errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="task-priority">Priority</label><select id="task-priority" className="h-9 w-full rounded-md border bg-background px-3 text-sm" {...register("priority")}>{TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority.charAt(0) + priority.slice(1).toLowerCase()}</option>)}</select></div>
            <div className="space-y-2"><label className="text-sm font-medium" htmlFor="task-due-date">Due date</label><Input id="task-due-date" type="date" {...register("dueDate")} /></div>
          </div>
          {createTask.isError && <p className="text-sm text-destructive">{createTask.error.message}</p>}
          <DialogFooter><Button type="submit" disabled={createTask.isPending}>{createTask.isPending ? "Creating…" : "Create task"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTaskDialog;
