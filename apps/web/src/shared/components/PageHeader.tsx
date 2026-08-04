import type { ReactNode } from "react";

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  level?: "h1" | "h2";
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  level = "h1",
}: PageHeaderProps) {
  const Heading = level;

  return (
    <div className="flex flex-col gap-4 pb-4 border-b border-border/50 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <Heading className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </Heading>
        {description && (
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}

export default PageHeader;
