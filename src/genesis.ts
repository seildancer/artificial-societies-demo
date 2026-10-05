import { clusters, hash, nodes } from './data';

export const GENESIS_DURATION = 6;
export const SOCIETY_READY_AT = GENESIS_DURATION + 8.3;
const birthStart = 0.45;
const birthDuration = 0.65;
const birthInterval = (GENESIS_DURATION - birthStart - birthDuration) / (nodes.length - 1);

// Interleave communities so the first births already show a varied audience.
const communities = clusters.map(c => nodes.filter(n => n.category === c.name)
  .sort((a, b) => hash(a.id + 817) - hash(b.id + 817)));
export const birthOrder = Array.from({ length: Math.max(...communities.map(c => c.length)) }, (_, i) =>
  communities.flatMap(c => c[i] ? [c[i]] : [])).flat();
export const birthRanks = new Map(birthOrder.map((node, rank) => [node.id, rank]));

export function personaBirth(rank: number, elapsed: number, reduced: boolean) {
  const progress = Math.max(0, Math.min(1, (elapsed - birthStart - rank * birthInterval + 1e-8) / birthDuration));
  return reduced ? Number(progress === 1) : progress * progress * (3 - 2 * progress);
}

export function createdPersonaCount(elapsed: number) {
  return Math.max(0, Math.min(nodes.length, Math.floor((elapsed - birthStart - birthDuration + 1e-8) / birthInterval) + 1));
}
