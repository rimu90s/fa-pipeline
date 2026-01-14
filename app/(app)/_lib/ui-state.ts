// app/(app)/_lib/ui-state.ts
import * as React from "react";

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

/**
 * PROMPT 14.5 — inline feedback, non-intrusive, auto-hide 2–3 seconds
 * UI-only helper. Does not touch backend or RBAC.
 */
export function useAutoDismissMessage(timeoutMs = 2500) {
  const [message, setMessage] = React.useState<string>("");
  const [kind, setKind] = React.useState<"success" | "error">("success");

  React.useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), timeoutMs);
    return () => clearTimeout(t);
  }, [message, timeoutMs]);

  return {
    message,
    kind,
    showSuccess: (msg: string) => {
      setKind("success");
      setMessage(msg);
    },
    showError: (msg: string) => {
      setKind("error");
      setMessage(msg);
    },
    clear: () => setMessage(""),
  };
}
