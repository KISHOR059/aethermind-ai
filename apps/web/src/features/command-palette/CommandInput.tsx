import { Search, X } from "lucide-react";

import { COMMAND_LIST_ID } from "./command-palette.constants";
import { CommandShortcuts } from "./CommandShortcuts";

export type CommandInputProps = {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
};

export function CommandInput({ query, onQueryChange, placeholder }: CommandInputProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        autoFocus
        role="combobox"
        aria-expanded="true"
        aria-controls={COMMAND_LIST_ID}
        aria-autocomplete="list"
        aria-label="Search commands"
        spellCheck={false}
        autoComplete="off"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
      {query ? (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          aria-label="Clear search"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <CommandShortcuts keys={["Esc"]} />
      )}
    </div>
  );
}
