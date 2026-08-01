import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  level?: "h1" | "h2";
};

function PageHeader({ eyebrow, title, description, actions, level = "h1" }: PageHeaderProps) {
  const Heading = level;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
        <Heading className="mt-1 text-3xl font-semibold tracking-tight">{title}</Heading>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export default PageHeader;
