import { IdentityPortrait } from './IdentityPortrait';
const publishers: Record<number, { name: string; letters: string; style: string }> = {
  0: { name: 'ScreenWire', letters: 'SW', style: 'wire' },
  1: { name: 'The Daily Cut', letters: 'dc', style: 'daily' },
  2: { name: 'After Hours', letters: 'ah', style: 'hours' },
  3: { name: 'Screen Tea', letters: 'st', style: 'tea' },
  46: { name: 'Spotlight Archive', letters: 'SA', style: 'archive' },
};
export function PostAvatar({ node, identity }: { node: number; identity: number }) {
  const publisher = publishers[node];
  if (publisher) return <span className={`publisher-logo logo-${publisher.style}`} aria-hidden="true"><span>{publisher.letters}</span></span>;
  return <IdentityPortrait index={node === -1 ? identity : node === 115 ? 5 : node === 146 ? 3 : 3 + node % 6} />;
}
export function postName(node: number) {
  return publishers[node]?.name ?? (node === 146 ? 'Industry insider' : node === 115 ? 'Unfiltered' : 'Community member');
}
