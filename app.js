/* Lift Log — simple workout planner + logger. Vanilla JS, no server, no fees. */
(function () {
'use strict';

// ---------- helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayStr = () => ymd(new Date());
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDate = s => { const d = parseYmd(s); return DOW[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); };
const fmtShort = s => { const d = parseYmd(s); return (d.getMonth() + 1) + '/' + d.getDate(); };
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const round = (n, step) => Math.round(n / step) * step;
const ICON = {
  swap: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 8h14l-4-4M20 16H6l4 4" stroke="currentColor" stroke-width="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="2"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 14l6-6 6 6" stroke="currentColor" stroke-width="2"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 10l6 6 6-6" stroke="currentColor" stroke-width="2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20h4L19 9l-4-4L4 16z" stroke="currentColor" stroke-width="2"/></svg>'
};

// ---------- default data ----------
const GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const LIB = {
  Chest: ['Barbell Bench Press', 'Incline Barbell Bench', 'Dumbbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Fly', 'Cable Fly', 'Push-Up', 'Dip'],
  Back: ['Pull-Up', 'Chin-Up', 'Lat Pulldown (Cable)', 'Seated Cable Row', 'Barbell Row', 'One-Arm Dumbbell Row', 'Face Pull', 'Straight-Arm Pulldown', 'Deadlift'],
  Legs: ['Back Squat', 'Front Squat', 'Romanian Deadlift', 'Goblet Squat', 'Bulgarian Split Squat', 'Dumbbell Walking Lunge', 'Leg Extension', 'Leg Curl', 'Hip Thrust', 'Calf Raise'],
  Shoulders: ['Overhead Press', 'Seated Dumbbell Shoulder Press', 'Lateral Raise', 'Cable Lateral Raise', 'Rear Delt Fly', 'Upright Row (Cable)'],
  Arms: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Cable Curl', 'Triceps Pushdown', 'Overhead Cable Triceps Ext.', 'Skull Crusher', 'Close-Grip Bench Press'],
  Core: ['Plank', 'Cable Crunch', 'Hanging Knee Raise', 'Pallof Press', 'Ab Wheel', 'Russian Twist']
};
function defaultData() {
  const exercises = [];
  GROUPS.forEach(g => LIB[g].forEach(n => exercises.push({ id: n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: n, group: g })));
  const id = n => exercises.find(e => e.name === n).id;
  const mk = (name, list) => ({ id: uid(), name, exercises: list.map(([n, s, r]) => ({ exId: id(n), sets: s, reps: r })) });
  const push = mk('Push', [['Barbell Bench Press', 3, 8], ['Incline Dumbbell Press', 3, 10], ['Seated Dumbbell Shoulder Press', 3, 10], ['Lateral Raise', 3, 12], ['Triceps Pushdown', 3, 12]]);
  const pull = mk('Pull', [['Pull-Up', 3, 8], ['Seated Cable Row', 3, 10], ['One-Arm Dumbbell Row', 3, 10], ['Face Pull', 3, 15], ['Dumbbell Curl', 3, 12]]);
  const legs = mk('Legs', [['Back Squat', 3, 6], ['Romanian Deadlift', 3, 8], ['Bulgarian Split Squat', 3, 10], ['Leg Extension', 3, 12], ['Leg Curl', 3, 12], ['Calf Raise', 3, 15]]);
  const full = mk('Full Body', [['Goblet Squat', 3, 10], ['Dumbbell Bench Press', 3, 10], ['Lat Pulldown (Cable)', 3, 10], ['Hip Thrust', 3, 10], ['Cable Crunch', 3, 15]]);
  return {
    version: 1,
    settings: { unit: 'lb', rest: 90, inc: 5 },
    exercises,
    workouts: [push, pull, legs, full],
    schedule: { 0: null, 1: push.id, 2: null, 3: pull.id, 4: null, 5: legs.id, 6: null },
    overrides: {},
    sessions: [],
    body: []
  };
}

function seedDemo(d) {
  // Sample history for the preview only.
  const base = { 'barbell-bench-press': 155, 'incline-dumbbell-press': 50, 'seated-dumbbell-shoulder-press': 40, 'lateral-raise': 15, 'triceps-pushdown': 50,
    'pull-up': 0, 'seated-cable-row': 120, 'one-arm-dumbbell-row': 60, 'face-pull': 40, 'dumbbell-curl': 30,
    'back-squat': 205, 'romanian-deadlift': 165, 'bulgarian-split-squat': 35, 'leg-extension': 90, 'leg-curl': 70, 'calf-raise': 135 };
  const now = new Date(); now.setHours(12);
  let bw = 214;
  for (let i = 84; i >= 1; i--) {
    const day = new Date(now); day.setDate(now.getDate() - i);
    const ds = ymd(day);
    if (i % 3 === 0) { bw += (Math.random() - 0.62) * 0.9; d.body.push({ date: ds, w: Math.round(bw * 10) / 10 }); }
    const wid = d.schedule[day.getDay()];
    if (!wid || (i % 17 === 0)) continue;
    const t = d.workouts.find(w => w.id === wid);
    const weeks = Math.floor((84 - i) / 7);
    d.sessions.push({ id: uid(), date: ds, workoutId: t.id, name: t.name, startedAt: day.getTime(), finishedAt: day.getTime() + 3600e3,
      entries: t.exercises.map(e => {
        const b = base[e.exId] || 50; const w = b ? b + Math.floor(weeks / 2) * 5 : 0;
        return { exId: e.exId, targetSets: e.sets, targetReps: e.reps,
          sets: Array.from({ length: e.sets }, (_, k) => ({ w: w, r: Math.max(1, e.reps - (k === e.sets - 1 && weeks % 2 ? 1 : 0) + (b ? 0 : Math.min(4, weeks >> 1))), done: true })) };
      }) });
  }
}

// ---------- state ----------
let S = Store.load();
if (!S) { S = defaultData(); if (Store.demo) seedDemo(S); }
const save = () => Store.save(S);
save();

const ui = { tab: 'calendar', calMonth: (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })(), sel: todayStr(),
  prog: { ex: null, metric: 'top', range: 90 }, bodyRange: 90, chart: null, activeSession: null, rest: null };

const exById = id => S.exercises.find(e => e.id === id) || { id, name: '(deleted exercise)', group: '' };
const wkById = id => S.workouts.find(w => w.id === id);
const sessionFor = date => S.sessions.find(s => s.date === date);
function plannedFor(date) {
  if (Object.prototype.hasOwnProperty.call(S.overrides, date)) { const o = S.overrides[date]; return o === 'rest' ? null : wkById(o) || null; }
  return wkById(S.schedule[parseYmd(date).getDay()]) || null;
}
const U = () => S.settings.unit;

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 1800); }

// ---------- suggestion engine ----------
function lastPerformance(exId, beforeDate, excludeId) {
  const list = S.sessions.filter(s => s.finishedAt && s.id !== excludeId && s.date <= beforeDate).sort((a, b) => b.date.localeCompare(a.date) || b.finishedAt - a.finishedAt);
  for (const s of list) {
    const e = s.entries.find(x => x.exId === exId);
    if (e && e.sets.some(st => st.done)) return { date: s.date, entry: e };
  }
  return null;
}
function suggest(exId, sets, reps, date, excludeId) {
  const last = lastPerformance(exId, date, excludeId);
  if (!last) return { sets: Array.from({ length: sets }, () => ({ w: '', r: reps, done: false })), note: 'First time — pick a starting weight', prev: [], up: false };
  const done = last.entry.sets.filter(s => s.done);
  const topW = Math.max(...done.map(s => num(s.w)));
  const target = last.entry.targetReps || reps;
  const hitAll = done.length >= (last.entry.targetSets || sets) && done.every(s => num(s.r) >= target);
  const inc = S.settings.inc;
  let w = topW, r = reps, up = false;
  if (hitAll) { if (topW > 0) { w = topW + inc; up = true; } else { r = Math.max(reps, Math.max(...done.map(s => num(s.r))) + 1); up = true; } }
  const prev = last.entry.sets.map(s => s.done ? (num(s.w) ? s.w + '×' + s.r : 'BW×' + s.r) : '—');
  const note = hitAll ? (topW > 0 ? `Hit all reps last time (${fmtShort(last.date)}) → +${inc} ${U()}` : `Hit all reps last time → add a rep`) : `Last: ${fmtShort(last.date)} — repeat and beat it`;
  return { sets: Array.from({ length: sets }, () => ({ w: w || '', r, done: false })), note, prev, up };
}

// ---------- routing ----------
const TITLES = { calendar: 'Calendar', plan: 'Weekly Plan', progress: 'Progress', body: 'Body Weight', more: 'More' };
function go(tab) {
  ui.tab = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('#screenTitle').textContent = TITLES[tab];
  $('#todayBtn').style.visibility = tab === 'calendar' ? 'visible' : 'hidden';
  render(); window.scrollTo(0, 0);
}
function render() {
  if (ui.chart) { ui.chart.destroy(); ui.chart = null; }
  const v = $('#view');
  ({ calendar: renderCalendar, plan: renderPlan, progress: renderProgress, body: renderBody, more: renderMore })[ui.tab](v);
}

// ---------- calendar ----------
function renderCalendar(v) {
  const m = ui.calMonth, first = new Date(m.getFullYear(), m.getMonth(), 1);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const t = todayStr();
  let cells = '';
  const daysIn = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const total = Math.ceil((first.getDay() + daysIn) / 7) * 7;
  for (let i = 0; i < total; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const ds = ymd(d), sess = sessionFor(ds), plan = plannedFor(ds);
    const cls = ['day', d.getMonth() !== m.getMonth() ? 'other' : '', sess && sess.finishedAt ? 'done' : (plan || sess) ? 'planned' : '', ds === t ? 'today' : '', ds === ui.sel ? 'sel' : ''].join(' ');
    const lbl = sess ? sess.name : plan ? plan.name : '';
    cells += `<button class="${cls}" data-act="pick-day" data-date="${ds}" type="button"><span class="num">${d.getDate()}</span><span class="lbl">${esc(lbl)}</span></button>`;
  }
  v.innerHTML = `
    <div class="cal-head">
      <button class="iconbtn" data-act="cal-prev" aria-label="Previous month">${ICON.left}</button>
      <h3>${MONTHS[m.getMonth()]} ${m.getFullYear()}</h3>
      <button class="iconbtn" data-act="cal-next" aria-label="Next month">${ICON.right}</button>
    </div>
    <div class="cal-grid">${DOW.map(d => `<div class="dow">${d[0]}</div>`).join('')}${cells}</div>
    <div class="legend"><span><i style="border-color:#5a2a10"></i>Planned</span><span><i style="background:var(--accent);border-color:var(--accent)"></i>Done</span></div>
    <h2>${ui.sel === t ? 'Today · ' : ''}${fmtDate(ui.sel)}</h2>
    ${dayCard(ui.sel)}`;
}
function dayCard(ds) {
  const sess = sessionFor(ds), plan = plannedFor(ds);
  if (sess) {
    const doneSets = sess.entries.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    const vol = sess.entries.reduce((a, e) => a + e.sets.filter(s => s.done).reduce((b, s) => b + num(s.w) * num(s.r), 0), 0);
    return `<div class="card daycard">
      <div class="row" style="margin-bottom:8px"><h3 class="grow">${esc(sess.name)}</h3>${sess.finishedAt ? '<span class="chip good">Done</span>' : '<span class="chip accent">In progress</span>'}</div>
      ${sess.entries.map(e => { const d = e.sets.filter(s => s.done); return `<div class="ex"><span>${esc(exById(e.exId).name)}</span><span class="muted">${d.length ? d.map(s => (num(s.w) ? s.w : 'BW') + '×' + s.r).join(', ') : '—'}</span></div>`; }).join('')}
      <p class="small muted">${doneSets} sets · ${Math.round(vol).toLocaleString()} ${U()} total volume</p>
      <div class="row"><button class="btn primary grow" data-act="open-session" data-date="${ds}">${sess.finishedAt ? 'View / edit' : 'Resume workout'}</button>
      <button class="btn danger" data-act="delete-session" data-date="${ds}">Delete</button></div></div>`;
  }
  if (!plan) {
    return `<div class="card"><p class="muted" style="margin-top:0">Rest day — nothing scheduled.</p>
      <button class="btn block" data-act="change-day" data-date="${ds}">Schedule a workout for this day</button></div>`;
  }
  return `<div class="card daycard">
    <div class="row" style="margin-bottom:8px"><h3 class="grow">${esc(plan.name)}</h3>${S.overrides[ds] ? '<span class="chip accent">Changed</span>' : '<span class="chip">Weekly plan</span>'}</div>
    ${plan.exercises.map(e => `<div class="ex"><span>${esc(exById(e.exId).name)}</span><span class="muted">${e.sets} × ${e.reps}</span></div>`).join('')}
    <div class="stack" style="margin-top:12px">
      <button class="btn primary block" data-act="start" data-date="${ds}">Start workout</button>
      <div class="row"><button class="btn grow" data-act="change-day" data-date="${ds}">${ICON.swap.replace('<svg', '<svg width="18" height="18"')} Switch workout</button>
      ${S.overrides[ds] ? `<button class="btn ghost" data-act="reset-day" data-date="${ds}">Use plan</button>` : ''}</div>
    </div></div>`;
}

// ---------- sheets ----------
function openSheet(title, body) {
  const sh = $('#sheet');
  sh.innerHTML = `<div class="sheet-panel" role="dialog" aria-label="${esc(title)}"><div class="sheet-head"><h3>${esc(title)}</h3><button class="iconbtn" data-act="close-sheet" aria-label="Close">${ICON.close}</button></div>${body}</div>`;
  sh.hidden = false;
}
function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; ui.sheetCtx = null; }

function workoutPicker(ds) {
  const cur = plannedFor(ds);
  openSheet('Switch workout · ' + fmtDate(ds), `<div class="list">
    ${S.workouts.map(w => `<button class="pick ${cur && cur.id === w.id ? 'cur' : ''}" data-act="set-day" data-date="${ds}" data-wid="${w.id}"><span><b>${esc(w.name)}</b><br><span class="small muted">${w.exercises.map(e => esc(exById(e.exId).name)).slice(0, 3).join(', ')}${w.exercises.length > 3 ? '…' : ''}</span></span><span class="muted">${w.exercises.length} ex</span></button>`).join('')}
    <button class="pick" data-act="set-day" data-date="${ds}" data-wid="rest"><span><b>Rest day</b></span></button></div>
    <p class="small muted">This only changes ${fmtDate(ds)}. Your weekly plan stays the same.</p>`);
}

function exercisePicker(ctx, title) {
  ui.sheetCtx = ctx;
  const groups = GROUPS.concat([...new Set(S.exercises.map(e => e.group))].filter(g => !GROUPS.includes(g)));
  const prefer = ctx.group;
  const order = prefer ? [prefer].concat(groups.filter(g => g !== prefer)) : groups;
  openSheet(title, `<input class="search" type="search" placeholder="Search exercises" data-act="ex-search" autocomplete="off">
    <div class="list" id="exList">${order.map(g => {
      const items = S.exercises.filter(e => e.group === g).sort((a, b) => a.name.localeCompare(b.name));
      if (!items.length) return '';
      return `<div class="group-h">${esc(g)}${g === prefer ? ' · same muscle group' : ''}</div>` + items.map(e => `<button class="pick" data-act="pick-ex" data-ex="${e.id}" data-name="${esc(e.name.toLowerCase())}"><span>${esc(e.name)}</span></button>`).join('');
    }).join('')}</div>
    <h2>Not listed?</h2>
    <div class="row"><input id="newExName" placeholder="New exercise name"><select id="newExGroup" style="width:130px">${GROUPS.map(g => `<option ${g === prefer ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
    <button class="btn block" style="margin-top:8px" data-act="add-ex-pick">Add & use</button>`);
}

// ---------- workout screen ----------
function createSession(ds) {
  const plan = plannedFor(ds);
  const s = { id: uid(), date: ds, workoutId: plan ? plan.id : null, name: plan ? plan.name : 'Workout', startedAt: Date.now(), finishedAt: null, entries: [] };
  if (plan) s.entries = plan.exercises.map(e => { const g = suggest(e.exId, e.sets, e.reps, ds, s.id); return { exId: e.exId, targetSets: e.sets, targetReps: e.reps, sets: g.sets }; });
  S.sessions.push(s); save();
  return s;
}
function openSession(s) { ui.activeSession = s.id; renderWorkout(); $('#workout').hidden = false; document.body.style.overflow = 'hidden'; }
function activeS() { return S.sessions.find(s => s.id === ui.activeSession); }
function closeWorkout() { $('#workout').hidden = true; ui.activeSession = null; document.body.style.overflow = ''; stopRest(); render(); }

function renderWorkout() {
  const s = activeS(); if (!s) return;
  const w = $('#workout');
  const scroll = w.scrollTop;
  w.innerHTML = `
    <div class="w-top">
      <button class="iconbtn" data-act="w-close" aria-label="Back">${ICON.left}</button>
      <div class="t"><b>${esc(s.name)}</b><span class="small muted">${fmtDate(s.date)}${s.finishedAt ? ' · saved' : ''}</span></div>
      <button class="btn sm" data-act="w-rename">Rename</button>
    </div>
    <div class="w-body">
      ${s.entries.length ? '' : '<div class="empty">No exercises yet. Add one below.</div>'}
      ${s.entries.map((e, i) => exCard(s, e, i)).join('')}
      <button class="btn block" data-act="w-add-ex">+ Add exercise</button>
    </div>
    <div class="w-foot"><div class="inner">
      <button class="btn primary grow" data-act="w-finish">${s.finishedAt ? 'Save changes' : 'Finish & save workout'}</button>
    </div></div>`;
  w.scrollTop = scroll;
}
function exCard(s, e, i) {
  const ex = exById(e.exId);
  const g = suggest(e.exId, e.targetSets || e.sets.length, e.targetReps || 8, s.date, s.id);
  return `<section class="exc">
    <div class="exc-h"><span class="n">${esc(ex.name)}</span>
      <button class="iconbtn" data-act="w-swap" data-i="${i}" aria-label="Swap exercise">${ICON.swap}</button>
      <button class="iconbtn" data-act="w-del-ex" data-i="${i}" aria-label="Remove exercise">${ICON.trash}</button></div>
    <div class="exc-sub">${g.up ? '<span class="chip accent">↑ Go up</span> ' : ''}${esc(g.note)}${e.targetReps ? ` · target ${e.targetSets}×${e.targetReps}` : ''}</div>
    <table class="sets"><thead><tr><th>Set</th><th>Last</th><th>${U()}</th><th>Reps</th><th></th></tr></thead><tbody>
    ${e.sets.map((st, k) => `<tr class="${st.done ? 'done' : ''}">
      <td class="setn">${k + 1}</td><td class="prev">${esc(g.prev[k] || '—')}</td>
      <td><input inputmode="decimal" data-act="w-in" data-i="${i}" data-k="${k}" data-f="w" value="${esc(st.w)}" placeholder="${U()}" aria-label="Weight set ${k + 1}"></td>
      <td><input inputmode="numeric" data-act="w-in" data-i="${i}" data-k="${k}" data-f="r" value="${esc(st.r)}" placeholder="reps" aria-label="Reps set ${k + 1}"></td>
      <td><button class="chk" data-act="w-done" data-i="${i}" data-k="${k}" aria-label="Mark set ${k + 1} done">${ICON.check}</button></td></tr>`).join('')}
    </tbody></table>
    <div class="exc-f"><button class="btn sm grow" data-act="w-add-set" data-i="${i}">+ Set</button><button class="btn sm ghost" data-act="w-rem-set" data-i="${i}">− Set</button></div>
  </section>`;
}

// rest timer
function startRest() {
  stopRest();
  let left = S.settings.rest; const bar = $('#restbar');
  const draw = () => { bar.innerHTML = `<span class="small">REST</span><span class="time">${Math.floor(left / 60)}:${pad(left % 60)}</span><button data-act="rest-adj" data-d="-15">−15</button><button data-act="rest-adj" data-d="15">+15</button><button data-act="rest-stop">Skip</button>`; };
  ui.rest = { get left() { return left; }, set left(v) { left = v; draw(); } };
  draw(); bar.hidden = false;
  ui.restT = setInterval(() => { left--; if (left <= 0) { stopRest(); toast('Rest done — next set'); if (navigator.vibrate) navigator.vibrate(300); } else draw(); }, 1000);
}
function stopRest() { clearInterval(ui.restT); ui.rest = null; $('#restbar').hidden = true; }

// ---------- plan ----------
function renderPlan(v) {
  v.innerHTML = `
    <p class="muted small" style="margin-top:0">Set your week once — it repeats on the calendar until you change it. To change a single day, tap it on the calendar and choose Switch workout.</p>
    <h2>Weekly schedule</h2>
    <div class="list">${[1, 2, 3, 4, 5, 6, 0].map(d => `<div class="planrow"><b>${DOW[d]}</b>
      <select data-act="sched" data-d="${d}"><option value="">Rest</option>${S.workouts.map(w => `<option value="${w.id}" ${S.schedule[d] === w.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}</select></div>`).join('')}</div>
    <h2>Workouts</h2>
    <div class="list">${S.workouts.map(w => {
      const days = [0, 1, 2, 3, 4, 5, 6].filter(d => S.schedule[d] === w.id).map(d => DOW[d]);
      return `<button class="pick" data-act="edit-wk" data-wid="${w.id}"><span><b>${esc(w.name)}</b><br><span class="small muted">${w.exercises.length} exercises${days.length ? ' · ' + days.join(', ') : ' · not scheduled'}</span></span><span class="muted">${ICON.edit.replace('<svg', '<svg width="18" height="18"')}</span></button>`;
    }).join('') || '<div class="empty">No workouts yet.</div>'}</div>
    <button class="btn primary block" style="margin-top:12px" data-act="new-wk">+ New workout</button>`;
}
function editWorkout(wid) {
  const w = wkById(wid); if (!w) return;
  ui.editing = wid;
  openSheet('Edit workout', `
    <label class="f">Name</label><input data-act="wk-name" value="${esc(w.name)}">
    <h2>Exercises · sets × reps</h2>
    <div>${w.exercises.map((e, i) => `<div class="tmpl-ex"><span class="nm">${esc(exById(e.exId).name)}</span>
      <input inputmode="numeric" data-act="wk-field" data-i="${i}" data-f="sets" value="${e.sets}" aria-label="Sets">
      <input inputmode="numeric" data-act="wk-field" data-i="${i}" data-f="reps" value="${e.reps}" aria-label="Reps">
      <button class="iconbtn" data-act="wk-move" data-i="${i}" aria-label="Move up">${ICON.up}</button>
      <button class="iconbtn" data-act="wk-rem" data-i="${i}" aria-label="Remove">${ICON.trash}</button></div>`).join('') || '<div class="empty">Add your first exercise.</div>'}</div>
    <p class="small muted">Columns: sets, reps. ↑ moves an exercise up.</p>
    <button class="btn block" data-act="wk-add">+ Add exercise</button>
    <div class="row" style="margin-top:14px"><button class="btn primary grow" data-act="close-sheet">Done</button><button class="btn danger" data-act="wk-delete">Delete</button></div>`);
}

// ---------- progress ----------
function exHistory(exId) {
  return S.sessions.filter(s => s.finishedAt).sort((a, b) => a.date.localeCompare(b.date)).map(s => {
    const e = s.entries.find(x => x.exId === exId); if (!e) return null;
    const d = e.sets.filter(x => x.done); if (!d.length) return null;
    return { date: s.date, top: Math.max(...d.map(x => num(x.w))), e1rm: Math.max(...d.map(x => num(x.w) * (1 + num(x.r) / 30))), vol: d.reduce((a, x) => a + num(x.w) * num(x.r), 0), reps: Math.max(...d.map(x => num(x.r))), sets: d };
  }).filter(Boolean);
}
function lineChart(canvas, labels, data, label, color) {
  const css = getComputedStyle(document.documentElement);
  return new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ label, data, borderColor: color, backgroundColor: color + '22', fill: true, tension: 0.25, pointRadius: 3, pointBackgroundColor: color, borderWidth: 2.5 }] },
    options: { maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { displayColors: false } },
      scales: { x: { ticks: { color: '#7d7d79', maxTicksLimit: 6, font: { size: 11 } }, grid: { color: '#222' } }, y: { ticks: { color: '#7d7d79', font: { size: 11 } }, grid: { color: '#222' } } } }
  });
}
function renderProgress(v) {
  const used = S.exercises.filter(e => exHistory(e.id).length);
  if (!used.length) { v.innerHTML = '<div class="empty" style="margin-top:20px">Finish a workout and your weight history shows up here.</div>'; return; }
  if (!ui.prog.ex || !used.find(e => e.id === ui.prog.ex)) ui.prog.ex = used[0].id;
  const cutoff = ui.prog.range ? ymd(new Date(Date.now() - ui.prog.range * 864e5)) : '0000';
  const h = exHistory(ui.prog.ex).filter(x => x.date >= cutoff);
  const all = exHistory(ui.prog.ex);
  const bw = all.every(x => x.top === 0);
  const metric = bw ? 'reps' : ui.prog.metric;
  const M = { top: ['Top weight', x => x.top], e1rm: ['Est. 1-rep max', x => Math.round(x.e1rm)], vol: ['Total volume', x => Math.round(x.vol)], reps: ['Best reps', x => x.reps] };
  const best = all.reduce((a, x) => x.top > a.top || (x.top === a.top && x.reps > a.reps) ? x : a, all[0]);
  const first = h[0], last = h[h.length - 1];
  const change = first && last ? M[metric][1](last) - M[metric][1](first) : 0;
  v.innerHTML = `
    <label class="f">Exercise</label>
    <select data-act="prog-ex">${GROUPS.map(g => { const it = used.filter(e => e.group === g); return it.length ? `<optgroup label="${g}">${it.map(e => `<option value="${e.id}" ${e.id === ui.prog.ex ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</optgroup>` : ''; }).join('')}${used.filter(e => !GROUPS.includes(e.group)).map(e => `<option value="${e.id}" ${e.id === ui.prog.ex ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
    ${bw ? '' : `<div class="seg" style="margin-top:10px">${['top', 'e1rm', 'vol'].map(k => `<button class="${metric === k ? 'on' : ''}" data-act="prog-metric" data-m="${k}">${M[k][0]}</button>`).join('')}</div>`}
    <div class="seg" style="margin-top:8px">${[[30, '1M'], [90, '3M'], [180, '6M'], [365, '1Y'], [0, 'All']].map(([d, l]) => `<button class="${ui.prog.range === d ? 'on' : ''}" data-act="prog-range" data-r="${d}">${l}</button>`).join('')}</div>
    <div class="chartbox">${h.length ? '<canvas id="pc"></canvas>' : '<div class="empty">No sessions in this range.</div>'}</div>
    <div class="stats">
      <div class="stat"><span>Best set</span><b>${bw ? best.reps + ' reps' : best.top + ' ' + U()}</b></div>
      <div class="stat"><span>Change</span><b style="color:${change > 0 ? 'var(--good)' : change < 0 ? 'var(--danger)' : 'inherit'}">${change > 0 ? '+' : ''}${change}</b></div>
      <div class="stat"><span>Sessions</span><b>${h.length}</b></div>
    </div>
    <h2>History</h2>
    <div class="list">${all.slice().reverse().slice(0, 25).map(x => `<div class="item"><span class="grow"><span class="title">${fmtDate(x.date)}</span><br><span class="small muted">${x.sets.map(s => (num(s.w) ? s.w : 'BW') + '×' + s.r).join(' · ')}</span></span><span class="muted small">${bw ? '' : Math.round(x.e1rm) + ' e1RM'}</span></div>`).join('')}</div>`;
  if (h.length) ui.chart = lineChart($('#pc'), h.map(x => fmtShort(x.date)), h.map(M[metric][1]), M[metric][0], '#ff6a1a');
}

// ---------- body weight ----------
function renderBody(v) {
  const list = S.body.slice().sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = ui.bodyRange ? ymd(new Date(Date.now() - ui.bodyRange * 864e5)) : '0000';
  const h = list.filter(x => x.date >= cutoff);
  const cur = list[list.length - 1];
  const d30 = list.filter(x => x.date >= ymd(new Date(Date.now() - 30 * 864e5)));
  const ch30 = d30.length > 1 ? Math.round((d30[d30.length - 1].w - d30[0].w) * 10) / 10 : 0;
  const low = list.length ? Math.min(...list.map(x => x.w)) : 0;
  v.innerHTML = `
    <div class="card"><div class="row">
      <div class="grow"><label class="f">Weight (${U()})</label><input id="bwIn" inputmode="decimal" placeholder="${cur ? cur.w : '0.0'}"></div>
      <div style="width:44%"><label class="f">Date</label><input id="bwDate" type="date" value="${todayStr()}"></div></div>
      <button class="btn primary block" style="margin-top:10px" data-act="bw-save">Log weight</button></div>
    ${list.length ? `
    <div class="stats">
      <div class="stat"><span>Current</span><b>${cur.w}</b></div>
      <div class="stat"><span>30-day</span><b style="color:${ch30 < 0 ? 'var(--good)' : ch30 > 0 ? 'var(--accent)' : 'inherit'}">${ch30 > 0 ? '+' : ''}${ch30}</b></div>
      <div class="stat"><span>Lowest</span><b>${low}</b></div></div>
    <div class="seg" style="margin-top:12px">${[[30, '1M'], [90, '3M'], [180, '6M'], [365, '1Y'], [0, 'All']].map(([d, l]) => `<button class="${ui.bodyRange === d ? 'on' : ''}" data-act="bw-range" data-r="${d}">${l}</button>`).join('')}</div>
    <div class="chartbox">${h.length ? '<canvas id="bc"></canvas>' : '<div class="empty">No entries in this range.</div>'}</div>
    <h2>Entries</h2>
    <div class="list">${list.slice().reverse().slice(0, 40).map(x => `<div class="item"><span class="grow title">${fmtDate(x.date)}</span><b>${x.w} ${U()}</b><button class="iconbtn" data-act="bw-del" data-date="${x.date}" aria-label="Delete entry">${ICON.trash}</button></div>`).join('')}</div>`
    : '<div class="empty" style="margin-top:14px">Log your first weigh-in to start the graph.</div>'}`;
  if (h.length) ui.chart = lineChart($('#bc'), h.map(x => fmtShort(x.date)), h.map(x => x.w), 'Body weight', '#f2f2f0');
}

// ---------- more ----------
function renderMore(v) {
  const custom = S.exercises.filter(e => e.custom);
  v.innerHTML = `
    <h2>Settings</h2>
    <div class="list">
      <div class="planrow" style="grid-template-columns:1fr 120px"><b>Units</b><select data-act="set" data-k="unit"><option ${U() === 'lb' ? 'selected' : ''}>lb</option><option ${U() === 'kg' ? 'selected' : ''}>kg</option></select></div>
      <div class="planrow" style="grid-template-columns:1fr 120px"><b>Rest timer (sec)</b><input inputmode="numeric" data-act="set" data-k="rest" value="${S.settings.rest}"></div>
      <div class="planrow" style="grid-template-columns:1fr 120px"><b>Weight jump when you hit all reps</b><input inputmode="decimal" data-act="set" data-k="inc" value="${S.settings.inc}"></div>
    </div>
    <h2>My exercises</h2>
    <div class="list">${custom.map(e => `<div class="item"><span class="grow"><span class="title">${esc(e.name)}</span> <span class="small muted">${esc(e.group)}</span></span><button class="iconbtn" data-act="del-custom" data-ex="${e.id}" aria-label="Delete">${ICON.trash}</button></div>`).join('') || '<div class="item muted small">Custom exercises you add will show here.</div>'}</div>
    <h2>Backup</h2>
    <p class="small muted" style="margin-top:0">Your data lives on this phone only. Export a backup now and then (save it to Files or iCloud Drive). Import it to restore or move to a new phone.</p>
    <div class="row"><button class="btn grow" data-act="export">Export backup</button><label class="btn grow" style="cursor:pointer">Import backup<input type="file" accept=".json,application/json" data-act="import" hidden></label></div>
    <h2>Add to iPhone home screen</h2>
    <div class="card small"><ol style="margin:0;padding-left:18px">
      <li>Open this app's link in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (square with arrow).</li><li>Tap <b>Add to Home Screen</b>, then <b>Add</b>.</li><li>Open it from the new Lift Log icon — it runs full screen and works offline.</li></ol>
      <p class="muted" style="margin-bottom:0">To share with your wife: text her the same link. Her phone keeps its own separate workouts and history.</p></div>
    <h2>Reset</h2>
    <button class="btn danger block" data-act="reset-all">Erase all data on this phone</button>
    <p class="small muted">Storage: ${Store.mode === 'device' ? 'saved on this device' : 'preview mode — sample data, not saved'} · ${S.sessions.filter(s => s.finishedAt).length} workouts · ${S.body.length} weigh-ins</p>`;
}

// ---------- events ----------
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-act], .tab'); if (!t) return;
  if (t.classList.contains('tab')) return go(t.dataset.tab);
  const a = t.dataset.act, ds = t.dataset.date;
  const s = activeS();
  switch (a) {
    case 'cal-prev': ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() - 1, 1); render(); break;
    case 'cal-next': ui.calMonth = new Date(ui.calMonth.getFullYear(), ui.calMonth.getMonth() + 1, 1); render(); break;
    case 'pick-day': {
      ui.sel = ds; const d = parseYmd(ds);
      if (d.getMonth() !== ui.calMonth.getMonth()) ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      render(); setTimeout(() => { const h = document.querySelector('.view h2'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); break;
    }
    case 'change-day': workoutPicker(ds); break;
    case 'set-day': S.overrides[ds] = t.dataset.wid; save(); closeSheet(); render(); toast('Day updated'); break;
    case 'reset-day': delete S.overrides[ds]; save(); render(); break;
    case 'start': openSession(createSession(ds)); break;
    case 'open-session': openSession(sessionFor(ds)); break;
    case 'delete-session': if (confirm('Delete this workout log?')) { S.sessions = S.sessions.filter(x => x.date !== ds); save(); render(); } break;
    case 'close-sheet': closeSheet(); if (ui.tab === 'plan') render(); break;

    // workout
    case 'w-close': save(); closeWorkout(); break;
    case 'w-rename': { const n = prompt('Workout name', s.name); if (n) { s.name = n.trim(); save(); renderWorkout(); } break; }
    case 'w-done': { const st = s.entries[+t.dataset.i].sets[+t.dataset.k]; st.done = !st.done; save(); t.closest('tr').classList.toggle('done', st.done); if (st.done) startRest(); break; }
    case 'w-add-set': { const e = s.entries[+t.dataset.i]; const l = e.sets[e.sets.length - 1] || { w: '', r: e.targetReps || 8 }; e.sets.push({ w: l.w, r: l.r, done: false }); save(); renderWorkout(); break; }
    case 'w-rem-set': { const e = s.entries[+t.dataset.i]; if (e.sets.length > 1) { e.sets.pop(); save(); renderWorkout(); } break; }
    case 'w-del-ex': if (confirm('Remove ' + exById(s.entries[+t.dataset.i].exId).name + ' from this workout?')) { s.entries.splice(+t.dataset.i, 1); save(); renderWorkout(); } break;
    case 'w-swap': { const e = s.entries[+t.dataset.i]; exercisePicker({ kind: 'swap', i: +t.dataset.i, group: exById(e.exId).group }, 'Swap ' + exById(e.exId).name); break; }
    case 'w-add-ex': exercisePicker({ kind: 'add-session' }, 'Add exercise'); break;
    case 'w-finish': {
      const any = s.entries.some(e => e.sets.some(x => x.done));
      if (!any && !confirm('No sets are checked off yet. Mark every filled-in set as done and save?')) break;
      if (!any) s.entries.forEach(e => e.sets.forEach(x => { if (x.r !== '' && x.r != null) x.done = true; }));
      s.finishedAt = s.finishedAt || Date.now(); save(); closeWorkout(); toast('Workout saved'); break;
    }
    case 'rest-adj': if (ui.rest) ui.rest.left = Math.max(5, ui.rest.left + +t.dataset.d); break;
    case 'rest-stop': stopRest(); break;

    // exercise picker
    case 'pick-ex': applyPick(t.dataset.ex); break;
    case 'add-ex-pick': {
      const n = $('#newExName').value.trim(); if (!n) { toast('Type a name first'); break; }
      const e = { id: 'c-' + uid(), name: n, group: $('#newExGroup').value, custom: true }; S.exercises.push(e); save(); applyPick(e.id); break;
    }

    // plan
    case 'edit-wk': editWorkout(t.dataset.wid); break;
    case 'new-wk': { const w = { id: uid(), name: 'New workout', exercises: [] }; S.workouts.push(w); save(); render(); editWorkout(w.id); break; }
    case 'wk-add': exercisePicker({ kind: 'add-tmpl' }, 'Add exercise'); break;
    case 'wk-rem': { const w = wkById(ui.editing); w.exercises.splice(+t.dataset.i, 1); save(); editWorkout(w.id); break; }
    case 'wk-move': { const w = wkById(ui.editing), i = +t.dataset.i; if (i > 0) { [w.exercises[i - 1], w.exercises[i]] = [w.exercises[i], w.exercises[i - 1]]; save(); editWorkout(w.id); } break; }
    case 'wk-delete': {
      const w = wkById(ui.editing); if (!confirm('Delete workout "' + w.name + '"? Past logs are kept.')) break;
      S.workouts = S.workouts.filter(x => x.id !== w.id);
      Object.keys(S.schedule).forEach(d => { if (S.schedule[d] === w.id) S.schedule[d] = null; });
      Object.keys(S.overrides).forEach(d => { if (S.overrides[d] === w.id) delete S.overrides[d]; });
      save(); closeSheet(); render(); break;
    }

    // progress / body
    case 'prog-metric': ui.prog.metric = t.dataset.m; render(); break;
    case 'prog-range': ui.prog.range = +t.dataset.r; render(); break;
    case 'bw-range': ui.bodyRange = +t.dataset.r; render(); break;
    case 'bw-save': {
      const w = num($('#bwIn').value), d = $('#bwDate').value || todayStr();
      if (!w) { toast('Enter a weight'); break; }
      S.body = S.body.filter(x => x.date !== d); S.body.push({ date: d, w: Math.round(w * 10) / 10 }); save(); render(); toast('Weight logged'); break;
    }
    case 'bw-del': if (confirm('Delete this weigh-in?')) { S.body = S.body.filter(x => x.date !== ds); save(); render(); } break;

    // more
    case 'del-custom': if (confirm('Delete this exercise? Past logs keep their numbers.')) { S.exercises = S.exercises.filter(e => e.id !== t.dataset.ex); save(); render(); } break;
    case 'export': exportData(); break;
    case 'reset-all': if (confirm('Erase ALL workouts, plans, and weigh-ins on this phone? Export a backup first if unsure.') && confirm('Really erase everything?')) { S = defaultData(); save(); render(); toast('Reset done'); } break;
  }
});

function applyPick(exId) {
  const c = ui.sheetCtx; if (!c) return;
  if (c.kind === 'swap' || c.kind === 'add-session') {
    const s = activeS();
    if (c.kind === 'swap') {
      const e = s.entries[c.i]; const g = suggest(exId, e.targetSets || e.sets.length, e.targetReps || 8, s.date, s.id);
      s.entries[c.i] = { exId, targetSets: e.targetSets || e.sets.length, targetReps: e.targetReps || 8, sets: g.sets };
    } else {
      const g = suggest(exId, 3, 10, s.date, s.id); s.entries.push({ exId, targetSets: 3, targetReps: 10, sets: g.sets });
    }
    save(); closeSheet(); renderWorkout();
  } else if (c.kind === 'add-tmpl') {
    const w = wkById(ui.editing); w.exercises.push({ exId, sets: 3, reps: 10 }); save(); editWorkout(w.id);
  }
}

document.addEventListener('input', (ev) => {
  const t = ev.target, a = t.dataset && t.dataset.act; if (!a) return;
  if (a === 'w-in') { const s = activeS(); s.entries[+t.dataset.i].sets[+t.dataset.k][t.dataset.f] = t.value.trim(); save(); }
  else if (a === 'ex-search') {
    const q = t.value.toLowerCase().trim();
    document.querySelectorAll('#exList .pick').forEach(p => p.style.display = !q || p.dataset.name.includes(q) ? '' : 'none');
    document.querySelectorAll('#exList .group-h').forEach(h => h.style.display = q ? 'none' : '');
  }
  else if (a === 'wk-name') { wkById(ui.editing).name = t.value; save(); }
  else if (a === 'wk-field') { const v = Math.max(1, parseInt(t.value, 10) || 1); wkById(ui.editing).exercises[+t.dataset.i][t.dataset.f] = v; save(); }
});
document.addEventListener('change', (ev) => {
  const t = ev.target, a = t.dataset && t.dataset.act; if (!a) return;
  if (a === 'sched') { S.schedule[t.dataset.d] = t.value || null; save(); render(); toast(DOW_LONG[t.dataset.d] + ' updated'); }
  else if (a === 'prog-ex') { ui.prog.ex = t.value; render(); }
  else if (a === 'set') { const k = t.dataset.k; S.settings[k] = k === 'unit' ? t.value : Math.max(k === 'rest' ? 10 : 0.5, num(t.value)); save(); toast('Saved'); }
  else if (a === 'import') importData(t.files[0]);
});
$('#sheet').addEventListener('click', ev => { if (ev.target.id === 'sheet') { closeSheet(); if (ui.tab === 'plan') render(); } });
$('#todayBtn').addEventListener('click', () => { const d = new Date(); ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1); ui.sel = todayStr(); render(); });

function exportData() {
  const name = 'liftlog-backup-' + todayStr() + '.json';
  const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: 'Lift Log backup' }).catch(() => {}); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function importData(f) {
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try { const d = JSON.parse(r.result); if (!d.workouts || !d.sessions) throw 0;
      if (!confirm('Replace everything on this phone with this backup?')) return;
      S = d; save(); render(); toast('Backup restored');
    } catch (e) { alert('That file is not a Lift Log backup.'); }
  };
  r.readAsText(f);
}

go('calendar');
})();
