"use client";

type ChatComposerProps = {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  onRecordingStart?: () => void;
  onRecordingEnd?: () => void;
  isRecording?: boolean;
  isThinking?: boolean;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function ChatComposer({
  value = "",
  onChange,
  onSubmit,
  onRecordingStart,
  onRecordingEnd,
  isRecording = false,
  isThinking = false,
  hint = "Hold to speak",
  placeholder = "Type something to start",
  disabled = false,
}: ChatComposerProps) {
  const canSubmit = value.trim().length > 0 && !disabled && !isThinking;
  const canRecord = !value.trim() && !disabled && !isThinking;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="rounded-[32px] border border-white/70 bg-white/80 px-4 pb-4 pt-3 shadow-sm backdrop-blur-xl ring-1 ring-slate-200/70">
        <div className="mb-3 flex items-center justify-center">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {isThinking ? "Thinking..." : hint}
          </span>
        </div>

        <div className="pointer-events-auto flex items-end gap-3">
          <div className="flex-1 rounded-[28px] bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <textarea
              value={value}
              onChange={(event) => onChange?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (canSubmit) {
                    onSubmit?.();
                  }
                }
              }}
              placeholder={placeholder}
              disabled={disabled || isThinking}
              rows={1}
              className="max-h-28 min-h-12 w-full resize-none bg-transparent pt-0.5 text-sm leading-6 text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="button"
            aria-label={canSubmit ? "Send message" : "Hold to record"}
            onClick={() => {
              if (canSubmit) {
                onSubmit?.();
              }
            }}
            onPointerDown={() => {
              if (canRecord) {
                onRecordingStart?.();
              }
            }}
            onPointerUp={() => {
              if (canRecord || isRecording) {
                onRecordingEnd?.();
              }
            }}
            onPointerCancel={() => {
              if (canRecord || isRecording) {
                onRecordingEnd?.();
              }
            }}
            onPointerLeave={() => {
              if (isRecording) {
                onRecordingEnd?.();
              }
            }}
            disabled={(!canSubmit && !canRecord && !isRecording) || disabled}
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-all duration-200 ${
              canSubmit || canRecord || isRecording ? "bg-emerald-600 active:scale-95" : "bg-slate-300"
            } ${isRecording ? "animate-soft-pulse" : ""}`}
          >
            {isRecording && !isThinking ? (
              <>
                <span className="absolute inset-0 rounded-full border border-emerald-400/40" />
                <span className="absolute inset-[-10px] rounded-full border border-emerald-300/35" />
                <span className="absolute inset-[-20px] rounded-full border border-emerald-200/25" />
              </>
            ) : null}

            {canSubmit ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="relative z-10 h-6 w-6"
              >
                <path d="M5 12h11" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="relative z-10 h-6 w-6"
              >
                <path d="M12 4a3 3 0 0 1 3 3v5a3 3 0 1 1-6 0V7a3 3 0 0 1 3-3Z" />
                <path d="M19 11a7 7 0 0 1-14 0" />
                <path d="M12 18v3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
