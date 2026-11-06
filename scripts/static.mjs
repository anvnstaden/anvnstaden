// Draws the README's fixed artwork, in a light and a dark version each:
//   header       the notebook page with my name, a sticky note and "hire me?"
//   tab-*        section headings, as the site's nav tabs hanging off a bar
//   interests    four sticky notes
//   btn-*        the hero's sticker buttons
//   footer       me walking along the grass
// Run with `node scripts/static.mjs`. The contribution city has its own script (contrib-3d.mjs).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { C, THEMES, ROOT, fontFaces, measure, wrap, esc, r, svg, save, paperCard } from './kit.mjs'

const W = 860

// ─── Header ──────────────────────────────────────────────────────────────────────────────────────────────────────

function logo(t) {
  // The AS monogram from the site, recoloured for dark mode the way the site inverts it.
  let src = readFileSync(join(ROOT, 'assets', 'art', 'logo.svg'), 'utf8')
  if (t.name === 'dark') src = src.replaceAll('#000a1a', C.ivory)
  return `data:image/svg+xml;base64,${Buffer.from(src).toString('base64')}`
}

function stickyNote(t, { cx, cy, w, h, tilt, fill = C.butter, tape = C.pink, cls = 'sway', delay = 0, content }) {
  return `<g transform="translate(${cx} ${cy}) rotate(${tilt})">
  <g class="${cls}" style="animation-delay:${delay}s">
    <ellipse cx="4" cy="${h / 2 - 2}" rx="${w / 2 - 6}" ry="9" fill="#000a1a" opacity="${t.name === 'dark' ? 0.55 : 0.22}" filter="url(#blur)"/>
    <path d="M${-w / 2} ${-h / 2}h${w}v${h - 14}q-6 10 -18 14h${-(w - 18)}z" fill="${fill}"/>
    <path d="M${w / 2} ${h / 2 - 14}q-6 10 -18 14q4 -9 1 -15z" fill="#000a1a" opacity="0.08"/>
    <rect x="-44" y="${-h / 2 - 13}" width="88" height="26" fill="${tape}" opacity="0.85" transform="rotate(-4 0 ${-h / 2})"/>
    ${content}
  </g>
</g>`
}

function header(t) {
  const H = 400
  const card = { x: 14, y: 4, w: 830, h: 380 }
  const textX = 128
  const nameSize = 64
  const sub = 'UI/UX Designer'
  const subSize = 25
  const subW = measure('F7', subSize, sub)
  const ampW = measure('U8', subSize, '&')

  // Ruled paper in light mode, a blueprint grid in dark mode (the site's hero sits on one).
  let paper = ''
  if (t.name === 'light') {
    for (let y = card.y + 62; y < card.y + card.h - 8; y += 31) paper += `<path d="M${card.x} ${y}H${card.x + card.w}" stroke="${t.rule}" stroke-width="1.2"/>`
  } else {
    for (let x = card.x + 20; x < card.x + card.w; x += 20) paper += `<path d="M${x} ${card.y}V${card.y + card.h}" stroke="${t.rule}" stroke-width="${(x - card.x) % 100 ? 0.8 : 1.6}"/>`
    for (let y = card.y + 20; y < card.y + card.h; y += 20) paper += `<path d="M${card.x} ${y}H${card.x + card.w}" stroke="${t.rule}" stroke-width="${(y - card.y) % 100 ? 0.8 : 1.6}"/>`
  }
  paper += `<path d="M${textX - 26} ${card.y}V${card.y + card.h}" stroke="${C.pink}" stroke-width="2"/>`

  // Spiral binding down the left edge.
  let spiral = ''
  const wire = t.name === 'dark' ? '#c4c7cc' : '#36393d'
  for (let cy = card.y + 30; cy < card.y + card.h - 14; cy += 30) {
    spiral += `<circle cx="46" cy="${cy}" r="5.5" fill="${t.stack[1]}" stroke="${t.plum}" stroke-width="1.5"/>`
    spiral += `<path d="M47 ${cy}C40 ${cy - 13} 8 ${cy - 15} 6 ${cy - 4}C5 ${cy + 3} 12 ${cy + 6} 20 ${cy + 5}" fill="none" stroke="${wire}" stroke-width="3" stroke-linecap="round"/>`
  }

  // The sticky note from the About Me notebook.
  const noteW = 196
  const items = ['finishing my BSc in Computer Science', 'practising my German Vokabeln']
  let ny = -50
  let lines = ''
  for (const item of items) {
    const wrapped = wrap('F7', 17, item, noteW - 66)
    lines += `<text x="-72" y="${ny}" class="f7" font-size="19" fill="${C.ink}">→</text>`
    wrapped.forEach((l, i) => (lines += `<text x="-48" y="${ny + i * 22}" class="f7" font-size="17" fill="${C.ink}">${esc(l)}</text>`))
    ny += wrapped.length * 22 + 14
  }
  const note = stickyNote(t, {
    cx: 728,
    cy: 238,
    w: noteW,
    h: 214,
    tilt: 4,
    content: `<text x="-76" y="-70" class="u6" font-size="19" fill="${C.blue}">Currently…</text>${lines}`,
  })

  const tick = `<path class="tick" d="M${textX + 171} 351l5 6 11-15" fill="none" stroke="${t.accent}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>`
  const box = (x) => `<rect x="${x}" y="341" width="20" height="20" rx="4" fill="none" stroke="${t.plum}" stroke-width="2"/>`

  const body = `<defs>
  <clipPath id="card"><rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="18"/></clipPath>
  <filter id="blur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
${paperCard(t, card.x, card.y, card.w, card.h)}
<g clip-path="url(#card)">${paper}</g>
${spiral}
<image href="${logo(t)}" x="${card.x + card.w - 92}" y="20" width="72" height="56" class="logo"/>
<g class="rise" style="animation-delay:.05s"><text x="${textX - 4}" y="118" class="u8" font-size="${nameSize}" fill="${t.plum}" letter-spacing="-1.5">Anja</text></g>
<g class="rise" style="animation-delay:.18s"><text x="${textX - 4}" y="196" class="u8" font-size="${nameSize}" fill="${t.accent}" letter-spacing="-1.5">van Staden</text></g>
<rect class="marker" x="${textX - 6}" y="228" width="${subW + 12}" height="22" rx="6" fill="${C.pink}" opacity="${t.name === 'dark' ? 0.4 : 0.55}" transform="rotate(-1.2 ${textX} 240)"/>
<text x="${textX}" y="248" class="f7" font-size="${subSize}" fill="${t.plum}">${sub}</text>
<text x="${textX + subW + 10}" y="248" class="u8" font-size="${subSize}" fill="${t.accent}">&amp;</text>
<text x="${textX + subW + ampW + 20}" y="248" class="f7" font-size="${subSize}" fill="${t.plum}">Software Engineer</text>
<text x="${textX}" y="292" class="f5" font-size="17" fill="${t.soft}">Final-year Computer Science &amp; Operations Research</text>
<text x="${textX}" y="314" class="f5" font-size="17" fill="${t.soft}">Stellenbosch University · South Africa</text>
<text x="${textX}" y="358" class="f7" font-size="20" fill="${t.plum}">hire me?</text>
${box(textX + 96)}<text x="${textX + 124}" y="358" class="f7" font-size="20" fill="${t.accent}">yes</text>
${box(textX + 168)}${tick}<text x="${textX + 196}" y="358" class="f7" font-size="20" fill="${t.accent}">obviously</text>
${note}`

  return svg({
    w: W,
    h: H,
    title: 'Anja van Staden. UI/UX Designer & Software Engineer. Final-year Computer Science & Operations Research, Stellenbosch University.',
    css: `${fontFaces('U8', 'U6', 'F5', 'F7')}
.u8{font-family:U8}.u6{font-family:U6}.f5{font-family:F5}.f7{font-family:F7}
.rise{animation:rise .8s cubic-bezier(.3,1.4,.5,1) both}
@keyframes rise{from{transform:translateY(26px);opacity:0}}
.marker{transform-box:fill-box;transform-origin:0 50%;animation:mark .7s ease .5s both}
@keyframes mark{from{transform:scaleX(0) rotate(-1.2deg)}to{transform:scaleX(1) rotate(-1.2deg)}}
.tick{stroke-dasharray:1;stroke-dashoffset:1;animation:tick .5s ease-out 1.2s forwards}
@keyframes tick{to{stroke-dashoffset:0}}
.sway{transform-box:fill-box;transform-origin:50% 0;animation:sway 6s ease-in-out infinite}
@keyframes sway{50%{transform:rotate(-2.5deg)}}
.logo{transform-box:fill-box;transform-origin:50% 0;animation:swing 5s ease-in-out infinite}
@keyframes swing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(4deg)}}`,
    body,
  })
}

// ─── Section tabs ────────────────────────────────────────────────────────────────────────────────────────────────

// The nav's tabs, in order. Each heading drops its own tab and leaves the rest tucked up, like the site's nav
// does while you scroll.
const TABS = [
  { id: 'about', label: 'About Me', fill: C.butter, text: C.ink },
  { id: 'into', label: "What I'm into", fill: 'paper', text: 'plum' },
  { id: 'skills', label: 'My Skills', fill: C.pink, text: C.ink },
  { id: 'activity', label: 'My Activity', fill: C.butter, text: C.ink },
  { id: 'projects', label: 'Projects', fill: C.blue, text: C.ivory },
  { id: 'contact', label: 'Contact Me', fill: 'plum', text: 'paper' },
]

function tab(t, current) {
  const H = 78
  const role = (v) => (v === 'paper' ? t.paper : v === 'plum' ? t.plum : v)
  let x = 20
  let out = `<rect x="0" y="0" width="${W}" height="5" rx="2.5" fill="${t.plum}"/>`
  let curTab = ''
  for (const tb of TABS) {
    const w = Math.round(measure('F7', 17, tb.label) + 34)
    const on = tb.id === current
    const h = on ? 56 : 13
    const rad = Math.min(14, h - 2)
    const d = `M${x} 4V${h - rad}Q${x} ${h} ${x + rad} ${h}H${x + w - rad}Q${x + w} ${h} ${x + w} ${h - rad}V4`
    const shape = `<path d="${d}Z" fill="${role(tb.fill)}"/><path d="${d}" fill="none" stroke="${t.plum}" stroke-width="2"/>`
    if (on) {
      curTab = `<g class="drop">${shape}<text x="${x + w / 2}" y="${h - 16}" text-anchor="middle" class="f7" font-size="17" fill="${role(tb.text)}">${esc(tb.label)}</text></g>`
    } else out += shape
    x += w + 8
  }
  const label = TABS.find((tb) => tb.id === current).label
  return svg({
    w: W,
    h: H,
    title: label,
    css: `${fontFaces('F7')}.f7{font-family:F7}
.drop{animation:drop .7s cubic-bezier(.3,1.5,.5,1) .1s both}
@keyframes drop{from{transform:translateY(-54px)}}`,
    // the dropped tab is drawn under the bar so it slides out from behind it
    body: `${curTab}${out}`,
  })
}

// ─── Interests: four sticky notes ────────────────────────────────────────────────────────────────────────────────

const ICONS = {
  // a pen nib
  design: '<path d="M4 20l3-9 7-7 6 6-7 7z"/><path d="M4 20l6-6"/><circle cx="11" cy="13" r="1.6"/>',
  // </>
  code: '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6M14 4l-4 16"/>',
  // a phone next to a screen
  responsive: '<rect x="2" y="4" width="15" height="11" rx="1.5"/><path d="M6 19h7M9.5 15v4"/><rect x="16" y="9" width="6" height="11" rx="1.5" fill="currentColor" fill-opacity=".25"/>',
  // a messy scribble that comes out as a straight arrow
  simple: '<path d="M2 14c2-6 5 2 3 4s-3-6 1-7 3 5 6 2l9 0M18 10l3 3-3 3"/>',
}

const INTERESTS = [
  { icon: 'design', title: 'UI/UX & product design', text: 'Understanding the people behind a problem, then designing something that fits how they actually work.', fill: C.butter, tape: C.pink, tilt: -3 },
  { icon: 'code', title: 'Frontend & web development', text: 'Taking designs out of Figma and into real, working interfaces.', fill: C.pink, tape: C.butter, tilt: 2.5 },
  { icon: 'responsive', title: 'User-centred, responsive design', text: 'Layouts that feel just as good on a phone as they do on a big screen.', fill: C.sky, tape: C.pink, tilt: -2 },
  { icon: 'simple', title: 'Making complicated things simple', text: 'Turning messy requirements into experiences that feel obvious.', fill: C.peach, tape: C.sky, tilt: 3 },
]

function interests(t) {
  const H = 296
  const noteW = 184
  const noteH = 250
  const inner = noteW - 36
  let notes = ''
  INTERESTS.forEach((it, i) => {
    const cx = 112 + i * 212
    const title = wrap('U6', 15, it.title, inner)
    const text = wrap('F5', 15.5, it.text, inner)
    let y = -noteH / 2 + 80
    let content = `<g transform="translate(${-noteW / 2 + 16} ${-noteH / 2 + 18}) scale(1.35)" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="${C.ink}">${ICONS[it.icon]}</g>`
    for (const l of title) {
      content += `<text x="${-noteW / 2 + 18}" y="${y}" class="u6" font-size="15" fill="${C.blue}">${esc(l)}</text>`
      y += 20
    }
    y += 8
    for (const l of text) {
      content += `<text x="${-noteW / 2 + 18}" y="${y}" class="f5" font-size="15.5" fill="${C.ink}">${esc(l)}</text>`
      y += 21
    }
    notes += stickyNote(t, { cx, cy: 150, w: noteW, h: noteH, tilt: it.tilt, fill: it.fill, tape: it.tape, delay: -i * 1.7, content })
  })
  return svg({
    w: W,
    h: H,
    title: INTERESTS.map((it) => `${it.title}: ${it.text}`).join(' '),
    css: `${fontFaces('U6', 'F5')}.u6{font-family:U6}.f5{font-family:F5}
.sway{transform-box:fill-box;transform-origin:50% 0;animation:sway 7s ease-in-out infinite}
@keyframes sway{50%{transform:rotate(-1.8deg)}}`,
    body: `<defs><filter id="blur" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="6"/></filter></defs>${notes}`,
  })
}

// ─── Buttons: the hero's stickers, with something poking out of the top ──────────────────────────────────────────

const BUTTONS = [
  { id: 'portfolio', label: 'View my portfolio', fill: C.blue, text: C.ivory, peek: 'pages', tilt: -2, icon: '<rect x="7" y="8" width="10" height="9" rx="1" fill="#fbf8f1" stroke="#000a1a" stroke-width="1.4"/><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#0e4798"/>' },
  { id: 'email', label: 'Email me', fill: C.butter, text: C.ink, peek: 'letter', tilt: 2, icon: '<rect x="3" y="6" width="18" height="14" rx="2" fill="#f7de93"/><path d="M3.5 6.5h17L12 13.5z" fill="#f7de93"/>' },
  { id: 'linkedin', label: 'LinkedIn', fill: C.pink, text: C.ink, peek: 'none', tilt: -1.5, icon: '<rect x="3" y="3" width="18" height="18" rx="3" fill="#dfa4b8"/><path d="M8 10.5v6M8 7.5v.01M12 16.5v-6M12 13c0-1.6 1-2.6 2.4-2.6S16.5 11.4 16.5 13v3.5"/>' },
  { id: 'cv', label: 'Download my CV', fill: 'paper', text: 'plum', peek: 'none', tilt: 1.5, icon: '<path d="M6 3h8l4 4v14H6z" fill="#fbf8f1"/><path d="M14 3v4h4M9 12h6M9 15.5h6M9 9h3"/>' },
]

function button(t, b) {
  const role = (v) => (v === 'paper' ? t.paper : v === 'plum' ? t.plum : v)
  const textW = measure('F7', 18, b.label)
  const fw = Math.round(20 + 26 + 12 + textW + 26)
  const fh = 58
  const pad = 16
  const w = fw + pad * 2
  const h = fh + pad * 2 + 14
  const ox = pad
  const oy = pad + 14
  const stroke = t.plum
  let peek = ''
  if (b.peek === 'pages') {
    ;[
      [C.pink, 0.12, -7],
      [C.butter, 0.35, 2],
      [C.ivory, 0.58, 8],
    ].forEach(([fill, at, rot], i) => {
      const px = ox + fw * at
      peek += `<g class="peek" style="animation-delay:${i * 0.15}s"><g transform="rotate(${rot} ${px + fw * 0.15} ${oy + 30})"><rect x="${px}" y="${oy - 10}" width="${fw * 0.3}" height="46" rx="5" fill="${fill}" stroke="${C.ink}" stroke-width="2"/><path d="M${px + 7} ${oy - 2}h${fw * 0.15}M${px + 7} ${oy + 4}h${fw * 0.21}" stroke="${C.ink}" stroke-width="2"/></g></g>`
    })
  } else if (b.peek === 'letter') {
    const px = ox + fw * 0.22
    peek = `<g class="peek"><g transform="rotate(-4 ${px} ${oy})"><rect x="${px}" y="${oy - 14}" width="${fw * 0.56}" height="44" rx="4" fill="${C.ivory}" stroke="${C.ink}" stroke-width="2"/><text x="${px + fw * 0.28}" y="${oy + 6}" text-anchor="middle" class="f7" font-size="16" fill="#c2416b">♥</text></g></g>`
  }
  const iconStroke = b.id === 'portfolio' ? C.ivory : C.ink
  return svg({
    w: Math.ceil(w),
    h,
    title: b.label,
    css: `${fontFaces('F7')}.f7{font-family:F7}
.peek{animation:peek 3.2s cubic-bezier(.3,1.6,.5,1) infinite}
@keyframes peek{0%,70%,100%{transform:none}80%{transform:translateY(-7px)}}`,
    body: `<g transform="rotate(${b.tilt} ${w / 2} ${oy + fh / 2})">
${peek}
<rect x="${ox}" y="${oy}" width="${fw}" height="${fh}" rx="14" fill="${role(b.fill)}" stroke="${stroke}" stroke-width="2.5"/>
<g transform="translate(${ox + 20} ${oy + 16})" fill="none" stroke="${iconStroke}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${b.icon}</g>
<text x="${ox + 58}" y="${oy + 35}" class="f7" font-size="18" fill="${role(b.text)}">${esc(b.label)}</text>
</g>`,
  })
}

// ─── Footer: me, walking along ───────────────────────────────────────────────────────────────────────────────────

function footer(t) {
  const H = 230
  const card = { x: 14, y: 4, w: 830, h: 210 }
  const dark = t.name === 'dark'
  const girl = `data:image/svg+xml;base64,${readFileSync(join(ROOT, 'assets', 'art', 'walking-girl.svg')).toString('base64')}`
  const groundY = card.y + card.h - 44

  const cloud = (x, y, s, cls, delay) =>
    `<g class="${cls}" style="animation-delay:${delay}s"><path transform="translate(${x} ${y}) scale(${s})" d="M10 30a12 12 0 0 1 4-23 16 16 0 0 1 29-1 11 11 0 0 1 17 9 9 9 0 0 1-2 15z" fill="${dark ? '#22345a' : '#fff'}" stroke="${t.plum}" stroke-width="${2 / s}" stroke-linejoin="round"/></g>`

  let sky = ''
  if (dark) {
    sky += `<circle cx="728" cy="60" r="26" fill="${C.ivory}"/><circle cx="742" cy="52" r="24" fill="#132240"/>`
    const stars = [[470, 30], [400, 70], [500, 112], [560, 40], [640, 74], [668, 26], [800, 104], [60, 116], [210, 112], [690, 124], [420, 128]]
    stars.forEach(([x, y], i) => (sky += `<path class="twinkle" style="animation-delay:${(i * 0.37) % 2.4}s" d="M${x} ${y - 6}l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="${C.butter}"/>`))
  } else {
    let rays = ''
    for (let i = 0; i < 12; i++) rays += `<path d="M0 -36V-48" transform="rotate(${i * 30})"/>`
    sky += `<g transform="translate(736 62)"><g class="spin" stroke="${C.butter}" stroke-width="4" stroke-linecap="round">${rays}</g><circle r="26" fill="${C.butter}" stroke="#e0b556" stroke-width="2"/></g>`
  }
  sky += cloud(440, 26, 1.05, 'drift', 0) + cloud(580, 86, 0.75, 'drift', -9) + cloud(300, 104, 0.55, 'drift', -4)

  let grass = `<path d="M${card.x} ${groundY}H${card.x + card.w}V${card.y + card.h}H${card.x}z" fill="${dark ? '#2f6b43' : '#8cc56b'}"/>`
  let blades = ''
  for (let x = card.x + 4; x < card.x + card.w; x += 9) {
    const hgt = 8 + ((x * 7) % 9)
    blades += `<path d="M${x} ${groundY + 2}l${2 + (x % 3)} ${-hgt}l3 ${hgt}" fill="${dark ? '#2f6b43' : '#8cc56b'}"/>`
  }
  let flowers = ''
  for (let i = 0; i < 16; i++) {
    const x = card.x + 30 + i * 52 + ((i * 17) % 23)
    const y = groundY + 16 + ((i * 11) % 22)
    flowers += `<circle cx="${x}" cy="${y}" r="3" fill="${i % 3 ? C.ivory : C.pink}"/><circle cx="${x}" cy="${y}" r="1.2" fill="${C.butter}"/>`
  }
  grass = `${blades}${grass}${flowers}<path d="M${card.x} ${groundY}H${card.x + card.w}" stroke="${t.plum}" stroke-width="1.5" stroke-opacity=".5"/>`

  const body = `<defs>
  <clipPath id="card"><rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="18"/></clipPath>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${dark ? '<stop offset="0" stop-color="#081224"/><stop offset="1" stop-color="#1a2b4c"/>' : '<stop offset="0" stop-color="#cfe6f6"/><stop offset="1" stop-color="#fbf8f1"/>'}</linearGradient>
</defs>
${paperCard(t, card.x, card.y, card.w, card.h, 18, 'url(#sky)')}
<g clip-path="url(#card)">
  ${sky}
  <text x="${card.x + 34}" y="${card.y + 52}" class="u6" font-size="20" fill="${t.plum}">thanks for stopping by!</text>
  <text x="${card.x + 34}" y="${card.y + 78}" class="f5" font-size="16" fill="${t.soft}">anjavanstaden.co.za</text>
  ${grass}
  <g class="walk"><g class="bob"><image href="${girl}" x="-70" y="${groundY - 130}" width="88" height="132"/></g></g>
</g>
<rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="18" fill="none" stroke="${t.plum}" stroke-width="2"/>`

  return svg({
    w: W,
    h: H,
    title: 'Thanks for stopping by! anjavanstaden.co.za',
    css: `${fontFaces('U6', 'F5')}.u6{font-family:U6}.f5{font-family:F5}
.walk{animation:walk 22s linear infinite}
@keyframes walk{from{transform:translateX(0)}to{transform:translateX(${card.w + 160}px)}}
.bob{animation:bob .55s ease-in-out infinite alternate}
@keyframes bob{to{transform:translateY(-3px)}}
.drift{animation:drift 30s ease-in-out infinite alternate}
@keyframes drift{to{transform:translateX(60px)}}
.spin{animation:spin 24s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.twinkle{transform-box:fill-box;transform-origin:center;animation:twinkle 2.4s ease-in-out infinite}
@keyframes twinkle{50%{transform:scale(.4);opacity:.4}}`,
    body,
  })
}

for (const t of Object.values(THEMES)) {
  save(`header-${t.name}.svg`, header(t))
  for (const tb of TABS) save(`tab-${tb.id}-${t.name}.svg`, tab(t, tb.id))
  save(`interests-${t.name}.svg`, interests(t))
  for (const b of BUTTONS) save(`btn-${b.id}-${t.name}.svg`, button(t, b))
  save(`footer-${t.name}.svg`, footer(t))
}
