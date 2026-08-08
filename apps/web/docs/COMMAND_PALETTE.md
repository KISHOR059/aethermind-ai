# Command Palette

The command palette (⌘K / Ctrl+K) is a keyboard-first launcher for navigating
AetherMind, creating tasks, running AI workflows, and controlling notifications.
It lives in `apps/web/src/features/command-palette`.

## Opening

| Action        | Shortcut         |
| ------------- | ---------------- |
| Toggle palette | `Ctrl+K` (macOS: `⌘K`) |
| Close / cancel | `Esc` (in picker mode, `Esc` returns to the main list) |
| Navigate items | `↑` / `↓`, `Tab` |
| Open item      | `Enter` |
| Jump to first / last | `Home` / `End` |

You can also click the "Search …" button in the app header, or call
`open()` from any consumer of `useCommandPalette()`.

## Architecture

```
src/features/command-palette/
├── CommandPalette.tsx          # Provider: global state, ⌘K shortcut, action-host dialogs
├── CommandPaletteDialog.tsx    # Dialog UI: query, modes, keyboard handling, execution
├── CommandInput.tsx            # Search input row
├── CommandList.tsx             # Scrollable grouped results (virtual-keyboard target)
├── CommandGroup.tsx            # Section label + items
├── CommandItem.tsx             # Row with fuzzy-match highlight + icon + hint
├── CommandEmpty.tsx            # "No results" state
├── CommandFooter.tsx           # Shortcut legend + active command
├── CommandShortcuts.tsx        # kbd pill renderer (also used by the header button)
├── command-palette.types.ts    # Domain types (commands, context, groups)
├── command-palette.constants.ts# Static commands, labels, limits, storage keys
├── command-palette.service.ts  # Pure logic: fuzzy search, grouping, builders, executor
├── command-palette.hooks.ts    # React Query index hooks + context
└── index.ts                    # Public exports
```

### Data flow

1. `CommandPaletteProvider` (mounted once in `AppLayout`) exposes
   `useCommandPalette()` and registers the global ⌘K/Ctrl+K listener.
2. On first open, the dialog chunk is lazy-loaded and stays mounted
   (hidden) so open/close animations play and search state resets per open.
3. The dialog builds commands from:
   - static command lists (`command-palette.constants.ts`),
   - date-aware calendar commands (`buildCalendarCommands`),
   - live tasks / calendar events / notifications from React Query indexes
     (`usePaletteTaskIndex`, `usePaletteEventIndex`, `usePaletteNotificationIndex`).
     Indexes are seeded from whatever is already in the query cache
     (`placeholderData`) and topped up with a single cached fetch, so the
     palette never fetches anything twice.
4. Typing runs a synchronous subsequence fuzzy match
   (`fuzzySearch`) with word-start / consecutive / prefix bonuses; results
   are grouped and capped per group.
5. `Enter` executes the active command via `resolveExecutor`, which either
   navigates (`route`), dispatches a context action, or opens one of the
   hosted dialogs. Executed commands and non-empty queries are recorded to
   `localStorage` ("Recent" section).

## URL parameters

Deep links used by the palette (all in the `/tasks` and `/calendar` routes):

| Route      | Params                                  | Effect |
| ---------- | --------------------------------------- | ------ |
| `/tasks`   | `?search=`, `?status=TODO\|IN_PROGRESS\|COMPLETED\|OVERDUE`, `?priority=LOW\|MEDIUM\|HIGH\|URGENT`, `?dueToday=1`, `?task=<id>` | Filters the task list; `task` opens the details drawer |
| `/calendar`| `?view=month\|week\|day\|agenda`, `?date=YYYY-MM-DD` | Sets view and focused date |

`TasksPage` treats the URL as the single source of truth for filters: the
toolbar writes filters back to the URL with `replace: true`, so palette
navigation and manual changes stay in sync without extra state effects.

## AI dialogs

The palette can open the AI workflows without duplicating their UI state:

- "Plan My Day" / "Weekly Review" / "Smart Reschedule" / "Task
  Prioritization" open their existing dialogs (`PlanMyDayDialog` now accepts
  optional controlled `open` / `onOpenChange` props; the other dialogs
  already did).
- "Task Breakdown" switches the palette into a task-picker mode; picking a
  task opens `TaskBreakdownDialog` for that task. `Esc` returns to the main
  list.

## Adding commands

1. Add a static command to the matching list in `command-palette.constants.ts`.
2. For dynamic entries (tasks, events, notifications), extend the builders
   in `command-palette.service.ts`.
3. For new actions, add the case to `PaletteAction` in
   `command-palette.types.ts` and `resolveExecutor` in
   `command-palette.service.ts`, wiring it to the `CommandContext` surface.
4. If the action should open a new hosted dialog, mount it in
   `CommandPalette.tsx` and expose an opener on the context value in
   `command-palette.hooks.ts`.

## Persistence

`localStorage` keys (see `COMMAND_PALETTE_STORAGE_KEYS`):

- `aethermind:command-palette:recent-commands` — last 10 executed commands
  (dynamic task/event entries are skipped; "clear recent" is exposed via
  `clearRecentCommands` on the context).
- `aethermind:command-palette:recent-searches` — last 10 non-empty queries,
  shown as the "Recent Searches" group on open.

## Validation

```sh
pnpm --filter web lint
pnpm --filter web check-types
pnpm --filter web build
```
