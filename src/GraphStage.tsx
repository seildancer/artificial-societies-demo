import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { clusters, hash, identities, nodes } from './data';
import { getView, type State } from './simulation';
import { IdentityPortrait } from './IdentityPortrait';

const cream = new THREE.Color('#F4EDE4'), grey = new THREE.Color('#69676c'), red = new THREE.Color('#E9364A');
const gold = new THREE.Color('#D6A84B');
const sentimentColor = (n: number) => n > 0 ? cream : n < 0 ? red : grey;
const ease = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
const rumourOrder = [...nodes].sort((a, b) => Math.hypot(a.x - nodes[2].x, a.y - nodes[2].y) - Math.hypot(b.x - nodes[2].x, b.y - nodes[2].y)).map(n => n.id);
const responseOrder = [...nodes].sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y)).map(n => n.id);
const rumourRanks = new Map(rumourOrder.map((id, i) => [id, i / nodes.length]));
const responseRanks = new Map(responseOrder.map((id, i) => [id, i / nodes.length]));

export function GraphStage({ state, reduced, paused, portraitIndex }: { state: State; reduced: boolean; paused: boolean; portraitIndex: number }) {
  const host = useRef<HTMLDivElement>(null);
  const centre = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLElement>(null);
  const clusterLabels = useRef<(HTMLDivElement | null)[]>([]);
  const live = useRef({ state, reduced, paused });
  live.current = { state, reduced, paused };
  const [hover, setHover] = useState<{ id: number; x: number; y: number } | null>(null);
  const [fallback, setFallback] = useState(false);
  const view = getView(state);
  const event = view.active;

  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer | undefined;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { setFallback(true); }
    const canvas = renderer?.domElement ?? document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    container.prepend(canvas);
    const ctx = renderer ? null : canvas.getContext('2d');
    renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
    camera.position.set(0, 0.6, 18);
    const geometry = new THREE.SphereGeometry(1, 10, 8);
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.InstancedMesh(geometry, material, nodes.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const starMaterial = new THREE.MeshBasicMaterial({ color: gold });
    const star = new THREE.Mesh(geometry, starMaterial);
    star.scale.setScalar(0.13);
    scene.add(star);
    const ringGeometry = new THREE.RingGeometry(0.27, 0.279, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);
    const pulseGeometry = new THREE.RingGeometry(0.1, 0.115, 32);
    const pulses = Array.from({ length: 22 }, () => {
      const item = new THREE.Mesh(pulseGeometry, new THREE.MeshBasicMaterial({ color: cream, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      scene.add(item); return item;
    });
    const maxEdges = 340;
    const positions = new Float32Array(maxEdges * 6), colors = new Float32Array(maxEdges * 6);
    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    const linesMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.65, depthWrite: false });
    const lines = new THREE.LineSegments(linesGeometry, linesMaterial); lines.frustumCulled = false; scene.add(lines);
    const dummy = new THREE.Object3D(), color = new THREE.Color(), vec = new THREE.Vector3();
    const points = nodes.map(n => new THREE.Vector3(n.x, n.y, n.z));
    const displayedColors = nodes.map(() => new THREE.Color('#0D0D0F'));
    const origin = new THREE.Vector3();
    let width = 1, height = 1, raf = 0, previous = performance.now(), hoverId = -1;
    let visiblePoints: { id: number; x: number; y: number; radius: number }[] = [];
    const resize = () => {
      width = container.clientWidth; height = container.clientHeight;
      if (renderer) renderer.setSize(width, height);
      else { canvas.width = width; canvas.height = height; }
      camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const project = (p: THREE.Vector3) => { vec.copy(p).project(camera); return { x: (vec.x + 1) * width / 2, y: (1 - vec.y) * height / 2 }; };
    const onMove = (e: PointerEvent) => {
      const { state: s } = live.current;
      if (s.step === 'identity' || getView(s).active || (s.step === 'society' && s.elapsed < 2.5)) return;
      const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
      const found = visiblePoints.find(p => Math.hypot(x - p.x, y - p.y) < Math.max(8, p.radius));
      hoverId = found?.id ?? -1;
      setHover(found ? { id: found.id, x: Math.min(width - 210, Math.max(8, found.x + 14)), y: Math.max(4, found.y - 48) } : null);
      canvas.style.cursor = found ? 'crosshair' : 'default';
    };
    const onLeave = () => { hoverId = -1; setHover(null); };
    canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave);

    function render(now: number) {
      const dt = Math.min(0.05, (now - previous) / 1000); previous = now;
      const { state: s, reduced: reduce, paused: pause } = live.current;
      const v = getView(s), active = v.active;
      const t = s.step === 'identity' ? (reduce || pause ? 0 : now / 1000) : s.elapsed;
      const isIdentity = s.step === 'identity';
      const small = width < 650;
      const xScale = small ? 0.82 : 1;
      points.forEach((p, i) => {
        const n = nodes[i];
        p.set(n.x * xScale, n.y, n.z);
        // Very small deterministic motion; snapshot time also restores this motion.
        if (!reduce) { p.x += Math.sin(t * 0.17 + i) * 0.045; p.y += Math.cos(t * 0.13 + i * 2) * 0.045; }
      });
      const fullDistance = Math.max(13.8, (small ? 6.2 : 7.6) / Math.tan(THREE.MathUtils.degToRad(21.5)) / camera.aspect);
      let targetX = 0;
      let targetY = 0.7, targetZ = fullDistance;
      const focus = active ? active.node === -1 ? origin : points[active.node] : undefined;
      const strength = active && !reduce ? ease((s.elapsed - active.at) / 0.55) * ease((active.at + active.duration - s.elapsed) / 0.55) : 0;
      if (focus) { targetX += focus.x * 0.37 * strength; targetY += (focus.y - targetY) * 0.37 * strength; targetZ -= Math.min(3.4, targetZ * 0.2) * strength; }
      const lerp = reduce ? 1 : 1 - Math.exp(-dt * 4.8);
      camera.position.x += (targetX - camera.position.x) * lerp;
      camera.position.y += (targetY - camera.position.y) * lerp;
      camera.position.z += (targetZ - camera.position.z) * lerp;
      camera.updateMatrixWorld();
      const relevant = new Set(active ? [active.node, ...active.targets] : []);
      const rumourState = s.step === 'rumour' || (s.step === 'response' && !s.running);
      const order = rumourState ? rumourOrder : responseOrder;
      const ranks = rumourState ? rumourRanks : responseRanks;
      visiblePoints = [];
      if (ctx) ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], p = points[i];
        const birth = isIdentity ? 1 : ease(v.genesis * 1.2 - i / nodes.length * 0.2);
        const change = v.progress === 1 ? 1 : ease((v.progress - ranks.get(i)!) * 8);
        color.copy(sentimentColor(v.from[i])).lerp(sentimentColor(v.to[i]), change);
        const dim = active && !relevant.has(i) ? 1 - 0.7 * strength : 1;
        color.multiplyScalar(dim * (isIdentity ? 0.85 : 0.87));
        displayedColors[i].lerp(color, reduce ? 1 : 1 - Math.exp(-dt * 8));
        color.copy(displayedColors[i]);
        dummy.position.copy(p);
        const size = (0.028 + n.influence * 0.042) * birth * (hoverId === i ? 1.6 : 1);
        dummy.scale.setScalar(size); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, color);
        const screen = project(p); const radius = size / (camera.position.z - p.z) * height * 1.3;
        if (birth > 0.5) visiblePoints.push({ id: i, ...screen, radius });
        if (ctx && birth > 0) { ctx.fillStyle = `#${color.getHexString()}`; ctx.beginPath(); ctx.arc(screen.x, screen.y, Math.max(1.2, radius), 0, Math.PI * 2); ctx.fill(); }
      }
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      let edgeCount = 0;
      const edge = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Color, alpha: number, travel = 1) => {
        if (edgeCount >= maxEdges) return;
        const offset = edgeCount++ * 6;
        positions.set([a.x, a.y, a.z, a.x + (b.x - a.x) * travel, a.y + (b.y - a.y) * travel, a.z + (b.z - a.z) * travel], offset);
        colors.set([c.r * alpha, c.g * alpha, c.b * alpha, c.r * alpha, c.g * alpha, c.b * alpha], offset);
        if (ctx) { const p = project(a), q = project(b); ctx.strokeStyle = `#${c.getHexString()}`; ctx.globalAlpha = alpha * 0.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (q.x - p.x) * travel, p.y + (q.y - p.y) * travel); ctx.stroke(); ctx.globalAlpha = 1; }
      };
      // Sparse local relationships, not a permanent hairball.
      if (v.genesis > 0.9) for (let i = 0; i < nodes.length; i += 2) {
        const other = Math.min(i + 3, nodes.length - 1);
        if (nodes[i].category === nodes[other].category) edge(points[i], points[other], grey, active ? 0.07 : isIdentity ? 0.35 : 0.22);
      }
      const tense = s.step === 'rumour' || (s.step === 'response' && !s.running);
      const activityColor = tense ? red : cream;
      const energetic = s.step === 'rumour' && s.elapsed > 6 && s.elapsed < 14;
      const activityCount = energetic ? 42 : 12;
      if (v.genesis > 0.9 && !reduce) for (let j = 0; j < activityCount; j++) {
        const beat = t * (energetic ? 1.25 : 0.36) + j * 0.63;
        const cycle = Math.floor(beat), frac = beat - cycle;
        const limit = s.step === 'rumour' ? Math.max(2, Math.floor(v.progress * nodes.length)) : nodes.length;
        const rank = Math.floor(hash(cycle + j * 91) * limit);
        const to = order[rank], from = order[Math.max(0, rank - 1 - (j % 5))];
        edge(points[from], points[to], activityColor, Math.sin(frac * Math.PI) * 0.6, Math.min(1, frac * 2));
      }
      if (active && focus) active.targets.forEach((target, i) => {
        const local = (s.elapsed - active.at - 0.6 - i * 0.17);
        if (local > 0) edge(focus, points[target], active.node === -1 ? gold : activityColor, 0.68 * ease(local * 2), Math.min(1, local * 1.5));
      });
      linesGeometry.setDrawRange(0, edgeCount * 2);
      linesGeometry.attributes.position.needsUpdate = true; linesGeometry.attributes.color.needsUpdate = true;
      pulses.forEach((pulse, j) => {
        const beat = t * (energetic ? 0.9 : 0.35) + j * 0.73, cycle = Math.floor(beat), frac = beat - cycle;
        const rank = Math.floor(hash(cycle + j * 71) * (s.step === 'rumour' ? Math.max(2, Math.floor(v.progress * nodes.length)) : nodes.length));
        pulse.position.copy(points[order[rank]]);
        pulse.scale.setScalar(0.6 + frac * 3.2);
        pulse.material.color.copy(activityColor);
        pulse.material.opacity = reduce || v.genesis < 0.99 ? 0 : (1 - frac) * 0.35 * (active ? 0.5 : 1);
      });
      ring.scale.setScalar(!reduce && s.running && s.elapsed < 3 && s.strategy !== 'silence' ? 1 + (s.elapsed % 1) * 9 : 1.5 + (reduce ? 0 : Math.sin(t) * 0.08));
      const cp = project(origin);
      if (centre.current) centre.current.style.transform = `translate(${cp.x}px, ${cp.y}px)`;
      clusters.forEach((c, i) => {
        const pos = project(new THREE.Vector3(c.x * xScale, c.y + (c.name === 'Fans' || c.name === 'Public' ? -1.7 : 1.35), c.z));
        if (clusterLabels.current[i]) { clusterLabels.current[i]!.style.transform = `translate(${pos.x}px, ${pos.y}px)`; clusterLabels.current[i]!.style.opacity = active ? '0.25' : String(v.genesis); }
      });
      if (highlight.current && focus) {
        const pos = project(focus);
        const cardWidth = Math.min(310, width - 32);
        const rightSpace = width - pos.x;
        const x = small ? (width - cardWidth) / 2 : Math.max(18, Math.min(width - cardWidth - 18, rightSpace > cardWidth + 30 ? pos.x + 28 : pos.x - cardWidth - 28));
        const y = small ? Math.max(12, height - 225) : Math.max(18, Math.min(height - 220, pos.y - 90));
        highlight.current.style.left = `${x}px`; highlight.current.style.top = `${y}px`;
      }
      if (renderer) renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf); observer.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave);
      geometry.dispose(); material.dispose(); starMaterial.dispose(); ringGeometry.dispose(); ringMaterial.dispose(); pulseGeometry.dispose();
      pulses.forEach(p => p.material.dispose()); linesGeometry.dispose(); linesMaterial.dispose(); renderer?.dispose(); canvas.remove();
    };
  }, []);

  return <div ref={host} className={`graph ${state.step === 'identity' ? 'graph-intro' : ''}`} role="group" aria-label={`3D social network: ${Math.round(229 * view.genesis)} personas. ${view.metrics.supportive}% supportive, ${view.metrics.hostile}% hostile.`} data-renderer={fallback ? 'canvas-fallback' : 'webgl'}>
    <div ref={centre} className="celebrity-anchor"><div className="celebrity-mark" role="img" aria-label={portraitIndex < 0 ? 'You, at the centre of the society' : `You as the ${identities[portraitIndex].title.toLowerCase()}`}><IdentityPortrait index={portraitIndex} /></div></div>
    {clusters.map((c, i) => <div key={c.name} ref={el => { clusterLabels.current[i] = el; }} className="cluster-label">{c.name}</div>)}
    {event && <article ref={highlight} key={`${state.step}-${event.at}`} className={`highlight ${state.step === 'rumour' ? 'highlight-danger' : ''}`} aria-live="polite">
      <div className="highlight-person"><span className="avatar">{event.node === -1 ? '✦' : nodes[event.node].category.slice(0, 1)}</span><div>{event.node === -1 ? 'You' : nodes[event.node].handle}</div></div>
      <p>{event.text}</p><div className="reaction">{event.reaction}</div>
    </article>}
    {hover && !event && <div className="node-tooltip" style={{ left: hover.x, top: hover.y }}>{nodes[hover.id].role}<small>{nodes[hover.id].category} · {view.to[hover.id] > 0 ? 'Supportive' : view.to[hover.id] < 0 ? 'Hostile' : 'Uncertain'} · {nodes[hover.id].influence > .66 ? 'High' : nodes[hover.id].influence > .33 ? 'Medium' : 'Low'} influence</small></div>}
  </div>;
}
