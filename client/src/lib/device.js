// Picks a 3D quality tier from what the device reports. The user can override it in the HUD.

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchDevice() {
  return typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
}

let webglSupport;
export function hasWebGL() {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    webglSupport = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

export function detectQuality() {
  if (typeof window === 'undefined') return 'medium';
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  if (isTouchDevice() && (small || memory <= 4 || cores <= 4)) return 'low';
  if (cores >= 8 && memory >= 8 && !small) return 'high';
  return 'medium';
}

export const QUALITY = {
  low: { dpr: [0.75, 1], shadows: false, shadowMapSize: 512, pointLights: 2, detail: 'low', decor: false, antialias: false },
  medium: { dpr: [1, 1.5], shadows: true, shadowMapSize: 1024, pointLights: 4, detail: 'medium', decor: true, antialias: true },
  high: { dpr: [1, 2], shadows: true, shadowMapSize: 2048, pointLights: 6, detail: 'high', decor: true, antialias: true },
};
