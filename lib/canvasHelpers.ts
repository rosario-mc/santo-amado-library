// Shared canvas drawing utilities for arcade games

const CANVAS_H = 300
const GROUND_H = 40

// ---- Clouds ----

export function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const h = w * 0.5
  ctx.beginPath()
  ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.ellipse(x - w * 0.25, y + 5, w * 0.3, h * 0.35, 0, 0, Math.PI * 2)
  ctx.ellipse(x + w * 0.25, y + 5, w * 0.3, h * 0.35, 0, 0, Math.PI * 2)
  ctx.fill()
}

// ---- Waves (ocean surface) ----

export function drawWaves(ctx: CanvasRenderingContext2D, cw: number, y: number, scrollX: number, color = '#1E90FF') {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, y)
  for (let x = 0; x <= cw; x += 5) {
    const wave = Math.sin((x + scrollX * 0.8) * 0.03) * 6 + Math.sin((x + scrollX * 1.2) * 0.05) * 3
    ctx.lineTo(x, y + wave)
  }
  ctx.lineTo(cw, CANVAS_H)
  ctx.lineTo(0, CANVAS_H)
  ctx.closePath()
  ctx.fill()
}

// ---- Stars ----

export function drawStars(ctx: CanvasRenderingContext2D, stars: { x: number; y: number; r: number; twinkle: number }[], cw: number) {
  for (const star of stars) {
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(star.twinkle))
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.beginPath()
    ctx.arc(star.x % cw, star.y, star.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ---- Parallax layer (generic scrolling shapes) ----

export function drawParallaxLayer(
  ctx: CanvasRenderingContext2D,
  items: { x: number; y: number; w: number }[],
  scrollX: number,
  speed: number,
  cw: number,
  drawFn: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => void
) {
  for (const item of items) {
    const sx = ((item.x - scrollX * speed) % (cw + item.w * 2)) - item.w
    drawFn(ctx, sx, item.y, item.w)
  }
}

// ---- Feedback text (cheer/oops with fade) ----

export function drawFeedbackText(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: string,
  timer: number,
  cw: number
) {
  if (timer <= 0 || !text) return
  ctx.save()
  ctx.globalAlpha = Math.min(1, timer / 20)
  ctx.fillStyle = color
  ctx.font = 'bold 28px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cw / 2, CANVAS_H / 2 - 30)
  ctx.restore()
  ctx.textBaseline = 'alphabetic'
}

// ---- Ground ----

export function drawGround(
  ctx: CanvasRenderingContext2D,
  cw: number,
  groundColor = '#8B5E3C',
  topColor = '#4CAF50'
) {
  ctx.fillStyle = groundColor
  ctx.fillRect(0, CANVAS_H - GROUND_H, cw, GROUND_H)
  ctx.fillStyle = topColor
  ctx.fillRect(0, CANVAS_H - GROUND_H, cw, 6)
}

// ---- Simple character (generic retro-style) ----

export function drawSimpleCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hatColor: string,
  bodyColor: string,
  frame: number,
  jumping: boolean,
  idle: boolean
) {
  // Hat
  ctx.fillStyle = hatColor
  ctx.fillRect(x + 2, y, w - 4, 10)
  ctx.fillRect(x - 2, y + 8, w + 4, 4)
  // Face
  ctx.fillStyle = '#FFCC80'
  ctx.fillRect(x + 4, y + 12, w - 8, 10)
  // Eyes
  ctx.fillStyle = '#000'
  ctx.fillRect(x + Math.floor(w * 0.28), y + 14, 3, 3)
  ctx.fillRect(x + Math.floor(w * 0.6), y + 14, 3, 3)
  // Body
  ctx.fillStyle = bodyColor
  ctx.fillRect(x + 2, y + 22, w - 4, 12)
  // Belt
  ctx.fillStyle = '#FFD93D'
  ctx.fillRect(x + 6, y + 22, w - 12, 3)
  // Legs
  ctx.fillStyle = bodyColor
  const legSpread = jumping ? 0 : idle ? 4 : frame === 0 ? 4 : 2
  ctx.fillRect(x + legSpread, y + 34, 8, 6)
  ctx.fillRect(x + w - legSpread - 8, y + 34, 8, 6)
  // Shoes
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(x + legSpread - 1, y + 38, 9, 4)
  ctx.fillRect(x + w - legSpread - 9, y + 38, 9, 4)
}

// ---- Bubbles (for underwater scenes) ----

export function drawBubbles(
  ctx: CanvasRenderingContext2D,
  bubbles: { x: number; y: number; r: number }[]
) {
  for (const b of bubbles) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

// ---- Sky gradient ----

export function drawSkyGradient(
  ctx: CanvasRenderingContext2D,
  cw: number,
  topColor: string,
  bottomColor: string,
  height = CANVAS_H - GROUND_H
) {
  const grad = ctx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, topColor)
  grad.addColorStop(1, bottomColor)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, cw, height)
}

// ---- Question gate marker ----

export function drawGateMarker(
  ctx: CanvasRenderingContext2D,
  gateScreenX: number,
  gateColor = '#FFD93D',
  borderColor = '#B8860B'
) {
  ctx.fillStyle = gateColor
  ctx.fillRect(gateScreenX - 25, CANVAS_H - GROUND_H - 140, 50, 140)
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 2
  ctx.strokeRect(gateScreenX - 25, CANVAS_H - GROUND_H - 140, 50, 140)
  ctx.fillStyle = borderColor
  ctx.font = 'bold 24px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('?', gateScreenX, CANVAS_H - GROUND_H - 70)
}

// ---- Decorative coins ----

export function drawDecorativeCoins(
  ctx: CanvasRenderingContext2D,
  coins: { x: number; y: number; collected: boolean }[],
  scrollX: number,
  cw: number
) {
  for (const dc of coins) {
    if (dc.collected) continue
    const sx = dc.x - scrollX
    if (sx < -20 || sx > cw + 20) continue
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(sx, dc.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#DAA520'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

// ---- Hills (parallax background) ----

export function drawHills(
  ctx: CanvasRenderingContext2D,
  scrollX: number,
  cw: number,
  color1 = '#6BBF6B',
  color2 = '#5AAE5A'
) {
  const hillY = CANVAS_H - GROUND_H
  ctx.fillStyle = color1
  for (let i = -1; i < 4; i++) {
    const hx = i * 250 - (scrollX * 0.4) % 250
    ctx.beginPath()
    ctx.moveTo(hx - 80, hillY)
    ctx.quadraticCurveTo(hx, hillY - 60, hx + 80, hillY)
    ctx.fill()
  }
  ctx.fillStyle = color2
  for (let i = -1; i < 5; i++) {
    const hx = (i * 180 - (scrollX * 0.6) % 180) + 50
    ctx.beginPath()
    ctx.moveTo(hx - 50, hillY)
    ctx.quadraticCurveTo(hx, hillY - 35, hx + 50, hillY)
    ctx.fill()
  }
}

// ---- Acacia trees (for safari scene) ----

export function drawAcaciaTree(ctx: CanvasRenderingContext2D, x: number, groundY: number) {
  // Trunk
  ctx.fillStyle = '#8B6914'
  ctx.fillRect(x - 3, groundY - 50, 6, 50)
  // Canopy (flat top)
  ctx.fillStyle = '#2D8B2D'
  ctx.beginPath()
  ctx.ellipse(x, groundY - 50, 28, 12, 0, 0, Math.PI * 2)
  ctx.fill()
}

// ---- Factory gears ----

export function drawGear(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number, color = '#888') {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.fillRect(
      Math.cos(a) * r * 0.5 - 3,
      Math.sin(a) * r * 0.5 - 3,
      r * 0.5,
      6
    )
  }
  ctx.fillStyle = '#666'
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Common constants
export const GROUND_Y = CANVAS_H - GROUND_H
export const CHAR_W = 28
export const CHAR_H = 40
export const CHAR_GROUND_Y = CANVAS_H - GROUND_H - 40
export const GATE_SPACING = 500
export const GRAVITY = 0.5
export const JUMP_FORCE = -9
