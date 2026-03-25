<script setup lang="ts">
const orbCanvasRef = useTemplateRef<HTMLCanvasElement>('orbCanvas')

useLandingOrbField(orbCanvasRef)
</script>

<template>
  <canvas
    ref="orbCanvas"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 z-0 h-dvh w-full"
  />
</template>
