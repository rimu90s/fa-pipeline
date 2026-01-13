// app/(app)/_lib/ui-state.ts

export type UiState =
  | { kind: "idle" }
  | { kind: "loading"; message?: string }
  | { kind: "empty"; title?: string; description?: string }
  | { kind: "error"; title?: string; description?: string };

export function isLoading(state: UiState): state is { kind: "loading"; message?: string } {
  return state.kind === "loading";
}

export function isEmpty(
  state: UiState
): state is { kind: "empty"; title?: string; description?: string } {
  return state.kind === "empty";
}

export function isError(
  state: UiState
): state is { kind: "error"; title?: string; description?: string } {
  return state.kind === "error";
}

export function uiLoading(message?: string): UiState {
  return { kind: "loading", message };
}

export function uiEmpty(title?: string, description?: string): UiState {
  return { kind: "empty", title, description };
}

export function uiError(title?: string, description?: string): UiState {
  return { kind: "error", title, description };
}
