type Props = {
  label?: string;
};

export function RotatingLoader({ label = "Loading..." }: Props) {
  return (
    <div className="flex min-h-64 items-center justify-center text-neutral-700" role="status" aria-live="polite">
      <span className="loading-text-pulse font-display text-4xl">{label}</span>
    </div>
  );
}
