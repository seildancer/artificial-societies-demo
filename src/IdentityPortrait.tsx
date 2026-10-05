export function IdentityPortrait({ index = -1 }: { index?: number }) {
  const portrait = Math.max(0, index) % 9;
  const cell = [2, 0, 3, 1, 4, 5, 6, 7, 8][portrait];
  return <span className={`identity-portrait portrait-${portrait}`} aria-hidden="true" style={{ backgroundPosition: `${(cell % 3) * 50}% ${Math.floor(cell / 3) * 50}%` }} />;
}
