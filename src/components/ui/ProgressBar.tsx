interface ProgressBarProps {
  percent: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  animate?: boolean;
}

export function ProgressBar({
  percent,
  className = "",
  trackClassName = "bg-ink-100",
  fillClassName = "bg-sky-800",
  animate = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full ${trackClassName} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${fillClassName} ${animate ? "animate-fill-bar" : ""}`}
        style={{
          width: animate ? undefined : `${clamped}%`,
          ["--fill" as string]: `${clamped}%`,
        }}
      />
    </div>
  );
}
