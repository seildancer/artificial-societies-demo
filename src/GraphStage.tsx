import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clusters, hash, identities, nodes } from './data';
import { getView, type State } from './simulation';
import { IdentityPortrait } from './IdentityPortrait';
import { PostAvatar, postName } from './PostAvatar';

const cream = new THREE.Color('#F4EDE4'), grey = new THREE.Color('#69676c'), red = new THREE.Color('#E9364A');
const gold = new THREE.Color('#D6A84B');
const sentimentColor = (n: number) => n > 0 ? cream : n < 0 ? red : grey;
const ease = (v: number) => { const t = Math.max(0, Math.min(1, v)); return t * t * (3 - 2 * t); };
const rumourOrder = [...nodes].sort((a, b) => Math.hypot(a.x - nodes[2].x, a.y - nodes[2].y) - Math.hypot(b.x - nodes[2].x, b.y - nodes[2].y)).map(n => n.id);
const responseOrder = [...nodes].sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y)).map(n => n.id);
const rumourRanks = new Map(rumourOrder.map((id, i) => [id, i / nodes.length]));
const responseRanks = new Map(responseOrder.map((id, i) => [id, i / nodes.length]));

const birthOrder = [...nodes].sort((a, b) => hash(a.id + 817) - hash(b.id + 817));
const birthRanks = new Map(birthOrder.map((node, rank) => [node.id, rank]));
const pinCadences = nodes.map(n => ({
  offset: hash(n.id + 2701) * 18,
  period: 9 + hash(n.id + 4903) * 9,
  duration: 2.1 + hash(n.id + 6101) * 2.4,
}));
const pinOrder = [...nodes].sort((a, b) => hash(a.id + 7907) - hash(b.id + 7907));
const relationships = nodes.flatMap(n => nodes.filter(b => b.id !== n.id && b.category === n.category)
  .sort((a, b) => Math.hypot(a.x-n.x,a.y-n.y,(a.z-n.z)*2) - Math.hypot(b.x-n.x,b.y-n.y,(b.z-n.z)*2))
  .slice(0, 3).filter(b => b.id > n.id).map(b => [n.id, b.id] as const));

export function GraphStage({ state, reduced, paused, portraitIndex }: { state: State; reduced: boolean; paused: boolean; portraitIndex: number }) {
  const host = useRef<HTMLDivElement>(null);
  const resetView = useRef(() => {});
  const centre = useRef<HTMLDivElement>(null);
  const activePin = useRef<HTMLDivElement>(null);
  const ambientPins = useRef<(HTMLDivElement | null)[]>([]);
  const clusterLabels = useRef<(HTMLDivElement | null)[]>([]);
  const live = useRef({ state, reduced, paused });
  live.current = { state, reduced, paused };
  const [hover, setHover] = useState<{ id: number; x: number; y: number } | null>(null);
  const [fallback, setFallback] = useState(false);
  const view = getView(state);
  const event = view.active;
  // Keep the portrait layer mounted while the renderer animates its positions.
  const ambientLayer = useMemo(() => <div className="ambient-pin-layer" aria-hidden="true">
    {nodes.map(n => <div key={n.id} ref={el => { ambientPins.current[n.id] = el; }} className="node-avatar-pin ambient-avatar-pin" data-node={n.id}>
      <div className="node-avatar-pin-mark"><PostAvatar node={n.id} identity={0} /></div>
    </div>)}
  </div>, []);

  useEffect(() => {
    const container = host.current!;
    let renderer: THREE.WebGLRenderer | undefined;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }); }
    catch { setFallback(true); }
    const canvas = renderer?.domElement ?? document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    container.prepend(canvas);
    const ctx = renderer ? null : canvas.getContext('2d');
    renderer?.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    if (renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100);
    camera.position.set(0, 0.6, 18);
    scene.fog = new THREE.FogExp2('#0d0d0f', 0.023);
    scene.add(new THREE.HemisphereLight('#f4eee1', '#232b46', 2.3));
    const keyLight = new THREE.DirectionalLight('#fff0d6', 3.8); keyLight.position.set(-4, 7, 9); scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight('#a6c5e8', 2.6); rimLight.position.set(5, -1, -4); scene.add(rimLight);
    const coreLight = new THREE.PointLight('#e8bb72', 16, 13, 2); coreLight.position.set(0, 0, 2); scene.add(coreLight);
    const geometry = new THREE.SphereGeometry(1, 20, 14);
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.2, metalness: 0.08, clearcoat: 0.65, clearcoatRoughness: 0.25,
      transparent: true, opacity: 0.64, depthWrite: false,
      emissive: '#b7aa94', emissiveIntensity: 0.08,
    });
    let composer: EffectComposer | undefined;
    let bloom: UnrealBloomPass | undefined;
    if (renderer) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.65, 0.76);
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
    }
    const mesh = new THREE.InstancedMesh(geometry, material, nodes.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);
    // One batched layer of soft halos also works when bloom is disabled.
    const glowPositions = new Float32Array(nodes.length * 3);
    const glowColors = new Float32Array(nodes.length * 3);
    const glowSizes = new Float32Array(nodes.length);
    const glowGeometry = new THREE.BufferGeometry();
    glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3).setUsage(THREE.DynamicDrawUsage));
    glowGeometry.setAttribute('color', new THREE.BufferAttribute(glowColors, 3).setUsage(THREE.DynamicDrawUsage));
    glowGeometry.setAttribute('size', new THREE.BufferAttribute(glowSizes, 1).setUsage(THREE.DynamicDrawUsage));
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: { projectionScale: { value: 1 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        uniform float projectionScale;
        varying vec3 haloColor;
        void main() {
          haloColor = color;
          vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * viewPosition;
          gl_PointSize = max(0.0, size * projectionScale / max(0.1, -viewPosition.z));
        }`,
      fragmentShader: `
        varying vec3 haloColor;
        void main() {
          float radius = length(gl_PointCoord - 0.5) * 2.0;
          float halo = exp(-4.5 * radius * radius) * (1.0 - smoothstep(0.65, 1.0, radius));
          gl_FragColor = vec4(haloColor, halo * 0.24);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const halos = new THREE.Points(glowGeometry, glowMaterial);
    halos.frustumCulled = false;
    scene.add(halos);
    const starMaterial = new THREE.MeshBasicMaterial({ color: gold });
    const star = new THREE.Mesh(geometry, starMaterial);
    star.scale.setScalar(0.13);
    scene.add(star);
    const ringGeometry = new THREE.RingGeometry(0.27, 0.279, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    scene.add(ring);
    const focusMaterial = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const focusRing = new THREE.Mesh(ringGeometry, focusMaterial); scene.add(focusRing);
    const pulseGeometry = new THREE.RingGeometry(0.1, 0.115, 32);
    const pulses = Array.from({ length: 22 }, () => {
      const item = new THREE.Mesh(pulseGeometry, new THREE.MeshBasicMaterial({ color: cream, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      scene.add(item); return item;
    });
    const maxEdges = 1100;
    const positions = new Float32Array(maxEdges * 6), colors = new Float32Array(maxEdges * 6);
    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    linesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
    const linesMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.65, depthWrite: false });
    const lines = new THREE.LineSegments(linesGeometry, linesMaterial); lines.frustumCulled = false; scene.add(lines);
    const dummy = new THREE.Object3D(), color = new THREE.Color(), vec = new THREE.Vector3();
    const points = nodes.map(n => new THREE.Vector3(n.x, n.y, n.z));
    const displayedColors = nodes.map(() => cream.clone());
    const births = new Float32Array(nodes.length);
    const pinOpacities = new Float32Array(nodes.length);
    const screenPoints: { x: number; y: number }[] = [];
    const rotation = new THREE.Quaternion();
    const cursorTarget = new THREE.Vector2(), cursorTilt = new THREE.Vector2();
    const lookAt = new THREE.Vector3(0, 0.4, 0);
    let yaw = -0.16, pitch = 0.08, targetYaw = -0.16, targetPitch = 0.08, zoom = 1;
    let dragging = false, lastX = 0, lastY = 0, visualTime = 0, introTime = 0;
    let frameElapsed = 0, lastElapsed = -1, slowFrames = 0;
    resetView.current = () => { targetYaw = -0.16; targetPitch = 0.08; zoom = 1; cursorTarget.set(0, 0); };
    const origin = new THREE.Vector3();
    let width = 1, height = 1, raf = 0, previous = performance.now(), hoverId = -1;
    let visiblePoints: { id: number; x: number; y: number; radius: number }[] = [];
    const resize = () => {
      width = container.clientWidth; height = container.clientHeight;
      if (renderer) { renderer.setSize(width, height); composer?.setSize(width, height); }
      else { canvas.width = width; canvas.height = height; }
      camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix();
      glowMaterial.uniforms.projectionScale.value = height * (renderer?.getPixelRatio() ?? 1) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const project = (p: THREE.Vector3) => { vec.copy(p).project(camera); return { x: (vec.x + 1) * width / 2, y: (1 - vec.y) * height / 2 }; };
    const onMove = (e: PointerEvent) => {
      if (dragging) {
        targetYaw += (e.clientX - lastX) * 0.004;
        targetPitch = THREE.MathUtils.clamp(targetPitch + (e.clientY - lastY) * 0.003, -0.65, 0.65);
        lastX = e.clientX; lastY = e.clientY; return;
      }
      const { state: s } = live.current;
      if (s.step === 'identity' || getView(s).active || (s.step === 'society' && s.elapsed < 2.5)) return;
      const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
      const found = visiblePoints.find(p => Math.hypot(x - p.x, y - p.y) < Math.max(8, p.radius));
      hoverId = found?.id ?? -1;
      setHover(found ? { id: found.id, x: Math.min(width - 210, Math.max(8, found.x + 14)), y: Math.max(4, found.y - 48) } : null);
      canvas.style.cursor = found ? 'crosshair' : 'grab';
    };
    const onLeave = () => { hoverId = -1; setHover(null); };
    const onCursorMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || dragging || live.current.reduced || live.current.paused) return;
      cursorTarget.set(
        THREE.MathUtils.clamp(e.clientX / window.innerWidth * 2 - 1, -1, 1) * 0.14,
        THREE.MathUtils.clamp(e.clientY / window.innerHeight * 2 - 1, -1, 1) * 0.085,
      );
    };
    const clearCursor = () => { cursorTarget.set(0, 0); };
    const onWindowLeave = (e: PointerEvent) => { if (!e.relatedTarget) clearCursor(); };
    const onDown = (e: PointerEvent) => { if (e.button !== 0) return; dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); onLeave(); canvas.style.cursor = 'grabbing'; };
    const onUp = () => { dragging = false; canvas.style.cursor = 'grab'; };
    const onKey = (e: KeyboardEvent) => {
      if (e.target !== container) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', 'Home'].includes(e.key)) e.preventDefault();
      if (e.key === 'ArrowLeft') targetYaw -= 0.15;
      if (e.key === 'ArrowRight') targetYaw += 0.15;
      if (e.key === 'ArrowUp') targetPitch = Math.max(-0.65, targetPitch - 0.1);
      if (e.key === 'ArrowDown') targetPitch = Math.min(0.65, targetPitch + 0.1);
      if (e.key === '+') zoom = Math.max(0.75, zoom - 0.1);
      if (e.key === '-') zoom = Math.min(1.4, zoom + 0.1);
      if (e.key === 'Home') resetView.current();
    };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
    container.addEventListener('keydown', onKey);
    canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointermove', onCursorMove, { passive: true });
    window.addEventListener('pointerout', onWindowLeave);
    window.addEventListener('blur', clearCursor);

    function render(now: number) {
      // Fall back to direct, antialiased rendering on sustained low frame rates.
      if (now - previous > 48) slowFrames++; else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 24 && bloom) bloom.enabled = false;
      const dt = Math.min(0.05, (now - previous) / 1000); previous = now;
      const { state: s, reduced: reduce, paused: pause } = live.current;
      const v = getView(s), active = v.active;
      const strength = active && !reduce ? ease((s.elapsed - active.at) / 0.85) * ease((active.at + active.duration - s.elapsed) / 0.65) : 0;
      const motionSpeed = 1 - 0.82 * strength;
      const motion = reduce ? 'reduced' : strength > 0.8 ? 'highlight' : 'ambient';
      if (container.dataset.motion !== motion) container.dataset.motion = motion;
      if (s.elapsed !== lastElapsed) { frameElapsed = s.elapsed; lastElapsed = s.elapsed; }
      else if (!pause && !document.hidden) frameElapsed = Math.min(s.elapsed + 0.1, frameElapsed + dt);
      if (!pause && !document.hidden) { if (!reduce) visualTime += dt * motionSpeed; if (s.step === 'identity') introTime += dt; }
      const t = visualTime;
      const smooth = reduce ? 1 : 1 - Math.exp(-dt * 5);
      yaw += (targetYaw - yaw) * smooth; pitch += (targetPitch - pitch) * smooth;
      if (reduce) { cursorTilt.set(0, 0); cursorTarget.set(0, 0); }
      else if (!pause && !dragging) cursorTilt.lerp(cursorTarget, 1 - Math.exp(-dt * 3.6 * motionSpeed));
      rotation.setFromEuler(new THREE.Euler(pitch + cursorTilt.y + Math.sin(t * 0.09) * 0.045, yaw + cursorTilt.x + Math.sin(t * 0.08) * 0.13, 0));
      const isIdentity = s.step === 'identity';
      const small = width < 650;
      const xScale = small ? 0.82 : 1;
      points.forEach((p, i) => {
        const n = nodes[i];
        p.set(n.x * xScale, n.y, n.z * 2.5);
        // Continuous ambient motion avoids a positional jump between story stages.
        if (!reduce) { p.x += Math.sin(t * 0.17 + i) * 0.045; p.y += Math.cos(t * 0.13 + i * 2) * 0.045; }
        p.applyQuaternion(rotation);
      });
      const fullDistance = Math.max(13.8, (small ? 6.2 : 7.6) / Math.tan(THREE.MathUtils.degToRad(21.5)) / camera.aspect);
      let targetX = 0;
      let targetY = 0.7, targetZ = fullDistance * zoom;
      const focus = active ? active.node === -1 ? origin : points[active.node] : undefined;
      focusRing.visible = Boolean(focus);
      if (focus) {
        focusRing.position.copy(focus);
        focusRing.quaternion.copy(camera.quaternion);
        focusRing.scale.setScalar(0.75 + (reduce ? 0 : Math.sin(t * 2) * 0.08));
        focusMaterial.color.copy(s.step === 'rumour' ? red : gold);
        focusMaterial.opacity = reduce ? 0.7 : strength * 0.8;
      }
      if (focus) { targetX += focus.x * 0.65 * strength; targetY += (focus.y - targetY) * 0.65 * strength; targetZ *= 1 - 0.3 * strength; }
      const lerp = reduce ? 1 : 1 - Math.exp(-dt * 4.8);
      camera.position.x += (targetX - camera.position.x) * lerp;
      camera.position.y += (targetY - camera.position.y) * lerp;
      camera.position.z += (targetZ - camera.position.z) * lerp;
      const aim = focus ?? origin;
      lookAt.lerp(vec.set(aim.x * 0.7 * strength, 0.4 + (aim.y - 0.4) * 0.7 * strength, aim.z * 0.7 * strength), lerp);
      camera.lookAt(lookAt);
      camera.updateMatrixWorld();
      if (activePin.current && focus) {
        const anchor = project(focus);
        // Attach your own post to the edge of the larger central portrait.
        if (active?.node === -1) anchor.y -= window.innerWidth <= 760 ? 23 : 30;
        activePin.current.style.transform = `translate(${anchor.x}px, ${anchor.y}px)`;
        activePin.current.style.opacity = String(reduce ? 1 : strength);
      }
      const relevant = new Set(active ? [active.node, ...active.targets] : []);
      const rumourState = s.step === 'rumour' || (s.step === 'response' && !s.running);
      const order = rumourState ? rumourOrder : responseOrder;
      const ranks = rumourState ? rumourRanks : responseRanks;
      visiblePoints = [];
      if (ctx) ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], p = points[i];
        const rank = birthRanks.get(i)!;
        const seed = rank < 42;
        const birth = reduce ? 1 : isIdentity ? (seed ? ease((introTime - rank * 0.024) / 0.18) : 0)
          : seed ? 1 : ease((s.step === 'society' ? frameElapsed - (rank - 42) * 0.0105 : 3) / 0.16);
        births[i] = birth;
        const change = v.progress === 1 ? 1 : ease((v.progress - ranks.get(i)!) * 8);
        color.copy(sentimentColor(v.from[i])).lerp(sentimentColor(v.to[i]), change);
        const dim = active && !relevant.has(i) ? 1 - 0.7 * strength : 1;
        color.multiplyScalar(dim * (isIdentity ? 0.85 : 0.87));
        displayedColors[i].lerp(color, reduce ? 1 : 1 - Math.exp(-dt * 8));
        color.copy(displayedColors[i]);
        dummy.position.copy(p);
        const size = (0.041 + n.influence * 0.067) * birth * (hoverId === i ? 1.6 : 1);
        dummy.scale.setScalar(size); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); mesh.setColorAt(i, color);
        glowPositions.set([p.x, p.y, p.z], i * 3);
        glowColors.set([color.r * birth, color.g * birth, color.b * birth], i * 3);
        glowSizes[i] = size * 7;
        const screen = project(p); const radius = size / (camera.position.z - p.z) * height * 1.3;
        screenPoints[i] = screen;
        if (birth > 0.5) visiblePoints.push({ id: i, ...screen, radius });
        if (ctx && birth > 0) {
          ctx.fillStyle = ctx.shadowColor = `#${color.getHexString()}`;
          ctx.shadowBlur = Math.max(3, radius * 2.5); ctx.globalAlpha = 0.72;
          ctx.beginPath(); ctx.arc(screen.x, screen.y, Math.max(1.2, radius), 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
      }
      const mobile = window.innerWidth <= 760;
      const pinLimit = mobile ? 7 : 26;
      const occupied = [{ ...project(origin), clearance: mobile ? 40 : 55 }];
      if (focus) occupied.push({ ...project(focus), clearance: mobile ? 45 : 65 });
      let pinCount = 0;
      for (const n of pinOrder) {
        const el = ambientPins.current[n.id];
        if (!el) continue;
        const screen = screenPoints[n.id];
        const cadence = pinCadences[n.id];
        // A fixed sample replaces recurring appearances in reduced motion.
        const age = ((reduce ? 0 : t) + cadence.offset) % cadence.period;
        const life = ease(age / 0.4) * ease((cadence.duration - age) / 0.65);
        const clearance = mobile ? 30 : 43;
        const eligible = s.step !== 'identity' && births[n.id] > 0.95 && active?.node !== n.id
          && life > 0 && pinCount < pinLimit
          && screen.x > clearance / 2 && screen.x < width - clearance / 2
          && screen.y > (mobile ? 38 : 50) && screen.y < height - 8
          && !occupied.some(p => Math.abs(p.x - screen.x) < p.clearance && Math.abs(p.y - screen.y) < p.clearance + 12);
        const opacity = eligible ? (reduce ? 0.7 : life * (1 - 0.65 * strength)) : 0;
        if (eligible) { pinCount++; occupied.push({ ...screen, clearance }); }
        const previousOpacity = pinOpacities[n.id];
        const nextOpacity = active?.node === n.id ? 0 : reduce ? opacity : pause || document.hidden ? previousOpacity : previousOpacity + (opacity - previousOpacity) * (1 - Math.exp(-dt * 9));
        pinOpacities[n.id] = nextOpacity < 0.005 ? 0 : nextOpacity;
        if (pinOpacities[n.id] > 0 || previousOpacity > 0) {
          el.style.opacity = String(pinOpacities[n.id]);
          el.style.transform = `translate(${screen.x}px, ${screen.y}px)`;
        }
      }
      glowGeometry.attributes.position.needsUpdate = true;
      glowGeometry.attributes.color.needsUpdate = true;
      glowGeometry.attributes.size.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      let edgeCount = 0;
      const edge = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Color, alpha: number, travel = 1) => {
        if (edgeCount >= maxEdges) return;
        const offset = edgeCount++ * 6;
        positions.set([a.x, a.y, a.z, a.x + (b.x - a.x) * travel, a.y + (b.y - a.y) * travel, a.z + (b.z - a.z) * travel], offset);
        colors.set([c.r * alpha, c.g * alpha, c.b * alpha, c.r * alpha, c.g * alpha, c.b * alpha], offset);
        if (ctx) { const p = project(a), q = project(b); ctx.strokeStyle = `#${c.getHexString()}`; ctx.globalAlpha = alpha * 0.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (q.x - p.x) * travel, p.y + (q.y - p.y) * travel); ctx.stroke(); ctx.globalAlpha = 1; }
      };
      for (const [a, b] of relationships) {
        const formed = Math.min(births[a], births[b]);
        if (formed > 0) edge(points[a], points[b], cream, formed * (active ? 0.065 : 0.16), formed);
      }
      // A few bridges expose how information can travel between communities.
      const bridges = [[0, 46], [3, 115], [146, 0], [146, 164], [46, 164], [115, 190]];
      for (const [a, b] of bridges) {
        const formed = Math.min(births[a], births[b]);
        if (formed > 0) edge(points[a], points[b], gold, formed * (active ? 0.025 : 0.075), formed);
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
        if (births[from] < 0.99 || births[to] < 0.99) continue;
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
        pulse.scale.setScalar(0.5 + frac * 1.9);
        pulse.quaternion.copy(camera.quaternion);
        pulse.material.color.copy(activityColor);
        pulse.material.opacity = reduce || births[order[rank]] < 0.99 || isIdentity ? 0 : (1 - frac) * 0.14 * (active ? 0.5 : 1);
      });
      ring.scale.setScalar(!reduce && s.running && s.elapsed < 3 && s.strategy !== 'silence' ? 1 + (s.elapsed % 1) * 9 : 1.5 + (reduce ? 0 : Math.sin(t) * 0.08));
      ring.quaternion.copy(camera.quaternion);
      const cp = project(origin);
      if (centre.current) centre.current.style.transform = `translate(${cp.x}px, ${cp.y}px)`;
      clusters.forEach((c, i) => {
        const pos = project(new THREE.Vector3(c.x * xScale, c.y + (c.name === 'Fans' || c.name === 'Public' ? -1.7 : 1.35), c.z * 2.5).applyQuaternion(rotation));
        if (clusterLabels.current[i]) { clusterLabels.current[i]!.style.transform = `translate(${pos.x}px, ${pos.y}px)`; clusterLabels.current[i]!.style.opacity = active ? '0.25' : String(isIdentity ? 0.6 : 0.5 + v.genesis * 0.5); }
      });
      if (composer && bloom?.enabled) composer.render(); else if (renderer) renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf); observer.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); container.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onCursorMove); window.removeEventListener('pointerout', onWindowLeave); window.removeEventListener('blur', clearCursor);
      composer?.passes.forEach(pass => pass.dispose()); composer?.dispose();
      geometry.dispose(); material.dispose(); starMaterial.dispose(); ringGeometry.dispose(); ringMaterial.dispose(); focusMaterial.dispose(); pulseGeometry.dispose();
      glowGeometry.dispose(); glowMaterial.dispose();
      pulses.forEach(p => p.material.dispose()); linesGeometry.dispose(); linesMaterial.dispose(); renderer?.dispose(); canvas.remove();
    };
  }, []);

  return <div ref={host} className={`graph ${state.step === 'identity' ? 'graph-intro' : ''}`} role="group" tabIndex={0} aria-label={`3D social network: ${reduced ? 229 : state.step === 'identity' ? 42 : Math.min(229, 42 + Math.floor(view.genesis * 187))} personas. ${view.metrics.supportive}% supportive, ${view.metrics.hostile}% hostile.`} data-renderer={fallback ? 'canvas-fallback' : 'webgl'}>
    {ambientLayer}
    <div ref={centre} className="celebrity-anchor"><div className="celebrity-mark" role="img" aria-label={portraitIndex < 0 ? 'You, at the centre of the society' : `You as the ${identities[portraitIndex].title.toLowerCase()}`}><IdentityPortrait index={portraitIndex} /></div></div>
    {event && <div ref={activePin} className={`node-avatar-pin highlight-avatar-pin ${state.step === 'rumour' ? 'pin-danger' : ''}`} data-node={event.node} role="img" aria-label={`${event.node === -1 ? 'You' : postName(event.node)}, active voice in the network`}>
      <div className="node-avatar-pin-mark"><PostAvatar node={event.node} identity={state.identity} /></div>
    </div>}
    {clusters.map((c, i) => <div key={c.name} ref={el => { clusterLabels.current[i] = el; }} className="cluster-label">{c.name}</div>)}
    {hover && !event && <div className="node-tooltip" style={{ left: hover.x, top: hover.y }}>{nodes[hover.id].role}<small>{nodes[hover.id].category} · {view.to[hover.id] > 0 ? 'Supportive' : view.to[hover.id] < 0 ? 'Hostile' : 'Uncertain'} · {nodes[hover.id].influence > .66 ? 'High' : nodes[hover.id].influence > .33 ? 'Medium' : 'Low'} influence</small></div>}
  </div>;
}
