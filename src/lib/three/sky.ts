import * as THREE from 'three'
import { skyFor } from '../weather/conditions.ts'

/**
 * Three.js (vanilla, no R3F) animated weather background.
 * Fixed camera, no sun/lens-flare. A gradient sky dome with layered parallax
 * cloud sprites plus weather particle systems (rain / snow / stars / fog),
 * driven by WMO condition + day/night. Camera never moves — "parallax" is the
 * cloud/particle layers shifting slightly against a static pointer /
 * device-orientation offset.
 */

const sphereShader = {
  vertex: /* glsl */ `
    varying vec3 vPos;
    void main() {
      vPos = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragment: /* glsl */ `
    uniform vec3 uTop;
    uniform vec3 uBottom;
    varying vec3 vPos;
    void main() {
      float h = clamp(normalize(vPos).y * 0.5 + 0.55, 0.0, 1.0);
      gl_FragColor = vec4(mix(uBottom, uTop, h), 1.0);
    }
  `,
}

/** A soft radial "puff" texture used for clouds / particles. */
const puffTexture = (
  radial: string,
  core = 'rgba(255,255,255,0.9)',
): THREE.Texture => {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64)
  grd.addColorStop(0, core)
  grd.addColorStop(0.55, radial)
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  return t
}

/** A dark base with soft lighter puffs — the storm-cloud smoke look. */
const smokeTexture = (): THREE.Texture => {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#0a0d14'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 26; i++) {
    const x = 32 + Math.random() * 192
    const y = 32 + Math.random() * 192
    const r = 24 + Math.random() * 60
    const grad = g.createRadialGradient(x, y, 2, x, y, r)
    grad.addColorStop(0, 'rgba(255,255,255,0.5)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  return new THREE.CanvasTexture(c)
}

const RAIN_COUNT = 1800

interface WeatherSpec {
  top: string
  bottom: string
  cloudCount: number
  cloudOpacity: number
  particles: 'none' | 'rain' | 'snow'
  fog: number
  stars: boolean
}

const specFor = (code: number, isDay: number): WeatherSpec => {
  const sky = skyFor(code, isDay)
  if (code >= 95)
    return {
      ...sky,
      cloudCount: 10,
      cloudOpacity: 0.7,
      particles: 'rain',
      fog: 0.35,
      stars: false,
    }
  if (code >= 80 && code <= 82)
    return {
      ...sky,
      cloudCount: 9,
      cloudOpacity: 0.6,
      particles: 'rain',
      fog: 0.2,
      stars: false,
    }
  if (code >= 61 && code <= 65)
    return {
      ...sky,
      cloudCount: 9,
      cloudOpacity: 0.65,
      particles: 'rain',
      fog: 0.28,
      stars: false,
    }
  if (code >= 71 && code <= 77)
    return {
      ...sky,
      cloudCount: 8,
      cloudOpacity: 0.6,
      particles: 'snow',
      fog: 0.18,
      stars: false,
    }
  if (code === 45 || code === 48)
    return {
      ...sky,
      cloudCount: 6,
      cloudOpacity: 0.45,
      particles: 'none',
      fog: 0.5,
      stars: false,
    }
  if (code === 3)
    return {
      ...sky,
      cloudCount: 9,
      cloudOpacity: 0.55,
      particles: 'none',
      fog: 0,
      stars: isDay === 0,
    }
  if (code === 1 || code === 2)
    return {
      ...sky,
      cloudCount: 5,
      cloudOpacity: 0.4,
      particles: 'none',
      fog: 0,
      stars: isDay === 0,
    }
  // clear
  return {
    ...sky,
    cloudCount: 2,
    cloudOpacity: 0.3,
    particles: 'none',
    fog: 0,
    stars: isDay === 0,
  }
}

export class Sky {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private skyMat: THREE.ShaderMaterial
  private clouds = new THREE.Group()
  private rain: THREE.Points | null = null
  private snow: THREE.Points | null = null
  private starPoints: THREE.Points | null = null
  private cloudSprites: THREE.Sprite[] = []
  private cloudSpec: { count: number; opacity: number } = {
    count: 2,
    opacity: 0.3,
  }
  private particles: 'none' | 'rain' | 'snow' = 'none'
  private rainMat!: THREE.PointsMaterial
  private snowMat!: THREE.PointsMaterial
  private starMat!: THREE.PointsMaterial
  private stormClouds = new THREE.Group()
  private rainVel!: Float32Array
  private raf = 0
  private clock = new THREE.Clock()
  private targets: { px: number; py: number } = { px: 0, py: 0 }
  private current: { px: number; py: number } = { px: 0, py: 0 }
  private ro: ResizeObserver
  private onPointerMove: (e: PointerEvent) => void

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.domElement.style.position = 'absolute'
    this.renderer.domElement.style.inset = '0'
    container.appendChild(this.renderer.domElement)

    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000)
    this.camera.position.set(0, 0, 0)

    const sky = skyFor(0, 1)
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: new THREE.Color(sky.top) },
        uBottom: { value: new THREE.Color(sky.bottom) },
      },
      vertexShader: sphereShader.vertex,
      fragmentShader: sphereShader.fragment,
      side: THREE.BackSide as THREE.Side,
      depthWrite: false,
    })
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(200, 32, 16),
      this.skyMat,
    )
    this.scene.add(dome)
    this.scene.fog = new THREE.Fog(0xffffff, 30, 70)

    // cloud sprites with parallax
    const tex = puffTexture('rgba(255,255,255,0.25)')
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          opacity: 0,
        }),
      )
      const z = -12 - Math.random() * 18 // depth
      s.position.set((Math.random() - 0.5) * 60, 3 + Math.random() * 12, z)
      const scale = 6 + Math.random() * 9
      s.scale.set(scale, scale * 0.4, 1)
      s.userData = {
        depth: Math.abs(z),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
      }
      this.clouds.add(s)
      this.cloudSprites.push(s)
    }
    this.scene.add(this.clouds)

    // weather particle systems
    this.rain = this.makeRain()
    this.snow = this.makeSnow()
    this.starPoints = this.makeStars()
    this.rainMat = this.rain.material as THREE.PointsMaterial
    this.snowMat = this.snow.material as THREE.PointsMaterial
    this.starMat = this.starPoints.material as THREE.PointsMaterial
    this.scene.add(this.rain, this.snow, this.starPoints)

    // per-drop rain velocities (gravity accelerates each drop)
    this.rainVel = new Float32Array(RAIN_COUNT)

    // lit storm-cloud smoke planes — the "rain storm" look (visible on rain)
    const smoke = smokeTexture()
    const cloudGeo = new THREE.PlaneGeometry(44, 44)
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(
        cloudGeo,
        new THREE.MeshLambertMaterial({
          map: smoke,
          transparent: true,
          opacity: 0.55,
          color: 0x3a4658,
        }),
      )
      mesh.position.set(
        (Math.random() - 0.5) * 130,
        12 + Math.random() * 30,
        -35 - Math.random() * 80,
      )
      mesh.rotation.z = Math.random() * Math.PI
      this.stormClouds.add(mesh)
    }
    this.stormClouds.visible = false
    this.scene.add(this.stormClouds)

    const stormLight = new THREE.DirectionalLight(0xccd8ff, 0.5)
    stormLight.position.set(-30, 12, 0)
    this.scene.add(new THREE.AmbientLight(0x5a6b86), stormLight)

    this.resize()
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)

    this.onPointerMove = (e: PointerEvent): void => {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      this.targets.px = ny * -0.8 // vertical parallax (slight)
      this.targets.py = nx * -1.4
    }
    window.addEventListener('pointermove', this.onPointerMove)

    const loop = (): void => {
      const t = this.clock.getElapsedTime()
      this.current.px += (this.targets.px - this.current.px) * 0.04
      this.current.py += (this.targets.py - this.current.py) * 0.04
      this.clouds.position.set(this.current.py * 1.5, this.current.px * 1.2, 0)

      this.cloudSprites.forEach((s) => {
        const d = s.userData as { depth: number; phase: number; speed: number }
        const p = s.position
        p.x =
          ((p.x + ((d.depth / 30) * d.speed * 0.02 + d.speed * 0.01)) % 70) - 60
        s.position.x = p.x
        s.material.opacity =
          this.cloudSpec.opacity * (0.5 + 0.5 * Math.sin(t * d.speed + d.phase))
      })

      this.stormClouds.children.forEach((c) => {
        c.rotation.z -= 0.0003
      })

      this.animateParticles(t)
      this.renderer.render(this.scene, this.camera)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  private makeRain = (): THREE.Points => {
    const streak = puffTexture(
      'rgba(255,255,255,0.0)',
      'rgba(215,230,255,0.95)',
    )
    const n = RAIN_COUNT
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90
      pos[i * 3 + 1] = (Math.random() - 0.2) * 60
      pos[i * 3 + 2] = -8 - Math.random() * 40
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const m = new THREE.PointsMaterial({
      size: 0.4,
      map: streak,
      color: 0xcfe2ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    return new THREE.Points(g, m)
  }

  private makeSnow = (): THREE.Points => {
    const tex = puffTexture('rgba(255,255,255,0.35)')
    const n = 140
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 70
      pos[i * 3 + 1] = Math.random() * 50 - 5
      pos[i * 3 + 2] = -8 - Math.random() * 26
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const m = new THREE.PointsMaterial({
      size: 0.8,
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    return new THREE.Points(g, m)
  }

  private makeStars = (): THREE.Points => {
    const tex = puffTexture('rgba(255,255,255,0.9)')
    const n = 160
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const z = -120
      pos[i * 3] = (Math.random() - 0.5) * 240
      pos[i * 3 + 1] = 20 + Math.random() * 130
      pos[i * 3 + 2] = z
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const m = new THREE.PointsMaterial({
      size: 1.4,
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    return new THREE.Points(g, m)
  }

  /** Interpolate particle Y so rain falls and snow drifts, resetting to top. */
  private animateParticles(t: number): void {
    const dt = this.clock.getDelta()
    if (this.particles === 'rain' && this.rain) {
      const attr = this.rain.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute
      const a = attr.array as Float32Array
      for (let i = 0; i < a.length; i += 3) {
        const idx = i / 3
        // gravity: each drop accelerates, faster streaks read as hard rain
        this.rainVel[idx] += dt * (50 + Math.random() * 40)
        a[i + 1] -= this.rainVel[idx] * dt
        a[i] += Math.sin(t * 6 + idx) * dt * 0.4
        if (a[i + 1] < -26) {
          a[i + 1] = 28
          this.rainVel[idx] = 0
        }
      }
      attr.needsUpdate = true
    } else if (this.particles === 'snow' && this.snow) {
      const attr = this.snow.geometry.getAttribute(
        'position',
      ) as THREE.BufferAttribute
      const a = attr.array as Float32Array
      for (let i = 0; i < a.length; i += 3) {
        a[i + 1] -= dt * 4
        a[i] += Math.sin(t * 1.5 + i) * dt * 0.6
        if (a[i + 1] < -22) a[i + 1] = 24
      }
      attr.needsUpdate = true
    }
  }

  update(code: number, isDay: number): void {
    const spec = specFor(code, isDay)
    this.skyMat.uniforms.uTop.value.set(spec.top)
    this.skyMat.uniforms.uBottom.value.set(spec.bottom)
    this.cloudSpec = { count: spec.cloudCount, opacity: spec.cloudOpacity }
    this.particles = spec.particles

    // storm smoke clouds for rain / showers / thunder
    this.stormClouds.visible =
      code >= 95 || (code >= 80 && code <= 82) || (code >= 61 && code <= 65)

    this.cloudSprites.forEach((s, i) => {
      s.visible = i < spec.cloudCount
      s.material.opacity = spec.cloudOpacity
    })

    this.rainMat.opacity = spec.particles === 'rain' ? 0.5 : 0
    this.snowMat.opacity = spec.particles === 'snow' ? 0.7 : 0
    this.starMat.opacity = spec.stars ? 0.5 : 0

    // Fog density by condition: none for clear, thick for fog/rain.
    const fog = this.scene.fog as THREE.Fog
    if (spec.fog <= 0) {
      fog.near = 200
      fog.far = 260
    } else {
      fog.near = 25
      fog.far = 25 + spec.fog * 140
    }
    fog.color.set(spec.bottom)
  }

  private resize(): void {
    const parent = this.renderer.domElement.parentElement
    if (!parent) return
    const w = parent.clientWidth || 1
    const h = parent.clientHeight || 1
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  dispose(): void {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('pointermove', this.onPointerMove)
    this.ro.disconnect()
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const mat = mesh.material as THREE.Material | THREE.Material[]
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
      else if (mat) mat.dispose()
    })
    this.skyMat.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
