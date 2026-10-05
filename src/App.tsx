import { useEffect, useReducer, useRef, useState } from 'react';
import { identities, type Strategy } from './data';
import { GraphStage } from './GraphStage';
import { IdentityPortrait } from './IdentityPortrait';
import { Brand } from './Brand';
import { EventHistory } from './EventHistory';
import { getView, initialState, reducer, type Step } from './simulation';
import { SOCIETY_READY_AT } from './genesis';

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
  const scenario = identities[state.identity];
  const outcomes = scenario.outcomes;
  const stepIndex = steps.indexOf(state.step);
  const [previewIdentity, setPreviewIdentity] = useState(-1);
  const societyReady = state.step === 'society' && state.elapsed >= SOCIETY_READY_AT;
  const rumourReady = state.step === 'rumour' && state.elapsed >= 14.6;
  const choosing = state.step === 'response' && !state.running;

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
    <main className="stage">
      <GraphStage state={state} reduced={reduced} paused={paused} portraitIndex={state.step === 'identity' && !state.selecting ? previewIdentity : state.identity} />
      {state.step === 'identity' ? <>
        <div className={`intro-copy ${state.selecting ? 'leaving' : ''}`}>
          <div className="eyebrow"><span className="gold-dash" /> SIMULATED MEDIA INDUSTRY</div>
          <h1>You’re famous now.<span>Can you survive<br />a rumour?</span></h1>
          <div className="powered-by"><span>Powered by</span><Brand /></div>
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
            <IdentityPortrait index={i} /><span className="persona-text"><strong>{p.title}</strong><span>{p.hook}</span></span><Arrow />
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

        {state.step !== 'outcome' && <EventHistory state={state} paused={paused} reduced={reduced} />}

        <section className={`interaction ${choosing ? 'response-choices' : ''} ${state.step === 'outcome' ? 'outcome-interaction' : ''}`} ref={panel} tabIndex={-1} aria-label={`${stepNames[stepIndex]} controls`}>
          {state.step === 'society' && <>
            <div className="interaction-copy"><h2>{view.genesis < 1 ? 'Persona genesis' : societyReady ? 'Your audience is listening.' : 'Society is live'}</h2></div>
            <div className="actions"><button className="text-button" onClick={back}>← Change identity</button><button className="primary danger-button" disabled={!societyReady} onClick={() => { setPaused(false); dispatch({ type: 'rumour' }); }}>Introduce a rumour<Arrow /></button></div>
          </>}
          {state.step === 'rumour' && <>
            <div className="interaction-copy"><h2>{rumourReady ? scenario.hook : 'Watch a rumour become a reputation.'}</h2></div>
            <div className="actions"><button className="text-button" onClick={back}>← Before the rumour</button><button className="primary" disabled={!rumourReady} onClick={() => { setPaused(false); dispatch({ type: 'respond' }); }}>Choose a response<Arrow /></button></div>
          </>}
          {choosing && <>
            <div className="response-heading"><div><span className="eyebrow">{scenario.title} · ONE STATEMENT, THREE APPROACHES</span><h2>What will you say?</h2><p>Same audience. Same rumour. Only your words change.</p></div><button className="text-button" onClick={back}>← Back to the rumour</button></div>
            <div className="response-options">{outcomes.map((o, i) => <button key={o.id} onClick={() => choose(o.id)} className="response-card"><span className="response-number">0{i + 1}{state.history.includes(o.id) && <span>TRIED</span>}</span><strong>{o.title}</strong><span className="response-intent">{o.short}</span><q>{o.response}</q><span className="run-label">Simulate this response ↗</span></button>)}</div>
          </>}
          {state.step === 'response' && state.running && <>
            <div className="interaction-copy"><h2>Observing audience reactions.</h2></div><div className="actions"><button className="text-button" onClick={back}>← Back to the rumour</button></div>
          </>}
          {state.step === 'outcome' && <>
            <div className="interaction-copy"><h2>{view.outcome!.insight}</h2></div><div className="actions"><button className="text-button" onClick={restart}>Start over</button><button className="primary" onClick={back}>Try another response<Arrow /></button></div>
          </>}
        </section>

        {state.step === 'outcome' && <aside className="outcome-panel" aria-label="Response outcome">
          <span className="eyebrow">{scenario.title} · RESPONSE LAB</span>
          <h2>Compare the consequences</h2>
          <p className="comparison-intro">One shared starting point. All three scripted branches, at the end of the same reaction sequence.</p>
          <p className="belief-definition"><b>Rumour being measured:</b> {scenario.claim}</p>
          <div className="comparison-grid">
            <div className="baseline-strip"><strong>Before any response</strong><span>{scenario.crisis.hostile}% hostile</span><span>{scenario.crisis.belief}% believe the rumour</span><span>100 reach index</span></div>
            {outcomes.map(o => <article className={`outcome-card ${state.strategy === o.id ? 'selected-result' : ''}`} key={o.id}>
              <span className="eyebrow">{state.strategy === o.id ? 'JUST PLAYED' : state.history.includes(o.id) ? 'PREVIOUSLY PLAYED' : 'ALTERNATIVE BRANCH'}</span>
              <h3>{o.title}</h3>
              <p className="statement-quote">“{o.response}”</p>
              <dl>{([['hostile', 'Hostile audience'], ['belief', 'Believe the rumour'], ['reach', 'Story reach index']] as const).map(([key, label]) => <div key={key} className="compare-metric"><dt>{label}</dt><dd><strong>{o.metrics[key]}{key !== 'reach' && '%'}</strong><span>{signed(o.metrics[key] - scenario.crisis[key])} {key === 'reach' ? 'index points' : 'pp'}</span></dd><div className="metric-track" aria-hidden="true"><i style={{width: `${o.metrics[key] / (key === 'reach' ? 2 : 1)}%`}} /><b style={{left: `${scenario.crisis[key] / (key === 'reach' ? 2 : 1)}%`}} /></div></div>)}</dl>
              <h4>{o.insight}</h4>
              <details><summary>Why this happened</summary><ul>{o.explanations.map(e => <li key={e}>{e}</li>)}</ul><div className="branch-reactions">{o.reactions.map((r, i) => <blockquote key={i}><strong>{r.author}</strong><p>“{r.text}”</p><small>{r.impact}</small></blockquote>)}</div></details>
              <button className="text-button" onClick={() => { setPaused(false); dispatch({ type: 'replay', strategy: o.id }); }}>{state.strategy === o.id ? 'Replay reactions' : 'Watch this branch'} <Arrow /></button>
            </article>)}
          </div>
          <p className="metric-note">Changes are relative to before the response. pp = percentage points. Reach is indexed to 100, not a headcount. Markers show the shared baseline. These illustrative values demonstrate tradeoffs; they are not forecasts.</p>
        </aside>}
      </>}
    </main>

    <footer className="footer"><div><span className="fiction-note">Illustrative simulation · scripted outcomes</span></div><div className="footer-controls">{state.step !== 'identity' && <button onClick={() => setPaused(p => !p)} aria-label={paused ? 'Resume simulation' : 'Pause simulation'}>{paused ? '▶ Resume' : 'Ⅱ Pause'}</button>}<button onClick={() => setReduced(r => !r)} aria-pressed={reduced}>Motion {reduced ? 'reduced' : 'full'}</button></div></footer>
  </div>;
}
