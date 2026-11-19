// The controller section: what each button does in Marah Launcher, from the launcher's
// docs/user-guide.md. The drawing's parts are in ControllerDrawing.vue; each has a data-part.

/** What a button does. */
export type Act = "move" | "select" | "back" | "search" | "trailer" | "menu" | "bar" | "page" | "notice" | "home";

// The list of keys under the drawing (on a tablet or a phone the drawing's labels are hidden).
export const keys: { act: Act; button: string; key: string | null; does: string }[] = [
  { act: "move", button: "D-pad, left stick", key: "Arrows", does: "Move" },
  { act: "select", button: "✕", key: "Enter", does: "Select" },
  { act: "back", button: "○", key: "Esc", does: "Back" },
  { act: "search", button: "△", key: "/", does: "Search" },
  { act: "trailer", button: "□", key: "T", does: "The game's trailer" },
  { act: "menu", button: "Options", key: "Menu", does: "The game's menu" },
  { act: "bar", button: "L1, R1", key: "Tab", does: "Along the top bar, or to the next section" },
  { act: "page", button: "L2, R2", key: "Page Up/Down", does: "A page up or down" },
  { act: "notice", button: "Create", key: "Delete", does: "Close the newest notice" },
  { act: "home", button: "PS", key: null, does: "Tap: Home. Hold: close the game, or the power menu" },
];

// What the line under the heading says for each act. HTML: the button's name is in <strong>.
export const words: Record<Act | "hold", string> = {
  move: "<strong>Move</strong>: the D-pad, the left stick or the arrow keys.",
  select: "<strong>✕ Select</strong>: opens what has the focus. Enter on a keyboard.",
  back: "<strong>○ Back</strong>: one screen back. Escape or Backspace.",
  search: "<strong>△ Search</strong>: the Library, or the Catalog when you are in it. / on a keyboard.",
  trailer: "<strong>□ Trailer</strong>: plays the shown game's trailer. T on a keyboard.",
  menu: "<strong>Options</strong>: the shown game's menu. On Home, the system's emulator page.",
  bar: "<strong>L1, R1</strong>: along the top bar, or to the section before or after. Tab on a keyboard.",
  page: "<strong>L2, R2</strong>: a page up or down. Page Up and Page Down.",
  notice: "<strong>Create</strong>: closes the newest notice. Delete on a keyboard.",
  home: "<strong>PS, tap</strong>: back to Home. Hold it to close the game, or for the power menu.",
  hold: "<strong>PS, hold</strong>: closes the running game. With none, the power menu.",
};
export const waiting = "Waiting for a button.";
export const padHere = "A controller is here. <strong>Press a button.</strong>";

// Keys count only while the drawing has the focus, so the page's own keys still work.
export const keyActs: Record<string, Act> = {
  ArrowUp: "move",
  ArrowDown: "move",
  ArrowLeft: "move",
  ArrowRight: "move",
  Enter: "select",
  Escape: "back",
  Backspace: "back",
  "/": "search",
  t: "trailer",
  T: "trailer",
  ContextMenu: "menu",
  PageUp: "page",
  PageDown: "page",
  Delete: "notice",
  Tab: "bar",
};
// The arrow keys light their own part of the D-pad.
export const keyParts: Record<string, string> = {
  ArrowUp: "dpad-up",
  ArrowDown: "dpad-down",
  ArrowLeft: "dpad-left",
  ArrowRight: "dpad-right",
};

// A real controller, in the browser's standard layout: 0 ✕, 1 ○, 2 □, 3 △, 4 L1, 5 R1, 6 L2,
// 7 R2, 8 Create, 9 Options, 12 to 15 the D-pad, 16 PS (read on its own: a tap or a hold).
export const padActs: Record<number, Act> = {
  0: "select",
  1: "back",
  2: "trailer",
  3: "search",
  4: "bar",
  5: "bar",
  6: "page",
  7: "page",
  8: "notice",
  9: "menu",
  12: "move",
  13: "move",
  14: "move",
  15: "move",
};
// The buttons whose act several parts share light their own part.
export const padParts: Record<number, string> = {
  4: "l1",
  5: "r1",
  6: "l2",
  7: "r2",
  12: "dpad-up",
  13: "dpad-down",
  14: "dpad-left",
  15: "dpad-right",
};
export const PS_BUTTON = 16;
/** How long the PS button is held before it counts as a hold, in ms. */
export const HOLD_MS = 600;
