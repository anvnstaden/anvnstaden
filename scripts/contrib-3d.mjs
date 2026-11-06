// Draws my GitHub contribution calendar as a little 3D city: one tower per day, as tall as that day was busy,
// standing on a slab in the portfolio's colours. Writes assets/contrib-3d-light.svg and assets/contrib-3d-dark.svg.
//
//   node scripts/contrib-3d.mjs [login]
//
// With GITHUB_TOKEN set it reads the calendar from the GraphQL API (what the workflow does every day), and
// without one it falls back to the public calendar on the profile page, so it also runs locally.
import { C, THEMES, fontFaces, measure, esc, r, svg, save, paperCard } from './kit.mjs'

const LOGIN = process.argv[2] || process.env.GITHUB_LOGIN || 'anvnstaden'
const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

async function fromGraphQL(token) {
  const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
    totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': LOGIN },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  })
  const json = await res.json()
  const cal = json?.data?.user?.contributionsCollection?.contributionCalendar
  if (!cal) throw new Error(`GraphQL: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`)
  const days = cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 }))
  return { total: cal.totalContributions, days }
}

async function fromProfilePage() {
  const res = await fetch(`https://github.com/users/${LOGIN}/contributions`, { headers: { 'User-Agent': LOGIN } })
  if (!res.ok) throw new Error(`profile page: HTTP ${res.status}`)
  const html = await res.text()
  const counts = {}
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>\s*(\d+|No) contributions?/g)) counts[m[1]] = m[2] === 'No' ? 0 : +m[2]
  const days = []
  for (const [tag] of html.matchAll(/<td[^>]*ContributionCalendar-day[^>]*>/g)) {
    const attr = (name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1]
    const date = attr('data-date')
    if (date) days.push({ date, count: counts[attr('id')] ?? 0, level: +(attr('data-level') ?? 0) })
  }
  if (!days.length) throw new Error('profile page: no calendar found')
  days.sort((a, b) => a.date.localeCompare(b.date))
  const total = +(html.match(/([\d,]+)\s+contributions?\s+in the last year/)?.[1].replace(/,/g, '') ?? days.reduce((s, d) => s + d.count, 0))
  return { total, days }
}

async function load() {
  if (process.env.GITHUB_TOKEN) {
    try {
      return await fromGraphQL(process.env.GITHUB_TOKEN)
    } catch (e) {
      console.warn(`${e.message}\nfalling back to the profile page`)
    }
  }
  return fromProfilePage()
}

// ─── Stats ───────────────────────────────────────────────────────────────────────────────────────────────────────

const fmtDate = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function stats(days) {
  let longest = 0
  let run = 0
  for (const d of days) {
    run = d.count ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  // today doesn't break the streak until it's over
  let i = days.length - 1
  if (i >= 0 && !days[i].count) i--
  let current = 0
  while (i >= 0 && days[i].count) current++, i--
  const best = days.reduce((a, b) => (b.count > a.count ? b : a), days[0])
  return { longest, current, best }
}

// ─── Drawing ─────────────────────────────────────────────────────────────────────────────────────────────────────

// The grid is turned 12° and squashed to 62% in depth: weeks run off to the right, weekdays come towards you.
const ANGLE = (12 * Math.PI) / 180
const SQUASH = 0.62
const CELL = 14.2
const WV = [Math.cos(ANGLE) * CELL, Math.sin(ANGLE) * SQUASH * CELL]
const DV = [-Math.sin(ANGLE) * CELL, Math.cos(ANGLE) * SQUASH * CELL]
const MAX_H = 112
const GAP = 0.13

// Low to high: butter, pink, raspberry, blue. Level 0 is a flat tile in the paper's own colour.
const RAMP = [null, C.butter, C.pink, '#c2416b', C.blue]
const RAMP_DARK = [null, C.butter, C.pink, '#e0708f', '#8fb0e6']

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16)
  const ch = (s) => Math.round(((n >> s) & 255) * f)
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`
}

function render(t, data, s) {
  const dark = t.name === 'dark'
  const Wd = 860
  const H = 470
  const first = new Date(`${data.days[0].date}T00:00:00Z`).getUTCDay()
  const cells = data.days.map((d, i) => ({ ...d, w: Math.floor((i + first) / 7), d: (i + first) % 7 }))
  const weeks = cells.at(-1).w + 1
  const max = Math.max(1, ...cells.map((c) => c.count))

  // Place the board: its left corner sits at (ox, oy).
  const boardW = weeks * WV[0] - 7 * DV[0]
  const ox = r((Wd - boardW) / 2 - 7 * DV[0] + 4)
  const oy = 232
  const P = (w, d, z = 0) => [r(ox + w * WV[0] + d * DV[0]), r(oy + w * WV[1] + d * DV[1] - z)]
  const pts = (...ps) => ps.map((p) => p.join(',')).join(' ')

  const ramp = dark ? RAMP_DARK : RAMP
  const edge = dark ? '#06101f' : C.ink
  const flat = dark ? '#1d2c47' : '#ebe4d4'

  // The slab the city stands on.
  const sl = { w0: -0.6, w1: weeks + 0.6, d0: -0.6, d1: 7.6, th: 12 }
  const s00 = P(sl.w0, sl.d0)
  const s10 = P(sl.w1, sl.d0)
  const s11 = P(sl.w1, sl.d1)
  const s01 = P(sl.w0, sl.d1)
  const down = ([x, y]) => [x, r(y + sl.th)]
  const slab = `<polygon points="${pts(s01, s11, down(s11), down(s01))}" fill="${shade(dark ? '#22345a' : '#e0d9c8', 0.92)}" stroke="${t.plum}" stroke-width="1.6" stroke-linejoin="round"/>
<polygon points="${pts(s11, s10, down(s10), down(s11))}" fill="${shade(dark ? '#22345a' : '#e0d9c8', 0.78)}" stroke="${t.plum}" stroke-width="1.6" stroke-linejoin="round"/>
<polygon points="${pts(s00, s10, s11, s01)}" fill="${dark ? '#132240' : '#f6f1e6'}" stroke="${t.plum}" stroke-width="1.6" stroke-linejoin="round"/>`

  // Towers, back to front so nearer ones cover the ones behind.
  const order = [...cells].sort((a, b) => a.w * WV[1] + a.d * DV[1] - (b.w * WV[1] + b.d * DV[1]) || a.w - b.w)
  let towers = ''
  for (const c of order) {
    const w0 = c.w + GAP
    const w1 = c.w + 1 - GAP
    const d0 = c.d + GAP
    const d1 = c.d + 1 - GAP
    if (!c.count) {
      towers += `<polygon points="${pts(P(w0, d0, 1.5), P(w1, d0, 1.5), P(w1, d1, 1.5), P(w0, d1, 1.5))}" fill="${flat}" stroke="${t.plum}" stroke-opacity=".22" stroke-width=".8"/>`
      continue
    }
    const h = r(7 + (MAX_H - 7) * Math.sqrt(c.count / max))
    const top = ramp[Math.max(1, c.level)]
    const front = `<polygon points="${pts(P(w0, d1), P(w1, d1), P(w1, d1, h), P(w0, d1, h))}" fill="${shade(top, 0.86)}"/>`
    const right = `<polygon points="${pts(P(w1, d0), P(w1, d1), P(w1, d1, h), P(w1, d0, h))}" fill="${shade(top, 0.7)}"/>`
    const roof = `<polygon points="${pts(P(w0, d0, h), P(w1, d0, h), P(w1, d1, h), P(w0, d1, h))}" fill="${top}"/>`
    const outline = `<path d="M${P(w0, d1, h)}L${P(w0, d1)}L${P(w1, d1)}L${P(w1, d0)}L${P(w1, d0, h)}L${P(w0, d0, h)}ZM${P(w0, d1, h)}L${P(w1, d1, h)}L${P(w1, d0, h)}M${P(w1, d1, h)}L${P(w1, d1)}" fill="none" stroke="${edge}" stroke-width=".9" stroke-linejoin="round"/>`
    const [bx, by] = P(c.w + 0.5, c.d + 0.5)
    towers += `<g class="t" style="transform-origin:${bx}px ${by}px;animation-delay:${c.w * 24 + c.d * 12}ms"><title>${c.count} on ${fmtDate(c.date)}</title>${front}${right}${roof}${outline}</g>`
  }

  // Month names along the front edge, tilted to follow it.
  const tilt = r((Math.atan2(WV[1], WV[0]) * 180) / Math.PI)
  let months = ''
  let lastMonth = -1
  for (const c of cells) {
    const m = +c.date.slice(5, 7)
    if (c.d === 0 && m !== lastMonth && c.w < weeks - 1) {
      lastMonth = m
      if (c.w === 0 && +c.date.slice(8) > 14) continue // not enough room before the next month starts
      const [x, y] = P(c.w + 0.2, sl.d1)
      months += `<text x="${x}" y="${r(y + sl.th + 15)}" transform="rotate(${tilt} ${x} ${r(y + sl.th + 15)})" class="f7" font-size="11.5" fill="${t.soft}">${new Date(`${c.date}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }).slice(0, 3)}</text>`
    }
  }
  let weekdays = ''
  for (const [d, name] of [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']]) {
    const [x, y] = P(sl.w0, d + 0.5)
    weekdays += `<text x="${r(x - 8)}" y="${r(y + 4)}" text-anchor="end" class="f7" font-size="11.5" fill="${t.soft}">${name}</text>`
  }

  // Headline and the stat boxes (the timeline's stat cards: a 2px border and a hard butter or pink shadow).
  const totalTxt = data.total.toLocaleString('en-GB')
  const head = `<text x="44" y="64" class="u8" font-size="32" fill="${t.plum}" letter-spacing="-.5">${totalTxt}<tspan class="u6" font-size="17" fill="${t.accent}" dx="10">contributions</tspan></text>
<text x="44" y="88" class="f5" font-size="16" fill="${t.soft}">in the last year, one tower per day</text>`

  const boxes = [
    { value: `${s.longest} day${s.longest === 1 ? '' : 's'}`, label: 'longest streak' },
    { value: `${s.current} day${s.current === 1 ? '' : 's'}`, label: 'current streak' },
    { value: `${s.best.count}`, label: `best day · ${fmtDate(s.best.date)}` },
  ].map((b) => ({ ...b, w: Math.ceil(Math.max(measure('U8', 19, b.value), measure('F5', 13, b.label)) + 30) }))
  let bx = 816 - boxes.reduce((a, b) => a + b.w, 0) - (boxes.length - 1) * 12
  let statBoxes = ''
  boxes.forEach((b, i) => {
    const shadow = i % 2 ? C.pink : C.butter
    statBoxes += `<g class="pop" style="animation-delay:${0.9 + i * 0.12}s"><rect x="${bx + 4}" y="${40 + 4}" width="${b.w}" height="58" rx="14" fill="${shadow}"/><rect x="${bx}" y="40" width="${b.w}" height="58" rx="14" fill="${t.paper}" stroke="${t.plum}" stroke-width="2"/>
<text x="${bx + 15}" y="68" class="u8" font-size="19" fill="${t.plum}">${esc(b.value)}</text><text x="${bx + 15}" y="87" class="f5" font-size="13" fill="${t.soft}">${esc(b.label)}</text></g>`
    bx += b.w + 12
  })

  // Legend: a little cube per level.
  const cube = (x, y, fill, h) => {
    const s = 9
    const a = [x, y]
    const b = [x + s, y - s * 0.4]
    const c2 = [x + s * 2, y]
    const d = [x + s, y + s * 0.4]
    const up = ([px, py]) => [px, py - h]
    return `<polygon points="${pts(up(a), up(b), up(c2), up(d))}" fill="${fill}" stroke="${edge}" stroke-width=".8"/><polygon points="${pts(a, d, up(d), up(a))}" fill="${shade(fill, 0.86)}" stroke="${edge}" stroke-width=".8"/><polygon points="${pts(d, c2, up(c2), up(d))}" fill="${shade(fill, 0.7)}" stroke="${edge}" stroke-width=".8"/>`
  }
  let legend = `<text x="44" y="${H - 30}" class="f5" font-size="13" fill="${t.soft}">less</text>`
  ;[flat, ...ramp.slice(1)].forEach((fill, i) => (legend += cube(78 + i * 26, H - 32, fill, i ? 4 + i * 4 : 1.5)))
  legend += `<text x="${78 + 5 * 26 + 4}" y="${H - 30}" class="f5" font-size="13" fill="${t.soft}">more</text>`

  const updated = `<text x="${78 + 5 * 26 + 56}" y="${H - 30}" class="f5" font-size="12.5" fill="${t.soft}">·  @${esc(LOGIN)} · updated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</text>`

  // Dotted paper in light mode (the notebook's doodling page), a blueprint grid in dark mode.
  const pattern = dark
    ? `<pattern id="bg" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${t.rule}"/></pattern>`
    : `<pattern id="bg" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="1.1" fill="#000a1a" opacity=".16"/></pattern>`

  const body = `<defs>${pattern}<clipPath id="card"><rect x="14" y="4" width="830" height="${H - 20}" rx="18"/></clipPath></defs>
${paperCard(t, 14, 4, 830, H - 20)}
<rect x="14" y="4" width="830" height="${H - 20}" rx="18" fill="url(#bg)"/>
${head}
${statBoxes}
<g class="city">${slab}${towers}</g>
${months}${weekdays}
${legend}
${updated}`

  return svg({
    w: Wd,
    h: H,
    title: `${totalTxt} GitHub contributions in the last year, drawn as a 3D city with one tower per day. Longest streak ${s.longest} days, current streak ${s.current} days, best day ${s.best.count} contributions on ${fmtDate(s.best.date)}.`,
    css: `${fontFaces('U8', 'U6', 'F5', 'F7')}.u8{font-family:U8}.u6{font-family:U6}.f5{font-family:F5}.f7{font-family:F7}
.t{animation:grow .9s cubic-bezier(.3,1.35,.5,1) both}
@keyframes grow{from{transform:scaleY(0)}}
.pop{transform-box:fill-box;transform-origin:50% 100%;animation:pop .5s cubic-bezier(.3,1.6,.5,1) both}
@keyframes pop{from{transform:scale(.6) rotate(-6deg);opacity:0}}`,
    body,
  })
}

const data = await load()
const s = stats(data.days)
console.log(`${LOGIN}: ${data.total} contributions over ${data.days.length} days, longest streak ${s.longest}, best day ${s.best.count} (${s.best.date})`)
for (const t of Object.values(THEMES)) save(`contrib-3d-${t.name}.svg`, render(t, data, s))
