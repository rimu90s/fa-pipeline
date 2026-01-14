// app/(app)/_components/InlineFeedback.tsx
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function InlineFeedback(props: {
  kind: "success" | "error";
  message: string;
  className?: string;
}) {
  if (!props.message) return null;

  if (props.kind === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cx(
          "flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2",
          props.className
        )}
      >
        <span aria-hidden="true" className="mt-0.5 text-emerald-700">
          ✓
        </span>
        <p className="text-sm text-emerald-800">{props.message}</p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cx(
        "flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2",
        props.className
      )}
    >
      <span aria-hidden="true" className="mt-0.5 text-amber-800">
        ⚠️
      </span>
      <p className="text-sm text-amber-900">{props.message}</p>
    </div>
  );
}
