// Shared bits for the README's SVGs: the portfolio's palette, its two fonts (embedded, so every viewer sees
// the same type), a text measurer and a few drawing helpers.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const ASSETS = join(ROOT, 'assets')

// Palette from anjavanstaden.co.za: ivory paper, navy ink, and three accents (blue, pink, butter).
export const C = {
  ivory: '#fbf8f1',
  ink: '#000a1a',
  blue: '#0e4798',
  pink: '#dfa4b8',
  butter: '#f7de93',
  peach: '#f3dcc0',
  sky: '#b9cbe8',
}

// Theme roles, swapped in dark mode the same way the site swaps them.
export const THEMES = {
  light: {
    name: 'light',
    paper: C.ivory,
    deep: '#f2ede2',
    plum: C.ink,
    soft: '#464f5f',
    accent: C.blue,
    rule: '#b9c3dd',
    stack: ['#ece6d8', '#e0d9c8', '#d4ccb9'],
  },
  dark: {
    name: 'dark',
    paper: '#0b1629',
    deep: '#16233a',
    plum: C.ivory,
    soft: '#b8c0cd',
    accent: '#8fb0e6',
    rule: 'rgb(143 176 230 / 0.16)',
    stack: ['#1a2944', '#22345a', '#2a4070'],
  },
}

const FONT_FILES = {
  U8: 'unbounded-800',
  U6: 'unbounded-600',
  F5: 'familjen-500',
  F7: 'familjen-700',
}
const METRICS = JSON.parse(readFileSync(join(ASSETS, 'fonts', 'metrics.json'), 'utf8'))

// @font-face rules for just the fonts an SVG uses, as data URIs (an <img> SVG can't load anything else).
export function fontFaces(...keys) {
  return keys
    .map((k) => {
      const b64 = readFileSync(join(ASSETS, 'fonts', `${FONT_FILES[k]}.woff2`)).toString('base64')
      return `@font-face{font-family:${k};src:url(data:font/woff2;base64,${b64}) format('woff2')}`
    })
    .join('')
}

export function measure(font, size, text, spacing = 0) {
  const m = METRICS[FONT_FILES[font]]
  let w = 0
  for (const ch of text) w += (m.adv[ch] ?? m.adv['n']) / m.upm * size + spacing
  return w
}

// Greedy word wrap to a pixel width.
export function wrap(font, size, text, maxW) {
  const lines = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && measure(font, size, next) > maxW) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const r = (n) => Math.round(n * 100) / 100

export function svg({ w, h, title, css = '', body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${css}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}</style>
${body}
</svg>
`
}

export function save(name, content) {
  const file = join(ASSETS, name)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
  console.log(`wrote assets/${name} (${(content.length / 1024).toFixed(1)} KB)`)
}

// The site's offset paper stack behind a card (2, 4 and 6px steps), then the card itself.
export function paperCard(t, x, y, w, h, rx = 18, fill = t.paper) {
  const steps = [6, 4, 2]
    .map((d, i) => `<rect x="${x + d}" y="${y + d}" width="${w}" height="${h}" rx="${rx}" fill="${t.stack[2 - i]}" stroke="${t.plum}" stroke-opacity="0.35"/>`)
    .join('')
  return `${steps}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${t.plum}" stroke-width="2"/>`
}
