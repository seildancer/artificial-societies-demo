import { useEffect, useRef, useState } from 'react';
import { nodes } from './data';
import { PostAvatar, postName } from './PostAvatar';
import { getView, type State } from './simulation';

export function EventHistory({ state, paused, reduced }: { state: State; paused: boolean; reduced: boolean }) {
  const { history, active } = getView(state);
  const list = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const [unread, setUnread] = useState(false);
  const society = state.step === 'society';
  const responding = state.step === 'response' && state.running;
  const settled = society ? state.elapsed >= 10.8 : state.step === 'rumour' ? state.elapsed >= 14.6 : !state.running;
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
    if (following.current) el.scrollTop = el.scrollHeight;
    else setUnread(true);
  }, [history.length, record]);

  const latest = history.at(-1);
  return <aside className={`event-history ${society ? 'audience-history' : 'rumour-history'}`} aria-label={society ? 'Audience history' : 'Rumour history'}>
    <header className="history-heading">
      <div className="history-label"><span className="eyebrow">{society ? 'BEFORE THE RUMOUR' : 'THE STORY SO FAR'}</span><span className={`history-status ${settled || paused ? 'is-still' : ''}`}><i />{paused ? 'Paused' : settled ? 'Ready to review' : 'Live'}</span></div>
      <h2>{society ? 'Meet your audience' : 'How the story spread'}</h2>
      <p>{society ? 'A few voices from the people around you.' : 'Key moments, kept in order.'}</p>
    </header>
    <div className="history-scroll" ref={list} tabIndex={0} role="region" aria-label="Key moments" onScroll={() => {
      const el = list.current!;
      following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      if (following.current) setUnread(false);
    }}>
      {history.length === 0 && <div className="history-opening"><span className="history-opening-mark" aria-hidden="true">{society ? '229' : '01'}</span><strong>{society ? 'People. Perspectives. Connections.' : 'One claim enters the conversation.'}</strong><p>{society ? 'Fans, journalists, critics and industry insiders all have a voice here.' : 'Watch who picks it up, and what changes when they pass it on.'}</p></div>}
      <ol className="history-list">
        {history.map((event, i) => <li key={`${event.phase}-${event.at}`} className={`history-moment moment-${event.phase} ${active?.at === event.at && active.text === event.text ? 'is-active' : ''}`}>
          {event.phase === 'response' && history[i - 1]?.phase !== 'response' && <div className="history-divider">AFTER YOUR DECISION</div>}
          <article className="history-event">
            <div className="moment-heading"><span>{event.kind.replace(/^\d+ \/ /, '')}</span><time dateTime={`PT${event.at}S`}>+{Math.floor(event.at / 60)}:{String(Math.floor(event.at % 60)).padStart(2, '0')}</time></div>
            <div className="moment-person"><PostAvatar node={event.node} identity={state.identity} /><div><strong>{event.node === -1 ? 'You' : postName(event.node)}</strong><small>{event.node === -1 ? 'Official account' : nodes[event.node].handle}</small></div><span className="moment-category">{event.node === -1 ? 'You' : nodes[event.node].category}</span></div>
            <p className="moment-post">{event.text}</p>
            <div className="moment-reaction">{event.reaction}</div>
            <div className="moment-impact">{event.impact}</div>
          </article>
        </li>)}
      </ol>
    </div>
    {unread && <button className="history-latest" onClick={scrollToLatest}>New moment below <span aria-hidden="true">↓</span></button>}
    <footer className="history-footer">
      <span className="history-count">{history.length} {history.length === 1 ? 'moment' : 'moments'} recorded</span>
      <span className="history-announcement sr-only" role="status">{latest ? `${latest.kind}. ${latest.text}` : ''}</span>
      <p>{settled && !society ? 'A rehearsal departure became a character judgement. What would you say?' : society ? 'Every voice is connected to the network.' : responding ? 'Fans, press and critics interpret your decision.' : 'The claim changes as it travels.'}</p>
    </footer>
  </aside>;
}
