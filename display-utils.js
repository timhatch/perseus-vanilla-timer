// Resize
export function onResize(el) {
  el.style.fontSize = `${document.documentElement.clientHeight * 0.7}px`
}

// Fullscreen
export async function fullScreen() {
  const el = document.documentElement
  if (el.requestFullscreen)       return el.requestFullscreen()
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen()
}

