import { CommandShortcuts } from "./CommandShortcuts";

export type CommandFooterProps = {
  isMac: boolean;
  activeLabel?: string;
};

export function CommandFooter({ isMac, activeLabel }: CommandFooterProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-3 sm:px-4 py-2 sm:py-2.5">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <CommandShortcuts keys={["↑", "↓"]} label="Navigate" />
        <CommandShortcuts keys={["↵"]} label="Select" />
        <CommandShortcuts keys={["Esc"]} label="Close" />
      </div>
      {activeLabel ? (
        <span className="hidden max-w-[30%] truncate text-[11px] text-muted-foreground md:inline">
          {activeLabel}
        </span>
      ) : null}
      <div className="hidden sm:block">
        <CommandShortcuts keys={[isMac ? "⌘" : "Ctrl", "K"]} label="Toggle" />
      </div>
    </div>
  );
}
