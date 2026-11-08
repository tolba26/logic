(() => {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k]; if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(9)) { if (c == null || c === false) continue; e.append(c instanceof Node ? c : document.createTextNode(String(c))); }
  return e;
}
function sv(tag, attrs, ...kids) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  for (const c of kids.flat(9)) { if (c == null || c === false) continue; e.append(c instanceof Node ? c : document.createTextNode(String(c))); }
  return e;
}
const store = {
  get(k, d) { try { const v = localStorage.getItem('dl2:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('dl2:' + k, JSON.stringify(v)); } catch (e) {} }
};
const RM = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
let uid = 0; const nid = p => p + '-' + (++uid);

/* ---------------- waveform renderer ---------------- */
function wave(o) {
  const slots = o.slots, sw = o.slotW || 30, rh = o.rowH || 40, nw = o.nameW || 46;
  const nR = o.rows.length, top = o.edgeMarks ? 14 : 4, bodyH = nR * rh;
  const W = nw + slots * sw + 12, H = top + bodyH + (o.time ? 24 : 6);
  const g = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'wave', role: 'img', 'aria-label': o.label || 'timing diagram' });
  if (o.cursor != null) g.append(sv('rect', { x: nw + o.cursor * sw, y: top, width: sw, height: bodyH, class: 'wv-cursor' }));
  (o.shade || []).forEach(z => g.append(sv('rect', { x: nw + z.from * sw, y: top + (z.row != null ? z.row * rh + 3 : 0), width: (z.to - z.from) * sw, height: z.row != null ? rh - 6 : bodyH, class: 'wv-shade ' + (z.cls || '') })));
  for (let i = 0; i <= slots; i++) { const x = nw + i * sw; g.append(sv('line', { x1: x, y1: top, x2: x, y2: top + bodyH, class: 'wv-grid' })); }
  (o.edges || []).forEach(b => {
    const x = nw + b * sw;
    g.append(sv('line', { x1: x, y1: top, x2: x, y2: top + bodyH, class: 'wv-edge' }));
    if (o.edgeMarks) g.append(sv('path', { d: `M${x - 5} ${top - 12} L${x + 5} ${top - 12} L${x} ${top - 3} Z`, class: 'wv-edgemark' }));
  });
  o.rows.forEach((r, ri) => {
    const y0 = top + ri * rh, yh = y0 + 9, yl = y0 + rh - 9;
    g.append(sv('text', { x: nw - 9, y: (yh + yl) / 2 + 4, class: 'wv-name', 'text-anchor': 'end' }, r.name));
    let d = '', prev = null;
    for (let i = 0; i < slots; i++) {
      const v = r.vals[i], x0 = nw + i * sw, x1 = x0 + sw;
      if (v == null) { prev = null; if (r.unknown) g.append(sv('line', { x1: x0 + 4, y1: (yh + yl) / 2, x2: x1 - 4, y2: (yh + yl) / 2, class: 'wv-unknown' })); continue; }
      const y = v ? yh : yl;
      if (prev == null) d += `M${x0} ${y}`; else if (prev !== v) d += `L${x0} ${y}`;
      d += `L${x1} ${y}`; prev = v;
    }
    if (d) g.append(sv('path', { d, class: 'wv-line ' + (r.cls || '') }));
    if (r.editable && o.onCell) for (let i = 0; i < slots; i++) {
      const hit = sv('rect', { x: nw + i * sw + 1, y: y0 + 2, width: sw - 2, height: rh - 4, class: 'wv-hit', tabindex: 0, role: 'button', 'data-k': ri + '-' + i, 'aria-label': `${r.name} slot ${i + 1}` });
      hit.addEventListener('click', () => o.onCell(ri, i));
      hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onCell(ri, i); } });
      g.append(hit);
    }
  });
  if (o.time) for (let i = 0; i <= slots; i++) { const t = o.time(i); if (t != null) g.append(sv('text', { x: nw + i * sw, y: top + bodyH + 17, class: 'wv-time', 'text-anchor': 'middle' }, t)); }
  return g;
}

/* ---------------- static waves ---------------- */
const STATIC = {
  'ex20-1': () => wave({ slots: 8, slotW: 52, time: i => i * 20, rows: [{ name: 'A', vals: [0,0,1,1,1,0,0,0], cls: 'in' }] }),
  'ex20-2': () => wave({ slots: 8, slotW: 52, time: i => i * 20, shade: [{ from: 2, to: 3, row: 1, cls: 'dly' }, { from: 5, to: 6, row: 1, cls: 'dly' }], rows: [{ name: 'A', vals: [0,0,1,1,1,0,0,0], cls: 'in' }, { name: 'G1', vals: [0,0,0,1,1,1,0,0], cls: 'mid' }] }),
  'ex20-3': () => wave({ slots: 8, slotW: 52, time: i => i * 20, shade: [{ from: 2, to: 3, row: 1, cls: 'dly' }, { from: 5, to: 6, row: 1, cls: 'dly' }, { from: 3, to: 4, row: 2, cls: 'dly' }, { from: 6, to: 7, row: 2, cls: 'dly' }], rows: [{ name: 'A', vals: [0,0,1,1,1,0,0,0], cls: 'in' }, { name: 'G1', vals: [0,0,0,1,1,1,0,0], cls: 'mid' }, { name: 'G2', vals: [1,1,1,1,0,0,0,1], cls: 'out' }] }),
  'ex20-4': () => wave({ slots: 8, slotW: 52, time: i => i * 20, shade: [{ from: 2, to: 4, row: 1, cls: 'dly' }, { from: 5, to: 7, row: 1, cls: 'dly' }], rows: [{ name: 'A', vals: [0,0,1,1,1,0,0,0], cls: 'in' }, { name: 'G2', vals: [1,1,1,1,0,0,0,1], cls: 'out' }] }),
  'clk-edge': () => clockFig('edge'),
  'clk-level': () => clockFig('level'),
  'sr-timing': () => wave({ slots: 12, slotW: 36, rows: [{ name: 'S', vals: [0,0,1,1,0,0,0,0,0,0,0,0], cls: 'in' }, { name: 'R', vals: [0,0,0,0,0,0,0,1,1,0,0,0], cls: 'in' }, { name: 'Q', vals: [0,0,0,1,1,1,1,1,0,0,0,0], cls: 'q' }], shade: [{ from: 2, to: 3, row: 2, cls: 'dly' }, { from: 7, to: 8, row: 2, cls: 'dly' }] })
};
function clockFig(kind) {
  const W = 440, H = 70, per = 80, x0 = 20, yh = 14, yl = 56;
  const g = sv('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'wave', role: 'img', 'aria-label': kind === 'edge' ? 'rising and falling edges' : 'high and low levels' });
  for (let k = 0; k < 5; k++) {
    const a = x0 + k * per, m = a + per / 2, b = a + per;
    const low = sv('line', { x1: a, y1: yl, x2: m, y2: yl, class: 'wv-line ' + (kind === 'level' ? 'q' : 'clk') });
    const rise = sv('line', { x1: m, y1: yl, x2: m, y2: yh, class: 'wv-line ' + (kind === 'edge' ? 'q' : 'clk') });
    const high = sv('line', { x1: m, y1: yh, x2: b, y2: yh, class: 'wv-line ' + (kind === 'level' ? 'in' : 'clk') });
    const fall = sv('line', { x1: b, y1: yh, x2: b, y2: yl, class: 'wv-line ' + (kind === 'edge' ? 'in' : 'clk') });
    g.append(low, rise, high, fall);
  }
  return g;
}

/* ---------------- gate-delay lab (L0) ---------------- */
function mountGateLab(root) {
  const N = 10;
  const st = { A: [0,0,1,1,0,0,1,1,1,1], B: [0,1,1,0,0,0,1,1,0,0], C: [0,0,1,1,1,1,1,0,0,0], d: 1, mode: 'see', gY: Array(N).fill(null), gZ: Array(N).fill(null), wrong: null, cur: null, timer: null, fk: null, msg: '' };
  const calc = () => {
    const at = i => Math.max(0, i - st.d);
    const S = st.A.map((a, i) => a | st.B[i]);
    const Y = S.map((_, i) => S[at(i)]);
    const Z = Y.map((_, i) => Y[at(i)] & st.C[at(i)]);
    return { S, Y, Z };
  };
  const delayBtns = [0, 1, 2].map(d => h('button', { class: 'seg', type: 'button', onclick: () => { st.d = d; st.wrong = null; st.msg = ''; render(); } }, d * 5 + ' ns'));
  const modeSee = h('button', { class: 'seg', type: 'button', onclick: () => { st.mode = 'see'; st.wrong = null; st.msg = ''; render(); } }, 'اعرض Y و Z');
  const modeTry = h('button', { class: 'seg', type: 'button', onclick: () => { stop(); st.mode = 'try'; st.wrong = null; st.msg = ''; render(); } }, 'هحلّها أنا');
  const playBtn = h('button', { class: 'btn', type: 'button', onclick: () => toggle() }, '▶ امشي معايا خانة خانة');
  const checkBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => check() }, 'صحّحلي');
  const resetBtn = h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.gY.fill(null); st.gZ.fill(null); st.wrong = null; st.msg = ''; render(); } }, 'امسح إجابتي');
  const waveBox = h('div', { class: 'wavebox', dir: 'ltr' });
  const out = h('p', { class: 'readout', 'aria-live': 'polite' });
  root.append(
    h('div', { class: 'ctlrow' },
      h('div', { class: 'ctl' }, h('span', { class: 'ctl-l' }, 'تأخير كل بوابة'), h('div', { class: 'segs' }, delayBtns)),
      h('div', { class: 'ctl' }, h('span', { class: 'ctl-l' }, 'الوضع'), h('div', { class: 'segs' }, modeSee, modeTry))),
    waveBox, out, h('div', { class: 'btnrow' }, playBtn, checkBtn, resetBtn));
  function render() {
    const { S, Y, Z } = calc(), tr = st.mode === 'try';
    delayBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(st.d === i)));
    modeSee.setAttribute('aria-pressed', String(!tr)); modeTry.setAttribute('aria-pressed', String(tr));
    checkBtn.hidden = !tr; resetBtn.hidden = !tr; playBtn.hidden = tr;
    const shade = (st.wrong || []).map(([r, i]) => ({ from: i, to: i + 1, row: r, cls: 'bad' }));
    waveBox.replaceChildren(wave({
      slots: N, slotW: 46, rowH: 42, time: i => i * 5, cursor: st.cur, shade,
      rows: [
        { name: 'A', vals: st.A, cls: 'in', editable: true }, { name: 'B', vals: st.B, cls: 'in', editable: true }, { name: 'C', vals: st.C, cls: 'in', editable: true },
        { name: 'Y', vals: tr ? st.gY : Y, cls: 'mid', editable: tr, unknown: true }, { name: 'Z', vals: tr ? st.gZ : Z, cls: 'out', editable: tr, unknown: true }],
      onCell: (r, i) => {
        st.fk = r + '-' + i;
        if (r < 3) { const k = 'ABC'[r]; st[k][i] ^= 1; }
        else { const a = r === 3 ? st.gY : st.gZ; a[i] = a[i] == null ? 1 : a[i] ? 0 : null; }
        st.wrong = null; st.msg = ''; render();
      }
    }));
    if (st.fk) { const t = waveBox.querySelector(`[data-k="${st.fk}"]`); if (t) t.focus({ preventScroll: true }); }
    if (st.msg) out.innerHTML = st.msg;
    else if (st.cur == null) out.textContent = tr
      ? 'اضغط على خانات Y و Z عشان ترسمهم: ضغطة = 1، التانية = 0، التالتة تمسح. وبعدين اضغط «صحّحلي».'
      : 'اضغط على أي خانة في A أو B أو C عشان تقلب قيمتها، وشوف Y و Z بيتحسبوا لوحدهم بالتأخير اللي اخترته.';
    else {
      const i = st.cur, j = Math.max(0, i - st.d);
      out.innerHTML = `<b>t = ${i * 5} → ${i * 5 + 5} ns</b> · دلوقتي A=${st.A[i]} و B=${st.B[i]}، يعني A+B = ${S[i]}. بس Y متأخرة ${st.d * 5}ns، فهي بتعرض قيمة A+B اللي كانت عند t=${j * 5}: <b>Y = ${Y[i]}</b>. وZ = Y·C ومتأخرة برضو ${st.d * 5}ns عن Y و C: <b>Z = ${Z[i]}</b>.`;
    }
  }
  function check() {
    const { Y, Z } = calc(), wrong = [];
    for (let i = 0; i < N; i++) { if (st.gY[i] !== Y[i]) wrong.push([3, i]); if (st.gZ[i] !== Z[i]) wrong.push([4, i]); }
    st.wrong = wrong;
    st.msg = wrong.length ? `<b>${2 * N - wrong.length} من ${2 * N}</b> خانة صح. الخانات المظللة بالأحمر غلط (أو فاضية). افتكر: Z بتستخدم Y المتأخرة، مش A+B المثالية.` : '<b>كله صح.</b> رسمت Y و Z بالتأخير مظبوط. جرّب تغيّر الـ delay وتحلها تاني.';
    render();
  }
  function stop() { clearInterval(st.timer); st.timer = null; st.cur = null; playBtn.textContent = '▶ امشي معايا خانة خانة'; }
  function toggle() {
    if (st.timer) { stop(); render(); return; }
    st.cur = 0; st.msg = ''; playBtn.textContent = '❚❚ وقّف'; render();
    st.timer = setInterval(() => { st.cur++; if (st.cur >= N) { stop(); } render(); }, RM ? 2200 : 1700);
  }
  render();
}

/* ---------------- flip-flop playground (L1) ---------------- */
const FFT = {
  SR: { ins: ['S', 'R'], clk: false, next: (v, q) => v.S && v.R ? null : v.S ? 1 : v.R ? 0 : q, eq: 'Q⁺ = S + R̄·Q', say: v => v.S && v.R ? 'S=R=1 ممنوع: الـ NOR الاتنين بيطلعوا 0، يعني Q و Q̄ الاتنين بقوا 0 وده مش منطقي.' : v.S ? 'S=1 → Set: الخرج Q بقى 1.' : v.R ? 'R=1 → Reset: الخرج Q بقى 0.' : 'S=R=0 → الذاكرة شغالة: Q محتفظ بقيمته.' },
  T: { ins: ['T'], clk: true, next: (v, q) => v.T ? 1 - q : q, eq: 'Q⁺ = T ⊕ Q', say: v => v.T ? 'T=1 → مع النبضة الجاية Q هيتقلب.' : 'T=0 → مع النبضة Q هيفضل زي ما هو.' },
  JK: { ins: ['J', 'K'], clk: true, next: (v, q) => ((v.J && !q) || (!v.K && q)) ? 1 : 0, eq: 'Q⁺ = J·Q̄ + K̄·Q', say: v => v.J && v.K ? 'J=K=1 → Toggle: هيتقلب مع النبضة.' : v.J ? 'J=1, K=0 → Set: هيبقى 1 مع النبضة.' : v.K ? 'J=0, K=1 → Reset: هيبقى 0 مع النبضة.' : 'J=K=0 → Hold: مش هيتغير.' },
  D: { ins: ['D'], clk: true, next: v => v.D ? 1 : 0, eq: 'Q⁺ = D', say: v => `مع النبضة الجاية Q هيبقى ${v.D} (نفس D).` }
};
function mountFF(root) {
  let t = 'JK', v = { J: 0, K: 0 }, q = 0, bad = false, hist = [];
  const tabs = Object.keys(FFT).map(k => h('button', { class: 'seg', type: 'button', onclick: () => { t = k; v = {}; FFT[k].ins.forEach(n => v[n] = 0); q = 0; bad = false; hist = []; snap(false); render(); } }, k === 'SR' ? 'SR' : k));
  const inBox = h('div', { class: 'ffins' });
  const lamp = h('div', { class: 'lamp', 'aria-live': 'polite' });
  const clkBtn = h('button', { class: 'btn primary', type: 'button', onclick: () => { const n = FFT[t].next(v, q); q = n; snap(true); render(); } }, 'نبضة Clock ↓');
  const say = h('p', { class: 'readout' });
  const tblBox = h('div', { class: 'scrollx' });
  const wBox = h('div', { class: 'wavebox', dir: 'ltr' });
  root.append(h('div', { class: 'ctl' }, h('span', { class: 'ctl-l' }, 'نوع الـ Flip-Flop'), h('div', { class: 'segs' }, tabs)),
    h('div', { class: 'ffstage' }, inBox, h('div', { class: 'ffbody', dir: 'ltr' }, h('div', { class: 'ffchip' }, ''), lamp), clkBtn),
    say, h('div', { class: 'ffgrid' }, h('div', null, h('div', { class: 'mini-h' }, 'الـ truth table (الصف المنوّر = اللي إنت فيه دلوقتي)'), tblBox), h('div', null, h('div', { class: 'mini-h' }, 'اللي حصل لحد دلوقتي'), wBox)));
  function snap(clk) { hist.push({ v: { ...v }, q: bad ? 0 : q, clk }); if (hist.length > 14) hist.shift(); }
  function render() {
    const F = FFT[t];
    tabs.forEach((b, i) => b.setAttribute('aria-pressed', String(Object.keys(FFT)[i] === t)));
    inBox.replaceChildren(...F.ins.map(n => h('button', { class: 'bit', type: 'button', 'aria-pressed': String(!!v[n]), onclick: () => {
      v[n] ^= 1;
      if (!F.clk) { const nx = F.next(v, q); bad = nx == null; if (!bad) q = nx; snap(false); }
      render();
    } }, h('span', { class: 'bit-n' }, n), h('span', { class: 'bit-v' }, v[n]))));
    root.querySelector('.ffchip').textContent = t + ' FF';
    const qv = bad ? 0 : q, qb = bad ? 0 : 1 - q;
    lamp.replaceChildren(h('span', { class: 'lq ' + (qv ? 'on' : '') }, 'Q = ' + qv), h('span', { class: 'lq ' + (qb ? 'on' : '') }, 'Q̄ = ' + qb));
    lamp.classList.toggle('bad', bad);
    clkBtn.hidden = !F.clk;
    say.innerHTML = `<b dir="ltr">${F.eq}</b> · ${F.say(v)}${F.clk ? ' اضغط «نبضة Clock» عشان التغيير يحصل.' : ' (الـ SR هنا latch من غير clock: بيرد على طول، بعد الـ propagation delay بس.)'}`;
    // truth table
    const rows = [];
    const nIn = F.ins.length;
    for (let c = 0; c < (1 << nIn); c++) for (let qq = 0; qq < 2; qq++) {
      const vals = {}; F.ins.forEach((n, i) => vals[n] = (c >> (nIn - 1 - i)) & 1);
      const nx = F.next(vals, qq);
      const active = F.ins.every(n => vals[n] === (v[n] || 0)) && qq === (bad ? 0 : q) && !bad;
      const forb = nx == null && F.ins.every(n => vals[n] === (v[n] || 0));
      rows.push(h('tr', { class: active || (forb && bad) ? 'cur' : '' }, ...F.ins.map(n => h('td', null, vals[n])), h('td', null, qq), h('td', { class: 'res' }, nx == null ? 'X' : nx)));
    }
    tblBox.replaceChildren(h('table', { class: 'tbl', dir: 'ltr' }, h('thead', null, h('tr', null, ...F.ins.map(n => h('th', null, n)), h('th', null, 'Q'), h('th', { class: 'res' }, 'Q⁺'))), h('tbody', null, rows)));
    const edges = []; hist.forEach((s, i) => { if (s.clk) edges.push(i); });
    wBox.replaceChildren(hist.length > 1 ? wave({ slots: hist.length, slotW: 26, rowH: 34, nameW: 30, edges, edgeMarks: true, rows: [...F.ins.map(n => ({ name: n, vals: hist.map(s => s.v[n] || 0), cls: 'in' })), { name: 'Q', vals: hist.map(s => s.q), cls: 'q' }] }) : h('p', { class: 'muted small' }, 'غيّر الدخل واضغط Clock وهتلاقي الإشارات بتترسم هنا.'));
  }
  snap(false); render();
}

/* ---------------- fill-in tables ---------------- */
const FILLS = {};
function mountFill(root, spec) {
  const defOpts = spec.opts || ['0', '1', 'X'];
  const cells = [];
  const thead = h('thead');
  if (spec.group) thead.append(h('tr', null, spec.group.map(([l, n, cls]) => h('th', { colspan: n, class: cls || '', html: l }))));
  thead.append(h('tr', null, spec.cols.map(c => h('th', { html: c }))));
  const tbody = h('tbody', null, spec.rows.map(r => h('tr', null, r.map(c => {
    if (c && typeof c === 'object') {
      const opts = c.o || defOpts;
      const b = h('button', { class: 'cellbtn', type: 'button', 'aria-label': 'خانة فاضية' }, '');
      b.dataset.v = '';
      const set = val => { b.dataset.v = val; b.textContent = val; b.classList.remove('ok', 'no'); };
      b.addEventListener('click', () => { const i = opts.indexOf(b.dataset.v); set(i === opts.length - 1 ? '' : opts[i + 1]); });
      b.addEventListener('keydown', e => { const k = e.key.toUpperCase(); const m = opts.find(o => o.toUpperCase() === k); if (m) { e.preventDefault(); set(m); } else if (e.key === 'Backspace' || e.key === 'Delete') set(''); });
      cells.push({ b, a: c.a, set });
      return h('td', { class: 'blank' }, b);
    }
    return h('td', { html: c });
  }))));
  const msg = h('p', { class: 'readout', 'aria-live': 'polite' }, spec.hint || 'اضغط على كل خانة فاضية عشان تختار القيمة (أو اكتب 0 أو 1 أو X من الكيبورد).');
  const chk = h('button', { class: 'btn primary', type: 'button', onclick: () => {
    let ok = 0; cells.forEach(c => { const good = c.b.dataset.v === c.a; c.b.classList.toggle('ok', good); c.b.classList.toggle('no', !good); if (good) ok++; });
    msg.innerHTML = ok === cells.length ? `<b>تمام، ${ok} من ${cells.length}.</b> ${spec.win || ''}` : `<b>${ok} من ${cells.length}</b> صح. الخانات الحمرا راجعها${spec.tip ? ': ' + spec.tip : '.'}`;
  } }, 'صحّحلي');
  const rev = h('button', { class: 'btn ghost', type: 'button', onclick: () => { cells.forEach(c => { c.set(c.a); c.b.classList.add('ok'); }); msg.innerHTML = spec.win ? `<b>ده الحل.</b> ${spec.win}` : '<b>ده الحل.</b>'; } }, 'اعرض الحل');
  const clr = h('button', { class: 'btn ghost', type: 'button', onclick: () => { cells.forEach(c => c.set('')); msg.textContent = spec.hint || 'اتمسح. ابدأ من الأول.'; } }, 'امسح');
  root.append(h('div', { class: 'scrollx' }, h('table', { class: 'tbl fill', dir: 'ltr' }, thead, tbody)), msg, h('div', { class: 'btnrow' }, chk, rev, clr));
}
const B = { a: 0 }; // placeholder
const c0 = { a: '0' }, c1 = { a: '1' }, cX = { a: 'X' };
FILLS['exc-all'] = {
  group: [['', 2], ['SR', 2], ['JK', 2], ['T', 1], ['D', 1]],
  cols: ['Q', 'Q⁺', 'S', 'R', 'J', 'K', 'T', 'D'],
  rows: [['0', '0', c0, cX, c0, cX, c0, c0], ['0', '1', c1, c0, c1, cX, c1, c1], ['1', '0', c0, c1, cX, c1, c1, c0], ['1', '1', cX, c0, cX, c0, c0, c1]],
  tip: 'لكل صف اسأل: إيه كل الطرق اللي توديني من Q لـ Q⁺؟ لو دخل مش فارق في كل الطرق يبقى X.',
  win: 'ده أهم جدول في المادة كلها، هتستخدمه في كل مسألة Design.'
};
FILLS['conv-dt'] = {
  cols: ['T', 'Q', 'Q⁺', 'D'],
  rows: [['0', '0', c0, c0], ['0', '1', c1, c1], ['1', '0', c1, c1], ['1', '1', c0, c0]],
  opts: ['0', '1'],
  tip: 'Q⁺ من جدول الـ T، وبعدين D = Q⁺ دايمًا (excitation بتاع D).',
  win: 'عمود D هو 0 1 1 0 = T ⊕ Q. يعني تحط XOR بين T و Q وتدخّله على D.'
};
const ns = a => ({ a, o: ['00', '01', '10', '11'] });
const zz = a => ({ a, o: ['0', '1'] });
FILLS['l2e1-trans'] = {
  group: [['P.S.', 1], ['N.S. (Q1⁺Q2⁺)', 2], ['Z', 2]],
  cols: ['Q1Q2', 'X=0', 'X=1', 'X=0', 'X=1'],
  rows: [['00', ns('00'), ns('01'), zz('0'), zz('1')], ['01', ns('01'), ns('11'), zz('1'), zz('0')], ['11', ns('11'), ns('00'), zz('0'), zz('1')], ['10', ns('10'), ns('01'), zz('0'), zz('1')]],
  hint: 'كل خانة N.S. فيها bitين (Q1⁺Q2⁺). اضغط عليها لحد ما توصل للقيمة اللي حسبتها.',
  tip: 'عوّض في Q1⁺ = XQ̄1Q2 + X̄Q1 و Q2⁺ = XQ̄2 + X̄Q2 + Q̄1Q2 و Z = XQ̄2 + X̄Q2Q̄1 + XQ1.',
  win: 'ده بالظبط جدول السلايد 3.'
};
const jk = a => ({ a, o: ['0', '1', 'X'] });
FILLS['l3e1-jk'] = {
  group: [['P.S.', 1], ['N.S.', 1], ['FF1', 2], ['FF2', 2], ['FF3', 2]],
  cols: ['Q1Q2Q3', 'Q1⁺Q2⁺Q3⁺', 'J1', 'K1', 'J2', 'K2', 'J3', 'K3'],
  rows: [
    ['000', '100', jk('1'), jk('X'), jk('0'), jk('X'), jk('0'), jk('X')],
    ['010', '011', jk('0'), jk('X'), jk('X'), jk('0'), jk('1'), jk('X')],
    ['011', '000', jk('0'), jk('X'), jk('X'), jk('1'), jk('X'), jk('1')],
    ['100', '111', jk('X'), jk('0'), jk('1'), jk('X'), jk('1'), jk('X')],
    ['111', '010', jk('X'), jk('1'), jk('X'), jk('0'), jk('X'), jk('1')]],
  hint: 'خد كل bit لوحده: قارن Q الحالية بـ Q⁺ وطبّق excitation الـ JK: 0→0 = 0X، 0→1 = 1X، 1→0 = X1، 1→1 = X0.',
  tip: 'خلي بالك إن كل FF بيبص على الـ bit بتاعه بس. FF2 مثلًا بيبص على Q2 و Q2⁺.',
  win: 'الصفوف 001 و 101 و 110 مش مستخدمة، فكل الـ J و K فيها X.'
};
FILLS['l3-gray'] = {
  group: [['P.S.', 1], ['N.S.', 1], ['D inputs', 2]],
  cols: ['Q1Q2', 'Q1⁺Q2⁺', 'D1', 'D2'],
  rows: [['00', '01', c0, c1], ['01', '11', c1, c1], ['11', '10', c1, c0], ['10', '00', c0, c0]],
  opts: ['0', '1'],
  tip: 'مع D مفيش أي تفكير: D = Q⁺ بتاع نفس الـ bit.',
  win: 'D1 = 0 1 1 0 بالترتيب ده بالظبط زي Q2، يعني D1 = Q2. و D2 = 1 1 0 0 = Q̄1. دايرة من غير ولا بوابة غير inverter!'
};
const stc = (a, o) => ({ a, o });
FILLS['l4-101'] = {
  group: [['P.S.', 1], ['N.S.', 2], ['Z', 2]],
  cols: ['', 'X=0', 'X=1', 'X=0', 'X=1'],
  rows: [['A <small>(مفيش)</small>', stc('A', ['A', 'B', 'C']), stc('B', ['A', 'B', 'C']), zz('0'), zz('0')],
    ['B <small>(…1)</small>', stc('C', ['A', 'B', 'C']), stc('B', ['A', 'B', 'C']), zz('0'), zz('0')],
    ['C <small>(…10)</small>', stc('A', ['A', 'B', 'C']), stc('B', ['A', 'B', 'C']), zz('0'), zz('1')]],
  hint: 'A = لسه مشفتش حاجة مفيدة، B = آخر حاجة جت 1، C = آخر حاجتين 10. لكل خانة اسأل: بعد الـ bit ده، إيه أطول جزء من أول 101 موجود في آخر اللي شفته؟',
  tip: 'من C لو جه 1: لقينا 101 فـ Z=1، والـ 1 الأخير ده ينفع يبدأ 101 جديدة، يعني نروح B مش A.',
  win: 'ده بالظبط الـ Mealy graph بتاع Problem 4.'
};
FILLS['l4-110'] = {
  group: [['P.S.', 1], ['N.S.', 2], ['Z', 2]],
  cols: ['', 'X=0', 'X=1', 'X=0', 'X=1'],
  rows: [['A <small>(مفيش)</small>', stc('A', ['A', 'B', 'C']), stc('B', ['A', 'B', 'C']), zz('0'), zz('0')],
    ['B <small>(…1)</small>', stc('A', ['A', 'B', 'C']), stc('C', ['A', 'B', 'C']), zz('0'), zz('0')],
    ['C <small>(…11)</small>', stc('A', ['A', 'B', 'C']), stc('C', ['A', 'B', 'C']), zz('1'), zz('0')]],
  hint: 'تمرين جديد مش في السلايدز: Mealy بيطلّع Z=1 كل ما يلاقي 110، مع overlap. A = مفيش، B = آخرها 1، C = آخرها 11.',
  tip: 'من C لو جه 1 يبقى عندنا 111، وآخرها لسه 11، فنفضل في C. ومن B لو جه 0 يبقى 10 ومفيش أي بداية لـ 110 في آخرها، نرجع A.',
  win: 'لاحظ إن بعد ما نلاقي 110 بنرجع A، لأن آخر حاجة 0 ومفيش 110 بتبدأ بـ 0.'
};

/* sheet fills */
const b01 = a => ({ a, o: ['0', '1'] });
FILLS['s1q5-char'] = {
  cols: ['M', 'N', 'Q', 'Q⁺'], opts: ['0', '1'],
  rows: [['0', '0', '0', b01('0')], ['0', '0', '1', b01('0')], ['0', '1', '0', b01('1')], ['0', '1', '1', b01('1')], ['1', '0', '0', b01('1')], ['1', '0', '1', b01('0')], ['1', '1', '0', b01('1')], ['1', '1', '1', b01('0')]],
  tip: 'M=0 يبقى Q⁺ = N على طول. M=1 يبقى Q⁺ = عكس Q (و N مش فارقة).',
  win: 'من الجدول: Q⁺ = M̄·N + M·Q̄.'
};
FILLS['s1q5-jk'] = {
  group: [['MN FF', 3], ['', 1], ['JK', 2]],
  cols: ['M', 'N', 'Q', 'Q⁺', 'J', 'K'],
  rows: [['0', '0', '0', '0', c0, cX], ['0', '0', '1', '0', cX, c1], ['0', '1', '0', '1', c1, cX], ['0', '1', '1', '1', cX, c0], ['1', '0', '0', '1', c1, cX], ['1', '0', '1', '0', cX, c1], ['1', '1', '0', '1', c1, cX], ['1', '1', '1', '0', cX, c1]],
  tip: 'excitation الـ JK: 0→0 = 0X، 0→1 = 1X، 1→0 = X1، 1→1 = X0.',
  win: 'J = M + N و K = M + N̄.'
};
const mx = a => ({ a, o: ['0', '1', 'Q', 'Q̄'] });
FILLS['s1q7-mux'] = {
  group: [['select', 2], ['', 1], ['', 1]],
  cols: ['J', 'K', 'المطلوب', 'مدخل الـ MUX'],
  rows: [['0', '0', '<small>hold</small>', mx('Q')], ['0', '1', '<small>reset</small>', mx('0')], ['1', '0', '<small>set</small>', mx('1')], ['1', '1', '<small>toggle</small>', mx('Q̄')]],
  hint: 'J و K داخلين على الـ select lines. كل مدخل في الـ MUX لازم يطلّع Q⁺ اللي الـ JK المفروض يطلّعه. اختار: 0 أو 1 أو Q أو Q̄.',
  win: 'I0 = Q، I1 = 0، I2 = 1، I3 = Q̄، وخرج الـ MUX داخل على D.'
};
FILLS['s1q8-char'] = {
  cols: ['P', 'N', 'Q', 'Q⁺'], opts: ['0', '1'],
  rows: [['0', '0', '0', b01('0')], ['0', '0', '1', b01('0')], ['0', '1', '0', b01('0')], ['0', '1', '1', b01('1')], ['1', '0', '0', b01('1')], ['1', '0', '1', b01('0')], ['1', '1', '0', b01('1')], ['1', '1', '1', b01('1')]],
  tip: 'PN: 00 = clear (0)، 01 = no change (Q)، 10 = toggle (Q̄)، 11 = set (1).',
  win: 'Q⁺ = P·Q̄ + N·Q.'
};
FILLS['s1q8-exc'] = {
  cols: ['Q', 'Q⁺', 'P', 'N'],
  rows: [['0', '0', c0, cX], ['0', '1', c1, cX], ['1', '0', cX, c0], ['1', '1', cX, c1]],
  tip: 'لكل انتقال اسأل: أنهي عمليات من الأربعة بتعمله؟ اللي بيفرق بينهم يبقى X.',
  win: 'لاحظ: P = J و N = عكس K. الـ PN ده JK متنكّر.'
};
FILLS['s1q8-d'] = {
  group: [['D FF', 3], ['PN', 2]],
  cols: ['D', 'Q', 'Q⁺', 'P', 'N'],
  rows: [['0', '0', '0', c0, cX], ['0', '1', '0', cX, c0], ['1', '0', '1', c1, cX], ['1', '1', '1', cX, c1]],
  tip: 'Q⁺ = D، وبعدين excitation الـ PN اللي لسه عاملها.',
  win: 'P = D و N = D. يعني وصّل D على الدخلين مع بعض ومن غير ولا بوابة.'
};
FILLS['s2q2-trans'] = {
  group: [['P.S. + input', 3], ['N.S. = D', 2]],
  cols: ['A', 'B', 'x', 'A⁺ = D<sub>A</sub>', 'B⁺ = D<sub>B</sub>'], opts: ['0', '1'],
  rows: [['0', '0', '0', b01('0'), b01('0')], ['0', '0', '1', b01('0'), b01('1')], ['0', '1', '0', b01('0'), b01('1')], ['0', '1', '1', b01('1'), b01('1')],
    ['1', '0', '0', b01('1'), b01('0')], ['1', '0', '1', b01('0'), b01('0')], ['1', '1', '0', b01('1'), b01('1')], ['1', '1', '1', b01('1'), b01('0')]],
  tip: 'x=0: الحالة الجاية = نفس الحالة. x=1: 00→01→11→10→00.',
  win: 'D<sub>A</sub> = A·x̄ + B·x و D<sub>B</sub> = B·x̄ + Ā·x.'
};
(() => {
  const rows = [];
  const nxt = (n, x) => x ? (n <= 5 ? (n + 4) % 6 : null) : (n + 3) % 8;
  for (const x of [0, 1]) for (let n = 0; n < 8; n++) {
    const m = nxt(n, x), bits = n.toString(2).padStart(3, '0');
    if (m == null) { rows.push([String(x), bits, '– – –', 'X', 'X', 'X', 'X']); continue; }
    const nb = m.toString(2).padStart(3, '0'), A = +bits[0], B = +bits[1], C = +bits[2], A2 = +nb[0], B2 = +nb[1], C2 = +nb[2];
    rows.push([String(x), bits, nb, b01(String(A ^ A2)), jk(B === 0 ? String(B2) : 'X'), jk(B === 1 ? String(1 - B2) : 'X'), b01(String(C ^ C2))]);
  }
  FILLS['s2q5-tbl'] = { group: [['', 1], ['P.S.', 1], ['N.S.', 1], ['T (A)', 1], ['JK (B)', 2], ['T (C)', 1]], cols: ['X', 'ABC', 'A⁺B⁺C⁺', 'T<sub>A</sub>', 'J<sub>B</sub>', 'K<sub>B</sub>', 'T<sub>C</sub>'], rows,
    hint: 'T = 1 لو الـ bit هيتغير. J/K من excitation الـ JK. الصفين 110 و 111 مع X=1 مش موجودين في العدّ mod 6 فهم X.',
    tip: 'اتأكد من عمود N.S. الأول: X=0 يعني +3 mod 8، و X=1 يعني −2 mod 6.', win: 'كده عندك كل اللي محتاجه للـ K-maps اللي تحت.' };
})();
const ss = a => ({ a, o: ['00', '01', '10', '11'] });
FILLS['s2q6-seq'] = {
  cols: ['', 't0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
  rows: [['x', '1', '1', '0', '1', '0', '1', '0', '0'], ['Q1Q2', ss('00'), ss('10'), ss('00'), ss('01'), ss('01'), ss('00'), ss('10'), ss('11')], ['Z', b01('1'), b01('1'), b01('0'), b01('0'), b01('0'), b01('1'), b01('0'), b01('0')]],
  hint: 'ابدأ من Q1Q2 = 00. لكل عمود: من الحالة الحالية و x، هات Z والحالة اللي هتكتبها في العمود اللي بعده.',
  tip: 'Z = x·(Q1 + Q̄2). و Q1⁺ = x·Q̄1·Q̄2 + (x̄ + Q2)·Q1 و Q2⁺ = x̄ ⊕ Q2.',
  win: 'Z = 1 1 0 0 0 1 0 0.'
};
FILLS['s2q4-trans'] = {
  group: [['P.S.', 1], ['N.S.', 2], ['Z', 2]],
  cols: ['Q1Q2', 'x=0', 'x=1', 'x=0', 'x=1'],
  rows: [['00', ns('00'), ns('01'), zz('0'), zz('1')], ['01', ns('01'), ns('10'), zz('1'), zz('1')], ['10', ns('10'), ns('00'), zz('0'), zz('1')], ['11', ns('11'), ns('00'), zz('1'), zz('1')]],
  tip: 'Q1⁺ = x·Q2·Q̄1 + x̄·Q1 و Q2⁺ = x·Q̄1·Q̄2 + x̄·Q2 و Z = x + Q2.'
};
FILLS['s3q1-z'] = {
  group: [['آخر bitين', 1], ['N.S.', 2], ['Z', 2]],
  cols: ['', 'X=0', 'X=1', 'X=0', 'X=1'],
  rows: [['00', ss('00'), ss('01'), b01('0'), b01('1')], ['01', ss('10'), ss('11'), b01('1'), b01('0')], ['10', ss('00'), ss('01'), b01('1'), b01('0')], ['11', ss('10'), ss('11'), b01('0'), b01('0')]],
  hint: 'الحالة = آخر bitين شفتهم. الحالة الجاية = (الـ bit التاني من الحالة) + الـ bit الجديد. والخرج: عدّ الأصفار في التلاتة (الحالة + الجديد)، لو 2 بالظبط يبقى 1.',
  tip: 'مثال: الحالة 01 وجه 0: آخر 3 = 010 فيهم صفرين ← Z=1، والحالة الجاية = 10.'
};
const st3 = a => ({ a, o: ['A', 'B', 'C'] });
FILLS['s3q4-tbl'] = {
  group: [['P.S.', 1], ['N.S.', 2], ['z', 2]],
  cols: ['', 'w=0', 'w=1', 'w=0', 'w=1'],
  rows: [['A <small>(reset)</small>', st3('B'), st3('C'), b01('0'), b01('0')], ['B <small>(آخرها 0)</small>', st3('B'), st3('C'), b01('1'), b01('0')], ['C <small>(آخرها 1)</small>', st3('B'), st3('C'), b01('0'), b01('1')]],
  tip: 'الحالة الجاية بتعتمد على الـ bit الجديد بس: 0 ← B، 1 ← C. والخرج 1 لما الجديد زي القديم.',
  win: 'لاحظ إن الحالة الجاية مش بتعتمد على الحالة الحالية خالص. الحالة بس بتفتكر آخر bit.'
};

/* ---------------- edge timing exercises ---------------- */
function mountEdgeEx(root, kind) {
  const slots = 18, edges = [4, 8, 12, 16];
  const ck = [...Array(slots)].map((_, s) => (s % 4 === 2 || s % 4 === 3) ? 1 : 0);
  const ins = kind === 'T'
    ? { T: [0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1] }
    : { J: [1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1], K: [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1] };
  const F = FFT[kind];
  const ans = []; { let q = 0; edges.forEach(e => { const v = {}; for (const k in ins) v[k] = ins[k][e - 1]; q = F.next(v, q); ans.push(q); }); }
  const g = Array(edges.length).fill(null); let reveal = false, checked = null;
  const qOf = arr => [...Array(slots)].map((_, s) => { let q = 0; for (let k = 0; k < edges.length; k++) if (s >= edges[k]) { if (arr[k] == null) return null; q = arr[k]; } return q; });
  const wBox = h('div', { class: 'wavebox', dir: 'ltr' });
  const pick = h('div', { class: 'edgepick' });
  const msg = h('p', { class: 'readout', 'aria-live': 'polite' }, 'اختار قيمة Q بعد كل falling edge (السهم). Q بيبدأ بـ 0.');
  root.append(wBox, pick, msg, h('div', { class: 'btnrow' },
    h('button', { class: 'btn primary', type: 'button', onclick: () => { checked = g.map((x, i) => x === ans[i]); const n = checked.filter(Boolean).length; msg.innerHTML = n === 4 ? '<b>4 من 4.</b> قريت الدخل قبل كل سهم صح.' : `<b>${n} من 4.</b> عند كل سهم بص على الدخل <u>قبل</u> السهم على طول، وطبّق الجدول على Q اللي قبله.`; render(); } }, 'صحّحلي'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { reveal = !reveal; render(); } }, 'اعرض/اخفي الحل')));
  function render() {
    const rows = [{ name: 'CK', vals: ck, cls: 'clk' }, ...Object.keys(ins).map(k => ({ name: k, vals: ins[k], cls: 'in' })), { name: 'Q', vals: qOf(g), cls: 'q', unknown: true }];
    if (reveal) rows.push({ name: 'Q ✓', vals: qOf(ans), cls: 'ans' });
    wBox.replaceChildren(wave({ slots, slotW: 30, rowH: 38, edges, edgeMarks: true, rows, time: i => { const k = edges.indexOf(i); return k >= 0 ? 'e' + (k + 1) : null; } }));
    pick.replaceChildren(...edges.map((e, k) => {
      const v = {}; for (const n in ins) v[n] = ins[n][e - 1];
      return h('div', { class: 'ep ' + (checked ? (checked[k] ? 'ok' : 'no') : '') },
        h('div', { class: 'ep-h' }, `e${k + 1}`), h('div', { class: 'ep-in', dir: 'ltr' }, Object.keys(v).map(n => `${n}=${v[n]}`).join(' ')),
        h('div', { class: 'segs' }, [0, 1].map(x => h('button', { class: 'seg', type: 'button', 'aria-pressed': String(g[k] === x), onclick: () => { g[k] = x; checked = null; render(); } }, 'Q=' + x))));
    }));
  }
  render();
}

/* ---------------- draw-the-waveform exercises (sheets) ---------------- */
// runs(n, v0, t1, t2, ...) -> array of n values starting at v0, flipping at each index t
const runs = (n, v0, ...t) => { const a = []; let v = v0, k = 0; for (let i = 0; i < n; i++) { while (k < t.length && t[k] === i) { v = 1 - v; k++; } a.push(v); } return a; };
const clkRuns = (n, f) => [...Array(n)].map((_, s) => f(s) ? 1 : 0);
const DX = {
  's1q1a': () => { const n = 44; return { slots: n, slotW: 18, edges: [8, 16, 24, 32, 40], edgeMarks: true,
    rows: [{ name: 'CK', vals: clkRuns(n, s => s % 8 >= 4), cls: 'clk' }, { name: 'J', vals: runs(n, 0, 2, 10, 21, 33), cls: 'in' }, { name: 'K', vals: runs(n, 0, 11, 14, 18, 26, 30, 31, 35), cls: 'in' }],
    targets: [{ name: 'Q', ans: runs(n, 0, 8, 24, 32, 40) }] }; },
  's1q1b': () => { const n = 44; return { slots: n, slotW: 18, edges: [4, 12, 20, 28, 36], edgeMarks: true,
    rows: [{ name: 'CK', vals: clkRuns(n, s => s % 8 >= 4), cls: 'clk' }, { name: 'J', vals: runs(n, 0, 2, 10, 21, 33), cls: 'in' }, { name: 'K', vals: runs(n, 0, 11, 14, 18, 26, 30, 31, 35), cls: 'in' }],
    targets: [{ name: 'Q', ans: runs(n, 0, 4, 12, 28, 36) }] }; },
  's1q2': () => { const n = 50, clk = runs(n, 0, 7, 20, 32, 44), x = runs(n, 0, 5, 10, 13, 17, 23, 28, 34, 38, 42);
    const qb = []; let held = 0; for (let s = 0; s < n; s++) { if (clk[s]) held = x[s]; qb.push(held); }
    return { slots: n, slotW: 16, edges: [20, 44], edgeMarks: true,
      rows: [{ name: 'clk', vals: clk, cls: 'clk' }, { name: 'x', vals: x, cls: 'in' }],
      targets: [{ name: 'QA', ans: runs(n, 0, 44) }, { name: 'QB', ans: qb, cls: 'out' }] }; },
  's1q6': () => { const n = 40; return { slots: n, slotW: 18, edges: [4, 10, 16, 22, 28, 34], edgeMarks: true,
    rows: [{ name: 'CLK', vals: runs(n, 0, 4, 6, 10, 12, 16, 18, 22, 24, 28, 30, 34, 36), cls: 'clk' }, { name: 'J', vals: runs(n, 0, 2, 8, 14, 20, 26, 32), cls: 'in' }, { name: 'K', vals: runs(n, 0, 2, 8, 14, 20, 26, 32), cls: 'in' },
      { name: 'PRE̅', vals: runs(n, 1, 14, 20), cls: 'mid' }, { name: 'CLR̅', vals: runs(n, 1, 26, 32), cls: 'mid' }],
    targets: [{ name: 'Q', ans: runs(n, 0, 4, 26) }] }; },
  's2q1': () => { const n = 17; return { slots: n, slotW: 30, edges: [1, 5, 9, 13], edgeMarks: true,
    rows: [{ name: 'CLK', vals: runs(n, 0, 1, 3, 5, 7, 9, 11, 13, 15), cls: 'clk' }],
    targets: [{ name: 'Q1', ans: runs(n, 0, 1, 9) }, { name: 'Q0', ans: runs(n, 0, 1, 5, 9, 13), cls: 'out' }] }; },
  's2q3': () => {
    const n = 74, x = runs(n, 0, 9, 26, 33, 65), edges = [8, 16, 24, 32, 40, 48, 56, 64, 72];
    const nx = { '00': ['00', '01'], '01': ['00', '10'], '10': ['00', '10'], '11': ['00', '10'] }, out = { '00': [0, 0], '01': [0, 0], '10': [0, 1], '11': [0, 1] };
    const st = []; let cur = '00'; for (let s = 0; s < n; s++) { if (edges.includes(s)) cur = nx[cur][x[s - 1]]; st.push(cur); }
    const z = st.map((q, s) => out[q][x[s]]);
    return { slots: n, slotW: 12, edges, edgeMarks: true,
      rows: [{ name: 'Clock', vals: clkRuns(n, s => s % 8 >= 4), cls: 'clk' }, { name: 'x', vals: x, cls: 'in' }],
      targets: [{ name: 'y1', ans: st.map(q => +q[0]) }, { name: 'y2', ans: st.map(q => +q[1]) }, { name: 'z', ans: z, cls: 'out' }],
      falseMarks: [{ from: 24, to: 26, row: 'z' }, { from: 64, to: 65, row: 'z' }] };
  }
};
function mountDraw(root, key) {
  const sp = DX[key]();
  const g = sp.targets.map(() => Array(sp.slots).fill(0));
  let wrong = null, reveal = false, fk = null;
  const box = h('div', { class: 'wavebox', dir: 'ltr' });
  const base = 'كل الإشارات اللي هترسمها بتبدأ 0. اضغط على أي خانة في صفها: الإشارة هتتقلب من الخانة دي لآخر الرسمة، يعني كل ضغطة = طلعة أو نزلة.';
  const msg = h('p', { class: 'readout', 'aria-live': 'polite' }, base);
  root.append(box, msg, h('div', { class: 'btnrow' },
    h('button', { class: 'btn primary', type: 'button', onclick: () => {
      wrong = []; sp.targets.forEach((t, ti) => t.ans.forEach((v, s) => { if (g[ti][s] !== v) wrong.push([ti, s]); }));
      const bad = new Set(wrong.map(w => w[0]));
      msg.innerHTML = !wrong.length ? '<b>رسمتك مظبوطة 100%.</b>' : `<b>فيه ${wrong.length} خانة غلط</b> (متظللة بالأحمر) في: ${[...bad].map(i => sp.targets[i].name).join('، ')}. ركّز على الـ edges المتعلّمة.`;
      render(); } }, 'صحّحلي'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { reveal = !reveal; render(); } }, 'اعرض/اخفي الحل'),
    h('button', { class: 'btn ghost', type: 'button', onclick: () => { g.forEach(a => a.fill(0)); wrong = null; msg.textContent = base; render(); } }, 'امسح')));
  function render() {
    const nF = sp.rows.length;
    const rows = [...sp.rows, ...sp.targets.map((t, i) => ({ name: t.name, vals: g[i], cls: t.cls || 'q', editable: true }))];
    if (reveal) sp.targets.forEach(t => rows.push({ name: t.name + ' ✓', vals: t.ans, cls: 'ans' }));
    const shade = (wrong || []).map(([ti, s]) => ({ from: s, to: s + 1, row: nF + ti, cls: 'bad' }));
    if (reveal && sp.falseMarks) sp.falseMarks.forEach(f => { const ti = sp.targets.findIndex(t => t.name === f.row); shade.push({ from: f.from, to: f.to, row: nF + sp.targets.length + ti, cls: 'dly' }); });
    box.replaceChildren(wave({ slots: sp.slots, slotW: sp.slotW, rowH: 38, nameW: 52, edges: sp.edges, edgeMarks: sp.edgeMarks, rows, shade,
      onCell: (ri, s) => { const ti = ri - nF; if (ti < 0 || ti >= sp.targets.length) return; fk = ri + '-' + s; for (let k = s; k < sp.slots; k++) g[ti][k] ^= 1; wrong = null; render(); } }));
    if (fk) { const t = box.querySelector(`[data-k="${fk}"]`); if (t) t.focus({ preventScroll: true }); }
  }
  render();
}

/* ---------------- walkthrough player ---------------- */
function mountWalk(root) {
  const steps = $$(':scope > .step', root); if (!steps.length) return;
  let i = 0, timer = null, all = false;
  const fill = h('i'); const bar = h('div', { class: 'walk-bar' }, fill);
  const count = h('div', { class: 'walk-count' });
  const prev = h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); go(i - 1); } }, '→ السابق');
  const next = h('button', { class: 'btn primary', type: 'button', onclick: () => { stop(); go(i + 1); } }, 'الخطوة الجاية ←');
  const play = h('button', { class: 'btn', type: 'button', onclick: () => toggle() }, '▶ تشغيل تلقائي');
  const allB = h('button', { class: 'btn ghost', type: 'button', onclick: () => { all = !all; stop(); upd(); } }, 'اعرض كل الخطوات');
  const dots = h('div', { class: 'walk-dots' }, steps.map((s, k) => h('button', { type: 'button', class: 'dot', 'aria-label': 'خطوة ' + (k + 1), onclick: () => { stop(); all = false; go(k); } }, k + 1)));
  root.prepend(h('div', { class: 'walk-head' }, count, dots, bar));
  root.append(h('div', { class: 'btnrow walk-foot' }, prev, next, play, allB));
  function upd() {
    steps.forEach((s, k) => { s.hidden = !all && k !== i; });
    count.innerHTML = all ? `<b>${steps.length} خطوات</b>` : `<b>خطوة ${i + 1} من ${steps.length}</b> · ${steps[i].dataset.title || ''}`;
    fill.style.width = all ? '100%' : ((i + 1) / steps.length * 100) + '%';
    $$('.dot', dots).forEach((d, k) => d.setAttribute('aria-current', String(!all && k === i)));
    prev.disabled = all || i === 0; next.disabled = all || i === steps.length - 1;
    play.hidden = all; allB.textContent = all ? 'رجّعها خطوة خطوة' : 'اعرض كل الخطوات';
  }
  function go(k) { i = Math.max(0, Math.min(steps.length - 1, k)); upd(); steps[i].classList.remove('enter'); void steps[i].offsetWidth; if (!RM) steps[i].classList.add('enter'); }
  function stop() { clearInterval(timer); timer = null; play.textContent = '▶ تشغيل تلقائي'; }
  function toggle() {
    if (timer) { stop(); return; }
    all = false; if (i === steps.length - 1) i = -1; go(i + 1); play.textContent = '❚❚ وقّف';
    timer = setInterval(() => { if (i >= steps.length - 1) { stop(); return; } go(i + 1); }, 7000);
  }
  upd();
}

/* ---------------- state machines ---------------- */
const M = {
  l2e1: { type: 'mealy', states: ['S0', 'S1', 'S2', 'S3'], codes: { S0: '00', S1: '01', S2: '11', S3: '10' }, bits: ['Q1', 'Q2'],
    next: { S0: ['S0', 'S1'], S1: ['S1', 'S2'], S2: ['S2', 'S0'], S3: ['S3', 'S1'] }, out: { S0: [0, 1], S1: [1, 0], S2: [0, 1], S3: [0, 1] },
    pos: { S0: [260, 75], S1: [410, 210], S2: [110, 210], S3: [410, 335] }, vb: [520, 400], start: 'S0', test: '10101' },
  l2e2: { type: 'moore', states: ['A', 'B', 'C', 'D'], codes: { A: '00', B: '01', C: '11', D: '10' }, bits: ['Q1', 'Q2'],
    next: { A: ['A', 'C'], B: ['A', 'C'], C: ['C', 'D'], D: ['D', 'B'] }, out: { A: 0, B: 1, C: 1, D: 0 },
    pos: { A: [260, 80], B: [110, 215], C: [410, 215], D: [260, 340] }, vb: [520, 410], start: 'A', test: '10101' },
  l2e3: { type: 'moore', states: ['S0', 'S1', 'S2', 'S3'], codes: { S0: '00', S1: '01', S2: '11', S3: '10' }, bits: ['A', 'B'],
    next: { S0: ['S3', 'S1'], S1: ['S0', 'S2'], S2: ['S1', 'S2'], S3: ['S2', 'S1'] }, out: { S0: 0, S1: 1, S2: 0, S3: 1 },
    pos: { S0: [260, 60], S1: [420, 200], S2: [260, 330], S3: [100, 200] }, vb: [520, 400], start: 'S0', test: '0110' },
  p1tree: { type: 'mealy', states: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    next: { A: ['B', 'C'], B: ['D', 'E'], C: ['F', 'G'], D: ['A', 'A'], E: ['A', 'A'], F: ['A', 'A'], G: ['A', 'A'] },
    out: { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 0], E: [0, 0], F: [0, 1], G: [0, 0] },
    pos: { A: [260, 40], B: [140, 125], C: [380, 125], D: [75, 215], E: [200, 215], F: [320, 215], G: [445, 215] }, vb: [520, 300], start: 'A', stubs: ['D', 'E', 'F', 'G'], test: '101011101',
    meaning: { A: 'بداية مجموعة جديدة', B: 'أول bit = 0', C: 'أول bit = 1', D: 'شفت 00', E: 'شفت 01', F: 'شفت 10، مستني 1', G: 'شفت 11' } },
  p1alt: { type: 'mealy', states: ['A', 'B', 'C', 'D', 'E'],
    next: { A: ['D', 'B'], B: ['C', 'E'], C: ['A', 'A'], D: ['E', 'E'], E: ['A', 'A'] }, out: { A: [0, 0], B: [0, 0], C: [0, 1], D: [0, 0], E: [0, 0] },
    pos: { A: [260, 50], B: [395, 150], C: [440, 290], D: [125, 150], E: [80, 290] }, vb: [520, 350], start: 'A', test: '0011111010111010100',
    meaning: { A: 'بداية مجموعة', B: 'شفت 1 (ماشي صح)', C: 'شفت 10 (ماشي صح)', D: 'أول bit غلط، فاضل 2', E: 'المجموعة باظت، فاضل 1' } },
  p2tree: { type: 'mealy', states: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P'], r: 17,
    next: { A: ['B', 'C'], B: ['D', 'E'], C: ['F', 'G'], D: ['H', 'I'], E: ['J', 'K'], F: ['L', 'M'], G: ['N', 'P'], H: ['A', 'A'], I: ['A', 'A'], J: ['A', 'A'], K: ['A', 'A'], L: ['A', 'A'], M: ['A', 'A'], N: ['A', 'A'], P: ['A', 'A'] },
    out: { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 0], E: [0, 0], F: [0, 0], G: [0, 0], H: [0, 0], I: [0, 0], J: [0, 0], K: [1, 0], L: [0, 1], M: [0, 0], N: [0, 0], P: [0, 0] },
    pos: { A: [400, 35], B: [200, 105], C: [600, 105], D: [100, 180], E: [300, 180], F: [500, 180], G: [700, 180], H: [50, 255], I: [150, 255], J: [250, 255], K: [350, 255], L: [450, 255], M: [550, 255], N: [650, 255], P: [750, 255] },
    vb: [800, 330], start: 'A', stubs: ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'P'], stubLen: 22, test: '0011100110110110100',
    meaning: { K: 'شفت 011، مستني 0', L: 'شفت 100، مستني 1' } },
  p2alt: { type: 'mealy', states: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    next: { A: ['B', 'E'], B: ['H', 'C'], C: ['I', 'D'], D: ['A', 'A'], E: ['F', 'H'], F: ['G', 'I'], G: ['A', 'A'], H: ['I', 'I'], I: ['A', 'A'] },
    out: { A: [0, 0], B: [0, 0], C: [0, 0], D: [1, 0], E: [0, 0], F: [0, 0], G: [0, 1], H: [0, 0], I: [0, 0] },
    pos: { A: [360, 40], E: [230, 115], B: [490, 115], F: [150, 200], H: [360, 200], C: [570, 200], G: [90, 285], I: [360, 290], D: [630, 285] }, vb: [720, 360], start: 'A', stubs: ['D', 'G', 'I'], test: '0011100110110110100',
    meaning: { A: 'بداية مجموعة', B: 'شفت 0', C: 'شفت 01', D: 'شفت 011، مستني 0', E: 'شفت 1', F: 'شفت 10', G: 'شفت 100، مستني 1', H: 'باظت بعد 2، فاضل 2', I: 'باظت، فاضل 1' } },
  p3: { type: 'mealy', states: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    next: { A: ['E', 'B'], B: ['C', 'F'], C: ['D', 'G'], D: ['A', 'A'], E: ['F', 'C'], F: ['G', 'G'], G: ['A', 'A'] }, out: { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 1], E: [0, 0], F: [0, 0], G: [0, 0] },
    pos: { A: [260, 40], E: [140, 120], B: [380, 120], F: [140, 220], C: [380, 220], G: [140, 320], D: [380, 320] }, vb: [520, 390], start: 'A', stubs: ['D', 'G'], test: '010110010001',
    meaning: { A: 'بداية مجموعة', B: 'شفت 1', C: 'شفت 10 أو 01', D: 'شفت 100 أو 010، مستني 1', E: 'شفت 0', F: 'باظت بعد 2', G: 'باظت، فاضل 1' } },
  p4mealy: { type: 'mealy', states: ['A', 'B', 'C'], next: { A: ['A', 'B'], B: ['C', 'B'], C: ['A', 'B'] }, out: { A: [0, 0], B: [0, 0], C: [0, 1] },
    pos: { A: [260, 70], B: [400, 250], C: [120, 250] }, vb: [520, 330], start: 'A', test: '00111010111010011',
    meaning: { A: 'مفيش حاجة مفيدة', B: 'آخر حاجة 1', C: 'آخر حاجتين 10' } },
  p4moore: { type: 'moore', states: ['A', 'B', 'C', 'D'], next: { A: ['A', 'B'], B: ['C', 'B'], C: ['A', 'D'], D: ['C', 'B'] }, out: { A: 0, B: 0, C: 0, D: 1 },
    pos: { A: [120, 90], B: [400, 90], C: [400, 275], D: [120, 275] }, vb: [520, 360], start: 'A', test: '00111010111010011',
    meaning: { A: 'مفيش حاجة مفيدة', B: 'آخر حاجة 1', C: 'آخر حاجتين 10', D: 'لسه لاقي 101 (Z=1)' } },
  p5mealy: { type: 'mealy', states: ['A', 'B', 'C', 'D'], next: { A: ['A', 'B'], B: ['A', 'C'], C: ['A', 'D'], D: ['A', 'D'] }, out: { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 1] },
    pos: { A: [110, 90], B: [210, 90], C: [310, 90], D: [410, 90] }, vb: [520, 260], start: 'A', bend: { 'A>B': -22, 'B>A': -22, 'C>A': -55, 'D>A': -85 }, test: '0111111011110',
    meaning: { A: 'آخر حاجة 0 أو لسه بادئين', B: 'آخرها 1', C: 'آخرها 11', D: 'آخرها 111 أو أكتر' } },
  p5moore: { type: 'moore', states: ['A', 'B', 'C', 'D', 'E'], next: { A: ['A', 'B'], B: ['A', 'C'], C: ['A', 'D'], D: ['A', 'E'], E: ['A', 'E'] }, out: { A: 0, B: 0, C: 0, D: 0, E: 1 },
    pos: { A: [95, 90], B: [185, 90], C: [275, 90], D: [365, 90], E: [455, 90] }, vb: [550, 290], start: 'A', bend: { 'A>B': -22, 'B>A': -22, 'C>A': -50, 'D>A': -75, 'E>A': -100 }, test: '0111111011110',
    meaning: { A: 'آخرها 0', B: 'آخرها 1', C: 'آخرها 11', D: 'آخرها 111', E: 'آخرها 1111 (Z=1)' } },
  p6: { type: 'mealy', states: ['A', 'B', 'C', 'D', 'E', 'F'], next: { A: ['B', 'D'], B: ['B', 'C'], C: ['E', 'D'], D: ['E', 'D'], E: ['F', 'C'], F: ['B', 'C'] },
    out: { A: [0, 0], B: [0, 0], C: [1, 0], D: [0, 0], E: [0, 0], F: [0, 1] },
    pos: { A: [260, 45], B: [115, 135], D: [405, 135], C: [115, 275], E: [405, 275], F: [260, 355] }, vb: [520, 420], start: 'A', test: '0010100100',
    meaning: { A: 'البداية', B: 'آخرها 0', C: 'آخرها 01', D: 'آخرها 1', E: 'آخرها 10', F: 'آخرها 100' } },
  p7: { type: 'moore', states: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], next: { A: ['B', 'E'], B: ['B', 'C'], C: ['D', 'E'], D: ['G', 'C'], E: ['F', 'E'], F: ['G', 'C'], G: ['B', 'H'], H: ['D', 'E'] },
    out: { A: 0, B: 0, C: 0, D: 1, E: 0, F: 0, G: 0, H: 1 },
    pos: { A: [260, 45], B: [130, 125], E: [390, 125], C: [130, 225], F: [390, 225], D: [130, 325], G: [390, 325], H: [260, 405] }, vb: [520, 470], start: 'A', bend: { 'H>E': 18 }, test: '0010100100',
    meaning: { A: 'البداية', B: 'آخرها 0', C: 'آخرها 01', D: 'لاقي 010 (Z=1)', E: 'آخرها 1', F: 'آخرها 10', G: 'آخرها 100', H: 'لاقي 1001 (Z=1)' } },
  p8: { type: 'moore', states: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], next: { A: ['B', 'E'], B: ['C', 'F'], C: ['D', 'G'], D: ['D', 'H'], E: ['F', 'E'], F: ['G', 'F'], G: ['H', 'G'], H: ['H', 'H'] },
    out: { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 1 },
    pos: { A: [260, 45], B: [130, 125], E: [390, 125], C: [130, 225], F: [390, 225], D: [130, 325], G: [390, 325], H: [260, 400] }, vb: [520, 470], start: 'A', loop: { D: 180, E: 0, F: 0, G: 0, H: 90 }, test: '0010110',
    meaning: { A: 'لسه مفيش', B: 'صفر واحد، مفيش 1', C: 'صفرين، مفيش 1', D: '3 أصفار، مستني 1', E: 'جه 1، مفيش أصفار', F: '1 وصفر واحد', G: '1 وصفرين', H: 'الشرط اتحقق: Z=1 على طول' } },
  p9: { type: 'moore', states: ['A', 'B', 'C', 'D', 'E', 'F'], next: { A: ['E', 'B'], B: ['C', 'A'], C: ['D', 'A'], D: ['D', 'F'], E: ['F', 'B'], F: ['F', 'D'] },
    out: { A: 0, B: 0, C: 0, D: 1, E: 0, F: 0 },
    pos: { A: [130, 65], B: [390, 65], E: [130, 200], C: [390, 200], F: [130, 335], D: [390, 335] }, vb: [520, 410], start: 'A', loop: { D: 90, F: 90 }, test: '1001101',
    meaning: { A: 'عدد الـ 1 زوجي', B: 'عدد الـ 1 فردي', E: 'زوجي + صفر واحد', C: 'فردي + صفر واحد', F: 'زوجي + شفنا 00', D: 'فردي + شفنا 00 (Z=1)' } },
  /* ---- sheets ---- */
  s2q4: { type: 'mealy', states: ['00', '01', '10', '11'], codes: { '00': '00', '01': '01', '10': '10', '11': '11' }, bits: ['Q1', 'Q2'],
    next: { '00': ['00', '01'], '01': ['01', '10'], '10': ['10', '00'], '11': ['11', '00'] }, out: { '00': [0, 1], '01': [1, 1], '10': [0, 1], '11': [1, 1] },
    pos: { '00': [110, 85], '01': [360, 85], '10': [360, 265], '11': [110, 265] }, vb: [470, 350], start: '01', test: '10011' },
  s2q6: { type: 'mealy', states: ['00', '01', '10', '11'], codes: { '00': '00', '01': '01', '10': '10', '11': '11' }, bits: ['Q1', 'Q2'],
    next: { '00': ['01', '10'], '01': ['00', '01'], '10': ['11', '00'], '11': ['10', '11'] }, out: { '00': [0, 1], '01': [0, 0], '10': [0, 1], '11': [0, 1] },
    pos: { '00': [110, 85], '01': [360, 85], '10': [110, 265], '11': [360, 265] }, vb: [470, 350], start: '00', test: '11010100' },
  s3q1: { type: 'mealy', states: ['00', '01', '10', '11'],
    next: { '00': ['00', '01'], '01': ['10', '11'], '10': ['00', '01'], '11': ['10', '11'] }, out: { '00': [0, 1], '01': [1, 0], '10': [1, 0], '11': [0, 0] },
    pos: { '00': [100, 90], '01': [360, 90], '11': [360, 280], '10': [100, 280] }, vb: [470, 370], start: '11', test: '1001010011',
    meaning: { '00': 'آخر bitين 00', '01': 'آخر bitين 01', '10': 'آخر bitين 10', '11': 'آخر bitين 11 (والبداية)' } },
  s3q2: { type: 'moore', states: ['S', 'E1', 'O1', 'E2', 'O2', 'E3', 'O3', 'ERR'], r: 25,
    next: { S: ['E1', 'O1'], E1: ['E2', 'O2'], O1: ['O2', 'E2'], E2: ['E3', 'O3'], O2: ['O3', 'E3'], E3: ['ERR', 'S'], O3: ['S', 'ERR'], ERR: ['E1', 'O1'] },
    out: { S: 0, E1: 0, O1: 0, E2: 0, O2: 0, E3: 0, O3: 0, ERR: 1 },
    pos: { S: [55, 200], E1: [165, 105], O1: [165, 295], E2: [285, 105], O2: [285, 295], E3: [405, 105], O3: [405, 295], ERR: [525, 200] }, vb: [600, 400], start: 'S',
    stubs: ['E3', 'O3'], stubDir: { E3: 'up' }, stubAll: ['ERR'], test: '101101101000',
    meaning: { S: 'أول chunk جديد (أو آخر chunk كان سليم)', E1: 'bit واحد، عدد الـ 1 زوجي', O1: 'bit واحد، فردي', E2: '2 bits، زوجي', O2: '2 bits، فردي', E3: '3 bits، زوجي', O3: '3 bits، فردي', ERR: 'الـ chunk خلص وعدد الـ 1 زوجي ← error' } },
  s3q3: { type: 'moore', states: ['R', 'A', 'B', 'C', 'D'],
    next: { R: ['A', 'B'], A: ['A', 'D'], B: ['C', 'B'], C: ['A', 'D'], D: ['C', 'B'] }, out: { R: 0, A: 0, B: 0, C: 1, D: 1 },
    pos: { R: [260, 50], A: [100, 165], B: [420, 165], C: [100, 330], D: [420, 330] }, vb: [520, 410], start: 'R', test: '0011101001',
    meaning: { R: 'reset، لسه مفيش bit', A: 'آخرها 0 ومفيش تغيير', B: 'آخرها 1 ومفيش تغيير', C: 'لسه متغير لـ 0 (z=1)', D: 'لسه متغير لـ 1 (z=1)' } },
  s3q4: { type: 'mealy', states: ['A', 'B', 'C'], next: { A: ['B', 'C'], B: ['B', 'C'], C: ['B', 'C'] }, out: { A: [0, 0], B: [1, 0], C: [0, 1] },
    pos: { A: [260, 60], B: [120, 240], C: [400, 240] }, vb: [520, 330], start: 'A', test: '0011100110',
    meaning: { A: 'reset، لسه مفيش bit', B: 'آخر w كان 0', C: 'آخر w كان 1' } },
  s3q5: { type: 'moore', states: ['A', 'B', 'C', 'D', 'E'], next: { A: ['B', 'C'], B: ['D', 'C'], C: ['B', 'E'], D: ['D', 'C'], E: ['B', 'E'] }, out: { A: 0, B: 0, C: 0, D: 1, E: 1 },
    pos: { A: [260, 50], B: [120, 175], C: [400, 175], D: [120, 330], E: [400, 330] }, vb: [520, 410], start: 'A', test: '0011100110',
    meaning: { A: 'reset', B: 'آخرها 0 (مرة واحدة)', C: 'آخرها 1 (مرة واحدة)', D: 'آخرها 00 (z=1)', E: 'آخرها 11 (z=1)' } },
  s3q6: { type: 'mealy', sym: ['a', 'b'], states: ['A', 'B', 'C'], next: { A: ['B', 'C'], B: ['B', 'C'], C: ['B', 'C'] }, out: { A: [0, 0], B: [1, 0], C: [0, 1] },
    pos: { A: [260, 60], B: [120, 240], C: [400, 240] }, vb: [520, 330], start: 'A', test: 'aababbba',
    meaning: { A: 'لسه مفيش حرف', B: 'آخر حرف a', C: 'آخر حرف b' } }
};

function fsmGraph(m, gid) {
  const [W, H] = m.vb, r = m.r || 23, P = m.pos;
  const g = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fsm-graph', role: 'img', 'aria-label': 'state graph', style: `max-width:${W}px` });
  const defs = sv('defs');
  ['n', 'hot'].forEach(k => defs.append(sv('marker', { id: `${gid}-${k}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, sv('path', { d: 'M0 0 L10 5 L0 10 z', class: 'arrow-' + k }))));
  g.append(defs);
  const xs = m.states.map(s => P[s][0]), ys = m.states.map(s => P[s][1]);
  const cx = xs.reduce((a, b) => a + b) / xs.length, cy = ys.reduce((a, b) => a + b) / ys.length;
  const edges = {};
  m.states.forEach(s => [0, 1].forEach(x => { const t = m.next[s][x], k = s + '>' + t; (edges[k] = edges[k] || { from: s, to: t, items: [] }).items.push(x); }));
  const S = x => m.sym ? m.sym[x] : x;
  const lab = e => {
    if (m.type === 'mealy') {
      const zs = e.items.map(x => m.out[e.from][x]);
      if (e.items.length === 2 && zs[0] === zs[1]) return `${S(0)},${S(1)}/${zs[0]}`;
      return e.items.map(x => `${S(x)}/${m.out[e.from][x]}`).join(' , ');
    }
    return e.items.map(S).join(',');
  };
  const gE = sv('g'), gL = sv('g'), gN = sv('g'); const eEls = {}, nEls = {};
  const stubGeo = (from, text) => {
    const [x1, y1] = P[from], L = m.stubLen || 28, up = m.stubDir && m.stubDir[from] === 'up';
    return up ? { d: `M${x1} ${y1 - r} L${x1} ${y1 - r - L}`, lx: x1, ly: y1 - r - L - 6, text }
      : { d: `M${x1} ${y1 + r} L${x1} ${y1 + r + L}`, lx: x1, ly: y1 + r + L + 13, text };
  };
  const stubAllTxt = {};
  for (const k in edges) {
    const e = edges[k], [x1, y1] = P[e.from], [x2, y2] = P[e.to];
    if (m.stubAll && m.stubAll.includes(e.from)) { (stubAllTxt[e.from] = stubAllTxt[e.from] || []).push(k); continue; }
    let d, lx, ly, text = lab(e), anchor = 'middle';
    const stub = m.stubs && m.stubs.includes(e.from) && e.to === m.start;
    if (stub) {
      ({ d, lx, ly, text } = stubGeo(e.from, text + ' → ' + e.to));
    } else if (e.from === e.to) {
      let a = m.loop && m.loop[e.from] != null ? m.loop[e.from] * Math.PI / 180 : Math.atan2(y1 - cy, x1 - cx);
      if (!(m.loop && m.loop[e.from] != null) && Math.hypot(x1 - cx, y1 - cy) < 5) a = -Math.PI / 2;
      const p = (ang, rad) => [x1 + rad * Math.cos(ang), y1 + rad * Math.sin(ang)];
      const [ax, ay] = p(a - 0.5, r), [bx, by] = p(a + 0.5, r), [c1x, c1y] = p(a - 0.8, r + 46), [c2x, c2y] = p(a + 0.8, r + 46);
      d = `M${ax} ${ay} C${c1x} ${c1y} ${c2x} ${c2y} ${bx} ${by}`;
      [lx, ly] = p(a, r + 50); ly += 4;
      const ca = Math.cos(a); if (ca > 0.45) anchor = 'start'; else if (ca < -0.45) anchor = 'end';
    } else {
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      const rev = edges[e.to + '>' + e.from];
      const b = m.bend && m.bend[k] != null ? m.bend[k] : (rev ? 20 : 0);
      const mx = (x1 + x2) / 2 + nx * b * 2, my = (y1 + y2) / 2 + ny * b * 2;
      const u = (ax, ay, bx, by) => { const l = Math.hypot(bx - ax, by - ay); return [(bx - ax) / l, (by - ay) / l]; };
      const [u1x, u1y] = u(x1, y1, mx, my), [u2x, u2y] = u(x2, y2, mx, my);
      const sx = x1 + u1x * r, sy = y1 + u1y * r, ex = x2 + u2x * (r + 1), ey = y2 + u2y * (r + 1);
      d = `M${sx} ${sy} Q${mx} ${my} ${ex} ${ey}`;
      const qx = .25 * sx + .5 * mx + .25 * ex, qy = .25 * sy + .5 * my + .25 * ey, off = b >= 0 ? 11 : -11;
      lx = qx + nx * off; ly = qy + ny * off + 4;
    }
    const path = sv('path', { d, class: 'edge', 'marker-end': `url(#${gid}-n)` });
    const t = sv('text', { x: lx, y: ly, class: 'elab', 'text-anchor': anchor }, text);
    gE.append(path); gL.append(t); eEls[k] = { path, t };
  }
  for (const from in stubAllTxt) {
    const ks = stubAllTxt[from];
    const geo = stubGeo(from, ks.map(k => `${lab(edges[k])}→${edges[k].to}`).join('  '));
    const path = sv('path', { d: geo.d, class: 'edge', 'marker-end': `url(#${gid}-n)` });
    const t = sv('text', { x: geo.lx, y: geo.ly, class: 'elab', 'text-anchor': 'middle' }, geo.text);
    gE.append(path); gL.append(t); ks.forEach(k => { eEls[k] = { path, t }; });
  }
  m.states.forEach(s => {
    const [x, y] = P[s];
    const grp = sv('g', { class: 'node' + (s === m.start ? ' start' : '') });
    grp.append(sv('circle', { cx: x, cy: y, r }));
    if (s === m.start) grp.append(sv('circle', { cx: x, cy: y, r: r - 4, class: 'ring' }));
    const label = m.type === 'moore' ? `${s}/${m.out[s]}` : s;
    grp.append(sv('text', { x, y: y + 5, 'text-anchor': 'middle', class: 'nlab' + (label.length > 3 ? ' sm' : '') }, label));
    gN.append(grp); nEls[s] = grp;
  });
  g.append(gE, gN, gL);
  return { svg: g, eEls, nEls, gid };
}

function mountFSM(root, key) {
  const m = M[key]; if (!m) return;
  const gid = nid('fsm'), G = fsmGraph(m, gid), mealy = m.type === 'mealy';
  // state table
  const nsCell = {}, zCell = {}, rowEl = {};
  const thead = h('thead', null,
    h('tr', null, h('th', { rowspan: 2 }, 'P.S.'), m.codes ? h('th', { rowspan: 2 }, m.bits.join('')) : null, h('th', { colspan: 2 }, 'N.S.'), mealy ? h('th', { colspan: 2 }, 'Z') : h('th', { rowspan: 2 }, 'Z')),
    h('tr', null, h('th', null, 'X=0'), h('th', null, 'X=1'), mealy ? [h('th', null, 'X=0'), h('th', null, 'X=1')] : null));
  const tbody = h('tbody', null, m.states.map(s => {
    const n0 = h('td', null, m.next[s][0]), n1 = h('td', null, m.next[s][1]);
    nsCell[s] = [n0, n1];
    let zc;
    if (mealy) { const z0 = h('td', { class: 'res' }, m.out[s][0]), z1 = h('td', { class: 'res' }, m.out[s][1]); zCell[s] = [z0, z1]; zc = [z0, z1]; }
    else { const z = h('td', { class: 'res' }, m.out[s]); zCell[s] = [z, z]; zc = [z]; }
    const tr = h('tr', null, h('th', null, s), m.codes ? h('td', { class: 'code' }, m.codes[s]) : null, n0, n1, zc);
    rowEl[s] = tr; return tr;
  }));
  const table = h('table', { class: 'tbl stt', dir: 'ltr' }, thead, tbody);
  const inp = h('input', { id: gid + '-in', class: 'seqin', type: 'text', inputmode: 'numeric', value: m.test || '', 'aria-label': 'input sequence', dir: 'ltr', spellcheck: 'false', autocomplete: 'off' });
  const stepB = h('button', { class: 'btn primary', type: 'button', onclick: () => { stop(); step(); } }, 'خطوة (نبضة clock)');
  const playB = h('button', { class: 'btn', type: 'button', onclick: () => toggle() }, '▶ شغّل الـ sequence');
  const resB = h('button', { class: 'btn ghost', type: 'button', onclick: () => { stop(); reset(); } }, 'من الأول');
  const read = h('p', { class: 'readout', 'aria-live': 'polite' });
  const traceBox = h('div', { class: 'scrollx' });
  const meanBox = m.meaning ? h('dl', { class: 'meaning' }, m.states.filter(s => m.meaning[s]).map(s => h('div', { 'data-s': s }, h('dt', null, s), h('dd', null, m.meaning[s])))) : null;
  root.append(
    h('div', { class: 'fsm-top' + (m.vb[0] > 540 ? ' wide' : '') }, h('div', { class: 'fsm-g' }, G.svg), h('div', { class: 'fsm-t' }, h('div', { class: 'scrollx' }, table), meanBox)),
    h('div', { class: 'fsm-ctl' }, h('label', { for: gid + '-in', class: 'ctl-l' }, 'الـ input sequence (X)'), inp, h('div', { class: 'btnrow' }, stepB, playB, resB)),
    read, traceBox);
  let cur = m.start, t = 0, trace = [], timer = null;
  const SY = x => m.sym ? m.sym[x] : x;
  const seq = () => inp.value.split('').map(ch => m.sym ? m.sym.indexOf(ch.toLowerCase()) : (ch === '0' ? 0 : ch === '1' ? 1 : -1)).filter(v => v >= 0);
  inp.addEventListener('input', () => { stop(); reset(); });
  function clearHot() {
    Object.values(G.eEls).forEach(e => { e.path.classList.remove('hot'); e.path.setAttribute('marker-end', `url(#${gid}-n)`); e.t.classList.remove('hot'); });
    Object.values(G.nEls).forEach(n => n.classList.remove('cur'));
    $$('td.hot, tr.cur', table).forEach(x => x.classList.remove('hot', 'cur'));
    if (meanBox) $$('[data-s]', meanBox).forEach(x => x.classList.remove('cur'));
  }
  function mark(ps, x) {
    clearHot();
    G.nEls[cur].classList.add('cur');
    if (meanBox) { const md = meanBox.querySelector(`[data-s="${cur}"]`); if (md) md.classList.add('cur'); }
    if (ps != null) {
      const e = G.eEls[ps + '>' + m.next[ps][x]];
      if (e) { e.path.classList.add('hot'); e.path.setAttribute('marker-end', `url(#${gid}-hot)`); e.t.classList.add('hot'); }
      rowEl[ps].classList.add('cur'); nsCell[ps][x].classList.add('hot'); zCell[ps][x].classList.add('hot');
    } else rowEl[cur].classList.add('cur');
  }
  function drawTrace() {
    const s = seq();
    if (!trace.length) { traceBox.replaceChildren(); return; }
    const cols = trace.length;
    const row = (lab, f, cls) => h('tr', null, h('th', null, lab), [...Array(cols)].map((_, i) => h('td', { class: cls ? cls(i) : '' }, f(i))), !mealy && lab === 'الحالة' ? h('td', { class: 'fin' }, cur) : (!mealy ? h('td', { class: 'fin' }, lab === 'Z' ? m.out[cur] : '') : null));
    traceBox.replaceChildren(h('table', { class: 'tbl trace', dir: 'ltr' }, h('tbody', null,
      row('t', i => 't' + i), row('X', i => SY(trace[i].x)), row('الحالة', i => trace[i].ps), row('Z', i => trace[i].z, i => trace[i].z ? 'one' : ''))));
    void s;
  }
  function step() {
    const s = seq();
    if (t >= s.length) { read.innerHTML = s.length ? '<b>الـ sequence خلصت.</b> اضغط «من الأول» أو اكتب sequence جديدة.' : 'اكتب sequence من 0 و 1 الأول.'; return; }
    const x = s[t], ps = cur, n = m.next[ps][x], z = mealy ? m.out[ps][x] : m.out[ps];
    trace.push({ x, ps, z }); cur = n; t++;
    mark(ps, x);
    const mean = s => m.meaning && m.meaning[s] ? ` <span class="muted">(${m.meaning[s]})</span>` : '';
    read.innerHTML = mealy
      ? `<b>t${t - 1}:</b> كنا في <b>${ps}</b>${mean(ps)}، جه X=${SY(x)} ← الخرج <b>Z=${z}</b> على السهم، ورحنا <b>${n}</b>${mean(n)}.`
      : `<b>t${t - 1}:</b> كنا في <b>${ps}/${m.out[ps]}</b> فالخرج وقتها Z=${m.out[ps]}. جه X=${SY(x)} ← رحنا <b>${n}</b>${mean(n)}، والخرج الجديد Z=${m.out[n]} هيظهر في الفترة الجاية.`;
    drawTrace();
  }
  function reset() { cur = m.start; t = 0; trace = []; mark(null); drawTrace(); read.innerHTML = `إحنا في حالة البداية <b>${m.start}</b>. اضغط «خطوة» وكل ضغطة = نبضة clock واحدة بتقرا bit واحد من X.`; }
  function stop() { clearInterval(timer); timer = null; playB.textContent = '▶ شغّل الـ sequence'; }
  function toggle() {
    if (timer) { stop(); return; }
    if (t >= seq().length) reset();
    playB.textContent = '❚❚ وقّف'; step();
    timer = setInterval(() => { if (t >= seq().length) { stop(); return; } step(); }, RM ? 1600 : 1000);
  }
  reset();
}

/* ---------------- FSM timing chart with false outputs ---------------- */
function mountFsmTiming(root, key) {
  const m = M[key]; const id = nid('ft');
  const inp = h('input', { id, class: 'seqin', type: 'text', value: m.test, dir: 'ltr', inputmode: 'numeric', 'aria-label': 'input sequence', autocomplete: 'off' });
  const box = h('div', { class: 'wavebox', dir: 'ltr' }); const note = h('p', { class: 'readout' });
  root.append(h('div', { class: 'fsm-ctl' }, h('label', { for: id, class: 'ctl-l' }, 'X'), inp), box, note);
  function render() {
    const bits = (inp.value.match(/[01]/g) || []).map(Number).slice(0, 10); const n = bits.length;
    if (!n) { box.replaceChildren(); note.textContent = 'اكتب sequence.'; return; }
    const slots = 4 * n + 2, S = [m.start];
    for (let k = 0; k < n; k++) S.push(m.next[S[k]][bits[k]]);
    const X = [...Array(slots)].map((_, s) => bits[Math.min(n - 1, s === 0 ? 0 : Math.floor((s - 1) / 4))]);
    const st = [...Array(slots)].map((_, s) => S[Math.min(n, Math.floor(s / 4))]);
    const ck = [...Array(slots)].map((_, s) => (s % 4 === 2 || s % 4 === 3) ? 1 : 0);
    const Z = st.map((q, s) => m.type === 'mealy' ? m.out[q][X[s]] : m.out[q]);
    const edges = [...Array(n)].map((_, k) => 4 * k + 4);
    const shade = []; let glitches = 0;
    if (m.type === 'mealy') for (let k = 1; k <= n - 1; k++) { const s = 4 * k; if (Z[s] !== Z[s + 1] && Z[s] !== Z[s - 1]) { shade.push({ from: s, to: s + 1, row: 2 + m.bits.length, cls: 'bad' }); glitches++; } }
    const rows = [{ name: 'CK', vals: ck, cls: 'clk' }, { name: 'X', vals: X, cls: 'in' }, ...m.bits.map((b, i) => ({ name: b, vals: st.map(q => +m.codes[q][i]), cls: 'q' })), { name: 'Z', vals: Z, cls: 'out' }];
    box.replaceChildren(wave({ slots, slotW: 18, rowH: 38, nameW: 40, edges, edgeMarks: true, rows, shade }));
    note.innerHTML = m.type === 'mealy'
      ? (glitches ? `فيه <b>${glitches}</b> false output (الحتت الحمرا): الـ state اتغيرت مع الـ edge، بس X لسه ما اتغيرش، فالـ Z اتحسب من state جديدة و X قديم.` : 'مفيش false output ظاهر (spike) في الـ sequence دي. ممكن الخرج يتأخر شوية في النزول أو الطلوع بعد الـ edge، بس مفيش نبضة غلط لوحدها.')
      : 'في Moore الـ Z بيتغير مع الـ state بس (عند الـ edges)، فمفيش false outputs خالص مهما X اتغير.';
  }
  inp.addEventListener('input', render); render();
}

/* ---------------- counter / equation machines ---------------- */
const CNT = {
  l2e4: { bits: ['A', 'B', 'C'], ff: 'T', x: true, init: '000', pairs: [['TA'], ['TB'], ['TC']],
    f: (q, x) => ({ TA: q.B & (x | q.C), TB: x | q.C, TC: 1 - x }), eqs: ['TA = B(x + C)', 'TB = x + C', 'TC = x̄'] },
  l3e1: { bits: ['Q1', 'Q2', 'Q3'], ff: 'JK', x: false, init: '000', pairs: [['J1', 'K1'], ['J2', 'K2'], ['J3', 'K3']],
    f: q => ({ J1: 1 - q.Q2, K1: q.Q3, J2: q.Q1, K2: (1 - q.Q1) & q.Q3, J3: q.Q1 | q.Q2, K3: 1 }), eqs: ['J1 = Q̄2', 'K1 = Q3', 'J2 = Q1', 'K2 = Q̄1·Q3', 'J3 = Q1 + Q2', 'K3 = 1'] },
  l3e2: { bits: ['Q1', 'Q2', 'Q3'], ff: 'T', x: true, init: '000', pairs: [['T1'], ['T2'], ['T3']],
    f: (q, x) => ({ T1: ((1 - x) & (1 - q.Q2) & (1 - q.Q3)) | (x & q.Q2 & q.Q3), T2: ((1 - x) & (1 - q.Q3)) | (x & q.Q3), T3: 1 }), eqs: ['T1 = X̄Q̄2Q̄3 + XQ2Q3', 'T2 = X̄Q̄3 + XQ3', 'T3 = 1'] },
  l3e3: { bits: ['A', 'B', 'C', 'D'], ff: 'JK', x: false, init: '0101', digits: true, pairs: [['JA', 'KA'], ['JB', 'KB'], ['JC', 'KC'], ['JD', 'KD']],
    f: q => ({ JA: q.B & (q.C | q.D), KA: 0, JB: q.C | q.D, KB: q.C | q.D, JC: 1 - q.D, KC: 1 - q.D, JD: 1, KD: 1 }), eqs: ['JA = B(C + D)', 'KA = 0', 'JB = KB = C + D', 'JC = KC = D̄', 'JD = KD = 1'] },
  s2q1: { bits: ['Q1', 'Q0'], ff: 'D', x: false, init: '00', pairs: [['D1'], ['D0']],
    f: q => ({ D1: (1 - q.Q0) ^ q.Q1, D0: 1 - q.Q0 }), eqs: ['D1 = Q̄0 ⊕ Q1', 'D0 = Q̄0'] },
  s2q2: { bits: ['A', 'B'], ff: 'D', x: true, init: '00', pairs: [['DA'], ['DB']],
    f: (q, x) => ({ DA: (q.A & (1 - x)) | (q.B & x), DB: (q.B & (1 - x)) | ((1 - q.A) & x) }), eqs: ['DA = A·x̄ + B·x', 'DB = B·x̄ + Ā·x'] },
  s2q5: { bits: ['A', 'B', 'C'], ffs: ['T', 'JK', 'T'], x: true, init: '000', pairs: [['TA'], ['JB', 'KB'], ['TC']],
    f: (q, x) => ({ TA: ((1 - x) & (q.B | q.C)) | (x & (1 - q.B)), JB: ((1 - x) & (1 - q.C)) | (x & q.A), KB: x | (1 - q.C), TC: 1 - x }),
    eqs: ['TA = X̄B + X̄C + XB̄', 'JB = X̄C̄ + XA', 'KB = X + C̄', 'TC = X̄'] }
};
function mountCounter(root, key) {
  const c = CNT[key]; let q = c.init.split('').map(Number), x = 1, hist = [];
  const bitsBox = h('div', { class: 'cbits', dir: 'ltr' });
  const xBox = c.x ? h('div', { class: 'ctl' }, h('span', { class: 'ctl-l' }, 'الدخل X'), h('div', { class: 'segs' }, [0, 1].map(v => h('button', { class: 'seg xseg', type: 'button', onclick: () => { x = v; render(); } }, 'X = ' + v)))) : null;
  const digBox = c.digits ? h('div', { class: 'ctl' }, h('span', { class: 'ctl-l' }, 'اختار رقم BCD'), h('div', { class: 'segs wrap' }, [...Array(10)].map((_, d) => h('button', { class: 'seg dseg', type: 'button', onclick: () => { q = d.toString(2).padStart(4, '0').split('').map(Number); hist = []; render(); } }, d)))) : null;
  const tbl = h('div', { class: 'scrollx' });
  const clk = h('button', { class: 'btn primary', type: 'button', onclick: () => { hist.push(q.join('')); q = nextQ(); render(); } }, c.digits ? 'نبضة Convert ↓' : 'نبضة Clock ↓');
  const rst = h('button', { class: 'btn ghost', type: 'button', onclick: () => { q = c.init.split('').map(Number); hist = []; render(); } }, 'رجّع للبداية');
  const histBox = h('div', { class: 'hist', dir: 'ltr' });
  root.append(h('div', { class: 'ctlrow' }, h('div', { class: 'ctl' }, h('span', { class: 'ctl-l' }, 'الحالة الحالية (اضغط على أي bit تغيّره)'), bitsBox), xBox, digBox),
    h('div', { class: 'eqline', dir: 'ltr' }, c.eqs.join('    ·    ')), tbl, h('div', { class: 'btnrow' }, clk, rst), histBox);
  const obj = () => { const o = {}; c.bits.forEach((b, i) => o[b] = q[i]); return o; };
  function nextQ() {
    const v = c.f(obj(), x);
    return q.map((b, i) => { const p = c.pairs[i], ty = c.ffs ? c.ffs[i] : c.ff; if (ty === 'T') return b ^ v[p[0]]; if (ty === 'D') return v[p[0]]; const J = v[p[0]], K = v[p[1]]; return (J & (1 - b)) | ((1 - K) & b); });
  }
  const dec = arr => parseInt(arr.join(''), 2);
  function render() {
    bitsBox.replaceChildren(...c.bits.map((b, i) => h('button', { class: 'bit', type: 'button', 'aria-pressed': String(!!q[i]), onclick: () => { q[i] ^= 1; hist = []; render(); } }, h('span', { class: 'bit-n' }, b), h('span', { class: 'bit-v' }, q[i]))));
    if (xBox) $$('.xseg', xBox).forEach((b, i) => b.setAttribute('aria-pressed', String(x === i)));
    if (digBox) $$('.dseg', digBox).forEach((b, i) => b.setAttribute('aria-pressed', String(dec(q) === i)));
    const v = c.f(obj(), x), nq = nextQ();
    tbl.replaceChildren(h('table', { class: 'tbl', dir: 'ltr' },
      h('thead', null, h('tr', null, h('th', null, 'bit'), h('th', null, 'Q'), h('th', null, 'FF inputs'), h('th', null, 'action'), h('th', { class: 'res' }, 'Q⁺'))),
      h('tbody', null, c.bits.map((b, i) => {
        const p = c.pairs[i]; const ins = p.map(n => `${n}=${v[n]}`).join('  ');
        let act; const ty = c.ffs ? c.ffs[i] : c.ff;
        if (ty === 'D') act = 'load ' + v[p[0]];
        else if (ty === 'T') act = v[p[0]] ? 'toggle' : 'hold';
        else { const J = v[p[0]], K = v[p[1]]; act = J && K ? 'toggle' : J ? 'set' : K ? 'reset' : 'hold'; }
        return h('tr', { class: q[i] !== nq[i] ? 'chg' : '' }, h('th', null, b), h('td', null, q[i]), h('td', null, ins), h('td', null, act), h('td', { class: 'res' }, nq[i]));
      }))));
    const all = [...hist, q.join('')];
    const parts = all.flatMap((s, i) => [i ? h('span', { class: 'arr' }, '→') : null, h('span', { class: 'hs' + (i === all.length - 1 ? ' now' : '') }, s, h('small', null, ' (' + parseInt(s, 2) + ')'))]).filter(Boolean);
    histBox.replaceChildren(h('span', { class: 'ctl-l' }, 'المسار: '), ...parts, h('span', { class: 'arr' }, '→'), h('span', { class: 'hs next', title: 'الحالة الجاية' }, nq.join(''), h('small', null, ' (' + dec(nq) + ')')));
  }
  render();
}

/* ---------------- K-maps ---------------- */
const G2 = ['00', '01', '11', '10'];
function kmap(spec) {
  const wrap = h('div', { class: 'kmap' });
  const cellEls = {};
  const head = h('tr', null, h('th', { class: 'corner', dir: 'ltr', html: `<span class="kn">${spec.name}</span><span class="kr">${spec.rl}</span><span class="kc">${spec.cl}</span>` }), spec.cols.map(cv => h('th', null, cv)));
  const body = spec.rows.map(rv => h('tr', null, h('th', null, rv), spec.cols.map(cv => {
    const key = rv + cv, v = spec.val(key);
    const td = h('td', { class: 'v' + v }, v === '0' ? '0' : v); cellEls[key] = td; return td;
  })));
  const table = h('table', { class: 'ktbl', dir: 'ltr' }, h('thead', null, head), h('tbody', null, body));
  const groups = spec.groups || [];
  const rings = {};
  groups.forEach((g, gi) => g.cells.forEach(k => (rings[k] = rings[k] || []).push(gi % 4)));
  for (const k in rings) cellEls[k].style.boxShadow = rings[k].map((c, j) => `inset 0 0 0 ${2 + j * 3}px var(--g${c})`).join(',');
  const chips = h('div', { class: 'kterms', dir: 'ltr' }, groups.length ? groups.map((g, gi) => {
    const b = h('button', { class: 'kchip', type: 'button', style: `--c:var(--g${gi % 4})`, html: g.t });
    const on = v => { wrap.classList.toggle('focus', v); g.cells.forEach(k => cellEls[k].classList.toggle('on', v)); };
    b.addEventListener('mouseenter', () => on(true)); b.addEventListener('mouseleave', () => on(false));
    b.addEventListener('focus', () => on(true)); b.addEventListener('blur', () => on(false));
    return b;
  }) : h('span', { class: 'kchip none' }, 'مفيش 1 خالص'));
  wrap.append(table, chips, h('div', { class: 'keq', dir: 'ltr', html: spec.eq }));
  return wrap;
}
function jkVal(q, nq, which) { if (which === 'J') return q === 0 ? String(nq) : 'X'; return q === 1 ? String(1 - nq) : 'X'; }
const KM = {
  l3e1: () => {
    const nx = { '000': '100', '100': '111', '111': '010', '010': '011', '011': '000' };
    const mk = (n, which, b, eq, groups) => ({ name: which + n, rl: 'Q1', cl: 'Q2Q3', rows: ['0', '1'], cols: G2, eq, groups,
      val: k => nx[k] ? jkVal(+k[b], +nx[k][b], which) : 'X' });
    return [
      mk(1, 'J', 0, 'J1 = <span class="ov">Q2</span>', [{ t: '<span class="ov">Q2</span>', cells: ['000', '001', '100', '101'] }]),
      mk(1, 'K', 0, 'K1 = Q3', [{ t: 'Q3', cells: ['001', '011', '101', '111'] }]),
      mk(2, 'J', 1, 'J2 = Q1 <small>(السلايد كاتبها Q3 بالغلط)</small>', [{ t: 'Q1', cells: ['100', '101', '111', '110'] }]),
      mk(2, 'K', 1, 'K2 = <span class="ov">Q1</span>·Q3', [{ t: '<span class="ov">Q1</span>Q3', cells: ['001', '011'] }]),
      mk(3, 'J', 2, 'J3 = Q1 + Q2', [{ t: 'Q1', cells: ['100', '101', '111', '110'] }, { t: 'Q2', cells: ['010', '011', '111', '110'] }]),
      mk(3, 'K', 2, 'K3 = 1', [{ t: '1', cells: ['000', '001', '011', '010', '100', '101', '111', '110'] }])];
  },
  l3e2: () => {
    const val = b => k => { const x = +k[0], s = parseInt(k.slice(1), 2), n = x ? (s + 1) % 8 : (s + 7) % 8; return String(((s >> (2 - b)) & 1) ^ ((n >> (2 - b)) & 1)); };
    return [
      { name: 'T1', rl: 'XQ1', cl: 'Q2Q3', rows: G2, cols: G2, val: val(0), eq: 'T1 = <span class="ov">X</span>·<span class="ov">Q2</span>·<span class="ov">Q3</span> + X·Q2·Q3',
        groups: [{ t: '<span class="ov">X</span><span class="ov">Q2</span><span class="ov">Q3</span>', cells: ['0000', '0100'] }, { t: 'XQ2Q3', cells: ['1011', '1111'] }] },
      { name: 'T2', rl: 'XQ1', cl: 'Q2Q3', rows: G2, cols: G2, val: val(1), eq: 'T2 = <span class="ov">X</span>·<span class="ov">Q3</span> + X·Q3',
        groups: [{ t: '<span class="ov">X</span><span class="ov">Q3</span>', cells: ['0000', '0010', '0100', '0110'] }, { t: 'XQ3', cells: ['1101', '1111', '1001', '1011'] }] }];
  },
  l3e3: () => {
    const val = (b, which) => k => { const n = parseInt(k, 2); if (n > 9) return 'X'; const nn = n + 3; return jkVal((n >> (3 - b)) & 1, (nn >> (3 - b)) & 1, which); };
    const rowsAll = cs => G2.flatMap(r => cs.map(c => r + c));
    const base = { rl: 'AB', cl: 'CD', rows: G2, cols: G2 };
    return [
      { ...base, name: 'JA', val: val(0, 'J'), eq: 'JA = BC + BD = B(C + D)', groups: [{ t: 'BC', cells: ['0111', '0110', '1111', '1110'] }, { t: 'BD', cells: ['0101', '0111', '1101', '1111'] }] },
      { ...base, name: 'KA', val: val(0, 'K'), eq: 'KA = 0', groups: [] },
      { ...base, name: 'JB', val: val(1, 'J'), eq: 'JB = C + D', groups: [{ t: 'C', cells: rowsAll(['11', '10']) }, { t: 'D', cells: rowsAll(['01', '11']) }] },
      { ...base, name: 'KB', val: val(1, 'K'), eq: 'KB = C + D', groups: [{ t: 'C', cells: rowsAll(['11', '10']) }, { t: 'D', cells: rowsAll(['01', '11']) }] },
      { ...base, name: 'JC', val: val(2, 'J'), eq: 'JC = <span class="ov">D</span>', groups: [{ t: '<span class="ov">D</span>', cells: rowsAll(['00', '10']) }] },
      { ...base, name: 'KC', val: val(2, 'K'), eq: 'KC = <span class="ov">D</span>', groups: [{ t: '<span class="ov">D</span>', cells: rowsAll(['00', '10']) }] }];
  },
  sr: () => [{ name: 'Q⁺', rl: 'S', cl: 'RQ', rows: ['0', '1'], cols: G2, eq: 'Q⁺ = S + <span class="ov">R</span>·Q',
    val: k => { const S = +k[0], R = +k[1], Q = +k[2]; if (S && R) return 'X'; return String(S ? 1 : R ? 0 : Q); },
    groups: [{ t: 'S', cells: ['100', '101', '111', '110'] }, { t: '<span class="ov">R</span>Q', cells: ['001', '101'] }] }],
  jk: () => [{ name: 'Q⁺', rl: 'J', cl: 'KQ', rows: ['0', '1'], cols: G2, eq: 'Q⁺ = J·<span class="ov">Q</span> + <span class="ov">K</span>·Q',
    val: k => { const J = +k[0], K = +k[1], Q = +k[2]; return String((J & (1 - Q)) | ((1 - K) & Q)); },
    groups: [{ t: 'J<span class="ov">Q</span>', cells: ['100', '110'] }, { t: '<span class="ov">K</span>Q', cells: ['001', '101'] }] }]
};
Object.assign(KM, {
  s1q5: () => {
    const nx = k => { const M = +k[0], N = +k[1], Q = +k[2]; return M ? 1 - Q : N; };
    const base = { rl: 'M', cl: 'NQ', rows: ['0', '1'], cols: G2 };
    return [
      { ...base, name: 'Q⁺', val: k => String(nx(k)), eq: 'Q⁺ = <span class="ov">M</span>·N + M·<span class="ov">Q</span>',
        groups: [{ t: '<span class="ov">M</span>N', cells: ['010', '011'] }, { t: 'M<span class="ov">Q</span>', cells: ['100', '110'] }] },
      { ...base, name: 'J', val: k => jkVal(+k[2], nx(k), 'J'), eq: 'J = M + N',
        groups: [{ t: 'M', cells: ['100', '101', '111', '110'] }, { t: 'N', cells: ['010', '011', '111', '110'] }] },
      { ...base, name: 'K', val: k => jkVal(+k[2], nx(k), 'K'), eq: 'K = M + <span class="ov">N</span>',
        groups: [{ t: 'M', cells: ['100', '101', '111', '110'] }, { t: '<span class="ov">N</span>', cells: ['000', '001', '100', '101'] }] }];
  },
  s1q8: () => [{ name: 'Q⁺', rl: 'P', cl: 'NQ', rows: ['0', '1'], cols: G2, eq: 'Q⁺ = P·<span class="ov">Q</span> + N·Q',
    val: k => { const P = +k[0], N = +k[1], Q = +k[2]; return String(!P && !N ? 0 : !P && N ? Q : P && !N ? 1 - Q : 1); },
    groups: [{ t: 'P<span class="ov">Q</span>', cells: ['100', '110'] }, { t: 'NQ', cells: ['011', '111'] }] }],
  s2q2: () => {
    const nx = k => { const A = +k[0], B = +k[1], x = +k[2]; if (!x) return [A, B]; return ({ '00': [0, 1], '01': [1, 1], '11': [1, 0], '10': [0, 0] })[k.slice(0, 2)]; };
    const base = { rl: 'AB', cl: 'x', rows: G2, cols: ['0', '1'] };
    return [
      { ...base, name: 'D<sub>A</sub>', val: k => String(nx(k)[0]), eq: 'D<sub>A</sub> = A·<span class="ov">x</span> + B·x', groups: [{ t: 'A<span class="ov">x</span>', cells: ['110', '100'] }, { t: 'Bx', cells: ['011', '111'] }] },
      { ...base, name: 'D<sub>B</sub>', val: k => String(nx(k)[1]), eq: 'D<sub>B</sub> = B·<span class="ov">x</span> + <span class="ov">A</span>·x', groups: [{ t: 'B<span class="ov">x</span>', cells: ['010', '110'] }, { t: '<span class="ov">A</span>x', cells: ['001', '011'] }] }];
  },
  s2q5: () => {
    const nx = (n, x) => x ? (n <= 5 ? (n + 4) % 6 : null) : (n + 3) % 8;
    const info = k => { const x = +k[0], n = parseInt(k.slice(1), 2), m = nx(n, x); return { n, m }; };
    const bit = (v, b) => (v >> (2 - b)) & 1;
    const base = { rl: 'XA', cl: 'BC', rows: G2, cols: G2 };
    const all = cs => G2.flatMap(r => cs.map(c => r + c));
    return [
      { ...base, name: 'T<sub>A</sub>', val: k => { const { n, m } = info(k); return m == null ? 'X' : String(bit(n, 0) ^ bit(m, 0)); },
        eq: 'T<sub>A</sub> = <span class="ov">X</span>B + <span class="ov">X</span>C + X<span class="ov">B</span>',
        groups: [{ t: '<span class="ov">X</span>B', cells: ['0010', '0011', '0110', '0111'] }, { t: '<span class="ov">X</span>C', cells: ['0001', '0011', '0101', '0111'] }, { t: 'X<span class="ov">B</span>', cells: ['1100', '1101', '1000', '1001'] }] },
      { ...base, name: 'J<sub>B</sub>', val: k => { const { n, m } = info(k); return m == null ? 'X' : jkVal(bit(n, 1), bit(m, 1), 'J'); },
        eq: 'J<sub>B</sub> = <span class="ov">X</span>·<span class="ov">C</span> + X·A',
        groups: [{ t: '<span class="ov">X</span><span class="ov">C</span>', cells: ['0000', '0010', '0100', '0110'] }, { t: 'XA', cells: ['1100', '1101', '1111', '1110'] }] },
      { ...base, name: 'K<sub>B</sub>', val: k => { const { n, m } = info(k); return m == null ? 'X' : jkVal(bit(n, 1), bit(m, 1), 'K'); },
        eq: 'K<sub>B</sub> = X + <span class="ov">C</span>',
        groups: [{ t: 'X', cells: ['1100', '1101', '1111', '1110', '1000', '1001', '1011', '1010'] }, { t: '<span class="ov">C</span>', cells: all(['00', '10']) }] }];
  }
});
function mountKmaps(root, key) { root.append(...KM[key]().map(kmap)); }

/* ---------------- quizzes ---------------- */
const QZ = {
  l0: [
    { q: 'الـ t<sub>PLH</sub> معناها إيه بالظبط؟', o: ['الوقت اللي الدخل بياخده عشان يطلع من Low لـ High', 'الوقت من تغيّر الدخل لحد ما الخرج يطلع من Low لـ High', 'متوسط التأخير بتاع البوابة', 'زمن الـ clock'], a: 1, w: 'الحرفين L و H بيوصفوا انتقال <b>الخرج</b>، مش الدخل. ودي فخ مشهور.' },
    { q: 'بوابة فيها t<sub>PLH</sub> = 14ns و t<sub>PHL</sub> = 6ns. الـ t<sub>PD</sub> كام؟', o: ['8 ns', '10 ns', '20 ns', '14 ns'], a: 1, w: 't<sub>PD</sub> = (14 + 6) / 2 = 10ns.' },
    { q: 'تلات بوابات ورا بعض، كل واحدة تأخيرها 5ns. الخرج النهائي متأخر عن الدخل بكام؟', o: ['5 ns', '10 ns', '15 ns', 'مش هنعرف'], a: 2, w: 'التأخير بيتجمع على المسار: 5 + 5 + 5 = 15ns.' },
    { q: 'AND بوابة واحد من دخليها ثابت على 0. الخرج هيبقى إيه؟', o: ['زي الدخل التاني', 'عكس الدخل التاني', '0 على طول', '1 على طول'], a: 2, w: 'الـ 0 هو الـ controlling value بتاع الـ AND: لو موجود، الخرج 0 مهما كان الدخل التاني. وعشان كده في السلايد 3، B=1 خلّت الـ AND تعدّي A زي ما هي.' }
  ],
  l1: [
    { q: 'إيه اللي يخلي الدايرة sequential مش combinational؟', o: ['إن فيها بوابات كتير', 'إن فيها memory والخرج بيعتمد على اللي فات', 'إنها أسرع', 'إنها مفيهاش clock'], a: 1, w: 'الـ sequential بتفتكر الماضي عن طريق الـ memory elements (الـ flip-flops).' },
    { q: 'JK flip-flop مع J=1 و K=1، بعد النبضة:', o: ['Q = 1', 'Q = 0', 'Q بيتقلب', 'ممنوع'], a: 2, w: 'ده الفرق بين JK و SR: الحالة اللي كانت ممنوعة في SR بقت Toggle في JK.' },
    { q: 'في Moore الخرج بيعتمد على:', o: ['الـ present state بس', 'الدخل بس', 'الـ present state والدخل', 'الـ clock بس'], a: 0, w: 'Moore: الخرج جوه الدايرة (A/0). Mealy: الخرج على السهم (1/0) لأنه بيعتمد على الدخل كمان.' },
    { q: 'عايز Q تروح من 1 لـ 0 باستخدام JK. لازم J و K يبقوا:', o: ['J=0, K=1', 'J=X, K=1', 'J=1, K=X', 'J=X, K=0'], a: 1, w: 'ينفع Reset (J=0,K=1) أو Toggle (J=1,K=1). في الحالتين K=1، و J مش فارقة يبقى X.' },
    { q: 'الدايرة الصغيرة (bubble) قبل المثلث عند CK معناها:', o: ['الـ FF بيشتغل على الـ rising edge', 'الـ FF بيشتغل على الـ falling edge', 'الـ clock متعكس فمش شغال', 'level-triggered'], a: 1, w: 'المثلث = edge-triggered. والـ bubble قبله = negative/falling edge. أغلب أمثلة الدكتور بالشكل ده.' },
    { q: 'T flip-flop، Q=1 و T=1. بعد النبضة Q =', o: ['1', '0', 'X', 'مش هيتغير'], a: 1, w: 'T=1 يعني اقلب: 1 ← 0. وبالمعادلة: Q⁺ = T ⊕ Q = 1 ⊕ 1 = 0.' }
  ],
  l2: [
    { q: 'أول خطوة في الـ Analysis:', o: ['ارسم الـ state graph', 'طلّع معادلات دخل الـ FFs والخرج من الرسمة', 'اعمل state assignment', 'ارسم الـ timing chart'], a: 1, w: 'الترتيب: معادلات الدخل والخرج ← next state ← transition table ← state table ← state graph.' },
    { q: 'معادلة الـ next state لـ JK:', o: ['Q⁺ = J + K̄Q', 'Q⁺ = JQ̄ + K̄Q', 'Q⁺ = J ⊕ K', 'Q⁺ = JK + Q'], a: 1, w: 'Q⁺ = JQ̄ + K̄Q. احفظها، هتعوّض فيها في كل مسألة analysis فيها JK.' },
    { q: 'Z = XQ̄2 + X̄Q2Q̄1 + XQ1. الدايرة دي:', o: ['Moore', 'Mealy', 'combinational', 'asynchronous'], a: 1, w: 'Z فيها X، يعني الخرج بيعتمد على الدخل مباشرة = Mealy.' },
    { q: 'دايرة فيها 2 flip-flops. أقصى عدد states:', o: ['2', '3', '4', '8'], a: 2, w: 'n flip-flops ← 2ⁿ states. 2² = 4.' },
    { q: 'الـ false output في الـ Mealy timing chart بيحصل ليه؟', o: ['عشان الـ flip-flop بايظ', 'عشان الـ state اتغيرت عند الـ edge والـ X لسه متغيرش', 'عشان الـ clock سريع', 'مبيحصلش في Mealy'], a: 1, w: 'Z = f(state, X). بين الـ edge ولحظة تغيير X، الدايرة شايفة state جديدة مع X قديم.' }
  ],
  l3: [
    { q: 'في الـ Design، بنعرف دخل الـ FF المطلوب منين؟', o: ['الـ characteristic equation', 'الـ excitation table', 'الـ timing chart', 'الـ truth table بتاع البوابات'], a: 1, w: 'Analysis = characteristic equation (عندي الدخل، فين هروح؟). Design = excitation table (عايز أروح هنا، أدخّل إيه؟).' },
    { q: 'الحالات اللي مش موجودة في الـ sequence بتاع العداد، بنحط فيها إيه في الـ K-map؟', o: ['0', '1', 'X (don\'t care)', 'بنشيلها من الماپ'], a: 2, w: 'بنحطها X وده بيساعدنا نكبّر المجموعات ونصغّر المعادلات.' },
    { q: 'عداد binary 3-bit (up)، T للـ bit الأصغر (T3) =', o: ['Q3', '1 دايمًا', 'Q2Q3', '0'], a: 1, w: 'الـ LSB بيتقلب مع كل نبضة، فـ T3 = 1.' },
    { q: 'ليه JD = KD = 1 في محوّل BCD لـ Excess-3؟', o: ['عشان D دايمًا بيبقى 1', 'عشان +3 عدد فردي، فالـ LSB لازم يتقلب كل مرة', 'غلطة في السلايد', 'عشان D مش مستخدم'], a: 1, w: 'لما تزوّد عدد فردي، أصغر bit بيتقلب دايمًا. والـ JK مع J=K=1 = toggle.' }
  ],
  l4: [
    { q: 'Mealy بيكتشف 101 مع overlap. أقل عدد states:', o: ['2', '3', '4', '5'], a: 1, w: 'A (مفيش)، B (…1)، C (…10). الخرج بيطلع على السهم من C بـ 1.' },
    { q: 'نفس المسألة بس Moore:', o: ['3', '4', '5', '6'], a: 1, w: 'Moore محتاج state زيادة (D) عشان الخرج 1 لازم يبقى «جوه» حالة.' },
    { q: '101 overlap، إحنا في C (آخرها 10) وجه 1. Z=1 ونروح فين؟', o: ['A', 'B', 'C', 'نفضل في C'], a: 1, w: 'الـ 1 الأخير ممكن يبقى بداية 101 جديدة، فنروح B (…1).' },
    { q: '«The network resets after every 3 inputs» معناها:', o: ['مع overlap', 'الدخل بيتقسم مجموعات منفصلة كل 3 ونرجع A بعد كل مجموعة', 'نرجع A بعد كل 1', 'الدايرة بتعيد التشغيل كل 3 ثواني'], a: 1, w: 'مجموعات ثابتة من غير overlap: بعد الـ bit التالت دايمًا نرجع A.' },
    { q: 'في Problem 8، ليه H بترجع لنفسها في 0 و 1؟', o: ['غلطة', 'عشان الشرط اتحقق والخرج يفضل 1 للأبد', 'عشان H هي البداية', 'عشان H مش مستخدمة'], a: 1, w: '«becomes 1 and remains 1 thereafter»: خلاص مفيش رجوع.' }
  ]
};
function mountQuiz(root, key) {
  const qs = QZ[key]; let score = 0, answered = 0;
  const sc = h('p', { class: 'qscore', 'aria-live': 'polite' });
  qs.forEach((q, qi) => {
    const why = h('p', { class: 'qwhy', hidden: true, html: q.w });
    const opts = q.o.map((o, oi) => h('button', { class: 'qopt', type: 'button', html: o, onclick: () => {
      if (box.dataset.done) return; box.dataset.done = '1'; answered++;
      opts.forEach((b, bi) => { b.disabled = true; if (bi === q.a) b.classList.add('right'); });
      if (oi === q.a) score++; else opts[oi].classList.add('wrong');
      why.hidden = false; upd();
    } }));
    const box = h('div', { class: 'q' }, h('p', { class: 'qq', html: `<span class="qn">${qi + 1}</span> ${q.q}` }), h('div', { class: 'qopts' }, opts), why);
    root.append(box);
  });
  const again = h('button', { class: 'btn ghost', type: 'button', onclick: () => { root.replaceChildren(); mountQuiz(root, key); } }, 'جرّب تاني');
  root.append(h('div', { class: 'qfoot' }, sc, again));
  function upd() { sc.innerHTML = `<b>${score} / ${qs.length}</b>${answered === qs.length ? (score === qs.length ? ' · كده المحاضرة دي في جيبك.' : ' · ارجع للأجزاء اللي غلطت فيها وجرّب تاني.') : ''}`; }
  upd();
}

/* ---------------- tPD calculator ---------------- */
function mountCalc(root) {
  const a = h('input', { id: 'tplh', type: 'number', value: 12, min: 0, step: 1, dir: 'ltr' }), b = h('input', { id: 'tphl', type: 'number', value: 8, min: 0, step: 1, dir: 'ltr' });
  const r = h('output', { class: 'calc-r', dir: 'ltr', for: 'tplh tphl' });
  const up = () => { const x = parseFloat(a.value) || 0, y = parseFloat(b.value) || 0; r.textContent = `tPD = (${x} + ${y}) / 2 = ${(x + y) / 2} ns`; };
  a.addEventListener('input', up); b.addEventListener('input', up);
  root.append(h('label', { for: 'tplh' }, 'tPLH (ns)', a), h('label', { for: 'tphl' }, 'tPHL (ns)', b), r); up();
}

/* ---------------- boot ---------------- */
function boot() {
  $$('[data-wave]').forEach(e => { const f = STATIC[e.dataset.wave]; if (f) e.append(f()); });
  $$('[data-gatelab]').forEach(mountGateLab);
  $$('[data-ffplay]').forEach(mountFF);
  $$('[data-fill]').forEach(e => mountFill(e, FILLS[e.dataset.fill]));
  $$('[data-edgeex]').forEach(e => mountEdgeEx(e, e.dataset.edgeex));
  $$('[data-draw]').forEach(e => mountDraw(e, e.dataset.draw));
  $$('[data-fsm]').forEach(e => mountFSM(e, e.dataset.fsm));
  $$('[data-fsmtiming]').forEach(e => mountFsmTiming(e, e.dataset.fsmtiming));
  $$('[data-counter]').forEach(e => mountCounter(e, e.dataset.counter));
  $$('[data-kmaps]').forEach(e => mountKmaps(e, e.dataset.kmaps));
  $$('[data-quiz]').forEach(e => mountQuiz(e, e.dataset.quiz));
  $$('[data-calc]').forEach(mountCalc);
  $$('.walk').forEach(mountWalk);
  // switcher for L4 problems
  $$('[data-switch]').forEach(sw => {
    const btns = $$('button[data-target]', sw), panes = btns.map(b => document.getElementById(b.dataset.target));
    const show = id => { btns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.target === id))); panes.forEach(p => { if (p) p.hidden = p.id !== id; }); };
    btns.forEach(b => b.addEventListener('click', () => show(b.dataset.target)));
    show(btns[0].dataset.target);
  });
  // progress
  const lecs = ['l0', 'l1', 's1', 'l2', 's2', 'l3', 'l4', 's3'];
  const prog = $('#prog'), progBar = $('#progbar');
  const updProg = () => { const n = lecs.filter(k => store.get('done-' + k, false)).length; if (prog) prog.textContent = `خلّصت ${n} من ${lecs.length} (5 محاضرات + 3 شيتات)`; if (progBar) progBar.style.width = (n / lecs.length * 100) + '%'; };
  $$('.done-btn').forEach(b => {
    const k = b.dataset.lec;
    const what = k.startsWith('s') ? 'الشيت ده' : 'المحاضرة دي';
    const set = v => { b.setAttribute('aria-pressed', String(v)); b.textContent = v ? `✓ خلّصت ${what}` : `علّم إني خلّصت ${what}`; $$(`a[data-lec="${k}"]`).forEach(a => a.classList.toggle('done', v)); };
    set(!!store.get('done-' + k, false));
    b.addEventListener('click', () => { const v = b.getAttribute('aria-pressed') !== 'true'; store.set('done-' + k, v); set(v); updProg(); });
  });
  updProg();
  // toc toggle (mobile)
  const toc = $('#toc'), tb = $('#tocbtn');
  if (tb && toc) {
    tb.addEventListener('click', () => { const o = toc.classList.toggle('open'); tb.setAttribute('aria-expanded', String(o)); });
    $$('a', toc).forEach(a => a.addEventListener('click', () => { toc.classList.remove('open'); tb.setAttribute('aria-expanded', 'false'); }));
  }
  // scrollspy
  const links = $$('#toc a[href^="#"]');
  const map = new Map(); links.forEach(a => { const s = document.getElementById(a.getAttribute('href').slice(1)); if (s) map.set(s, a); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(ents => { ents.forEach(en => { if (en.isIntersecting) { links.forEach(l => l.classList.remove('active')); const a = map.get(en.target); if (a) { a.classList.add('active'); const top = a.closest('.toc-lec'); if (top) $$('.toc-lec', toc).forEach(t => t.classList.toggle('here', t === top)); } } }); }, { rootMargin: '-15% 0px -75% 0px' });
    map.forEach((_, s) => io.observe(s));
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
