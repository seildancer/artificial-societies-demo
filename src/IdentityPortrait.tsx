export function IdentityPortrait({ index = -1 }: { index?: number }) {
  const cell = Math.max(0, index) % 9;
  return <span className={`identity-portrait portrait-${cell}`} aria-hidden="true" style={{ backgroundPosition: `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 50}%` }} />;
}
