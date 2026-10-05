import { useEffect, useReducer, useRef, useState } from 'react';
import { identities, outcomes, type Strategy } from './data';
import { GraphStage } from './GraphStage';
import { IdentityPortrait } from './IdentityPortrait';
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
  const [previewIdentity, setPreviewIdentity] = useState(-1);
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
      <ol className="progress" aria-label="Experience progress">{stepNames.map((name, i) => <li key={name} className={i === stepIndex ? 'current' : i < stepIndex ? 'visited' : ''} aria-current={i === stepIndex ? 'step' : undefined}><span className="step-number">0{i + 1}</span><span className="step-name">{name}</span></li>)}</ol>
    </header>

    <main className="stage">
      <GraphStage state={state} reduced={reduced} paused={paused} portraitIndex={state.step === 'identity' && !state.selecting ? previewIdentity : state.identity} />
      {state.step === 'identity' ? <>
        <div className={`intro-copy ${state.selecting ? 'leaving' : ''}`}>
          <div className="eyebrow"><span className="gold-dash" /> HOLLYWOOD RUMOUR</div>
          <h1>You’re famous.<br /><span>Can you survive<br />a rumour?</span></h1>
        </div>
        <section className={`identity-panel ${state.selecting ? 'selecting' : ''}`} aria-label="Choose your identity">
          <div className="choice-heading"><h2>Choose your role</h2></div>
          <div className="persona-options">{identities.map((p, i) => <button key={p.title} className={`persona-card ${state.selecting && state.identity === i ? 'selected' : ''}`} disabled={state.selecting} onMouseEnter={() => setPreviewIdentity(i)} onFocus={() => setPreviewIdentity(i)} onClick={event => {
            const card = event.currentTarget.getBoundingClientRect();
            const target = document.querySelector('.celebrity-mark')!.getBoundingClientRect();
            event.currentTarget.style.setProperty('--fly-x', `${target.x + target.width / 2 - card.x - card.width / 2}px`);
            event.currentTarget.style.setProperty('--fly-y', `${target.y + target.height / 2 - card.y - card.height / 2}px`);
            dispatch({ type: 'identity', index: i });
          }}>
            <IdentityPortrait index={i} /><span className="persona-text"><strong>{p.title}</strong></span><Arrow />
          </button>)}</div>
        </section>
      </> : <>
        {state.step !== 'outcome' && <aside className="sentiment" aria-label="Public sentiment">
          <span className="eyebrow">Public sentiment</span>
          <div className="sentiment-key">
            <span><i className="supportive" /><b>{view.metrics.supportive}%</b> supportive</span>
            <span><i className="neutral" /><b>{100 - view.metrics.supportive - view.metrics.hostile}%</b> uncertain</span>
            <span><i className="hostile" /><b>{view.metrics.hostile}%</b> hostile</span>
          </div>
        </aside>}

        <section className={`interaction ${choosing ? 'response-choices' : ''} ${state.step === 'outcome' ? 'outcome-interaction' : ''}`} ref={panel} tabIndex={-1} aria-label={`${stepNames[stepIndex]} controls`}>
          {state.step === 'society' && <>
            <div className="interaction-copy"><h2>{genesis ? 'Creating your social world…' : societyReady ? 'You’re in good company. For now.' : 'Word is getting around.'}</h2></div>
            <div className="actions"><button className="text-button" onClick={back}>← Change identity</button><button className="primary danger-button" disabled={!societyReady} onClick={() => { setPaused(false); dispatch({ type: 'rumour' }); }}>Spread a rumour<Arrow /></button></div>
          </>}
          {state.step === 'rumour' && <>
            <div className="interaction-copy"><h2>{rumourReady ? 'The story is no longer yours.' : state.elapsed < 6.8 ? 'It starts with a whisper.' : 'A whisper becomes a verdict.'}</h2></div>
            <div className="actions"><button className="text-button" onClick={back}>← Before the rumour</button><button className="primary" disabled={!rumourReady} onClick={() => { setPaused(false); dispatch({ type: 'respond' }); }}>Decide how to respond<Arrow /></button></div>
          </>}
          {choosing && <>
            <div className="response-heading"><div><h2>What will you say?</h2></div><button className="text-button" onClick={back}>← Back to the rumour</button></div>
            <div className="response-options">{outcomes.map((o, i) => <button key={o.id} onClick={() => choose(o.id)} className="response-card"><span className="response-number">0{i + 1}{state.history.includes(o.id) && <span>TRIED</span>}</span><strong>{o.title}</strong><span>{o.short}</span><Arrow /></button>)}</div>
          </>}
          {state.step === 'response' && state.running && <>
            <div className="interaction-copy"><h2>{state.strategy === 'silence' ? 'Even silence says something.' : 'Your words. Their interpretations.'}</h2></div><div className="actions"><button className="text-button" onClick={back}>← Back to the rumour</button></div>
          </>}
          {state.step === 'outcome' && <>
            <div className="interaction-copy"><h2>{view.outcome!.insight}</h2></div><div className="actions"><button className="text-button" onClick={restart}>Start over</button><button className="primary" onClick={back}>Try another response<Arrow /></button></div>
          </>}
          {active && <div className="timeline-track" role="progressbar" aria-label="Sequence progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(state.elapsed / (state.step === 'society' ? 10.8 : state.step === 'rumour' ? 14.6 : 14.4) * 100))}><span style={{ width: `${Math.min(100, state.elapsed / (state.step === 'society' ? 10.8 : state.step === 'rumour' ? 14.6 : 14.4) * 100)}%` }} /></div>}
        </section>

        {state.step === 'outcome' && <aside className="outcome-panel" aria-label="Response outcome">
          <h2>{view.outcome!.title}</h2>
          <div className="result-head"><span>THE CHANGE</span><span>Before → After</span></div>
          <div className="result-row"><span>Net sentiment</span><strong><em>−11</em> → {signed(view.metrics.supportive - view.metrics.hostile)}</strong></div>
          <div className="result-row"><span>Rumour belief</span><strong><em>58%</em> → {view.metrics.belief}%</strong></div>
          <div className="result-row reach-row"><span>Story reach</span><strong>{signed(view.metrics.reach - 100)}% <span>{view.metrics.reach > 100 ? '↑' : '↓'}</span></strong></div>
          <details className="result-details" key={state.strategy}><summary>Why it played out this way</summary><p className="statement-quote">{view.outcome!.response}</p><ul>{view.outcome!.explanations.map(e => <li key={e}>{e}</li>)}</ul></details>
          {state.history.length > 1 && <div className="comparison"><div className="eyebrow">YOUR EXPERIMENTS</div><table><caption className="sr-only">Comparison of responses tried with identical starting conditions</caption><thead><tr><th>Response</th><th>Sentiment</th><th>Reach</th></tr></thead><tbody>{state.history.map(id => { const o = outcomes.find(o => o.id === id)!; return <tr key={id} className={state.strategy === id ? 'selected-result' : ''}><td>{o.title}</td><td>{signed(o.metrics.supportive - o.metrics.hostile)}</td><td>{signed(o.metrics.reach - 100)}%</td></tr>; })}</tbody></table></div>}
        </aside>}
      </>}
    </main>

    <footer className="footer"><div><span className="fiction-note">A fictional, scripted society</span></div><div className="footer-controls">{state.step !== 'identity' && <button onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume simulation' : 'Pause simulation'}>{paused ? '▶ Resume' : 'Ⅱ Pause'}</button>}<button onClick={() => setReduced(r => !r)} aria-pressed={reduced}>Motion {reduced ? 'reduced' : 'full'}</button></div></footer>
  </div>;
}
