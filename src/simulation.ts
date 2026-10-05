import { baseline, baselineSnapshot, crisis, crisisSnapshot, outcomes, responseSnapshots, storyEvents, type Metrics, type Strategy } from './data';
export type Step = 'identity' | 'society' | 'rumour' | 'response' | 'outcome';
export interface State { step: Step; identity: number; elapsed: number; strategy?: Strategy; running: boolean; societyTime: number; rumourTime: number; history: Strategy[]; selecting: boolean }
export const initialState: State = { step: 'identity', identity: 0, elapsed: 0, running: false, societyTime: 11, rumourTime: 15, history: [], selecting: false };
export type Action = { type: 'tick'; dt: number } | { type: 'identity'; index: number } | { type: 'enter' } | { type: 'rumour' } | { type: 'respond' } | { type: 'strategy'; strategy: Strategy } | { type: 'back' } | { type: 'restart' };
export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'tick': {
      if (s.step === 'identity') return s;
      const elapsed = s.elapsed + a.dt;
      if (s.step === 'response' && s.running && elapsed >= 14.4) return { ...s, step: 'outcome', elapsed: 14.4, running: false, history: [...new Set([...s.history, s.strategy!])] };
      return { ...s, elapsed };
    }
    case 'identity': return s.step === 'identity' && !s.selecting ? { ...s, identity: a.index, selecting: true } : s;
    case 'enter': return s.selecting ? { ...s, step: 'society', elapsed: 0, selecting: false } : s;
    case 'rumour': return s.step === 'society' && s.elapsed >= 10.8 ? { ...s, step: 'rumour', elapsed: 0, societyTime: s.elapsed } : s;
    case 'respond': return s.step === 'rumour' && s.elapsed >= 14.6 ? { ...s, step: 'response', elapsed: s.elapsed, rumourTime: s.elapsed, running: false } : s;
    case 'strategy': return s.step === 'response' && !s.running ? { ...s, strategy: a.strategy, elapsed: 0, running: true } : s;
    case 'back':
      if (s.step === 'society') return { ...initialState, identity: s.identity };
      if (s.step === 'rumour') return { ...s, step: 'society', elapsed: s.societyTime, running: false };
      if (s.step === 'response') return { ...s, step: 'rumour', elapsed: s.rumourTime, running: false };
      if (s.step === 'outcome') return { ...s, step: 'response', elapsed: s.rumourTime, running: false };
      return s;
    case 'restart': return { ...initialState };
  }
}
const clamp = (n: number) => Math.max(0, Math.min(1, n));
export function getView(s: State) {
  const outcome = outcomes.find(o => o.id === s.strategy);
  const phase = s.step === 'outcome' ? 'response' : s.step;
  const events = storyEvents(phase, s.identity, s.strategy);
  const active = s.step !== 'outcome' && !(s.step === 'response' && !s.running) ? events.find(e => s.elapsed >= e.at && s.elapsed < e.at + e.duration) : undefined;
  let from = baselineSnapshot, to = baselineSnapshot, progress = 1;
  let fromMetrics = baseline, toMetrics = baseline;
  if (s.step === 'rumour') {
    from = baselineSnapshot; to = crisisSnapshot;
    // Small first hops, then a rapidly accelerating cascade.
    progress = s.elapsed < 3.4 ? clamp(s.elapsed / 3.4) * 0.018 : s.elapsed < 7 ? 0.018 + clamp((s.elapsed - 3.4) / 3.6) * 0.15 : 0.168 + clamp((s.elapsed - 7) / 6.9) * 0.832;
    fromMetrics = baseline; toMetrics = crisis;
  }
  if (s.step === 'response' || s.step === 'outcome') {
    from = crisisSnapshot; to = s.running || s.step === 'outcome' ? responseSnapshots[s.strategy!] : crisisSnapshot;
    progress = s.step === 'outcome' || !s.running ? 1 : clamp((s.elapsed - 2.8) / 10.8);
    fromMetrics = crisis; toMetrics = s.running || s.step === 'outcome' ? outcome!.metrics : crisis;
  }
  const metrics = Object.fromEntries(Object.keys(fromMetrics).map(k => [k, Math.round(fromMetrics[k as keyof Metrics] + (toMetrics[k as keyof Metrics] - fromMetrics[k as keyof Metrics]) * progress)])) as unknown as Metrics;
  const choosing = s.step === 'response' && !s.running;
  // Derive the record from story time so pausing, rewinding and trying another
  // response preserve the original rumour without retaining discarded reactions.
  const history = s.step === 'identity' ? [] : s.step === 'society'
    ? storyEvents('society', s.identity).filter(e => e.at <= s.elapsed).map(e => ({ ...e, phase: 'society' as const }))
    : [
      ...storyEvents('rumour', s.identity).filter(e => e.at <= (s.step === 'rumour' ? s.elapsed : s.rumourTime)).map(e => ({ ...e, phase: 'rumour' as const })),
      ...((s.step === 'response' && s.running) || s.step === 'outcome'
        ? storyEvents('response', s.identity, s.strategy).filter(e => e.at <= s.elapsed).map(e => ({ ...e, phase: 'response' as const })) : []),
    ];
  const priorPosts = Math.floor(s.societyTime * 1.2);
  const rumourPosts = Math.floor((choosing ? s.elapsed : s.rumourTime) * 8.4);
  const posts = s.step === 'society' ? Math.floor(s.elapsed * 1.2) : s.step === 'rumour' ? priorPosts + Math.floor(s.elapsed * 8.4) : priorPosts + rumourPosts + (choosing ? 0 : Math.floor(s.elapsed * (s.strategy === 'silence' ? 1.5 : 4.8)));
  const activity = { posts, reactions: posts * 4, reposts: Math.floor(posts * 0.7), conversations: Math.floor(posts / 5) };
  return { active, history, from, to, progress, metrics, outcome, activity, genesis: s.step === 'society' ? clamp(s.elapsed / 2.5) : 1 };
}
