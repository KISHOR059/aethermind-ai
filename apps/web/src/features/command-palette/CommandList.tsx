import type { KeyboardEvent } from "react";

import { COMMAND_LIST_ID } from "./command-palette.constants";
import type { CommandGroupView, CommandItemData } from "./command-palette.types";
import { CommandEmpty } from "./CommandEmpty";
import { CommandGroup } from "./CommandGroup";
import { CommandItem } from "./CommandItem";

export type CommandListProps = {
  groups: readonly CommandGroupView[];
  query: string;
  activeId?: string;
  onSelect: (item: CommandItemData) => void;
  onActiveChange: (item: CommandItemData, index: number) => void;
  registerRef: (id: string, element: HTMLButtonElement | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export function CommandList({
  groups,
  query,
  activeId,
  onSelect,
  onActiveChange,
  registerRef,
  onKeyDown,
}: CommandListProps) {
  let flatIndex = -1;

  return (
    <div
      id={COMMAND_LIST_ID}
      role="listbox"
      aria-label="Commands"
      onKeyDown={onKeyDown}
      className="flex-1 overflow-y-auto overscroll-contain px-2 py-2"
    >
      {groups.length === 0 ? (
        <CommandEmpty query={query} />
      ) : (
        groups.map((group) => (
          <CommandGroup key={group.id} label={group.label}>
            {group.items.map((item) => {
              flatIndex += 1;
              const index = flatIndex;
              return (
                <CommandItem
                  key={item.command.id}
                  item={item}
                  active={activeId === item.command.id}
                  onSelect={() => onSelect(item)}
                  onMouseMove={() => onActiveChange(item, index)}
                  registerRef={registerRef}
                />
              );
            })}
          </CommandGroup>
        ))
      )}
    </div>
  );
}
