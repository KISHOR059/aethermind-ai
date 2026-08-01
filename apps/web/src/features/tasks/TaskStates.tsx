import { AlertCircle, ClipboardList } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import EmptyState from "@/shared/components/EmptyState";

export function TaskEmptyState() { return <EmptyState icon={<ClipboardList className="size-8 text-muted-foreground" />} title="No tasks yet" description="Create a task to start organizing your work." />; }
export function TaskLoadingState() { return <div className="grid gap-4 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <Card key={item}><CardContent className="space-y-3 py-6"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/3" /></CardContent></Card>)}</div>; }
export function TaskErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><AlertCircle className="size-8 text-destructive" /><p className="font-medium">Unable to load tasks</p><p className="text-sm text-muted-foreground">{message}</p><Button variant="outline" onClick={onRetry}>Try again</Button></CardContent></Card>; }
