import type { Metrics } from './data';

// Impact is measured against the crisis: reductions in these metrics help.
export const consequenceStats = [
  { key: 'hostile', label: 'Hostile audience', suffix: '%', unit: 'pp' },
  { key: 'belief', label: 'Believe the rumour', suffix: '%', unit: 'pp' },
  { key: 'reach', label: 'Story reach index', suffix: '', unit: 'points' },
] as const;

// An illustrative composite: each displayed impact point has equal weight.
export function overallImpact(before: Metrics, after: Metrics): number {
  const total = consequenceStats.reduce((sum, stat) => sum + before[stat.key] - after[stat.key], 0);
  return Math.round(total / consequenceStats.length * 10) / 10 || 0;
}
