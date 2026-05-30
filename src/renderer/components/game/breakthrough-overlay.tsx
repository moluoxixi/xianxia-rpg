interface BreakthroughOverlayProps {
  realm: string;
}

export function BreakthroughOverlay({ realm }: BreakthroughOverlayProps) {
  if (!realm) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70">
      <div className="realm-glow text-center text-5xl font-bold tracking-[8px] text-primary">
        突破<br />
        <span className="mt-4 block text-3xl">{realm}</span>
      </div>
    </div>
  );
}
