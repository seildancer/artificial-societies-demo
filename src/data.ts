import { scenarios, timedPosts } from './scenarios';
export type Category = 'Media' | 'Fans' | 'Critics' | 'Industry' | 'Public';
export type Strategy = 'denial' | 'apology' | 'statement';
export type Sentiment = -1 | 0 | 1;
export interface Persona { id: number; category: Category; role: string; handle: string; influence: number; x: number; y: number; z: number }
export const identities = scenarios;
export const clusters: { name: Category; count: number; x: number; y: number; z: number; roles: string[] }[] = [
  { name: 'Media', count: 45, x: -1.3, y: 2.6, z: -0.5, roles: ['Entertainment journalist', 'Mainstream outlet', 'Gossip account', 'Culture commentator'] },
  { name: 'Fans', count: 68, x: -3.3, y: -1.1, z: 0.5, roles: ['Longtime fan', 'Fan account', 'New follower'] },
  { name: 'Critics', count: 31, x: -4.3, y: 1.6, z: -0.2, roles: ['Industry critic', 'Anti-fan', 'Sceptical commentator'] },
  { name: 'Industry', count: 19, x: 3.1, y: 2.2, z: -1, roles: ['Co-star', 'Casting director', 'Friend / insider', 'PR observer'] },
  { name: 'Public', count: 66, x: 3.3, y: -1.2, z: 0, roles: ['Casual viewer', 'Film enthusiast', 'Neutral observer', 'Culture podcast host'] },
];
// A seeded layout keeps every replay in the same social world.
export function hash(n: number) { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }
export const nodes: Persona[] = [];
for (const c of clusters) {
  for (let j = 0; j < c.count; j++) {
    const id = nodes.length;
    const angle = j * 2.399963;
    const r = Math.sqrt((j + 0.5) / c.count) * (c.name === 'Fans' || c.name === 'Public' ? 2 : 1.55);
    nodes.push({ id, category: c.name, role: c.roles[j % c.roles.length], handle: `@${c.name.toLowerCase()}${String(j + 1).padStart(2, '0')}`, influence: 0.22 + hash(id + 3) * 0.78,
      x: c.x + Math.cos(angle) * r, y: c.y + Math.sin(angle) * r * 0.72, z: c.z + (hash(id + 42) - 0.5) * 2 });
  }
}
nodes[2].handle = '@AfterHours'; nodes[3].handle = '@ScreenTea'; nodes[0].handle = '@ScreenWire'; nodes[1].handle = '@TheDailyCut';
nodes[46].handle = '@SpotlightArchive'; nodes[115].handle = '@Unfiltered';
export interface Metrics { supportive: number; hostile: number; belief: number; reach: number }
export const baseline: Metrics = { supportive: 72, hostile: 10, belief: 0, reach: 100 };
export interface Outcome { id: Strategy; title: string; short: string; response: string; metrics: Metrics; insight: string; explanations: string[]; reactions: { node: number; author: string; text: string; reaction: string; impact: string; kind: string }[] }
// Category-biased sentiment allocation gives exact totals and distinct local reactions.
export function snapshot(metrics: Metrics, key: string): Sentiment[] {
  const bias: Record<Category, number> = { Fans: 0.28, Industry: 0.14, Public: 0, Media: -0.03, Critics: -0.4 };
  const sorted = [...nodes].sort((a, b) => (hash(b.id + (key === 'baseline' ? 5 : 12)) + bias[b.category]) - (hash(a.id + (key === 'baseline' ? 5 : 12)) + bias[a.category]));
  const positive = Math.round(nodes.length * metrics.supportive / 100);
  const negative = Math.round(nodes.length * metrics.hostile / 100);
  const result: Sentiment[] = Array(nodes.length).fill(0);
  sorted.forEach((n, i) => { result[n.id] = i < positive ? 1 : i >= nodes.length - negative ? -1 : 0; });
  return result;
}
export const baselineSnapshot = snapshot(baseline, 'baseline');
export interface StoryEvent { at: number; duration: number; node: number; author?: string; role?: string; text: string; reaction: string; impact: string; kind: string; targets: number[] }
export function storyEvents(phase: string, identity: number, strategy?: Strategy): StoryEvent[] {
  const person = scenarios[identity];
  if (phase === 'society') return [
    { at: 6.6, duration: 3.1, node: 0, text: `The ${person.title.toLowerCase()} is riding high with ${person.context}. A familiar face, with an audience ready to listen.`, reaction: 'Good press travels through fans and industry contacts', impact: 'A strong reputation before the controversy', kind: 'The public image', targets: [3, 46, 47, 164] },
    { at: 10.5, duration: 3.1, node: 46, text: `Following the ${person.title.toLowerCase()} for years. There is a reason people keep showing up.`, reaction: 'Supporters share memories and recommendations', impact: 'Trust is personal. So is disappointment.', kind: 'An invested audience', targets: [147, 151, 70, 170] },
  ];
  if (phase === 'rumour') return timedPosts(person.rumour, [0.3, 4, 7.5, 11]);
  if (phase === 'response' && strategy) {
    const result = person.outcomes.find(o => o.id === strategy)!;
    return [
      { at: 0.2, duration: 2.8, node: -1, author: person.title, text: result.response, reaction: 'Official statement reaches the same audience', impact: 'Watch which words people choose to repeat.', kind: '01 / Your response', targets: [0, 46, 146] },
      ...timedPosts(result.reactions, [3.5, 7, 10.5]),
    ];
  }
  return [];
}
