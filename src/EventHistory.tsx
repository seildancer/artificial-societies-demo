import { useEffect, useRef, useState } from 'react';
import { nodes, identities } from './data';
import { PostAvatar, postName } from './PostAvatar';
import { getView, type State } from './simulation';
import { PersonaGenesis } from './PersonaGenesis';
import { SOCIETY_READY_AT } from './genesis';

export function EventHistory({ state, paused, reduced }: { state: State; paused: boolean; reduced: boolean }) {
  const { history, active, genesis, personaCount } = getView(state);
  const list = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [unread, setUnread] = useState(false);
  const society = state.step === 'society';
  const creating = society && genesis < 1;
  const responding = state.step === 'response' && state.running;
  const settled = society ? state.elapsed >= SOCIETY_READY_AT : state.step === 'rumour' ? state.elapsed >= 14.6 : !state.running;
  const record = society ? 'society' : responding ? `response-${state.strategy}` : 'rumour';

  const scrollToLatest = () => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'instant' : 'smooth' });
    following.current = true;
    setUnread(false);
  };

  useEffect(() => {
    following.current = true;
    setUnread(false);
    if (list.current) list.current.scrollTop = 0;
  }, [record]);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    if (creating) el.scrollTop = 0;
    else if (following.current) el.scrollTop = el.scrollHeight;
    else setUnread(true);
  }, [history.length, record, creating]);

  const latest = history.at(-1);
  return <aside className={`event-history ${society ? 'audience-history' : 'rumour-history'}`} aria-label={society ? 'Audience history' : 'Rumour history'}>
    <header className="history-heading">
      <div className="history-label"><span className="eyebrow">{society ? 'BEFORE THE RUMOUR' : 'THE STORY SO FAR'}</span><span className={`history-status ${settled || paused ? 'is-still' : ''}`}><i />{paused ? 'Paused' : creating ? 'Creating' : settled ? 'Ready to review' : 'Live'}</span></div>
      <h2>{society ? creating ? 'Persona genesis' : 'Society is live' : 'How the story spread'}</h2>
      {!society && <button className="history-original" onClick={() => { following.current = false; list.current?.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' }); }}>Read the original incident ↑</button>}
    </header>
    <div className="history-scroll" ref={list} tabIndex={0} role="region" aria-label="Key moments" onScroll={() => {
      const el = list.current!;
      following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      if (following.current) setUnread(false);
    }}>
      {creating && <PersonaGenesis count={personaCount} elapsed={state.elapsed} />}
      {society && !creating && <div className="genesis-complete"><strong>{personaCount} personas</strong><span>5 communities · Individual voices, connected.</span></div>}
      {!society && <section className="incident-brief"><span className="eyebrow">THE ORIGINAL INCIDENT</span><h3>{identities[state.identity].hook}</h3><p>{identities[state.identity].incident}</p><p><b>What’s visible</b> {identities[state.identity].known}</p><p><b>Still unverified</b> {identities[state.identity].unknown}</p></section>}
      <ol className="history-list">
        {history.map((event, i) => <li key={`${event.phase}-${event.at}`} className={`history-moment moment-${event.phase} ${active?.at === event.at && active.text === event.text ? 'is-active' : ''}`}>
          {event.phase === 'response' && history[i - 1]?.phase !== 'response' && <div className="history-divider">AFTER YOUR DECISION</div>}
          <article className="history-event">
            <div className="moment-heading"><span>{event.kind.replace(/^\d+ \/ /, '')}</span><time dateTime={`PT${event.at}S`}>+{Math.floor(event.at / 60)}:{String(Math.floor(event.at % 60)).padStart(2, '0')}</time></div>
            <div className="moment-person"><PostAvatar node={event.node} identity={state.identity} /><div><strong>{event.author ?? (event.node === -1 ? 'You' : postName(event.node))}</strong><small>{event.node === -1 ? 'Official account' : event.author ? 'Simulated post' : nodes[event.node].handle}</small></div><span className="moment-category">{event.node === -1 ? 'You' : nodes[event.node].category}</span></div>
            <p className="moment-post">{event.text}</p>
            <div className="moment-reaction">{event.reaction}</div>
            <div className="moment-impact">{event.impact}</div>
          </article>
        </li>)}
      </ol>
    </div>
    {unread && <button className="history-latest" onClick={scrollToLatest}>New moment below <span aria-hidden="true">↓</span></button>}
    <span className="history-announcement sr-only" role="status">{creating ? 'Persona genesis. Creating your society.' : latest ? `${latest.kind}. ${latest.text}` : society ? 'Society is live. 229 personas across 5 communities.' : ''}</span>
  </aside>;
}
