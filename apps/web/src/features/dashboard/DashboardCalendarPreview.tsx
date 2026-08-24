import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

import type { Task } from "@/features/tasks/task.types";
import { formatShortTaskDueDate, isTaskSameDay } from "@/features/tasks/task.utils";
import TaskPriorityBadge from "@/features/tasks/TaskPriorityBadge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/cn";

export interface DashboardCalendarPreviewProps {
  tasks?: Task[];
  className?: string;
}

export function DashboardCalendarPreview({
  tasks = [],
  className,
}: DashboardCalendarPreviewProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust for Monday start (0 = Mon, 6 = Sun)
  const startingDayIndex = (firstDayOfMonth + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days array
  const calendarCells = [];

  // Previous month padding
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i),
    });
  }

  // Next month padding to fill grid (35 or 42)
  const remainingCells = 35 - calendarCells.length;
  if (remainingCells > 0) {
    for (let i = 1; i <= remainingCells; i++) {
      calendarCells.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }
  }

  const weekDayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  // Filter tasks for selected date
  const selectedDayTasks = tasks.filter(
    (t) => t.dueDate && isTaskSameDay(t.dueDate, selectedDate),
  );

  const isSelectedToday = isTaskSameDay(selectedDate.toISOString(), today);
  const selectedDateLabel = isSelectedToday
    ? "Today's Schedule"
    : selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " Schedule";

  return (
    <Card className={cn("rounded-lg border-border/60 bg-card shadow-2xs flex flex-col", className)}>
      <CardHeader className="p-3 sm:p-3.5 pb-2 flex flex-row items-center justify-between border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
            <CalendarDays className="size-3" />
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
            Calendar Matrix
          </CardTitle>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={prevMonth}
            className="size-5 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3" />
          </Button>
          <span className="text-[11px] font-semibold text-foreground px-1">{monthName}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={nextMonth}
            className="size-5 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center">
            {weekDayLabels.map((label, idx) => (
              <span key={idx} className="text-[10px] font-semibold text-muted-foreground/80 py-0.5">
                {label}
              </span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isTodayCell = isTaskSameDay(cell.date.toISOString(), today);
              const isSelected = isTaskSameDay(cell.date.toISOString(), selectedDate);
              const hasTaskOnDay = tasks.some(
                (t) => t.dueDate && isTaskSameDay(t.dueDate, cell.date),
              );

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDate(cell.date)}
                  className={`relative flex flex-col items-center justify-center h-7.5 rounded text-[11px] transition-colors cursor-pointer ${
                    cell.isCurrentMonth
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/30 font-normal"
                  } ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : isTodayCell
                        ? "bg-primary/15 text-primary font-bold hover:bg-primary/25"
                        : "hover:bg-muted/50"
                  }`}
                >
                  <span>{cell.day}</span>
                  {hasTaskOnDay && !isSelected && (
                    <span
                      className={`absolute bottom-0.5 size-1 rounded-full ${
                        isTodayCell ? "bg-primary" : "bg-primary/70"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Agenda Mini-Block */}
        <div className="space-y-1.5 pt-2 border-t border-border/40 flex-1 flex flex-col justify-start">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {selectedDateLabel}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {selectedDayTasks.length} task{selectedDayTasks.length === 1 ? "" : "s"}
            </span>
          </div>

          {selectedDayTasks.length === 0 ? (
            <div className="py-2.5 px-3 rounded-md bg-muted/20 border border-dashed border-border/50 text-center">
              <p className="text-[11px] text-muted-foreground">No tasks scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
              {selectedDayTasks.slice(0, 3).map((task) => {
                const shortDue = formatShortTaskDueDate(task.dueDate);
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-md bg-muted/30 hover:bg-muted/60 text-xs transition-colors"
                  >
                    <span className="truncate font-medium text-[11px] text-foreground flex-1">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <TaskPriorityBadge priority={task.priority} />
                      {shortDue && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 font-mono">
                          <Clock className="size-2 text-muted-foreground/70" />
                          {shortDue.includes("·") ? shortDue.split("·")[1].trim() : shortDue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium">
            {tasks.filter((t) => t.dueDate && isTaskSameDay(t.dueDate, today)).length} task(s) today
          </span>

          <Button
            asChild
            variant="ghost"
            size="xs"
            className="text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1 -mr-1 h-6"
          >
            <Link to="/calendar">
              Open Full Calendar
              <ArrowRight className="size-2.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardCalendarPreview;
