import { onBeforeUnmount, onMounted, type Ref } from 'vue'

type OrbPalette = {
  inner: string
  mid: string
  outer: string
}

type OrbSpec = {
  radius: number
  speed: number
  light: OrbPalette
  dark: OrbPalette
}

type Orb = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  boundsRadius: number
  repelRadius: number
  maxSpeed: number
  sprite: HTMLCanvasElement
}

const ORB_SPECS: OrbSpec[] = [
  {
    radius: 220,
    speed: 1.05,
    light: {
      inner: 'rgba(251, 191, 36, 0.26)',
      mid: 'rgba(251, 191, 36, 0.14)',
      outer: 'rgba(251, 191, 36, 0)',
    },
    dark: {
      inner: 'rgba(253, 224, 71, 0.16)',
      mid: 'rgba(251, 191, 36, 0.08)',
      outer: 'rgba(251, 191, 36, 0)',
    },
  },
  {
    radius: 250,
    speed: 0.92,
    light: {
      inner: 'rgba(255, 255, 255, 0.34)',
      mid: 'rgba(255, 255, 255, 0.14)',
      outer: 'rgba(255, 255, 255, 0)',
    },
    dark: {
      inner: 'rgba(244, 244, 245, 0.12)',
      mid: 'rgba(244, 244, 245, 0.05)',
      outer: 'rgba(244, 244, 245, 0)',
    },
  },
  {
    radius: 180,
    speed: 1.18,
    light: {
      inner: 'rgba(245, 158, 11, 0.22)',
      mid: 'rgba(245, 158, 11, 0.11)',
      outer: 'rgba(245, 158, 11, 0)',
    },
    dark: {
      inner: 'rgba(251, 191, 36, 0.13)',
      mid: 'rgba(251, 191, 36, 0.06)',
      outer: 'rgba(251, 191, 36, 0)',
    },
  },
  {
    radius: 160,
    speed: 1.26,
    light: {
      inner: 'rgba(254, 243, 199, 0.3)',
      mid: 'rgba(254, 243, 199, 0.12)',
      outer: 'rgba(254, 243, 199, 0)',
    },
    dark: {
      inner: 'rgba(250, 250, 249, 0.1)',
      mid: 'rgba(250, 250, 249, 0.04)',
      outer: 'rgba(250, 250, 249, 0)',
    },
  },
]

const ORB_ANCHORS = [
  { x: 0.16, y: 0.14 },
  { x: 0.82, y: 0.22 },
  { x: 0.24, y: 0.68 },
  { x: 0.76, y: 0.84 },
]

const POINTER_INFLUENCE_MS = 140

export function useLandingOrbField(canvasRef: Ref<HTMLCanvasElement | null>) {
  let context: CanvasRenderingContext2D | null = null
  let orbs: Orb[] = []
  let animationFrameId = 0
  let resizeObserver: ResizeObserver | null = null
  let colorSchemeMedia: MediaQueryList | null = null
  let reducedMotionMedia: MediaQueryList | null = null
  let viewportWidth = 0
  let viewportHeight = 0
  let pageHeight = 0
  let prefersDark = false
  let prefersReducedMotion = false
  let lastFrameTime = 0

  const pointer = {
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    active: false,
    expiresAt: 0,
  }

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function randomBetween(min: number, max: number) {
    return min + Math.random() * (max - min)
  }

  function getDocumentHeight() {
    return Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight ?? 0,
      window.innerHeight,
    )
  }

  function getActiveOrbSpecs() {
    return viewportWidth < 768 ? ORB_SPECS.slice(0, 3) : ORB_SPECS
  }

  function createOrbSprite(radius: number, palette: OrbPalette) {
    const softRadius = radius * 1.32
    const size = Math.ceil(softRadius * 2)
    const sprite = document.createElement('canvas')

    sprite.width = size
    sprite.height = size

    const spriteContext = sprite.getContext('2d')

    if (!spriteContext) {
      return sprite
    }

    const center = size / 2
    const gradient = spriteContext.createRadialGradient(
      center,
      center,
      radius * 0.08,
      center,
      center,
      softRadius,
    )

    gradient.addColorStop(0, palette.inner)
    gradient.addColorStop(0.58, palette.mid)
    gradient.addColorStop(1, palette.outer)

    spriteContext.fillStyle = gradient
    spriteContext.fillRect(0, 0, size, size)

    return sprite
  }

  function getPalette(spec: OrbSpec) {
    return prefersDark ? spec.dark : spec.light
  }

  function createOrb(spec: OrbSpec, index: number): Orb {
    const anchor = ORB_ANCHORS[index % ORB_ANCHORS.length]
    const angle = Math.random() * Math.PI * 2
    const maxX = Math.max(spec.radius, viewportWidth - spec.radius)
    const maxY = Math.max(spec.radius, pageHeight - spec.radius)

    return {
      x: clamp(viewportWidth * anchor.x + randomBetween(-48, 48), spec.radius, maxX),
      y: clamp(pageHeight * anchor.y + randomBetween(-120, 120), spec.radius, maxY),
      vx: Math.cos(angle) * spec.speed,
      vy: Math.sin(angle) * spec.speed,
      radius: spec.radius,
      boundsRadius: spec.radius * 0.62,
      repelRadius: spec.radius * 1.08,
      maxSpeed: spec.speed * 2.8,
      sprite: createOrbSprite(spec.radius, getPalette(spec)),
    }
  }

  function initializeOrbs() {
    const specs = getActiveOrbSpecs()
    orbs = specs.map((spec, index) => createOrb(spec, index))
  }

  function updateOrbSprites(specs = getActiveOrbSpecs()) {
    for (const [index, orb] of orbs.entries()) {
      orb.sprite = createOrbSprite(specs[index].radius, getPalette(specs[index]))
    }
  }

  function syncCanvasMetrics(options?: { resetOrbs?: boolean }) {
    const canvas = canvasRef.value

    if (!canvas) {
      return false
    }

    const nextViewportWidth = Math.max(window.innerWidth, 1)
    const nextViewportHeight = Math.max(window.innerHeight, 1)
    const nextPageHeight = getDocumentHeight()
    const widthScale = viewportWidth > 0 ? nextViewportWidth / viewportWidth : 1
    const heightScale = pageHeight > 0 ? nextPageHeight / pageHeight : 1
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    viewportWidth = nextViewportWidth
    viewportHeight = nextViewportHeight
    pageHeight = nextPageHeight

    canvas.width = Math.round(nextViewportWidth * dpr)
    canvas.height = Math.round(nextViewportHeight * dpr)
    canvas.style.width = `${nextViewportWidth}px`
    canvas.style.height = `${nextViewportHeight}px`

    context = canvas.getContext('2d')

    if (!context) {
      return false
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.imageSmoothingEnabled = true

    const specs = getActiveOrbSpecs()

    if (options?.resetOrbs || orbs.length === 0 || orbs.length !== specs.length) {
      initializeOrbs()
      return true
    }

    for (const [index, orb] of orbs.entries()) {
      const spec = specs[index]
      const maxX = Math.max(spec.radius, nextViewportWidth - spec.radius)
      const maxY = Math.max(spec.radius, nextPageHeight - spec.radius)

      orb.x = clamp(orb.x * widthScale, spec.radius, maxX)
      orb.y = clamp(orb.y * heightScale, spec.radius, maxY)
      orb.radius = spec.radius
      orb.boundsRadius = spec.radius * 0.62
      orb.repelRadius = spec.radius * 1.08
      orb.maxSpeed = spec.speed * 2.8
    }

    updateOrbSprites(specs)

    return true
  }

  function renderScene() {
    if (!context) {
      return
    }

    context.clearRect(0, 0, viewportWidth, viewportHeight)
    context.globalCompositeOperation = prefersDark ? 'screen' : 'source-over'
    context.globalAlpha = prefersDark ? 0.76 : 0.94

    const scrollY = window.scrollY

    for (const orb of orbs) {
      const screenY = orb.y - scrollY
      const spriteHalfWidth = orb.sprite.width / 2
      const spriteHalfHeight = orb.sprite.height / 2

      if (screenY < -spriteHalfHeight || screenY > viewportHeight + spriteHalfHeight) {
        continue
      }

      context.drawImage(orb.sprite, orb.x - spriteHalfWidth, screenY - spriteHalfHeight)
    }

    context.globalAlpha = 1
    context.globalCompositeOperation = 'source-over'
  }

  function stepOrbs(now: number) {
    const delta = lastFrameTime > 0 ? Math.min(32, now - lastFrameTime) : 16.67
    const frameScale = delta / 16.67
    const isPointerActive = pointer.active && now < pointer.expiresAt

    lastFrameTime = now
    pointer.active = isPointerActive

    for (const orb of orbs) {
      if (isPointerActive) {
        const dx = orb.x - pointer.x
        const dy = orb.y - pointer.y
        const distanceSquared = dx * dx + dy * dy
        const influenceSquared = orb.repelRadius * orb.repelRadius

        if (distanceSquared > 0.001 && distanceSquared < influenceSquared) {
          const distance = Math.sqrt(distanceSquared)
          const strength = (1 - distance / orb.repelRadius) * 0.24 * frameScale

          orb.vx += (dx / distance) * strength
          orb.vy += (dy / distance) * strength
        }
      }

      const speed = Math.hypot(orb.vx, orb.vy)

      if (speed > orb.maxSpeed) {
        const scale = orb.maxSpeed / speed
        orb.vx *= scale
        orb.vy *= scale
      }

      orb.x += orb.vx * frameScale
      orb.y += orb.vy * frameScale

      const maxX = Math.max(orb.boundsRadius, viewportWidth - orb.boundsRadius)
      const maxY = Math.max(orb.boundsRadius, pageHeight - orb.boundsRadius)

      if (orb.x <= orb.boundsRadius) {
        orb.x = orb.boundsRadius
        orb.vx = Math.abs(orb.vx)
      } else if (orb.x >= maxX) {
        orb.x = maxX
        orb.vx = -Math.abs(orb.vx)
      }

      if (orb.y <= orb.boundsRadius) {
        orb.y = orb.boundsRadius
        orb.vy = Math.abs(orb.vy)
      } else if (orb.y >= maxY) {
        orb.y = maxY
        orb.vy = -Math.abs(orb.vy)
      }
    }
  }

  function stopAnimation() {
    if (animationFrameId === 0) {
      return
    }

    cancelAnimationFrame(animationFrameId)
    animationFrameId = 0
  }

  function animate(now: number) {
    stepOrbs(now)
    renderScene()
    animationFrameId = window.requestAnimationFrame(animate)
  }

  function startAnimation() {
    if (prefersReducedMotion || animationFrameId !== 0) {
      return
    }

    lastFrameTime = 0
    animationFrameId = window.requestAnimationFrame(animate)
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch' || prefersReducedMotion) {
      return
    }

    pointer.x = event.pageX
    pointer.y = event.pageY
    pointer.clientX = event.clientX
    pointer.clientY = event.clientY
    pointer.expiresAt = performance.now() + POINTER_INFLUENCE_MS
    pointer.active = true
  }

  function handleScroll() {
    if (pointer.active) {
      pointer.x = pointer.clientX + window.scrollX
      pointer.y = pointer.clientY + window.scrollY
    }

    if (prefersReducedMotion) {
      renderScene()
    }
  }

  function handleResize() {
    if (!syncCanvasMetrics()) {
      return
    }

    renderScene()
    startAnimation()
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stopAnimation()
      return
    }

    if (!syncCanvasMetrics()) {
      return
    }

    renderScene()
    startAnimation()
  }

  function handleColorSchemeChange(event: MediaQueryListEvent) {
    prefersDark = event.matches
    updateOrbSprites()
    renderScene()
  }

  function handleReducedMotionChange(event: MediaQueryListEvent) {
    prefersReducedMotion = event.matches

    if (prefersReducedMotion) {
      stopAnimation()
      renderScene()
      return
    }

    startAnimation()
  }

  onMounted(() => {
    colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)')
    reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersDark = colorSchemeMedia.matches
    prefersReducedMotion = reducedMotionMedia.matches

    if (!syncCanvasMetrics({ resetOrbs: true })) {
      return
    }

    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })

    resizeObserver.observe(document.documentElement)

    colorSchemeMedia.addEventListener('change', handleColorSchemeChange)
    reducedMotionMedia.addEventListener('change', handleReducedMotionChange)
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    renderScene()
    startAnimation()
  })

  onBeforeUnmount(() => {
    stopAnimation()
    resizeObserver?.disconnect()
    colorSchemeMedia?.removeEventListener('change', handleColorSchemeChange)
    reducedMotionMedia?.removeEventListener('change', handleReducedMotionChange)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
}
