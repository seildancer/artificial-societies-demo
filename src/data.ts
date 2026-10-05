export type Category = 'Media' | 'Fans' | 'Critics' | 'Industry' | 'Public';
export type Strategy = 'silence' | 'denial' | 'apology' | 'statement';
export type Sentiment = -1 | 0 | 1;
export interface Persona { id: number; category: Category; role: string; handle: string; influence: number; x: number; y: number; z: number }
export const identities = [
  { title: 'Breakout actor', name: 'Maya Chen', initials: 'MC', description: 'Suddenly famous after a hit streaming series.', glyph: '✧', context: 'the next major sci-fi project' },
  { title: 'Pop star', name: 'Jules Vega', initials: 'JV', description: 'A huge online fandom. Constant scrutiny.', glyph: '✳', context: 'a much-anticipated concert film' },
  { title: 'Veteran actor', name: 'Alex Morgan', initials: 'AM', description: 'An established name. A carefully managed image.', glyph: '❋', context: 'an award-tipped new drama' },
];
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
export const crisis: Metrics = { supportive: 31, hostile: 42, belief: 58, reach: 100 };
export interface Outcome { id: Strategy; title: string; short: string; response: string; metrics: Metrics; insight: string; explanations: string[]; reactions: [string, string, string] }
export const outcomes: Outcome[] = [
  { id: 'silence', title: 'Say nothing', short: 'Let the story burn out on its own.', response: 'No public response. Let the work speak for itself.', metrics: { supportive: 29, hostile: 39, belief: 61, reach: 76 },
    insight: 'The attention faded. The suspicion stayed.', explanations: ['Fewer fresh posts gave the story less oxygen.', 'Loyal fans defended you without new information.', 'Unanswered questions hardened into accepted fact.'],
    reactions: ['They don’t owe the internet an explanation. Let them work.', 'No comment from the team. The original account remains unchallenged.', 'Still nothing? That silence tells you everything.'] },
  { id: 'denial', title: 'Short denial', short: 'Push back. Keep it brief.', response: '“This story isn’t true. I left rehearsal for a scheduled appointment. Please stop spreading it.”', metrics: { supportive: 44, hostile: 43, belief: 45, reach: 124 },
    insight: 'Your fans believed you. Your critics got louder.', explanations: ['Core fans shared the denial as a definitive rebuttal.', 'The forceful tone became a new story of its own.', 'Hostile coverage grew even as overall belief fell.'],
    reactions: ['There it is. A scheduled appointment. Can we move on now?', 'Star denies walkout, but the director has yet to comment.', '“Please stop spreading it” is a very convenient way to dodge questions.'] },
  { id: 'apology', title: 'Apologise + clarify', short: 'Own the disagreement. Add context.', response: '“We did disagree creatively. I’m sorry it got heated. I left for a scheduled appointment, and we’re already back at work.”', metrics: { supportive: 46, hostile: 34, belief: 41, reach: 138 },
    insight: 'You rebuilt some trust. And gave the rumour 38% more reach.', explanations: ['Core fans rallied around an honest explanation.', 'Mainstream reporting became more measured.', 'Critics reframed your clarification as an admission.'],
    reactions: ['Honestly, this is a fair explanation. Creative disagreements happen.', 'Confirms disagreement, but disputes reports of storming off set.', 'So there WAS an argument. That’s the part everyone should remember.'] },
  { id: 'statement', title: 'Full statement', short: 'Put the whole story on the record.', response: '“Our team values a collaborative set. A creative discussion has been misrepresented. My departure was scheduled, the director and I are aligned, and production continues. We appreciate everyone’s support.”', metrics: { supportive: 43, hostile: 32, belief: 35, reach: 152 },
    insight: 'The facts travelled further. So did the controversy.', explanations: ['Mainstream outlets corrected the walkout narrative.', 'Industry observers welcomed a clear official account.', 'Quote-mining fuelled a second wave of attention.'],
    reactions: ['Read the full statement before judging. This explains a lot.', 'Production continues as planned; team disputes reports of on-set chaos.', '“Creative discussion” — that’s a lot of PR language for an argument.'] },
];
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
export const crisisSnapshot = snapshot(crisis, 'crisis');
export const responseSnapshots = Object.fromEntries(outcomes.map(o => [o.id, snapshot(o.metrics, o.id)])) as Record<Strategy, Sentiment[]>;
export interface StoryEvent { at: number; duration: number; node: number; role?: string; text: string; reaction: string; impact: string; kind: string; targets: number[] }
export function storyEvents(phase: string, identity: number, strategy?: Strategy): StoryEvent[] {
  const person = identities[identity];
  if (phase === 'society') return [
    { at: 3.1, duration: 3.1, node: 0, text: `${person.name} has apparently joined ${person.context}. One to watch.`, reaction: '@ScreenTea reposted · “Huge if true.”', impact: '14 personas influenced · Reach +2.1%', kind: 'A little good press', targets: [3, 46, 47, 164] },
    { at: 7, duration: 3.1, node: 146, text: `Working with ${person.name} has been a highlight. Some very good things on the way.`, reaction: 'Fans reacted positively · 8 new follows', impact: '21 personas influenced · Trust rising', kind: 'Word gets around', targets: [147, 151, 70, 170] },
  ];
  if (phase === 'rumour') return [
    { at: 0.3, duration: 3, node: 2, text: `Heard ${person.name} left rehearsal after a huge argument with the director. Someone on set needs to talk.`, reaction: 'Unverified source · First 2 reposts', impact: 'One post. A whole new narrative.', kind: '01 / The spark', targets: [3, 7] },
    { at: 4, duration: 2.7, node: 3, text: `Apparently ${person.name} stormed off set. Not a great look when everyone else is trying to work.`, reaction: '“Left rehearsal” becomes “stormed off set”', impact: '14 personas influenced', kind: '02 / The embellishment', targets: [1, 115, 166, 32] },
    { at: 7.5, duration: 2.7, node: 1, text: `CHAOS ON SET: ${person.name} clashes with director as production faces questions.`, reaction: 'A private disagreement becomes a public crisis', impact: '38 personas influenced', kind: '03 / The headline', targets: [14, 39, 181, 192, 201] },
    { at: 11, duration: 2.7, node: 115, text: 'Impossible to work with. We’ve been saying this for months. This is just what finally got out.', reaction: 'A single incident becomes a character judgement', impact: '90+ personas reached · Belief hardens', kind: '04 / The verdict', targets: [116, 122, 174, 208] },
  ];
  if (phase === 'response' && strategy) {
    const result = outcomes.find(o => o.id === strategy)!;
    return [
      { at: 0.2, duration: 2.8, node: -1, text: result.response, reaction: strategy === 'silence' ? 'No new post · The network fills the silence' : 'Your response reaches fans, press and industry first', impact: strategy === 'silence' ? 'Attention begins to decay' : 'A new wave enters the society', kind: strategy === 'silence' ? '01 / Your silence' : '01 / Your response', targets: strategy === 'silence' ? [] : [0, 46, 146] },
      { at: 3.5, duration: 2.7, node: 46, text: result.reactions[0], reaction: 'Fan accounts repost · Supporters rally', impact: '11 personas influenced', kind: '02 / The fans', targets: [49, 55, 60, 78] },
      { at: 7, duration: 2.7, node: 0, text: result.reactions[1], reaction: 'Mainstream coverage reframes the story', impact: '28 personas influenced', kind: '03 / The press', targets: [1, 19, 178, 198] },
      { at: 10.5, duration: 2.7, node: 115, text: result.reactions[2], reaction: 'A new interpretation reaches the wider public', impact: '19 personas influenced', kind: '04 / The second-order effect', targets: [117, 129, 189, 219] },
    ];
  }
  return [];
}
