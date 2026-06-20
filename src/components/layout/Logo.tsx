export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="PokemonBinder logo">
      <circle cx="16" cy="16" r="15" fill="#ffffff" />
      {/* top half — brand color */}
      <path d="M1 16a15 15 0 0 0 30 0Z" fill="var(--color-primary)" />
      {/* equator */}
      <path d="M2 16h28" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
      {/* outer ring (re-stroked so it stays crisp over the fill) */}
      <circle cx="16" cy="16" r="15" fill="none" stroke="#0f172a" strokeWidth="2.5" />
      {/* center button */}
      <circle cx="16" cy="16" r="4.6" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="1.7" fill="var(--color-accent)" />
    </svg>
  );
}
