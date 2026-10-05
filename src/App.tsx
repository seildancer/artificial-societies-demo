import { useEffect, useReducer, useRef, useState } from 'react';
import { clusters, identities, outcomes, type Strategy } from './data';
import { GraphStage } from './GraphStage';
import { getView, initialState, reducer, type Step } from './simulation';

const steps: Step[] = ['identity', 'society', 'rumour', 'response', 'outcome'];
const stepNames = ['Identity', 'Society', 'Rumour', 'Response', 'Outcome'];
const signed = (n: number) => `${n > 0 ? '+' : ''}${n}`;
const Arrow = () => <span aria-hidden="true">↗</span>;

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const tickState = useRef({ paused, state }); tickState.current = { paused, state };
  const view = getView(state);
  const stepIndex = steps.indexOf(state.step);
  const identity = identities[state.identity];
  const societyReady = state.step === 'society' && state.elapsed >= 10.8;
  const rumourReady = state.step === 'rumour' && state.elapsed >= 14.6;
  const choosing = state.step === 'response' && !state.running;
  const genesis = state.step === 'society' && state.elapsed < 2.6;
  const active = (state.step === 'society' && !societyReady) || (state.step === 'rumour' && !rumourReady) || state.running;

  useEffect(() => {
    let raf = 0, previous = performance.now(), accumulated = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.12, (now - previous) / 1000); previous = now;
      if (!tickState.current.paused && !document.hidden) {
        accumulated += dt;
        if (accumulated >= 0.08) { dispatch({ type: 'tick', dt: accumulated }); accumulated = 0; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (!state.selecting) return;
    const timer = window.setTimeout(() => dispatch({ type: 'enter' }), reduced ? 20 : 650);
    return () => clearTimeout(timer);
  }, [state.selecting, reduced]);
  useEffect(() => {
    if (state.step !== 'identity') panel.current?.focus({ preventScroll: true });
  }, [state.step, state.running]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change); return () => media.removeEventListener('change', change);
  }, []);
  const back = () => { setPaused(false); dispatch({ type: 'back' }); };
  const choose = (strategy: Strategy) => { setPaused(false); dispatch({ type: 'strategy', strategy }); };
  const restart = () => { setPaused(false); dispatch({ type: 'restart' }); };

  return <div className={`experience step-${state.step} ${reduced ? 'reduced-motion' : ''}`} data-step={state.step} data-running={state.running} data-selected={state.identity}>
    <header className="header">
      <a className="brand" href="https://societies.ai" target="_blank" rel="noreferrer" aria-label="Artificial Societies website"><span className="brand-symbol" aria-hidden="true">✳</span><span>artificial<br />societies</span></a>
      <div className="edition">INTERACTIVE FIELD NOTES <span>№ 001</span></div>
      <ol className="progress" aria-label="Experience progress">{stepNames.map((name, i) => <li key={name} className={i === stepIndex ? 'current' : i < stepIndex ? 'visited' : ''} aria-current={i === stepIndex ? 'step' : undefined}><span className="step-number">0{i + 1}</span><span className="step-name">{name}</span></li>)}</ol>
    </header>

    <main className="stage">
      <GraphStage state={state} reduced={reduced} paused={paused} />
      {state.step === 'identity' ? <>
        <div className={`intro-copy ${state.selecting ? 'leaving' : ''}`}>
          <div className="eyebrow"><span className="gold-dash" /> A HOLLYWOOD REPUTATION EXPERIMENT</div>
          <h1>You’re famous<br />in Hollywood now.<br /><span>Can you survive<br className="desktop-break" /> a rumour?</span></h1>
          <p>One story. Hundreds of opinions.<br />A whole world watching what you do next.</p>
        </div>
        <div className="scene-caption"><span className="live-dot" /> YOUR WORLD IS WAITING<span>229 perspectives. One reputation.</span></div>
        <section className={`identity-panel ${state.selecting ? 'selecting' : ''}`} aria-label="Choose your identity">
          <div className="choice-heading"><h2>You are…</h2><span>CHOOSE YOUR PLACE IN THE SPOTLIGHT</span></div>
          <div className="persona-options">{identities.map((p, i) => <button key={p.title} className={`persona-card ${state.selecting && state.identity === i ? 'selected' : ''}`} disabled={state.selecting} onClick={event => {
            const card = event.currentTarget.getBoundingClientRect();
            const target = document.querySelector('.celebrity-mark')!.getBoundingClientRect();
            event.currentTarget.style.setProperty('--fly-x', `${target.x + target.width / 2 - card.x - card.width / 2}px`);
            event.currentTarget.style.setProperty('--fly-y', `${target.y + target.height / 2 - card.y - card.height / 2}px`);
            dispatch({ type: 'identity', index: i });
          }}>
            <span className="persona-glyph" aria-hidden="true">{p.glyph}</span><span className="persona-text"><strong>{p.title}</strong><span>{p.description}</span></span><Arrow />
          </button>)}</div>
        </section>
      </> : <>
        <div className="scene-heading"><div className="eyebrow">HOLLYWOOD / {identity.title.toUpperCase()}</div><h1>{identity.name}<span>’s world</span></h1><div className="live-status"><span className={`live-dot ${state.step === 'rumour' ? 'danger' : ''}`} />{paused ? 'Simulation paused' : genesis ? 'Persona Genesis' : active ? 'Society in motion' : 'A living society'}<span className="divider">/</span>{Math.round(229 * view.genesis)} personas</div></div>
        <aside className="sentiment" aria-label="Public sentiment">
          <div className="eyebrow">PUBLIC SENTIMENT</div><div className="sentiment-number">{signed(view.metrics.supportive - view.metrics.hostile)}<span>net sentiment</span></div>
          <div className="sentiment-bar" aria-hidden="true"><i style={{ width: `${view.metrics.supportive}%` }} /><i style={{ width: `${100 - view.metrics.supportive - view.metrics.hostile}%` }} /><i style={{ width: `${view.metrics.hostile}%` }} /></div>
          <div className="sentiment-labels"><span>{view.metrics.supportive}% supportive</span><span>{view.metrics.hostile}% hostile</span></div>
        </aside>
        {genesis && <div className="genesis"><div className="eyebrow">PERSONA GENESIS</div><h2>Creating your social world<span className="ellipsis">…</span></h2>{clusters.map(c => <div key={c.name}><span>{c.name}</span><b>{Math.round(c.count * view.genesis)}</b></div>)}<p>{Math.round(229 * view.genesis)} personas generated</p></div>}
        <div className="graph-legend"><span><i className="supportive" />Supportive</span><span><i className="neutral" />Uncertain</span><span><i className="hostile" />Hostile</span><span className="influence-legend">◌ Size = influence</span></div>
        <div className="activity" aria-label="Ambient activity"><span><b>{view.activity.posts}</b> posts</span><span><b>{view.activity.reactions}</b> reactions</span><span><b>{view.activity.reposts}</b> reposts</span><span className="conversation-count"><b>{view.activity.conversations}</b> conversations</span></div>

        <section className={`interaction ${choosing ? 'response-choices' : ''} ${state.step === 'outcome' ? 'outcome-interaction' : ''}`} ref={panel} tabIndex={-1} aria-label={`${stepNames[stepIndex]} controls`}>
          {state.step === 'society' && <>
            <div className="interaction-copy"><div className="eyebrow">01 → 02 / THE WORLD AROUND YOU</div><h2>{genesis ? 'Every reputation starts with people.' : societyReady ? 'Your world looks pretty good.' : 'You’re becoming the talk of the town.'}</h2><p>{genesis ? 'Fans, critics, insiders. Each with a different point of view.' : 'Good press. New followers. For now, the story is on your side.'}</p></div>
            <div className="actions"><button className="text-button" onClick={back}>← Change identity</button><button className="primary danger-button" disabled={!societyReady} onClick={() => { setPaused(false); dispatch({ type: 'rumour' }); }}>{societyReady ? 'Spread a rumour' : 'Your world is forming'}<Arrow /></button></div>
          </>}
          {state.step === 'rumour' && <>
            <div className="interaction-copy"><div className="eyebrow danger-text">03 / A STORY TAKES ON A LIFE OF ITS OWN</div><h2>{rumourReady ? 'The story is no longer yours.' : state.elapsed < 6.8 ? 'It starts with a whisper.' : 'A whisper becomes a verdict.'}</h2><p>{rumourReady ? `From +62 to ${signed(view.metrics.supportive - view.metrics.hostile)} sentiment. The same people, a very different world.` : 'Watch a rumour change as it passes from person to person.'}</p></div>
            <div className="actions"><button className="text-button" onClick={back}>← Before the rumour</button><button className="primary" disabled={!rumourReady} onClick={() => { setPaused(false); dispatch({ type: 'respond' }); }}>{rumourReady ? 'Decide how to respond' : 'The rumour is spreading'}<Arrow /></button></div>
          </>}
          {choosing && <>
            <div className="response-heading"><div><div className="eyebrow">04 / YOUR MOVE</div><h2>Everyone is listening. What will you say?</h2></div><button className="text-button" onClick={back}>← Back to the rumour</button></div>
            <div className="response-options">{outcomes.map((o, i) => <button key={o.id} onClick={() => choose(o.id)} className="response-card"><span className="response-number">0{i + 1}{state.history.includes(o.id) && <span>TRIED</span>}</span><strong>{o.title}</strong><span>{o.short}</span><Arrow /></button>)}</div>
            <p className="choice-note">One response. Many interpretations. No perfect answer.</p>
          </>}
          {state.step === 'response' && state.running && <>
            <div className="interaction-copy"><div className="eyebrow">04 / {view.outcome!.title.toUpperCase()}</div><h2>{state.strategy === 'silence' ? 'Even silence says something.' : 'Your words. Their interpretations.'}</h2><p>Fans, journalists and critics are telling three different stories.</p></div><div className="actions"><button className="text-button" onClick={back}>← Back to the rumour</button><span className="running-label"><span className="live-dot" /> Reactions unfolding</span></div>
          </>}
          {state.step === 'outcome' && <>
            <div className="interaction-copy"><div className="eyebrow">05 / THE CONSEQUENCES</div><h2>{view.outcome!.insight}</h2><p>Same society. Different choices. Different consequences.</p></div><div className="actions"><button className="text-button" onClick={restart}>Start over</button><button className="primary" onClick={back}>Try another response<Arrow /></button></div>
          </>}
          {active && <div className="timeline-track" role="progressbar" aria-label="Sequence progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(state.elapsed / (state.step === 'society' ? 10.8 : state.step === 'rumour' ? 14.6 : 14.4) * 100))}><span style={{ width: `${Math.min(100, state.elapsed / (state.step === 'society' ? 10.8 : state.step === 'rumour' ? 14.6 : 14.4) * 100)}%` }} /></div>}
        </section>

        {state.step === 'outcome' && <aside className="outcome-panel" aria-label="Response outcome">
          <div className="eyebrow">YOUR RESPONSE <span>/{String(state.history.length).padStart(2, '0')}</span></div><h2>{view.outcome!.title}</h2><p className="statement-quote">{view.outcome!.response}</p>
          <div className="result-head"><span>THE CHANGE</span><span>Before → After</span></div>
          <div className="result-row"><span>Net sentiment</span><strong><em>−11</em> → {signed(view.metrics.supportive - view.metrics.hostile)}</strong></div>
          <div className="result-row"><span>Supportive</span><strong><em>31%</em> → {view.metrics.supportive}%</strong></div>
          <div className="result-row"><span>Hostile</span><strong><em>42%</em> → {view.metrics.hostile}%</strong></div>
          <div className="result-row"><span>Rumour belief</span><strong><em>58%</em> → {view.metrics.belief}%</strong></div>
          <div className="result-row reach-row"><span>Story reach</span><strong>{signed(view.metrics.reach - 100)}% <span>{view.metrics.reach > 100 ? '↑' : '↓'}</span></strong></div>
          <div className="eyebrow what-happened">WHAT HAPPENED</div><ul>{view.outcome!.explanations.map(e => <li key={e}>{e}</li>)}</ul>
          {state.history.length > 1 && <div className="comparison"><div className="eyebrow">YOUR EXPERIMENTS</div><table><caption className="sr-only">Comparison of responses tried with identical starting conditions</caption><thead><tr><th>Response</th><th>Sentiment</th><th>Reach</th></tr></thead><tbody>{state.history.map(id => { const o = outcomes.find(o => o.id === id)!; return <tr key={id} className={state.strategy === id ? 'selected-result' : ''}><td>{o.title}</td><td>{signed(o.metrics.supportive - o.metrics.hostile)}</td><td>{signed(o.metrics.reach - 100)}%</td></tr>; })}</tbody></table></div>}
        </aside>}
      </>}
    </main>

    <footer className="footer"><div><span className="footer-title">HOLLYWOOD RUMOUR</span><span className="footer-separator">/</span><span>A fictional, scripted society</span></div><div className="footer-controls">{state.step !== 'identity' && <button onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume simulation' : 'Pause simulation'}>{paused ? '▶ Resume' : 'Ⅱ Pause'}</button>}<button onClick={() => setReduced(r => !r)} aria-pressed={reduced}>Motion {reduced ? 'reduced' : 'full'}</button><span className="sound-off">NO SOUND REQUIRED <span aria-hidden="true">↗</span></span></div></footer>
  </div>;
}
