/** Small, reusable silhouettes connect each role card to the same person in the graph. */
export function IdentityPortrait({ index = -1 }: { index?: number }) {
  return <svg className={`identity-portrait portrait-${index}`} viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <circle cx="40" cy="40" r="39" className="portrait-ground" />
    {index === 0 ? <>
      <path d="M20 48c-3-10-1-28 8-33 8-5 21-3 26 4 7 8 6 24 3 31l-10 9H30Z" className="portrait-hair" />
      <path d="m34 43-2 13-14 8-5 16h54l-6-16-14-8-2-13Z" className="portrait-figure" />
      <path d="M28 28c0-10 24-12 24 1l-2 13c-1 7-6 11-10 11s-9-5-10-11Z" className="portrait-face" />
      <path d="M25 31c0-20 29-20 30 1-6-2-10-6-12-11-4 7-11 10-18 10Z" className="portrait-hair" />
      <path d="m28 59 12 11 12-11M40 70v10" className="portrait-detail" />
    </> : index === 1 ? <>
      <path d="m32 43-1 13-13 8-5 16h54l-6-16-13-8-1-13Z" className="portrait-figure" />
      <path d="M27 27c0-10 26-10 26 0l-2 15c-2 7-7 11-11 11s-9-4-11-11Z" className="portrait-face" />
      <path d="m25 31-2-14 9 2 4-9 7 7 9-3 5 13-5 8-3-10-10 3-9-2-2 9Z" className="portrait-hair" />
      <path d="M27 33h26l-2 8H42l-2-5-2 5h-9Z" className="portrait-hair" />
      <path d="m29 58 11 9 11-9M23 65l6 15M57 65l-6 15" className="portrait-detail" />
    </> : <>
      <path d="m32 43-1 13-15 8-5 16h58l-5-16-15-8-1-13Z" className="portrait-figure" />
      <path d="M27 28c0-12 26-12 26 0l-2 14c-1 7-7 12-11 12s-10-5-11-12Z" className="portrait-face" />
      <path d="M25 32c-4-20 15-26 26-17 5 4 6 10 4 18l-5-10-10-3-9 5-3 10Z" className="portrait-hair" />
      <path d="m31 56 9 8 9-8-2 16H33Z" className="portrait-face" />
      <path d="m25 60 9 20M55 60l-9 20m-9-15 3 4 3-4-3 15" className="portrait-detail" />
    </>}
  </svg>;
}
