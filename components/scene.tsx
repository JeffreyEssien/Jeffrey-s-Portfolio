'use client'

// One GPU particle system behind the whole site. Each section has a shape; scrolling
// morphs between them, the pointer is a force field, clicks send shockwaves and
// scroll speed adds turbulence. Everything moves in the vertex shader: a curl-noise
// flow field keeps the matter alive and carries particles between shapes, and a final
// lens pass bends and splits the image with scroll speed, morphs and clicks.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { setWebgl, useIntroDone } from './effects'
import { fitName } from './particle-name'

const SECTIONS = ['hero', 'about', 'work', 'projects', 'ops', 'contact']
// Per-shape motion: Y-spin speed, wave amplitude, opacity, X tilt.
const MOTION = [
  { rot: 0, wave: 0, alpha: 1, tilt: 0 },
  { rot: 0.12, wave: 0, alpha: 0.5, tilt: 0.3 },
  { rot: 0.35, wave: 0, alpha: 0.45, tilt: 0 },
  { rot: 0, wave: 0.35, alpha: 0.55, tilt: 0 },
  { rot: 0.18, wave: 0, alpha: 0.45, tilt: 0.45 },
  { rot: 0.1, wave: 0, alpha: 0.4, tilt: 1.15 },
]
// Per-shape strength of the ambient flow; the name barely shimmers so it stays legible.
const FLOW = [0.03, 0.22, 0.16, 0.12, 0.14, 0.3]
const CLICKS = 6
const FOV = 50
const CAMERA_Z = 10

const vertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec4 aRand;
  uniform float uT, uTime, uIntro, uVel, uHover, uPixelRatio, uSize, uFromShift, uToShift, uFromFlow, uToFlow;
  uniform vec4 uFromMotion, uToMotion;
  uniform vec3 uMouse;
  uniform vec4 uClicks[${CLICKS}];
  varying float vAlpha, vGlow, vSeed, vHue;

  // Simplex noise (Ashima Arts / Stefan Gustavson, MIT).
  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - 0.5;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    vec3 ns = 0.142857142857 * vec3(2.0, 0.5, 1.0) - vec3(0.0, 1.0, 0.0);
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x), p1 = vec3(a0.zw, h.y), p2 = vec3(a1.xy, h.z), p3 = vec3(a1.zw, h.w);
    vec4 norm = inversesqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
  vec3 grad(vec3 p) {
    float n = snoise(p);
    return vec3(snoise(p + vec3(0.1, 0.0, 0.0)) - n, snoise(p + vec3(0.0, 0.1, 0.0)) - n, snoise(p + vec3(0.0, 0.0, 0.1)) - n) * 10.0;
  }
  // Divergence-free flow (cross product of two noise gradients): smoke-like, never clumps.
  vec3 flow(vec3 p) { return cross(grad(p), grad(p + vec3(31.4, -17.2, 9.7))) * 0.25; }

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  vec3 rotX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
  vec3 animate(vec3 p, vec4 m, float shift) {
    p.y += m.y * sin(p.x * 0.7 + uTime * 0.9) * cos(p.z * 0.9 + uTime * 0.6) * 2.0;
    p = rotX(rotY(p, uTime * m.x), m.w);
    p.y += shift;
    return p;
  }

  void main() {
    float seed = aRand.w;
    vec3 from = animate(aFrom, uFromMotion, uFromShift);
    vec3 to = animate(aTo, uToMotion, uToShift);
    float tt = smoothstep(0.0, 1.0, clamp((uT - seed * 0.35) / 0.65, 0.0, 1.0));
    vec3 pos = mix(from, to, tt);

    // Mid-transition particles ride the flow field like ink in water, then settle.
    float travel = sin(3.14159 * tt);
    vec3 current = flow(pos * 0.22 + vec3(0.0, uTime * 0.07, seed * 0.6));
    pos += current * (mix(uFromFlow, uToFlow, tt) + travel * 2.4 + uVel * 0.9);
    pos += aRand.xyz * travel * 0.7;
    pos += vec3(sin(uTime * 0.6 + seed * 40.0), cos(uTime * 0.5 + seed * 31.0), sin(uTime * 0.4 + seed * 17.0)) * (0.02 + uVel * 0.6);

    // Intro: fly in from a wide scattered cloud.
    float intro = smoothstep(0.0, 1.0, clamp((uIntro - seed * 0.45) / 0.55, 0.0, 1.0));
    pos = mix(aRand.xyz * 14.0, pos, intro);

    float glow = 0.0;
    vec2 dm = pos.xy - uMouse.xy;
    float f = smoothstep(uMouse.z, 0.0, length(dm));
    // The pointer is a whirlpool: matter twists around it (a rotation, so it never piles up).
    float twist = f * f * 2.2;
    float cs = cos(twist), sn = sin(twist);
    pos.xy = uMouse.xy + mat2(cs, sn, -sn, cs) * dm + normalize(dm + 1e-5) * f * 0.25;
    pos.z += f * 1.2;
    glow += f;

    for (int i = 0; i < ${CLICKS}; i++) {
      vec4 c = uClicks[i];
      float age = uTime - c.z;
      if (age < 0.0 || age > 2.5) continue;
      vec2 d = pos.xy - c.xy;
      float ring = exp(-pow((length(d) - age * 6.0) * 1.5, 2.0)) * (1.0 - age / 2.5) * c.w;
      pos.xy += normalize(d + 1e-5) * ring * 1.1;
      pos.z += ring * 1.2;
      glow += ring;
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * uPixelRatio * (0.55 + seed * 0.9) * (1.0 + glow * 1.4 + uHover * 0.25) * (10.0 / -mv.z), 9.0 * uPixelRatio);
    vAlpha = mix(uFromMotion.z, uToMotion.z, tt);
    vGlow = glow;
    vSeed = seed;
    vHue = 0.5 + 0.5 * sin(seed * 23.0 + pos.y * 0.35 + pos.x * 0.2 + uTime * 0.25);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uAccent, uViolet;
  varying float vAlpha, vGlow, vSeed, vHue;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d);
    vec3 color = mix(vec3(0.96), uAccent, step(0.14, vSeed));
    // A quarter of the accent particles drift through violet for depth.
    color = mix(color, uViolet, step(0.75, vSeed) * smoothstep(0.45, 0.9, vHue));
    color = mix(color, vec3(1.0), clamp(vGlow, 0.0, 1.0) * 0.3);
    gl_FragColor = vec4(color * (1.0 + vGlow * 0.9), a * vAlpha * (0.32 + vGlow * 0.5));
  }
`

const lens = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uAspect: { value: 1 },
    uStrain: { value: 0 }, uClicks: { value: [] as THREE.Vector4[] },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAspect, uStrain;
    uniform vec4 uClicks[${CLICKS}];
    varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      c.x *= uAspect;
      float r2 = dot(c, c);
      // Barrel warp and chromatic split grow with strain (scroll speed, morphs, the intro).
      vec2 uv = vUv - (vUv - 0.5) * r2 * uStrain * 0.35;
      // Clicks send a refracting ring across the glass.
      for (int i = 0; i < ${CLICKS}; i++) {
        vec4 k = uClicks[i];
        float age = uTime - k.z;
        if (age < 0.0 || age > 1.6) continue;
        vec2 d = vUv - k.xy;
        d.x *= uAspect;
        float ring = exp(-pow((length(d) - age * 0.9) * 22.0, 2.0)) * (1.0 - age / 1.6) * k.w;
        uv -= normalize(d + 1e-5) * ring * 0.018 / vec2(uAspect, 1.0);
      }
      vec2 split = (vUv - 0.5) * (0.003 + uStrain * 0.02) * (0.4 + r2 * 2.0);
      vec3 col = vec3(texture2D(tDiffuse, uv + split).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - split).b);
      col *= 1.0 - smoothstep(0.35, 1.1, r2 * 1.6) * 0.55;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

type View = { w: number; h: number; visW: number; visH: number; k: number }

function view(): View {
  const w = window.innerWidth, h = window.innerHeight
  const visH = 2 * Math.tan((FOV / 2) * Math.PI / 180) * CAMERA_Z
  return { w, h, visH, visW: visH * (w / h), k: visH / h }
}

// Rejection-free text sampling: pick random filled pixels of the rendered word.
function nameShape(n: number, v: View, anchor: HTMLElement | null, text: string, family: string) {
  const out = new Float32Array(n * 3)
  const rect = anchor?.getBoundingClientRect()
  const left = rect ? rect.left : v.w * 0.05
  const top = rect ? rect.top + window.scrollY : v.h * 0.3
  const width = rect ? rect.width : v.w * 0.9
  const { fontSize, height } = fitName(text, width, family)
  const c = document.createElement('canvas')
  c.width = Math.ceil(width)
  c.height = Math.ceil(height)
  const ctx = c.getContext('2d')!
  ctx.font = `italic 400 ${fontSize}px ${family}`
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(text, 2, height / 2)
  const data = ctx.getImageData(0, 0, c.width, c.height).data
  const filled: number[] = []
  for (let i = 3; i < data.length; i += 8) if (data[i] > 128) filled.push((i - 3) / 4)
  for (let i = 0; i < n; i++) {
    const p = filled[(Math.random() * filled.length) | 0] ?? 0
    const px = left + (p % c.width) + Math.random()
    const py = top + Math.floor(p / c.width) + Math.random()
    out[i * 3] = (px - v.w / 2) * v.k
    out[i * 3 + 1] = -(py - v.h / 2) * v.k
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.25
  }
  return out
}

function sphere(n: number, v: View) {
  const out = new Float32Array(n * 3)
  const r = v.visH * 0.34
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const shell = i % 10 < 8
    const y = 1 - (i / (n - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    const rr = shell ? r : r * Math.cbrt(Math.random()) * 0.9
    out.set([Math.cos(th) * rad * rr, y * rr, Math.sin(th) * rad * rr], i * 3)
  }
  return out
}

function helix(n: number, v: View) {
  const out = new Float32Array(n * 3)
  const len = v.visH * 1.1, r = Math.min(v.visW, v.visH) * 0.16
  for (let i = 0; i < n; i++) {
    const u = Math.random()
    const a = u * Math.PI * 2 * 3.2
    if (i % 6 === 0) {
      // rungs between the two strands
      const step = Math.round(u * 40) / 40, aa = step * Math.PI * 2 * 3.2, s = Math.random() * 2 - 1
      out.set([Math.cos(aa) * r * s, (step - 0.5) * len, Math.sin(aa) * r * s], i * 3)
    } else {
      const strand = i % 2 ? Math.PI : 0, j = (Math.random() - 0.5) * 0.12
      out.set([Math.cos(a + strand) * r + j, (u - 0.5) * len + j, Math.sin(a + strand) * r + j], i * 3)
    }
  }
  return out
}

function terrain(n: number, v: View) {
  const out = new Float32Array(n * 3)
  const cols = Math.ceil(Math.sqrt(n * 2.2)), rows = Math.ceil(n / cols)
  for (let i = 0; i < n; i++) {
    const x = (i % cols) / cols, z = Math.floor(i / cols) / rows
    out.set([(x - 0.5) * v.visW * 1.6, -v.visH * 0.28, (z - 0.75) * 12], i * 3)
  }
  return out
}

function cluster(n: number, v: View) {
  const out = new Float32Array(n * 3)
  const s = Math.min(v.visW, v.visH) * 0.11, gap = s * 1.9
  for (let i = 0; i < n; i++) {
    const pod = i % 27
    const cx = ((pod % 3) - 1) * gap, cy = ((Math.floor(pod / 3) % 3) - 1) * gap, cz = (Math.floor(pod / 9) - 1) * gap
    // points on the cube's edges, so each pod reads as a wireframe node
    const p = [Math.random() * 2 - 1, Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1]
    const axis = i % 3
    const e = [p[axis], p[(axis + 1) % 3], p[(axis + 2) % 3]]
    out.set([cx + e[0] * s / 2, cy + e[1] * s / 2, cz + e[2] * s / 2], i * 3)
  }
  return out
}

function galaxy(n: number, v: View) {
  const out = new Float32Array(n * 3)
  const R = Math.min(v.visW, v.visH) * 0.62
  for (let i = 0; i < n; i++) {
    const r = Math.pow(Math.random(), 0.7) * R
    const arm = (i % 3) * (Math.PI * 2 / 3)
    const spread = (Math.random() - 0.5) * (0.5 + r / R) * 0.9
    const a = arm + r * 1.4 / (R / 3) * 0.6 + spread
    out.set([Math.cos(a) * r, (Math.random() - 0.5) * 0.25 * (1 - r / R), Math.sin(a) * r], i * 3)
  }
  return out
}

export default function Scene({ name }: { name: string }) {
  const host = useRef<HTMLDivElement>(null)
  const intro = useIntroDone()
  const introRef = useRef(intro)
  introRef.current = intro

  useEffect(() => {
    const el = host.current
    if (!el) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    } catch {
      setWebgl('off')
      return
    }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.innerWidth < 768
    const count = mobile ? 14000 : 36000
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75)
    renderer.setPixelRatio(dpr)
    // Work directly in display space: an sRGB output pass would amplify the faint
    // additive haze of tens of thousands of particles into a grey veil.
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    renderer.setClearColor(new THREE.Color().setRGB(11 / 255, 11 / 255, 12 / 255, THREE.LinearSRGBColorSpace), 1)
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
    camera.position.z = CAMERA_Z
    const family = getComputedStyle(document.body).getPropertyValue('--font-serif').trim() || 'Georgia, serif'
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#c8f560'

    const geometry = new THREE.BufferGeometry()
    const rand = new Float32Array(count * 4)
    for (let i = 0; i < count; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(0.3 + Math.random())
      rand.set([v.x, v.y, v.z, Math.random()], i * 4)
    }
    geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 4))
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000)

    const clicks = Array.from({ length: CLICKS }, () => new THREE.Vector4(0, 0, -100, 0))
    const uniforms = {
      uT: { value: 0 }, uTime: { value: 0 }, uIntro: { value: still ? 1 : 0 }, uVel: { value: 0 }, uHover: { value: 0 },
      uPixelRatio: { value: dpr }, uSize: { value: mobile ? 3.2 : 2.6 }, uFromShift: { value: 0 }, uToShift: { value: 0 },
      uFromMotion: { value: new THREE.Vector4() }, uToMotion: { value: new THREE.Vector4() },
      uMouse: { value: new THREE.Vector3(999, 999, mobile ? 0.9 : 1.3) },
      uClicks: { value: clicks },
      uAccent: { value: new THREE.Color().setStyle(accent, THREE.LinearSRGBColorSpace) },
      uViolet: { value: new THREE.Color().setStyle('#9b7bff', THREE.LinearSRGBColorSpace) },
      uFromFlow: { value: 0 }, uToFlow: { value: 0 },
    }
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    scene.add(new THREE.Points(geometry, material))

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.5, 0.2, 0.6)
    if (!mobile) composer.addPass(bloom)
    const lensClicks = Array.from({ length: CLICKS }, () => new THREE.Vector4(0, 0, -100, 0))
    const lensPass = new ShaderPass(lens)
    lensPass.uniforms.uClicks.value = lensClicks
    composer.addPass(lensPass)

    // Adaptive quality: software renderers start low; any device that can't hold
    // ~30fps sheds bloom, then particles, then resolution.
    const gl = renderer.getContext()
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const gpu = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    let tier = /swiftshader|llvmpipe|software/i.test(gpu) ? 0 : 2
    const applyTier = () => {
      if (tier < 2 && composer.passes.includes(bloom)) composer.removePass(bloom)
      if (tier === 0 && composer.passes.includes(lensPass)) composer.removePass(lensPass)
      geometry.setDrawRange(0, tier === 0 ? Math.floor(count * 0.25) : tier === 1 ? Math.floor(count * 0.6) : count)
      if (tier === 0) { renderer.setPixelRatio(1); composer.setPixelRatio(1); uniforms.uPixelRatio.value = 1 }
    }
    applyTier()
    let frameSamples = 0, frameTotal = 0, lastFrame = performance.now()

    let shapes: THREE.BufferAttribute[] = []
    let v = view()
    let tops: number[] = []
    const build = () => {
      v = view()
      renderer.setSize(v.w, v.h)
      composer.setSize(v.w, v.h)
      camera.aspect = v.w / v.h
      camera.updateProjectionMatrix()
      lensPass.uniforms.uAspect.value = v.w / v.h
      const anchor = document.querySelector<HTMLElement>('[data-name-anchor]')
      shapes = [nameShape(count, v, anchor, name, family), sphere(count, v), helix(count, v), terrain(count, v), cluster(count, v), galaxy(count, v)]
        .map((a) => new THREE.BufferAttribute(a, 3))
      tops = SECTIONS.map((id) => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY)
      pair = [-1, -1]
    }

    // Scroll position → (shape a, shape b, t). Morph during the last 40% of each section.
    const progress = () => {
      const probe = window.scrollY + v.h * 0.5
      let i = 0
      while (i < tops.length - 1 && probe >= tops[i + 1]) i++
      const end = tops[i + 1] ?? document.documentElement.scrollHeight
      const local = (probe - tops[i]) / Math.max(1, end - tops[i])
      return Math.min(SECTIONS.length - 1, i + Math.min(1, Math.max(0, (local - 0.6) / 0.4)))
    }

    let pair = [-1, -1]
    const pointer = { x: 999, y: 999, tx: 999, ty: 999, nx: 0, ny: 0 }
    let smooth = 0, lastTime = 0, lastY = window.scrollY, vel = 0, hover = 0, hoverTarget = 0, introT = still ? 1 : 0, clickIndex = 0
    const clock = new THREE.Clock()
    let frame = 0

    const toWorld = (cx: number, cy: number) => [(cx / v.w - 0.5) * v.visW, -(cy / v.h - 0.5) * v.visH]
    const onMove = (e: PointerEvent) => {
      ;[pointer.tx, pointer.ty] = toWorld(e.clientX, e.clientY)
      pointer.nx = e.clientX / v.w - 0.5
      pointer.ny = e.clientY / v.h - 0.5
      hoverTarget = (e.target as Element).closest?.('a, button') ? 1 : 0
    }
    const onDown = (e: PointerEvent) => {
      const [x, y] = toWorld(e.clientX, e.clientY)
      const strength = (e.target as Element).closest?.('a, button') ? 1.6 : 1
      lensClicks[clickIndex % CLICKS].set(e.clientX / v.w, 1 - e.clientY / v.h, clock.getElapsedTime(), strength)
      clicks[clickIndex++ % CLICKS].set(x, y, clock.getElapsedTime(), strength)
    }
    const onLeave = () => { pointer.tx = pointer.ty = 999 }

    const tick = () => {
      frame = requestAnimationFrame(tick)
      // Nothing to show behind an open modal; skip the GPU work.
      if (document.querySelector('dialog[open]')) { lastFrame = performance.now(); return }
      const now = performance.now()
      frameTotal += now - lastFrame
      lastFrame = now
      if (++frameSamples === 90) {
        if (frameTotal / frameSamples > 32 && tier > 0) { tier--; applyTier() }
        frameSamples = 0
        frameTotal = 0
      }
      const time = clock.getElapsedTime()
      const dt = Math.min(time - lastTime, 0.1)
      lastTime = time
      uniforms.uTime.value = still ? 0 : time
      lensPass.uniforms.uTime.value = time
      const target = progress()
      smooth += (target - smooth) * (still ? 1 : 0.08)
      const a = Math.min(Math.floor(smooth), SECTIONS.length - 2)
      const t = smooth - a
      if (a !== pair[0]) {
        pair = [a, a + 1]
        geometry.setAttribute('aFrom', shapes[a])
        geometry.setAttribute('aTo', shapes[a + 1])
        const m = (s: number) => MOTION[s]
        uniforms.uFromMotion.value.set(m(a).rot, m(a).wave, m(a).alpha, m(a).tilt)
        uniforms.uToMotion.value.set(m(a + 1).rot, m(a + 1).wave, m(a + 1).alpha, m(a + 1).tilt)
        uniforms.uFromFlow.value = FLOW[a]
        uniforms.uToFlow.value = FLOW[a + 1]
      }
      uniforms.uT.value = t
      // The name is laid out in page space, so it scrolls with the hero.
      const shift = window.scrollY * v.k
      uniforms.uFromShift.value = a === 0 ? shift : 0
      uniforms.uToShift.value = 0

      vel += (Math.min(Math.abs(window.scrollY - lastY) / 60, 1.5) - vel) * 0.1
      lastY = window.scrollY
      uniforms.uVel.value = still ? 0 : vel
      hover += (hoverTarget - hover) * 0.1
      uniforms.uHover.value = hover
      // Time-based so slow devices still finish forming the name (~2s).
      if (introRef.current && introT < 1) introT = Math.min(1, introT + dt / 2)
      uniforms.uIntro.value = 1 - Math.pow(1 - introT, 3)
      lensPass.uniforms.uStrain.value = still ? 0 : Math.sin(Math.PI * t) * 0.9 + vel * 0.7 + Math.pow(1 - introT, 2) * 1.6

      pointer.x += (pointer.tx - pointer.x) * 0.15
      pointer.y += (pointer.ty - pointer.y) * 0.15
      uniforms.uMouse.value.x = pointer.x
      uniforms.uMouse.value.y = pointer.y
      if (!still) {
        camera.position.x += (pointer.nx * 0.6 - camera.position.x) * 0.04
        camera.position.y += (-pointer.ny * 0.4 - camera.position.y) * 0.04
        camera.position.z = CAMERA_Z + vel * 1.2
        camera.lookAt(0, 0, 0)
      }
      composer.render()
    }

    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200) }
    // Section heights change as content loads; re-measure periodically and on resize.
    const remeasure = setInterval(() => { tops = SECTIONS.map((id) => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY) }, 1500)

    document.fonts.ready.then(() => {
      if (!renderer.domElement.isConnected) return
      build()
      setWebgl('on')
      lastFrame = performance.now()
      frame = requestAnimationFrame(tick)
    })
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(resizeTimer)
      clearInterval(remeasure)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.removeEventListener('pointerleave', onLeave)
      geometry.dispose()
      material.dispose()
      lensPass.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [name])

  return <div ref={host} aria-hidden className="pointer-events-none fixed inset-0 z-0" />
}
