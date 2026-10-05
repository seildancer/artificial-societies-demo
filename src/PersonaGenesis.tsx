import { clusters, nodes } from './data';
import { PostAvatar } from './PostAvatar';
import { birthOrder, createdPersonaCount } from './genesis';

export function PersonaGenesis({ count, elapsed }: { count: number; elapsed: number }) {
  // Hold each set long enough to read while the population keeps growing.
  const previewCount = Math.min(count, createdPersonaCount(Math.floor(elapsed / 0.7) * 0.7));
  const recent = birthOrder.slice(Math.max(0, previewCount - 3), previewCount).reverse();
  const created = birthOrder.slice(0, count);

  return <div className="genesis-build" aria-label="Persona creation progress">
    <div className="genesis-population"><strong data-testid="persona-count">{count}</strong><span>of {nodes.length}<small>personas created</small></span></div>
    <div className="genesis-progress" role="progressbar" aria-label="Personas created" aria-valuemin={0} aria-valuemax={nodes.length} aria-valuenow={count}><span style={{ width: `${count / nodes.length * 100}%` }} /></div>
    <p className="genesis-description">Creating individual voices, perspectives and influence.</p>
    <div className="genesis-communities">{clusters.map(c => <div key={c.name}><span>{c.name}</span><b>{created.filter(n => n.category === c.name).length}<small> / {c.count}</small></b></div>)}</div>
    <div className="genesis-personas" aria-label="Newly created personas">
      <span className="eyebrow">{count ? 'NEW PERSONAS' : 'PREPARING YOUR SOCIETY'}</span>
      {recent.map(n => <div className="genesis-persona" key={n.id} data-node={n.id}>
        <PostAvatar node={n.id} identity={0} />
        <div><strong>{n.role}</strong><small>{n.handle} · {n.category}</small></div>
        <span>{n.influence > 0.66 ? 'High' : n.influence > 0.33 ? 'Medium' : 'Low'}<small>influence</small></span>
      </div>)}
    </div>
  </div>;
}
