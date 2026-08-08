import { SearchX } from "lucide-react";

export type CommandEmptyProps = {
  query: string;
};

export function CommandEmpty({ query }: CommandEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No results for &ldquo;{query}&rdquo;</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Try a command like &ldquo;new task&rdquo;, &ldquo;calendar&rdquo;, or &ldquo;plan my day&rdquo;.
      </p>
    </div>
  );
}
