/* علاء الشريف — exam platform. Plain JS single-page app: hash router, localStorage database. */
(() => {
'use strict';

// ---------- storage ----------
const KEY = 'alaa-db', SESSION = 'alaa-session', THEME = 'alaa-theme', EXAM = 'alaa-exam', LOCK = 'alaa-lock';
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};
const clone = o => JSON.parse(JSON.stringify(o));
let DB = (() => { const d = store.get(KEY); return d && d.version === SEED.version ? d : clone(SEED); })();
const save = () => store.set(KEY, DB);
const UI = { stage: 'tawjihi', act: {}, faq: 0, lb: null, menu: false, pin: ['', '', '', ''], su: { step: 1 }, review: 'wrong',
  rf: 'all', board: 'grade', sidebar: true, qf: {}, edit: null, aud: {}, msg: null, sent: {}, setTab: 'general', draft: null, account: false };

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const LET = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي'];
const num = n => Number(n).toLocaleString('en-US');
const fmt = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const day = d => new Date(d).toLocaleDateString('ar-JO-u-nu-latn', { day: 'numeric', month: 'long' });
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (d, n) => (Date.now() - new Date(d).getTime()) / 864e5 <= n;
const S = () => DB.settings;

const hsl = hex => {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s * 100, l * 100];
};
const orbBg = (hex, grey) => {
  let [h, s, l] = hsl(hex || '#5A45D6'); s = grey ? 6 : Math.max(s, 58);
  const L = Math.min(Math.max(l, 30), 58);
  return `radial-gradient(55% 55% at 30% 24%, hsl(${h + 25} ${s}% ${Math.min(L + 30, 86)}%) 0%, transparent 70%),` +
    `radial-gradient(50% 50% at 76% 72%, hsl(${h - 25} ${s}% ${Math.min(L + 14, 70)}%) 0%, transparent 72%),` +
    `radial-gradient(65% 65% at 58% 42%, hsl(${h} ${s}% ${L + 8}%) 0%, transparent 80%),` +
    `radial-gradient(circle at 50% 50%, hsl(${h} ${s}% ${L}%) 0%, hsl(${h - 10} ${s}% ${Math.max(L - 18, 14)}%) 100%)`;
};
const orb = (hex, size, extra = '', inner = '', grey = false) =>
  `<div class="orb ${extra}" style="width:${size}px;height:${size}px;background:${orbBg(hex, grey)}">${inner}</div>`;
const band = p => p <= 50 ? 'danger' : p <= 70 ? 'warn' : p <= 83 ? 'good' : 'success';
const BAND_MSG = { danger: 'ادرس أكثر', warn: 'تحتاج تثبيتاً', good: 'أحسنت، ويمكنك الأفضل', success: 'أبدعت' };
const pctChip = p => `<span class="pct" style="background:color-mix(in oklab,var(--${band(p)}) 18%,var(--card))">${p}%</span>`;
const ring = (p, size, sw, color, inner) => {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${sw}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(p, 100) / 100)}" style="transition:stroke-dashoffset .6s var(--ease)"/></svg><div class="v">${inner}</div></div>`;
};
const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2200); };
const normPhone = p => { let d = String(p).replace(/\D/g, ''); if (d.startsWith('962')) d = '0' + d.slice(3); if (d.length === 9 && d[0] === '7') d = '0' + d; return d; };
const intlPhone = p => { const d = normPhone(p); return d.startsWith('0') ? '962' + d.slice(1) : d; };
const ytId = v => { if (!v) return ''; const m = String(v).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : /^[\w-]{11}$/.test(v) ? v : ''; };

// ---------- data queries ----------
const grade = id => DB.grades.find(g => g.id === id);
const contentGrade = id => { const g = grade(id); return g && g.same ? g.same : id; };
const unit = id => DB.units.find(u => u.id === id);
const lesson = id => DB.lessons.find(l => l.id === id);
const unitsOf = gid => DB.units.filter(u => u.grade === contentGrade(gid));
const lessonsOf = uid => DB.lessons.filter(l => l.unit === uid);
const qsOfLesson = lid => DB.questions.filter(q => q.lesson === lid);
const qsOfUnit = uid => lessonsOf(uid).flatMap(l => qsOfLesson(l.id));
const gradeOfLesson = lid => { const l = lesson(lid); return l && unit(l.unit)?.grade; };
const me = () => DB.students.find(s => s.id === store.get(SESSION));
const attemptsOf = sid => DB.attempts.filter(a => a.student === sid);
const best = (sid, key) => { const xs = DB.attempts.filter(a => a.student === sid && a.key === key); return xs.length ? Math.max(...xs.map(a => a.pct)) : null; };
const points = s => {
  const by = {};
  attemptsOf(s.id).forEach(a => { by[a.key] = Math.max(by[a.key] || 0, a.correct); });
  return (s.bonus || 0) + Object.values(by).reduce((x, y) => x + y * 10, 0);
};
const ranking = gid => DB.students.filter(s => !gid || s.grade === gid).map(s => ({ s, pts: points(s) })).sort((a, b) => b.pts - a.pts);
const examInfo = key => {
  const [t, id] = key.split(':');
  if (t === 'L') { const l = lesson(id); if (!l) return null; const qs = qsOfLesson(id).slice(0, 15); return { key, title: l.name, sub: unit(l.unit)?.name, qs, unit: l.unit, lesson: id, type: 'L' }; }
  const u = unit(id); if (!u) return null; const qs = qsOfUnit(id).slice(0, 30);
  return { key, title: 'مراجعة ' + u.name, sub: 'مراجعة الوحدة', qs, unit: id, type: 'U' };
};
const minutesFor = n => Math.max(3, n);

// ---------- theme ----------
const applyTheme = () => {
  const t = store.get(THEME) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#0E0E0F' : '#FAF9F7');
  return t;
};

// ---------- router ----------
const route = () => (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
const go = p => { location.hash = '#/' + p; };
let lastPath = '';

function render() {
  applyTheme();
  const r = route(), [a, b, c] = r;
  const path = r.join('/');
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
  let html;
  if (!a) html = vHome();
  else if (a === 'signin') html = vSignin();
  else if (a === 'signup') html = vSignup();
  else if (a === 'app' || a === 'exam' || a === 'result') {
    if (!me()) { store.del(SESSION); go('signin'); return; }
    if (a === 'exam') html = vExam(b + ':' + c);
    else if (a === 'result') html = vResult(b);
    else html = vApp(b, c);
  } else if (a === 'admin') html = sessionStorage.getItem('alaa-admin') === '1' ? vAdmin(b) : vAdminGate();
  else html = vNotFound();
  $('#app').innerHTML = html;
  afterRender(a);
}
function afterRender(a) {
  if (a === 'signin' || a === 'signup') { const f = document.querySelector('[data-autofocus]'); if (f && !f.value) f.focus(); }
}
window.addEventListener('hashchange', render);

// =====================================================================
// PUBLIC SITE
// =====================================================================
const siteHeader = () => `
<header class="wrap site-head">
  <a class="brand" href="#/">${esc(S().teacher)}</a>
  <nav>
    <a href="#/" onclick="A.scroll('grades');return false">الصفوف</a>
    <a href="#/" onclick="A.scroll('videos');return false">الفيديوهات</a>
    <a href="#/" onclick="A.scroll('board');return false">لوحة الشرف</a>
    <a href="#/" onclick="A.scroll('about');return false">عن الأستاذ</a>
  </nav>
  <div class="actions">
    <button class="icon-btn" title="تبديل المظهر" onclick="A.toggleTheme()"><i class="ph ph-${document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon'}"></i></button>
    ${me() ? `<a class="btn btn-ink" href="#/app">حسابي</a>` : `<a class="btn hide-sm" href="#/signin">تسجيل الدخول</a><a class="btn btn-ink" href="#/signup">ابدأ مجاناً</a>`}
    <button class="icon-btn menu-btn" onclick="A.set('menu',true)" aria-label="القائمة"><i class="ph ph-list"></i></button>
  </div>
</header>
${UI.menu ? `<div class="mobile-menu" onclick="A.set('menu',false)"><div class="sheet" onclick="event.stopPropagation()">
  <a href="#/" onclick="A.scroll('grades');return false">الصفوف</a><a href="#/" onclick="A.scroll('videos');return false">الفيديوهات</a>
  <a href="#/" onclick="A.scroll('board');return false">لوحة الشرف</a><a href="#/" onclick="A.scroll('about');return false">عن الأستاذ</a>
  ${me() ? '' : `<a href="#/signin">تسجيل الدخول</a>`}
  <button class="btn btn-ink btn-lg" style="margin-top:12px" onclick="A.set('menu',false)">إغلاق</button></div></div>` : ''}`;

function vHome() {
  const st = DB.settings, stages = DB.stages;
  const items = DB.grades.filter(g => g.stage === UI.stage);
  const ai = Math.min(UI.act[UI.stage] ?? 0, items.length - 1), cur = items[ai];
  const side = (o) => items[ai + o];
  const carItem = (g, o) => {
    if (!g) return `<div style="width:220px"></div>`;
    const cen = o === 0, n = unitsOf(g.id).length;
    return `<div class="it ${cen ? '' : 'side'}" onclick="${cen ? (g.soon ? '' : `A.startGrade('${g.id}')`) : `A.pickGrade(${ai + o})`}">
      ${orb(g.color, cen ? 220 : 170, cen && !g.soon ? 'play' : '', cen && !g.soon ? '<i class="ph-fill ph-play"></i>' : '', g.soon)}
      <div class="nm">${esc(g.name)}</div><div class="muted" style="font-size:13px;margin-top:-10px">${g.soon ? 'قريباً' : esc(g.desc) + (n ? ` · ${n} وحدات` : '')}</div></div>`;
  };
  const boardGrades = [...new Set(DB.students.map(s => s.grade))].map(grade).filter(Boolean).slice(0, 3);
  const lbG = UI.lb || boardGrades[0]?.id;
  const rows = ranking(lbG).slice(0, 5);
  const vids = DB.lessons.slice().sort((x, y) => (ytId(y.video) ? 1 : 0) - (ytId(x.video) ? 1 : 0)).slice(0, 4);
  const MED = ['#D4A62A', '#A8ADB4', '#B87333'];
  return `${siteHeader()}
<main class="wrap">
  <section class="hero">
    <div><h1>${esc(st.headline)}</h1>
      <div class="row" style="margin-top:20px"><a class="btn btn-ink btn-lg" href="#/${me() ? 'app' : 'signup'}">ابدأ مجاناً</a><button class="btn btn-lg" onclick="A.scroll('videos')">شاهد الشروحات</button></div></div>
    <p>${esc(st.intro)}</p>
  </section>

  <section class="stage-panel" id="grades">
    <div class="stage-tabs">${stages.map(s => `<button class="${s.id === UI.stage ? 'on' : ''}" onclick="A.set('stage','${s.id}')"><span class="dot" style="background:${orbBg(DB.grades.find(g => g.stage === s.id)?.color)}"></span>${esc(s.name)}</button>`).join('')}</div>
    <div class="carousel">
      <button class="arrow" onclick="A.pickGrade(${ai - 1})" ${ai > 0 ? '' : 'disabled style="opacity:.3"'} aria-label="السابق"><i class="ph ph-caret-right"></i></button>
      ${carItem(side(-1), -1)}${carItem(cur, 0)}${carItem(side(1), 1)}
      <button class="arrow" onclick="A.pickGrade(${ai + 1})" ${ai < items.length - 1 ? '' : 'disabled style="opacity:.3"'} aria-label="التالي"><i class="ph ph-caret-left"></i></button>
    </div>
    <div class="stage-foot">
      <span class="chip" style="background:var(--card)">امتحانات الدروس</span><span class="chip">مراجعات</span><span class="chip">لوحة الشرف</span><span class="chip">فيديوهات</span>
      <a class="chip" href="${esc(st.channel)}" target="_blank" rel="noopener">قناة واتساب</a>
      <span class="grow"></span>${cur && !cur.soon ? `<button class="btn btn-ink" onclick="A.startGrade('${cur.id}')">ابدأ مجاناً</button>` : ''}
    </div>
  </section>

  <section class="stats">
    <div><b>${num(DB.students.length)}</b><span>طالب وطالبة</span></div>
    <div><b>${num(DB.attempts.length)}</b><span>امتحان منجز</span></div>
    <div><b>${num(DB.questions.length)}</b><span>سؤال</span></div>
    <div><b>${num(DB.lessons.length)}</b><span>درس وشرح</span></div>
  </section>

  <h2 class="section-title">ثلاث خطوات، كل يوم</h2>
  <div class="steps">${[['سجّل برقم هاتفك', 'اسمك وصفّك ورقم سري من 4 أرقام. لا بريد ولا كلمات مرور طويلة.', '#E8552B'],
    ['خذ امتحان الدرس', 'امتحان قصير لكل درس من الكتاب، ومراجعة شاملة لكل وحدة.', '#5A45D6'],
    ['راجع أخطاءك', 'ترى الإجابة الصحيحة وسببها، والفيديو الذي يشرح الدرس.', '#3FBF8F']].map((s, i) =>
    `<div class="card"><div class="row" style="justify-content:space-between">${orb(s[2], 44)}<span class="n">0${i + 1}</span></div><h3 style="margin:16px 0 6px;font-size:17px">${s[0]}</h3><p class="muted" style="font-size:14px">${s[1]}</p></div>`).join('')}</div>

  <section class="split">
    <div class="card" id="board">
      <div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px"><h3 style="font-size:18px">لوحة الشرف</h3>
        <div class="seg">${boardGrades.map(g => `<button class="${g.id === lbG ? 'on' : ''}" onclick="A.set('lb','${g.id}')">${esc(g.short)}</button>`).join('')}</div></div>
      ${rows.map((r, i) => `<div class="lb-row"><span class="rank" style="${i < 3 ? `background:${orbBg(MED[i])};color:#fff` : ''}">${i + 1}</span><span>${esc(r.s.name)}</span><b>${num(r.pts)}</b></div>`).join('') || '<p class="muted">لا يوجد طلاب بعد.</p>'}
      <p class="faint" style="font-size:12px;margin-top:10px">النقاط = مجموع أعلى علامة في كل امتحان</p>
    </div>
    <div id="videos">
      <div class="row" style="justify-content:space-between;margin-bottom:14px"><h3 style="font-size:18px">أحدث الشروحات</h3><a href="#/${me() ? 'app/videos' : 'signup'}">كل الفيديوهات</a></div>
      <div class="videos">${vids.map(l => thumbCard(l, me() ? `#/app/lesson/${l.id}` : '#/signup')).join('')}</div>
    </div>
  </section>

  <section class="about" id="about">
    <div class="avatar-orb" style="background:${orbBg('#5A45D6')}">${esc(st.initial)}</div>
    <div><div class="muted" style="font-size:13px">عن الأستاذ</div><h2 style="font-size:30px;margin:4px 0 10px">الأستاذ ${esc(st.teacher)}</h2>
      <p class="muted" style="max-width:560px">${esc(st.about)}</p>
      <div class="socials">
        <a class="btn btn-sm" href="${esc(st.youtube)}" target="_blank" rel="noopener"><i class="ph ph-youtube-logo"></i>يوتيوب</a>
        <a class="btn btn-sm" href="${esc(st.instagram)}" target="_blank" rel="noopener"><i class="ph ph-instagram-logo"></i>إنستغرام</a>
        <a class="btn btn-sm" href="${esc(st.facebook)}" target="_blank" rel="noopener"><i class="ph ph-facebook-logo"></i>فيسبوك</a>
        <a class="btn btn-sm" href="https://wa.me/${esc(st.whatsapp)}" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i>واتساب</a>
      </div></div>
  </section>

  <section class="faq">
    <h2 class="display" style="font-size:40px">أسئلة شائعة</h2>
    <div>${st.faq.map((f, i) => `<div class="faq-item"><button onclick="A.set('faq',${UI.faq === i ? -1 : i})">${esc(f[0])}<i class="ph ph-${UI.faq === i ? 'minus' : 'plus'}"></i></button>${UI.faq === i ? `<p>${esc(f[1])}</p>` : ''}</div>`).join('')}</div>
  </section>

  <footer class="site-foot"><span class="brand">${esc(st.teacher)}</span><a href="https://wa.me/${esc(st.whatsapp)}" target="_blank" rel="noopener" style="color:var(--muted)">تواصل معنا</a><a href="#/admin" style="color:var(--muted)">لوحة الإدارة</a><span class="grow"></span><span>${esc(st.domain)} © ${new Date().getFullYear()}</span></footer>
</main>`;
}
const thumbCard = (l, href) => {
  const id = ytId(l.video), u = unit(l.unit);
  return `<a href="${href}" style="color:var(--ink)"><div class="thumb">${id ? `<img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">` : ''}<span class="pl"><i class="ph-fill ph-play"></i></span>${l.dur ? `<span class="dur">${esc(l.dur)}</span>` : ''}</div>
    <div class="vid-meta"><b>شرح درس ${esc(l.name)}</b><span>${esc(u?.name || '')}</span></div></a>`;
};

// ---------- sign in / sign up ----------
const pinInputs = (name) => `<div class="pins">${[0, 1, 2, 3].map(i => `<input inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="رقم ${i + 1}" data-pin="${name}" data-i="${i}" value="${esc(UI.pin[i])}" oninput="A.pin(event)" onkeydown="A.pinKey(event)">`).join('')}</div>`;
const authArt = (hex) => `<div class="art">${orb(hex, 520)}<div style="position:absolute;bottom:40px;inset-inline:40px;text-align:center" class="muted">${esc(S().subject)} · ${esc(S().teacher)}</div></div>`;

function vSignin() {
  const lock = store.get(LOCK, { n: 0, until: 0 }), locked = lock.until > Date.now();
  return `<div class="auth"><div class="form">
  <div class="row" style="justify-content:space-between"><a class="ruqaa" style="font-size:24px;color:var(--ink)" href="#/">${esc(S().teacher)}</a><a href="#/" class="muted"><i class="ph ph-arrow-right"></i> الرئيسية</a></div>
  <div class="inner">
    <h1>تسجيل الدخول</h1><p class="muted" style="margin-bottom:28px">أدخل رقم هاتفك ورقمك السري</p>
    <div class="field"><label>رقم الهاتف</label><div class="phone"><input id="phone" type="tel" inputmode="tel" placeholder="07X XXX XXXX" data-autofocus value="${esc(UI.phone || '')}" oninput="UI.phone=this.value" onkeydown="if(event.key==='Enter')A.signin()"><span>+962</span></div></div>
    <div class="field"><label>الرقم السري</label>${pinInputs('in')}</div>
    <div class="err" id="err">${locked ? `محاولات كثيرة خاطئة. حاول بعد ${Math.ceil((lock.until - Date.now()) / 60000)} دقيقة.` : esc(UI.err || '')}</div>
    <button class="btn btn-ink btn-lg btn-block" onclick="A.signin()" ${locked ? 'disabled' : ''}>دخول</button>
    <div class="row" style="justify-content:space-between;margin-top:16px;font-size:14px"><span>ليس لديك حساب؟ <a href="#/signup">أنشئ حساباً</a></span><a class="muted" href="https://wa.me/${esc(S().whatsapp)}?text=${encodeURIComponent('نسيت الرقم السري لحسابي في المنصة')}" target="_blank" rel="noopener">نسيت الرقم السري؟</a></div>
    <p class="faint" style="font-size:12px;margin-top:28px">تجربة: 0790000000 · الرقم السري 1234</p>
  </div></div>${authArt('#5A45D6')}</div>`;
}

function vSignup() {
  const su = UI.su, step = su.step;
  const body = step === 1 ? `
    <div class="field"><label>الاسم الكامل</label><input class="input" data-autofocus placeholder="مثال: سارة محمود" value="${esc(su.name || '')}" oninput="UI.su.name=this.value"></div>
    <div class="field"><label>رقم الهاتف</label><div class="phone"><input type="tel" inputmode="tel" placeholder="07X XXX XXXX" value="${esc(su.phone || '')}" oninput="UI.su.phone=this.value"><span>+962</span></div></div>`
  : step === 2 ? `<div class="field"><label>اختر صفّك</label></div><div class="grade-grid">${DB.grades.map(g => `<button class="${su.grade === g.id ? 'on' : ''}" ${g.soon ? 'disabled' : ''} onclick="UI.su.grade='${g.id}';A.r()">${orb(g.color, 48, '', '', g.soon)}${esc(g.short)}${g.soon ? '<small class="faint">قريباً</small>' : ''}</button>`).join('')}</div>`
  : `<div class="field"><label>اختر رقماً سرياً من 4 أرقام</label>${pinInputs('up')}</div>
     <label class="row" style="font-size:14px;margin:8px 0"><input type="checkbox" ${su.terms !== false ? "checked" : ""} onchange="UI.su.terms=this.checked"> أوافق على شروط استخدام المنصة</label>
     <label class="row" style="font-size:14px"><input type="checkbox" ${su.wa !== false ? 'checked' : ''} onchange="UI.su.wa=this.checked"> أرسلوا لي تنبيهات الامتحانات على واتساب</label>`;
  return `<div class="auth"><div class="form">
  <div class="row" style="justify-content:space-between"><a class="ruqaa" style="font-size:24px;color:var(--ink)" href="#/">${esc(S().teacher)}</a><a href="#/" class="muted"><i class="ph ph-arrow-right"></i> الرئيسية</a></div>
  <div class="inner">
    <h1>إنشاء حساب</h1><p class="muted">الخطوة ${step} من 3 · ${['معلوماتك', 'صفّك', 'رقمك السري'][step - 1]}</p>
    <div class="stepper">${[1, 2, 3].map(i => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
    ${body}
    <div class="err">${esc(UI.err || '')}</div>
    <div class="row">${step > 1 ? `<button class="btn btn-lg" onclick="A.suBack()">رجوع</button>` : ''}<button class="btn btn-ink btn-lg grow" onclick="A.suNext()">${step < 3 ? 'التالي' : 'إنشاء الحساب'}</button></div>
    <p style="margin-top:16px;font-size:14px">لديك حساب؟ <a href="#/signin">سجّل الدخول</a></p>
  </div></div>${authArt(grade(su.grade)?.color || '#E8552B')}</div>`;
}

// =====================================================================
// STUDENT APP
// =====================================================================
const TABS = [['', 'الرئيسية', 'house'], ['units', 'الوحدات', 'stack'], ['results', 'نتائجي', 'chart-line-up'], ['board', 'لوحة الشرف', 'trophy'], ['videos', 'الفيديوهات', 'play-circle']];

function vApp(tab = '', id) {
  const s = me(), g = grade(s.grade);
  const t = tab === 'unit' ? 'units' : tab === 'lesson' ? 'units' : tab;
  let body;
  if (!tab) body = vStudentHome(s);
  else if (tab === 'units') body = vUnits(s);
  else if (tab === 'unit') body = vUnit(s, id);
  else if (tab === 'lesson') body = vLesson(s, id);
  else if (tab === 'results') body = vResults(s);
  else if (tab === 'board') body = vBoard(s);
  else if (tab === 'videos') body = vVideos(s);
  else body = vNotFound(true);
  return `${UI.hideChannel ? '' : `<div class="channel"><i class="ph ph-whatsapp-logo"></i> قناة ${esc(g?.short || '')} على واتساب — امتحانات جديدة وتنبيهات <a href="${esc(S().channel)}" target="_blank" rel="noopener"><b>انضم</b></a><button class="btn-ghost" style="border:0;background:none;color:var(--muted)" onclick="UI.hideChannel=true;A.r()" aria-label="إخفاء"><i class="ph ph-x"></i></button></div>`}
  <header class="topbar"><div class="wrap in">
    <a class="brand" href="#/">${esc(S().teacher)}</a>
    <nav>${TABS.map(([k, l]) => `<a class="${k === t ? 'on' : ''}" href="#/app${k ? '/' + k : ''}">${l}</a>`).join('')}</nav>
    <button class="me" onclick="A.set('account',true)"><span class="muted hide-sm">${esc(g?.short || '')}</span><span class="av">${esc(s.name.trim()[0] || '؟')}</span></button>
  </div></header>
  <main class="wrap app-main">${body}</main>
  <nav class="tabbar">${TABS.map(([k, l, ic]) => `<a class="${k === t ? 'on' : ''}" href="#/app${k ? '/' + k : ''}"><i class="ph${k === t ? '-fill' : ''} ph-${ic}"></i>${l}</a>`).join('')}</nav>
  ${UI.account ? vAccount(s) : ''}`;
}

function vAccount(s) {
  const dark = document.documentElement.dataset.theme === 'dark';
  return `<div class="modal" onclick="A.set('account',false)"><div class="box" onclick="event.stopPropagation()">
    <div class="row" style="gap:14px;margin-bottom:20px"><span class="me"><span class="av" style="width:56px;height:56px;font-size:22px">${esc(s.name.trim()[0])}</span></span><div><h3 style="margin:0">${esc(s.name)}</h3><span class="muted" style="direction:ltr;display:inline-block">${esc(s.phone)}</span></div></div>
    <div class="field"><label>الصف</label><select class="input" onchange="A.changeGrade(this.value)">${DB.grades.filter(g => !g.soon).map(g => `<option value="${g.id}" ${g.id === s.grade ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
    <div class="row" style="justify-content:space-between;padding:10px 0;border-top:1px solid var(--line)"><span>الوضع الداكن</span><button class="btn btn-sm" onclick="A.toggleTheme()">${dark ? 'إيقاف' : 'تشغيل'}</button></div>
    <div class="row" style="justify-content:space-between;padding:10px 0;border-top:1px solid var(--line)"><span>رسائل واتساب</span><button class="btn btn-sm" onclick="A.toggleWa()">${s.noWa ? 'تفعيل' : 'إيقاف'}</button></div>
    <div class="row" style="margin-top:16px"><button class="btn btn-danger" onclick="A.logout()"><i class="ph ph-sign-out"></i>تسجيل الخروج</button><span class="grow"></span><button class="btn btn-ink" onclick="A.set('account',false)">تم</button></div>
  </div></div>`;
}

const unitProgress = (s, u) => { const ls = lessonsOf(u.id); const done = ls.filter(l => best(s.id, 'L:' + l.id) != null).length; return { done, total: ls.length, pct: ls.length ? Math.round(done / ls.length * 100) : 0 }; };
const nextUp = s => {
  for (const u of unitsOf(s.grade)) {
    for (const l of lessonsOf(u.id)) if (qsOfLesson(l.id).length && best(s.id, 'L:' + l.id) == null) return { l, u };
  }
  return null;
};

function vStudentHome(s) {
  const h = new Date().getHours(), units = unitsOf(s.grade), nx = nextUp(s);
  const weak = DB.lessons.filter(l => unitsOf(s.grade).some(u => u.id === l.unit)).map(l => ({ l, b: best(s.id, 'L:' + l.id) })).filter(x => x.b != null && x.b <= 70).sort((a, b) => a.b - b.b).slice(0, 4);
  const todayN = attemptsOf(s.id).filter(a => a.date.slice(0, 10) === today()).length, goal = S().dailyGoal || 3;
  const rk = ranking(s.grade), pos = rk.findIndex(r => r.s.id === s.id) + 1;
  const left = Math.max(0, goal - todayN);
  return `<div class="app-grid"><div>
    <div class="greet"><h1>${h < 12 ? 'صباح الخير' : 'مساء الخير'}، ${esc(s.name.split(' ')[0])}</h1><p class="muted">${esc(grade(s.grade)?.name || '')}</p></div>
    ${nx ? `<div class="continue">${orb(nx.u.color, 110, 'play', '<i class="ph-fill ph-play"></i>')}
      <div class="grow"><div class="muted" style="font-size:13px">${attemptsOf(s.id).length ? 'تابع من حيث توقفت' : 'ابدأ من هنا'} · ${esc(nx.u.name)}</div><h2>${esc(nx.l.name)}</h2><div class="muted" style="font-size:13px">شاهد الشرح ثم خذ امتحان الدرس (${qsOfLesson(nx.l.id).length} أسئلة)</div></div>
      <a class="btn btn-ink btn-lg" href="#/app/lesson/${nx.l.id}">تابع <i class="ph ph-arrow-left"></i></a></div>`
      : units.length ? `<div class="continue"><div class="grow"><h2>أنهيت كل الدروس المتاحة 🎉</h2><p class="muted">راجع الوحدات أو أعد الامتحانات لرفع علاماتك.</p></div><a class="btn btn-ink btn-lg" href="#/app/units">الوحدات</a></div>`
      : `<div class="continue"><div class="grow"><h2>المحتوى قادم قريباً</h2><p class="muted">لم تُضف وحدات لصفّك بعد. انضم لقناة واتساب ليصلك التنبيه.</p></div></div>`}
    <h2 style="font-size:22px;margin-bottom:14px">وحداتي</h2>
    <div class="unit-cards">${units.map(u => { const p = unitProgress(s, u); return `<a class="unit-card" href="#/app/unit/${u.id}"><div class="top">${orb(u.color, 64)}<span class="muted" style="font-size:13px">${p.done} من ${p.total}</span></div><b>${esc(u.name)}</b><div class="bar"><i style="width:${p.pct}%"></i></div></a>`; }).join('')}</div>
    ${weak.length ? `<h2 style="font-size:22px;margin:32px 0 14px">دروس تحتاج تثبيتاً</h2><div class="list">${weak.map(w => `<a class="li" href="#/app/lesson/${w.l.id}">${pctChip(w.b)}<span class="grow">${esc(w.l.name)}</span><span class="muted" style="font-size:13px">${esc(unit(w.l.unit)?.name || '')}</span><span style="color:var(--accent);font-weight:600"><i class="ph-fill ph-play-circle"></i> شاهد الشرح</span></a>`).join('')}</div>` : ''}
  </div>
  <aside>
    <div class="card side-card"><div class="row" style="gap:14px">${ring(todayN / goal * 100, 64, 6, 'var(--ink)', `${Math.min(todayN, goal)}/${goal}`)}<div><b>هدف اليوم</b><div class="muted" style="font-size:13px">${goal} امتحانات كل يوم</div></div></div>
      <p class="muted" style="font-size:14px;margin-top:12px">${left ? `${left === 1 ? 'امتحان واحد' : left === 2 ? 'امتحانان' : left + ' امتحانات'} وتكون أنهيت هدف اليوم.` : 'أنهيت هدف اليوم. أحسنت!'}</p></div>
    <div class="panel side-card"><div class="muted" style="font-size:13px">ترتيبك في ${esc(grade(s.grade)?.short || '')}</div><div class="row" style="align-items:baseline"><b style="font-size:36px">${pos}</b><span class="muted">من ${rk.length}</span></div><div class="muted" style="font-size:13px">${num(points(s))} نقطة</div><a href="#/app/board" style="font-weight:600">لوحة الشرف</a></div>
    <div class="card side-card"><b>آخر النتائج</b>${attemptsOf(s.id).slice(-3).reverse().map(a => `<a class="row" href="#/result/${a.id}" style="color:var(--ink);padding:8px 0;border-bottom:1px solid var(--line)"><span class="grow">${esc(a.title)}</span>${pctChip(a.pct)}</a>`).join('') || '<p class="muted" style="font-size:14px;margin-top:8px">لم تأخذ أي امتحان بعد.</p>'}</div>
  </aside></div>`;
}

function vUnits(s) {
  const units = unitsOf(s.grade);
  return `<h1 style="font-size:30px;margin-bottom:20px">الوحدات</h1>
  ${units.length ? `<div class="unit-cards">${units.map(u => { const p = unitProgress(s, u), b = best(s.id, 'U:' + u.id); return `<a class="unit-card" href="#/app/unit/${u.id}"><div class="top">${orb(u.color, 72)}${b != null ? pctChip(b) : ''}</div><b style="font-size:17px">${esc(u.name)}</b><span class="muted" style="font-size:13px">${p.total} دروس · أنجزت ${p.done}</span><div class="bar"><i style="width:${p.pct}%"></i></div></a>`; }).join('')}</div>` : `<div class="empty">لا توجد وحدات لصفّك بعد.</div>`}`;
}

function examRow(s, key, title, meta, icon, href) {
  const b = best(s.id, key);
  return `<a class="li lesson-item" href="${href}"><span class="circ" style="background:${b != null ? `var(--${band(b)})` : 'transparent'};border:${b != null ? 0 : '1.5px solid var(--line)'}">${b != null ? '<i class="ph ph-check"></i>' : ''}</span>
    <span class="grow"><b style="font-weight:600">${esc(title)}</b><br><span class="muted" style="font-size:12px"><i class="${icon}"></i> ${meta}</span></span>${b != null ? `<span style="color:var(--${band(b)});font-weight:700">${b}%</span>` : ''}<i class="ph ph-caret-left faint"></i></a>`;
}

function vUnit(s, id) {
  const u = unit(id); if (!u) return vNotFound(true);
  const ls = lessonsOf(id), p = unitProgress(s, u), uq = qsOfUnit(id).length;
  return `<a href="#/app/units" class="muted"><i class="ph ph-arrow-right"></i> الوحدات</a>
  <div class="outline-head" style="margin-top:14px">${orb(u.color, 96)}<div><div class="muted" style="font-size:13px">${esc(grade(u.grade)?.name || '')}</div><h1 style="font-size:28px">${esc(u.name)}</h1><div class="muted">${p.done} من ${p.total} دروس</div></div></div>
  <h3 style="margin:0 0 10px">الدروس</h3>
  <div class="list">${ls.map(l => { const n = qsOfLesson(l.id).length; return examRow(s, 'L:' + l.id, l.name, `${n} أسئلة · ${minutesFor(n)} دقائق`, 'ph ph-exam', `#/app/lesson/${l.id}`); }).join('') || '<div class="empty">لا دروس بعد.</div>'}</div>
  <h3 style="margin:24px 0 10px">المراجعة</h3>
  <div class="list">${uq ? examRow(s, 'U:' + id, 'مراجعة الوحدة', `${Math.min(uq, 30)} سؤالاً · ${minutesFor(Math.min(uq, 30))} دقيقة`, 'ph ph-arrows-clockwise', `#/exam/U/${id}`) : '<div class="empty">لا أسئلة بعد.</div>'}</div>`;
}

function vLesson(s, id) {
  const l = lesson(id); if (!l) return vNotFound(true);
  const u = unit(l.unit), n = qsOfLesson(id).length, b = best(s.id, 'L:' + id), yid = ytId(l.video);
  const sib = lessonsOf(l.unit), idx = sib.findIndex(x => x.id === id), nx = sib[idx + 1];
  return `<a href="#/app/unit/${u.id}" class="muted"><i class="ph ph-arrow-right"></i> ${esc(u.name)}</a>
  <div class="lesson-layout" style="margin-top:14px"><div>
    <div class="player">${yid ? `<iframe src="https://www.youtube-nocookie.com/embed/${yid}?rel=0" title="${esc(l.name)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>` : `<div class="thumb" style="height:100%;border:0;border-radius:0"><span class="pl"><i class="ph-fill ph-play"></i></span><span style="position:absolute;bottom:14px">يُضاف الشرح قريباً</span></div>`}</div>
    <div class="muted" style="font-size:13px;margin-top:18px">الدرس ${idx + 1} · ${esc(u.name)}</div>
    <h1 style="font-size:28px;margin:4px 0 18px">${esc(l.name)}</h1>
    <div class="card row" style="flex-wrap:wrap;gap:16px">${orb(u.color, 56)}<div class="grow"><b>امتحان الدرس</b><div class="muted" style="font-size:13px">${n} أسئلة · ${minutesFor(n)} دقائق${b != null ? ` · أفضل علامة ${b}%` : ''}</div></div>
      ${n ? `<a class="btn btn-ink btn-lg" href="#/exam/L/${id}">${b != null ? 'أعد الامتحان' : 'ابدأ الامتحان'}</a>` : `<span class="chip">قريباً</span>`}</div>
  </div>
  <aside><div class="card"><b>دروس الوحدة</b><div style="margin-top:8px">${sib.map((x, i) => { const bb = best(s.id, 'L:' + x.id); return `<a class="row" href="#/app/lesson/${x.id}" style="padding:10px 8px;border-radius:12px;color:var(--ink);${x.id === id ? 'background:var(--surface);font-weight:700' : ''}"><span class="faint" style="width:18px">${i + 1}</span><span class="grow">${esc(x.name)}</span>${bb != null ? `<span style="color:var(--${band(bb)});font-weight:700;font-size:13px">${bb}%</span>` : ''}</a>`; }).join('')}</div>
    <a class="btn btn-block" style="margin-top:12px" href="#/exam/U/${u.id}">مراجعة الوحدة</a>
    ${nx ? `<a class="btn btn-block btn-ghost" style="margin-top:6px" href="#/app/lesson/${nx.id}">الدرس التالي <i class="ph ph-arrow-left"></i></a>` : ''}</div></aside></div>`;
}

function lineChart(series, w, h, labels) {
  const all = series.flatMap(x => x.data), max = Math.max(1, ...all), n = Math.max(...series.map(x => x.data.length));
  const X = i => n > 1 ? 8 + i * (w - 16) / (n - 1) : w / 2, Y = v => h - 18 - v / max * (h - 34);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;direction:ltr">${[0.25, 0.5, 0.75].map(f => `<line x1="0" x2="${w}" y1="${Y(max * f)}" y2="${Y(max * f)}" stroke="var(--line)" stroke-dasharray="3 4"/>`).join('')}
  ${series.map(sr => `<polyline fill="none" stroke="${sr.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${sr.data.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}"/>${sr.dots ? sr.data.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="var(--card)" stroke="${sr.color}" stroke-width="2"/>`).join('') : ''}`).join('')}
  ${labels ? labels.map(([i, t]) => `<text x="${X(i)}" y="${h - 2}" font-size="10" fill="var(--faint)" text-anchor="${i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}">${esc(t)}</text>`).join('') : ''}</svg>`;
}

function vResults(s) {
  const units = unitsOf(s.grade);
  const att = attemptsOf(s.id).filter(a => UI.rf === 'all' || a.unit === UI.rf).slice().reverse();
  const avg = att.length ? Math.round(att.reduce((x, a) => x + a.pct, 0) / att.length) : 0;
  return `<div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px"><h1 style="font-size:30px">نتائجي</h1>
    <div class="seg"><button class="${UI.rf === 'all' ? 'on' : ''}" onclick="A.set('rf','all')">الكل</button>${units.map((u, i) => `<button class="${UI.rf === u.id ? 'on' : ''}" onclick="A.set('rf','${u.id}')">الوحدة ${i + 1}</button>`).join('')}</div></div>
  ${att.length ? `<div class="grid2" style="margin-bottom:16px"><div class="card"><div class="muted" style="font-size:13px">متوسط علاماتك</div><b style="font-size:40px;color:var(--${band(avg)})">${avg}%</b><div class="muted" style="font-size:13px">${att.length} محاولات</div></div>
    <div class="card">${lineChart([{ data: att.slice().reverse().map(a => a.pct), color: 'var(--ink)', dots: true }], 520, 140)}</div></div>
  <div class="list">${att.map(a => `<a class="li" href="#/result/${a.id}">${pctChip(a.pct)}<span class="grow"><b style="font-weight:600">${esc(a.title)}</b><br><span class="muted" style="font-size:12px">${day(a.date)} · ${fmt(a.taken)} دقيقة${a.late ? ' · انتهى الوقت' : ''}</span></span><i class="ph ph-caret-left faint"></i></a>`).join('')}</div>`
  : `<div class="empty">${orb('#9A968F', 90, '', '', true)}<p style="margin-top:16px">لا نتائج بعد. ابدأ بأول امتحان!</p><a class="btn btn-ink" style="margin-top:12px" href="#/app/units">الوحدات</a></div>`}`;
}

function vBoard(s) {
  const rk = ranking(UI.board === 'grade' ? s.grade : null), pos = rk.findIndex(r => r.s.id === s.id);
  const MED = ['#D4A62A', '#A8ADB4', '#B87333'], order = [1, 0, 2];
  return `<div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:12px"><h1 style="font-size:30px">لوحة الشرف</h1>
    <div class="seg"><button class="${UI.board === 'grade' ? 'on' : ''}" onclick="A.set('board','grade')">صفّي</button><button class="${UI.board === 'all' ? 'on' : ''}" onclick="A.set('board','all')">كل الصفوف</button></div></div>
  <div class="podium">${order.map(i => rk[i] ? `<div class="p">${orb(MED[i], i === 0 ? 120 : 92, '', i + 1)}<b>${esc(rk[i].s.name)}</b><span class="muted" style="direction:ltr">${num(rk[i].pts)}</span></div>` : '').join('')}</div>
  <div class="list">${rk.map((r, i) => `<div class="li ${i === pos ? 'pinned' : ''}"><span class="rank">${i + 1}</span><span class="grow">${esc(r.s.name)}${i === pos ? ' (أنت)' : ''}</span><span class="muted" style="font-size:12px">${esc(grade(r.s.grade)?.short || '')}</span><b style="direction:ltr;min-width:60px;text-align:left">${num(r.pts)}</b></div>`).join('')}</div>`;
}

function vVideos(s) {
  const ls = unitsOf(s.grade).flatMap(u => lessonsOf(u.id));
  return `<h1 style="font-size:30px;margin-bottom:20px">الفيديوهات</h1>${ls.length ? `<div class="videos" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${ls.map(l => thumbCard(l, `#/app/lesson/${l.id}`)).join('')}</div>` : '<div class="empty">لا فيديوهات بعد.</div>'}`;
}

// =====================================================================
// EXAM
// =====================================================================
let EX = sessionStorage.getItem(EXAM) ? JSON.parse(sessionStorage.getItem(EXAM)) : null;
const saveEx = () => { if (EX) sessionStorage.setItem(EXAM, JSON.stringify(EX)); else sessionStorage.removeItem(EXAM); };

function vExam(key) {
  const info = examInfo(key);
  if (!info || !info.qs.length) return vNotFound(true);
  if (!EX || EX.key !== key) {
    EX = { key, qs: info.qs.map(q => q.id), ans: {}, flags: {}, cur: 0, mode: 'one', left: minutesFor(info.qs.length) * 60, total: minutesFor(info.qs.length) * 60, started: false, confirm: false, blur: false };
    saveEx();
  }
  const s = me(), qs = EX.qs.map(id => DB.questions.find(q => q.id === id)).filter(Boolean);
  if (!EX.started) return vPreExam(info, qs);
  const answered = Object.keys(EX.ans).length;
  const qCard = (q, i) => {
    const prevPassage = i > 0 && qs[i - 1].passage === q.passage;
    const passage = q.passage && (EX.mode === 'one' || !prevPassage) ? `<div class="passage"><small>النص${EX.mode === 'all' ? ` · للسؤال ${i + 1}${qs.slice(i + 1).filter(x => x.passage === q.passage).length ? ' وما بعده' : ''}` : ''}</small>${esc(q.passage)}</div>` : '';
    return `${passage}<div class="qcard ${EX.mode === 'all' && i === EX.cur ? 'cur' : ''}" id="q${i}">
      <div class="qmeta"><span class="qnum">${i + 1}</span><span>${esc(lesson(q.lesson)?.name || '')}</span><span class="grow"></span>
        <button class="btn btn-sm" style="${EX.flags[i] ? 'border-color:var(--warn);background:color-mix(in oklab,var(--warn) 14%,var(--card))' : ''}" onclick="A.flag(${i})"><i class="ph${EX.flags[i] ? '-fill' : ''} ph-flag"></i>${EX.flags[i] ? 'معلَّم' : 'للمراجعة'}</button></div>
      <div class="qtext">${esc(q.text)}</div>
      <div class="opts ${q.o.length > 4 ? 'many' : ''}">${q.o.map((o, j) => `<button class="opt ${EX.ans[i] === j ? 'sel' : ''}" onclick="A.answer(${i},${j})"><span class="l">${LET[j]}</span><span>${esc(o)}</span>${j < 9 && EX.mode === 'one' ? `<span class="k">${j + 1}</span>` : ''}</button>`).join('')}</div></div>`;
  };
  const unanswered = qs.map((_, i) => i).filter(i => EX.ans[i] == null);
  const t = EX.left, tcls = t <= 30 ? 'crit' : t <= 120 ? 'warn' : '';
  return `<div class="exam" oncontextmenu="return false">
  <header class="exam-head">
    <button class="btn" onclick="A.leaveExam()"><i class="ph ph-x"></i>خروج</button>
    <div><b>${esc(info.title)}</b><div class="muted" style="font-size:12px">${qs.length} أسئلة · ${minutesFor(qs.length)} دقائق</div></div>
    <span class="grow"></span>
    <div class="seg"><button class="${EX.mode === 'one' ? 'on' : ''}" onclick="A.mode('one')">سؤال سؤال</button><button class="${EX.mode === 'all' ? 'on' : ''}" onclick="A.mode('all')">عرض الكل</button></div>
    <span class="timer ${tcls}" id="timer"><i class="ph ph-timer"></i><span id="tval">${fmt(t)}</span></span>
    <button class="btn btn-ink" onclick="A.askSubmit()">تسليم</button>
  </header>
  <div class="exam-prog"><i style="width:${Math.round(answered / qs.length * 100)}%"></i></div>
  <div class="wm" aria-hidden="true">${Array.from({ length: 80 }, () => `<span>${esc(s.name)} · ${esc(s.phone)}</span>`).join('')}</div>
  <div class="exam-body">
    <aside class="qmap"><b>خريطة الأسئلة</b>
      <div class="cells">${qs.map((_, i) => `<button class="${EX.ans[i] != null ? 'done' : ''} ${i === EX.cur ? 'cur' : ''}" onclick="A.goQ(${i})">${i + 1}${EX.flags[i] ? '<i class="ph-fill ph-flag fl"></i>' : ''}</button>`).join('')}</div>
      <p class="muted" style="font-size:13px">أجبت عن ${answered} من ${qs.length}${Object.values(EX.flags).filter(Boolean).length ? ` · ${Object.values(EX.flags).filter(Boolean).length} للمراجعة` : ''}</p>
      <div class="panel muted" style="font-size:12px;margin-top:12px;padding:12px 14px">اختصارات: <b>1–9</b> لاختيار إجابة، <b>← →</b> للتنقّل.</div>
    </aside>
    <div class="qcol">
      ${EX.mode === 'one' ? qCard(qs[EX.cur], EX.cur) + `<div class="exam-nav"><button class="btn btn-lg" onclick="A.goQ(${EX.cur - 1})" ${EX.cur > 0 ? '' : 'disabled'}><i class="ph ph-arrow-right"></i>السابق</button>
        <button class="btn btn-ink btn-lg" onclick="${EX.cur < qs.length - 1 ? `A.goQ(${EX.cur + 1})` : 'A.askSubmit()'}">${EX.cur < qs.length - 1 ? 'التالي <i class="ph ph-arrow-left"></i>' : 'تسليم'}</button></div>`
      : qs.map(qCard).join('') + `<button class="btn btn-ink btn-lg" onclick="A.askSubmit()">تسليم الامتحان</button>`}
    </div>
  </div>
  ${EX.confirm ? `<div class="modal" onclick="A.closeConfirm()"><div class="box" onclick="event.stopPropagation()"><h3>تسليم الامتحان؟</h3>
    ${unanswered.length ? `<p class="muted">لم تُجب عن ${unanswered.length} ${unanswered.length === 1 ? 'سؤال' : 'أسئلة'}:</p><div class="row" style="flex-wrap:wrap;margin:12px 0">${unanswered.map(i => `<button class="btn btn-sm" onclick="A.closeConfirm();A.goQ(${i})">${i + 1}</button>`).join('')}</div>` : '<p class="muted">أجبت عن كل الأسئلة. لا يمكنك تعديل إجاباتك بعد التسليم.</p>'}
    <div class="row" style="margin-top:16px"><button class="btn btn-ink btn-lg grow" onclick="A.submit()">تسليم</button><button class="btn btn-lg" onclick="A.closeConfirm()">رجوع</button></div></div></div>` : ''}
  ${EX.blur ? `<div class="blur-guard"><div>${orb('#C98A0B', 90)}<h2 style="margin:18px 0 6px">توقّف الامتحان مؤقتاً</h2><p class="muted" style="margin-bottom:18px">غادرت نافذة الامتحان. الوقت متوقف حتى تعود.</p><button class="btn btn-ink btn-lg" onclick="A.unblur()">متابعة الامتحان</button></div></div>` : ''}
</div>`;
}

function vPreExam(info, qs) {
  const u = unit(info.unit), b = best(me().id, info.key);
  return `<div class="center-page"><div style="max-width:480px;width:100%">
    ${orb(u?.color, 140)}<div class="muted" style="margin-top:20px">${esc(info.sub || '')}</div><h1 style="font-size:30px;margin:4px 0 20px">${esc(info.title)}</h1>
    <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap"><span class="chip"><i class="ph ph-list-numbers"></i>${qs.length} أسئلة</span><span class="chip"><i class="ph ph-timer"></i>${minutesFor(qs.length)} دقائق</span>${b != null ? `<span class="chip">أفضل علامة ${b}%</span>` : ''}</div>
    <div class="card" style="text-align:start;margin:24px 0;font-size:14px"><b>قبل أن تبدأ</b><ul class="muted" style="margin:8px 0 0;padding-inline-start:18px">
      <li>يبدأ المؤقّت عند الضغط على «ابدأ»، ويُسلَّم الامتحان تلقائياً عند انتهاء الوقت.</li>
      <li>إذا غادرت النافذة يتوقف الامتحان مؤقتاً.</li><li>تستطيع تعليم أي سؤال للمراجعة والعودة إليه قبل التسليم.</li></ul></div>
    <button class="btn btn-ink btn-lg btn-block" onclick="A.startExam()">ابدأ</button>
    <a class="btn btn-ghost btn-block" style="margin-top:8px" href="#/app${info.lesson ? '/lesson/' + info.lesson : '/unit/' + info.unit}">رجوع</a>
  </div></div>`;
}

function submitExam(late) {
  if (!EX) return;
  const info = examInfo(EX.key), s = me();
  const qs = EX.qs.map(id => DB.questions.find(q => q.id === id)).filter(Boolean);
  const correct = qs.filter((q, i) => EX.ans[i] === q.c).length;
  const a = { id: uid('a'), student: s.id, key: EX.key, title: info.title, unit: info.unit, lesson: info.lesson || null,
    qs: EX.qs, ans: EX.ans, correct, total: qs.length, pct: Math.round(correct / qs.length * 100), taken: EX.total - EX.left, late: !!late, date: new Date().toISOString() };
  DB.attempts.push(a); save();
  EX = null; saveEx();
  UI.review = 'wrong';
  go('result/' + a.id);
}

setInterval(() => {
  if (!EX || !EX.started || EX.blur) return;
  if (route()[0] !== 'exam') return;
  EX.left = Math.max(0, EX.left - 1); saveEx();
  const v = $('#tval'), t = $('#timer');
  if (v) v.textContent = fmt(EX.left);
  if (t) t.className = 'timer ' + (EX.left <= 30 ? 'crit' : EX.left <= 120 ? 'warn' : '');
  if (EX.left === 0) submitExam(true);
}, 1000);
const pauseExam = () => { if (EX && EX.started && !EX.blur && route()[0] === 'exam') { EX.blur = true; saveEx(); render(); } };
window.addEventListener('blur', pauseExam);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseExam(); });
document.addEventListener('keydown', e => {
  if (!EX || !EX.started || route()[0] !== 'exam' || EX.blur || EX.confirm) return;
  if (/input|textarea|select/i.test(e.target.tagName)) return;
  const q = DB.questions.find(x => x.id === EX.qs[EX.cur]); const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9 && q && n <= q.o.length) A.answer(EX.cur, n - 1);
  else if (e.key === 'ArrowLeft') A.goQ(EX.cur + 1);
  else if (e.key === 'ArrowRight') A.goQ(EX.cur - 1);
});

// ---------- result ----------
function vResult(id) {
  const a = DB.attempts.find(x => x.id === id), s = me();
  if (!a || a.student !== s.id) return vNotFound(true);
  const qs = a.qs.map(qid => DB.questions.find(q => q.id === qid));
  const b = band(a.pct), wrong = qs.map((q, i) => i).filter(i => !qs[i] || a.ans[i] !== qs[i].c);
  const show = (UI.review === 'wrong' ? wrong : qs.map((_, i) => i)).filter(i => qs[i]);
  const tries = DB.attempts.filter(x => x.student === s.id && x.key === a.key);
  const lessonsMiss = {}; wrong.forEach(i => { if (qs[i]) lessonsMiss[qs[i].lesson] = (lessonsMiss[qs[i].lesson] || 0) + 1; });
  const info = examInfo(a.key), sib = info?.lesson ? lessonsOf(info.unit) : [], nx = sib[sib.findIndex(l => l.id === info.lesson) + 1];
  const nextHref = info?.type === 'L' ? (nx ? `#/app/lesson/${nx.id}` : `#/exam/U/${info.unit}`) : '#/app/units';
  return `<div class="result">
  <aside class="sum">
    <a href="#/app" class="muted" style="align-self:flex-start"><i class="ph ph-arrow-right"></i> الرئيسية</a>
    <div class="muted" style="margin-top:12px">${esc(a.title)}</div>
    ${ring(a.pct, 190, 12, `var(--${b})`, `<div style="font-size:46px;line-height:1">${a.pct}%</div><div class="muted" style="font-size:13px;font-weight:500">${a.correct} من ${a.total}</div>`)}
    <div class="band-msg" style="color:var(--${b})">${BAND_MSG[b]}</div>
    <div class="row muted" style="font-size:13px;gap:14px"><span>${fmt(a.taken)} دقيقة</span><span>المحاولة ${tries.findIndex(x => x.id === a.id) + 1}</span>${a.late ? '<span style="color:var(--danger)">انتهى الوقت</span>' : ''}</div>
    <div class="dots">${qs.map((q, i) => `<i style="background:${q && a.ans[i] === q.c ? 'var(--success)' : a.ans[i] == null ? 'var(--line)' : 'var(--danger)'}"></i>`).join('')}</div>
    <div class="row" style="width:100%;margin-top:10px"><a class="btn btn-lg grow" href="#/exam/${a.key.replace(':', '/')}">أعد المحاولة</a><a class="btn btn-ink btn-lg grow" href="${nextHref}">${info?.type === 'L' ? (nx ? 'الدرس التالي' : 'مراجعة الوحدة') : 'الوحدات'}</a></div>
    ${Object.keys(lessonsMiss).length ? `<div style="width:100%;text-align:start;margin-top:18px"><b>دروس جاءت منها أخطاؤك</b>${Object.entries(lessonsMiss).map(([lid, n]) => `<a class="row" href="#/app/lesson/${lid}" style="padding:10px 0;border-top:1px solid var(--line);color:var(--ink)"><i class="ph-fill ph-play-circle"></i><span class="grow">${esc(lesson(lid)?.name || '')}</span><span class="muted" style="font-size:12px">${n} ${n === 1 ? 'خطأ' : 'أخطاء'}</span></a>`).join('')}</div>` : ''}
  </aside>
  <main class="rev">
    <div class="row" style="justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px"><h2 style="font-size:24px">راجع إجاباتك</h2>
      <div class="seg"><button class="${UI.review === 'wrong' ? 'on' : ''}" onclick="A.set('review','wrong')">الأخطاء فقط (${wrong.length})</button><button class="${UI.review === 'all' ? 'on' : ''}" onclick="A.set('review','all')">الكل (${qs.length})</button></div></div>
    ${show.length ? show.map(i => { const q = qs[i], my = a.ans[i], ok = my === q.c; return `<div class="card" style="margin-bottom:14px">
      <div class="qmeta"><span class="st" style="background:${ok ? 'var(--success)' : my == null ? 'var(--faint)' : 'var(--danger)'}"><i class="ph ph-${ok ? 'check' : my == null ? 'minus' : 'x'}"></i></span><span>السؤال ${i + 1} · ${esc(lesson(q.lesson)?.name || '')}</span></div>
      ${q.passage ? `<div class="passage" style="font-size:15px;margin-bottom:10px">${esc(q.passage)}</div>` : ''}
      <div class="qtext" style="font-size:17px;margin-bottom:12px">${esc(q.text)}</div>
      <div class="opts">${my == null ? `<div class="ans-row" style="background:var(--surface)"><i class="ph ph-minus-circle"></i>لم تُجب عن هذا السؤال</div>` : !ok ? `<div class="ans-row" style="background:color-mix(in oklab,var(--danger) 9%,var(--card))"><i class="ph ph-x-circle" style="color:var(--danger)"></i>${esc(q.o[my])}<small>إجابتك</small></div>` : ''}
        <div class="ans-row" style="background:color-mix(in oklab,var(--success) 10%,var(--card))"><i class="ph-fill ph-check-circle" style="color:var(--success)"></i>${esc(q.o[q.c])}<small>${ok ? 'إجابتك' : 'الصحيحة'}</small></div></div>
      ${q.why ? `<div class="why"><b>السبب:</b> ${esc(q.why)}</div>` : ''}</div>`; }).join('') : `<div class="empty">${orb('#1F8A4C', 80)}<p style="margin-top:14px">لا أخطاء! كل إجاباتك صحيحة.</p></div>`}
  </main></div>`;
}

// =====================================================================
// ADMIN
// =====================================================================
const ANAV = [['', 'لوحة التحكم', 'squares-four'], ['questions', 'بنك الأسئلة', 'list-checks'], ['content', 'الوحدات والدروس', 'stack'], ['students', 'الطلاب', 'users'], ['campaigns', 'الحملات', 'whatsapp-logo'], ['settings', 'الإعدادات', 'gear']];

function vAdminGate() {
  return `<div class="center-page"><div style="max-width:360px;width:100%">${orb('#0B0B0C', 90, '', '', true)}
    <h1 style="font-size:26px;margin:18px 0 6px">لوحة الإدارة</h1><p class="muted" style="margin-bottom:20px">أدخل رمز الإدارة (افتراضياً 0000 — غيّره من الإعدادات)</p>
    <input class="input" id="apin" type="password" inputmode="numeric" placeholder="••••" style="text-align:center;letter-spacing:.4em" onkeydown="if(event.key==='Enter')A.adminLogin()" autofocus>
    <div class="err" style="margin:8px 0">${esc(UI.err || '')}</div>
    <button class="btn btn-ink btn-lg btn-block" onclick="A.adminLogin()">دخول</button><a class="btn btn-ghost btn-block" style="margin-top:8px" href="#/">الموقع</a></div></div>`;
}

function vAdmin(tab = '') {
  const body = { '': aDash, questions: aQuestions, content: aContent, students: aStudents, campaigns: aCampaigns, settings: aSettings }[tab];
  return `<div class="admin ${UI.sidebar ? '' : 'collapsed'}">
  <aside class="sidebar"><div class="brand"><span class="lbl">${esc(S().teacher)}</span><button class="icon-btn" style="border:0;width:32px;height:32px" onclick="A.set('sidebar',${!UI.sidebar})" aria-label="طي"><i class="ph ph-sidebar-simple"></i></button></div>
    ${ANAV.map(([k, l, ic]) => `<a class="${k === tab ? 'on' : ''}" href="#/admin${k ? '/' + k : ''}" title="${l}"><i class="ph${k === tab ? '-fill' : ''} ph-${ic}"></i><span class="lbl">${l}</span></a>`).join('')}
    <span class="grow"></span><a href="#/" title="الموقع"><i class="ph ph-globe"></i><span class="lbl">الموقع</span></a><a href="#/admin" onclick="A.adminLogout();return false" title="خروج"><i class="ph ph-sign-out"></i><span class="lbl">خروج</span></a></aside>
  <div><div class="admin-top"><input class="search" placeholder="ابحث عن طالب، سؤال، درس…" value="${esc(UI.q || '')}" oninput="A.search(this.value)" id="asearch"><span class="grow"></span>
    <button class="icon-btn" onclick="A.toggleTheme()"><i class="ph ph-${document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon'}"></i></button>
    <div class="row"><div style="text-align:end;line-height:1.3"><b>${esc(S().teacher)}</b><div class="muted" style="font-size:12px">المالك</div></div><span class="me"><span class="av">${esc(S().initial)}</span></span></div></div>
  <main class="admin-main">${body ? body() : vNotFound(true)}</main></div></div>
  ${UI.edit ? qEditor() : ''}`;
}

function aDash() {
  const att = DB.attempts, wk = att.filter(a => daysAgo(a.date, 7));
  const avg = att.length ? (att.reduce((x, a) => x + a.pct, 0) / att.length).toFixed(1) : '—';
  const days = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * 864e5).toISOString().slice(0, 10));
  const byDay = (arr, f) => days.map(d => arr.filter(x => (f(x) || '').slice(0, 10) === d).length);
  const gradeCounts = DB.grades.map(g => ({ g, n: DB.students.filter(s => s.grade === g.id).length })), maxG = Math.max(1, ...gradeCounts.map(x => x.n));
  const exams = {}; att.forEach(a => { exams[a.title] = (exams[a.title] || 0) + 1; });
  const qStat = {}; att.forEach(a => a.qs.forEach((qid, i) => { const q = DB.questions.find(x => x.id === qid); if (!q) return; qStat[qid] = qStat[qid] || { q, n: 0, ok: 0 }; qStat[qid].n++; if (a.ans[i] === q.c) qStat[qid].ok++; }));
  const hard = Object.values(qStat).map(x => ({ ...x, r: Math.round(x.ok / x.n * 100) })).sort((a, b) => a.r - b.r).slice(0, 4);
  const kp = (l, v, sub) => `<div class="kpi"><span>${l}</span><b>${v}</b><span style="font-size:12px">${sub}</span></div>`;
  return `<div class="row" style="align-items:baseline;gap:12px"><h1>لوحة التحكم</h1><span class="muted">${new Date().toLocaleDateString('ar-JO-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
  <div class="kpis">${kp('طلاب جدد هذا الأسبوع', num(DB.students.filter(s => daysAgo(s.joined, 7)).length), `من ${num(DB.students.length)} طالب`)}${kp('امتحانات اليوم', num(att.filter(a => a.date.slice(0, 10) === today()).length), 'محاولة')}${kp('امتحانات هذا الأسبوع', num(wk.length), 'محاولة')}${kp('متوسط العلامات', avg === '—' ? avg : avg + '%', 'كل المحاولات')}${kp('نشطون هذا الأسبوع', num(new Set(wk.map(a => a.student)).size), 'طالب')}</div>
  <div class="grid2"><div class="card"><h3 style="font-size:16px;margin-bottom:10px">الطلاب حسب الصف</h3>${gradeCounts.map(x => `<div class="hbar"><span class="muted">${esc(x.g.short)}</span><div class="t"><i style="width:${Math.max(4, x.n / maxG * 100)}%;background:${orbBg(x.g.color)}"></i></div><b style="direction:ltr;text-align:left">${x.n}</b></div>`).join('')}</div>
    <div class="card"><div class="row" style="justify-content:space-between"><h3 style="font-size:16px">آخر 30 يوماً</h3><span class="muted" style="font-size:12px"><b style="color:var(--ink)">—</b> امتحانات · <b style="color:var(--accent)">—</b> تسجيلات</span></div>
      ${lineChart([{ data: byDay(att, a => a.date), color: 'var(--ink)' }, { data: byDay(DB.students, s => s.joined), color: 'var(--accent)' }], 640, 220, [[0, day(days[0])], [15, day(days[15])], [29, day(days[29])]])}</div></div>
  <div class="grid3">
    <div class="card"><h3 style="font-size:16px">أفضل الطلاب</h3>${ranking().slice(0, 5).map((r, i) => `<div class="lb-row"><span class="faint">${i + 1}</span><span>${esc(r.s.name)}</span><span class="muted" style="font-size:12px">${esc(grade(r.s.grade)?.short || '')}</span><b>${num(r.pts)}</b></div>`).join('')}</div>
    <div class="card"><h3 style="font-size:16px">الأكثر امتحاناً</h3>${Object.entries(exams).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, n]) => `<div class="lb-row"><span>${esc(t)}</span><b class="muted">${n}</b></div>`).join('') || '<p class="muted" style="margin-top:10px">لا محاولات بعد.</p>'}</div>
    <div class="card"><div class="row" style="justify-content:space-between"><h3 style="font-size:16px">أكثر الأسئلة خطأً</h3><a href="#/admin/questions">بنك الأسئلة</a></div>${hard.map(h => `<div class="lb-row" style="cursor:pointer" onclick="A.editQ('${h.q.id}')"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">${esc(h.q.text)}</span><b style="color:var(--danger)">${100 - h.r}%</b></div>`).join('') || '<p class="muted" style="margin-top:10px">لا بيانات بعد.</p>'}</div>
  </div>`;
}

function aQuestions() {
  const f = UI.qf, q = (UI.q || '').trim();
  const units = DB.units.filter(u => !f.grade || u.grade === f.grade), lessons = DB.lessons.filter(l => (!f.unit || l.unit === f.unit) && units.some(u => u.id === l.unit));
  const list = DB.questions.filter(x => lessons.some(l => l.id === x.lesson) && (!f.lesson || x.lesson === f.lesson) && (!q || x.text.includes(q) || x.o.some(o => o.includes(q))));
  return `<div class="row" style="justify-content:space-between"><div class="row" style="align-items:baseline;gap:10px"><h1>بنك الأسئلة</h1><span class="muted">${num(DB.questions.length)} سؤالاً</span></div><button class="btn btn-ink" onclick="A.newQ()"><i class="ph ph-plus"></i>سؤال جديد</button></div>
  <div class="filters">
    <select onchange="A.qf('grade',this.value)"><option value="">كل الصفوف</option>${DB.grades.filter(g => !g.same).map(g => `<option value="${g.id}" ${f.grade === g.id ? 'selected' : ''}>${esc(g.short)}</option>`).join('')}</select>
    <select onchange="A.qf('unit',this.value)"><option value="">كل الوحدات</option>${units.map(u => `<option value="${u.id}" ${f.unit === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select>
    <select onchange="A.qf('lesson',this.value)"><option value="">كل الدروس</option>${lessons.map(l => `<option value="${l.id}" ${f.lesson === l.id ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</select>
  </div>
  <table class="table"><thead><tr><th style="width:40px">#</th><th>السؤال</th><th>الدرس</th><th>الخيارات</th><th>الإجابة</th></tr></thead><tbody>
  ${list.map((x, i) => `<tr class="click" onclick="A.editQ('${x.id}')"><td class="faint">${i + 1}</td><td>${esc(x.text)}${x.passage ? ' <span class="chip">نص</span>' : ''}</td><td class="muted">${esc(lesson(x.lesson)?.name || '')}</td><td class="muted">${x.o.length}</td><td><span class="chip" style="background:color-mix(in oklab,var(--success) 14%,var(--card))">${LET[x.c]}</span></td></tr>`).join('') || `<tr><td colspan="5" class="empty">لا أسئلة مطابقة.</td></tr>`}
  </tbody></table>`;
}

const qPreview = e => `<div class="muted" style="font-size:12px;margin-bottom:10px">معاينة كما يراها الطالب</div>
  ${e.passage ? `<div class="passage" style="margin-bottom:12px;background:var(--card)">${esc(e.passage)}</div>` : ''}
  <div class="qcard"><div class="qtext">${esc(e.text) || '<span class="faint">نص السؤال…</span>'}</div><div class="opts many">${e.o.map((o, j) => `<div class="opt ${j === e.c ? 'sel' : ''}"><span class="l">${LET[j]}</span><span>${esc(o) || '<span class="faint">خيار فارغ</span>'}</span></div>`).join('')}</div>
  ${e.why ? `<div class="why"><b>السبب:</b> ${esc(e.why)}</div>` : ''}</div>`;

function qEditor() {
  const e = UI.edit, isNew = !DB.questions.some(q => q.id === e.id);
  return `<div class="drawer" onclick="A.closeQ()"><div class="pane" onclick="event.stopPropagation()">
  <div class="pane-head"><h3 style="font-size:18px">${isNew ? 'سؤال جديد' : 'تعديل سؤال'}</h3><span class="muted">· ${esc(lesson(e.lesson)?.name || '')}</span><span class="grow"></span><button class="icon-btn" onclick="A.closeQ()"><i class="ph ph-x"></i></button></div>
  <div class="pane-body"><div>
    <div class="field"><label>الدرس</label><select class="input" onchange="UI.edit.lesson=this.value;A.r()">${DB.units.map(u => `<optgroup label="${esc(grade(u.grade)?.short + ' · ' + u.name)}">${lessonsOf(u.id).map(l => `<option value="${l.id}" ${l.id === e.lesson ? 'selected' : ''}>${esc(l.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="field"><label>نص السؤال</label><textarea class="input" oninput="A.ed('text',this.value)">${esc(e.text)}</textarea></div>
    <div class="field"><label>النص المرافق <span class="muted">(اختياري)</span></label><textarea class="input" style="min-height:60px" oninput="A.ed('passage',this.value)">${esc(e.passage || '')}</textarea></div>
    <div class="row" style="justify-content:space-between;margin-bottom:8px"><b>الخيارات (${e.o.length} من 10)</b><span class="muted" style="font-size:12px">انقر ✓ لتحديد الإجابة الصحيحة</span></div>
    ${e.o.map((o, j) => `<div class="opt-edit"><span class="lt">${LET[j]}</span><input class="${j === e.c ? 'ok' : ''}" value="${esc(o)}" oninput="A.edOpt(${j},this.value)"><button class="tick ${j === e.c ? 'on' : ''}" onclick="A.edC(${j})"><i class="ph ph-check"></i></button><button class="icon-btn" style="border:0;width:32px;height:32px;color:var(--faint)" onclick="A.edDel(${j})" ${e.o.length <= 2 ? 'disabled' : ''}><i class="ph ph-trash"></i></button></div>`).join('')}
    ${e.o.length < 10 ? `<button class="btn btn-sm" onclick="A.edAdd()"><i class="ph ph-plus"></i>خيار</button>` : ''}
    <div class="field" style="margin-top:16px"><label>سبب الإجابة الصحيحة</label><textarea class="input" style="min-height:60px" oninput="A.ed('why',this.value)">${esc(e.why || '')}</textarea></div>
  </div><div id="qprev">${qPreview(e)}</div></div>
  <div class="pane-foot"><button class="btn btn-ink" onclick="A.saveQ()">حفظ</button><button class="btn" onclick="A.closeQ()">إلغاء</button><span class="grow"></span>${isNew ? '' : `<button class="btn btn-ghost btn-danger" onclick="A.delQ()">حذف السؤال</button>`}</div>
  </div></div>`;
}

function aContent() {
  return `<div class="row" style="justify-content:space-between"><h1>الوحدات والدروس</h1></div>
  <p class="muted" style="margin:6px 0 20px">أضف وحدات ودروساً لكل صف، وضع رابط فيديو يوتيوب لكل درس.</p>
  ${DB.grades.filter(g => !g.same).map(g => `<div class="card" style="margin-bottom:12px">
    <div class="row" style="gap:12px">${orb(g.color, 40, '', '', g.soon)}<div class="grow"><b>${esc(g.name)}</b><div class="muted" style="font-size:12px">${esc(g.desc)}</div></div>
      <button class="btn btn-sm" onclick="A.gradeEdit('${g.id}')">تعديل</button><button class="btn btn-sm" onclick="A.gradeSoon('${g.id}')">${g.soon ? 'تفعيل' : 'قريباً'}</button><button class="btn btn-sm btn-ink" onclick="A.addUnit('${g.id}')"><i class="ph ph-plus"></i>وحدة</button></div>
    ${DB.units.filter(u => u.grade === g.id).map(u => `<div style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px">
      <div class="row">${orb(u.color, 26)}<b class="grow">${esc(u.name)}</b><span class="muted" style="font-size:12px">${qsOfUnit(u.id).length} سؤالاً</span>
        <button class="btn btn-sm btn-ghost" onclick="A.renUnit('${u.id}')">إعادة تسمية</button><button class="btn btn-sm btn-ghost btn-danger" onclick="A.delUnit('${u.id}')">حذف</button><button class="btn btn-sm" onclick="A.addLesson('${u.id}')"><i class="ph ph-plus"></i>درس</button></div>
      ${lessonsOf(u.id).map(l => `<div class="row" style="padding:8px 0 8px 0;padding-inline-start:36px;font-size:14px"><i class="ph ${ytId(l.video) ? 'ph-fill ph-youtube-logo' : 'ph-video'}" style="color:${ytId(l.video) ? 'var(--danger)' : 'var(--faint)'}"></i><span class="grow">${esc(l.name)}</span><span class="muted" style="font-size:12px">${qsOfLesson(l.id).length} أسئلة</span>
        <button class="btn btn-sm btn-ghost" onclick="A.lessonVideo('${l.id}')">الفيديو</button><button class="btn btn-sm btn-ghost" onclick="A.renLesson('${l.id}')">إعادة تسمية</button><button class="btn btn-sm btn-ghost btn-danger" onclick="A.delLesson('${l.id}')">حذف</button></div>`).join('')}
    </div>`).join('')}
  </div>`).join('')}`;
}

function aStudents() {
  const q = (UI.q || '').trim();
  const list = DB.students.filter(s => !q || s.name.includes(q) || s.phone.includes(q)).map(s => ({ s, pts: points(s), n: attemptsOf(s.id).length })).sort((a, b) => b.pts - a.pts);
  return `<div class="row" style="align-items:baseline;gap:10px"><h1>الطلاب</h1><span class="muted">${num(DB.students.length)}</span></div>
  <table class="table" style="margin-top:16px"><thead><tr><th>الاسم</th><th>الهاتف</th><th>الصف</th><th>النقاط</th><th>المحاولات</th><th>التسجيل</th><th></th></tr></thead><tbody>
  ${list.map(({ s, pts, n }) => `<tr><td><b>${esc(s.name)}</b></td><td style="direction:ltr;text-align:right">${esc(s.phone)}</td><td class="muted">${esc(grade(s.grade)?.short || '')}</td><td>${num(pts)}</td><td>${n}</td><td class="muted">${day(s.joined)}</td>
    <td style="white-space:nowrap"><a class="btn btn-sm" href="https://wa.me/${intlPhone(s.phone)}" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i></a> <button class="btn btn-sm" onclick="A.resetPin('${s.id}')">رقم سري</button> <button class="btn btn-sm btn-danger" onclick="A.delStudent('${s.id}')"><i class="ph ph-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">لا طلاب.</td></tr>'}
  </tbody></table>`;
}

function campaignAudience() {
  const sel = Object.keys(UI.aud).filter(k => UI.aud[k]);
  return DB.students.filter(s => !s.noWa && (!sel.length || sel.includes(s.grade)) && (!UI.inactive || !attemptsOf(s.id).some(a => daysAgo(a.date, 7))));
}
function aCampaigns() {
  if (UI.msg == null) UI.msg = `مرحباً {الاسم} 👋\nنزل امتحان جديد على منصة الأستاذ ${S().teacher}. ادخل وجرّب الآن!\n${location.origin + location.pathname}`;
  const aud = campaignAudience(), sample = aud[0];
  const fill = s => UI.msg.replaceAll('{الاسم}', s ? s.name.split(' ')[0] : 'سارة');
  return `<h1>حملة واتساب جديدة</h1><p class="muted" style="margin:6px 0 20px">اختر الجمهور واكتب الرسالة، ثم أرسلها لكل طالب بنقرة (تُفتح محادثة واتساب جاهزة).</p>
  <div class="grid2"><div>
    <div class="card" style="margin-bottom:12px"><b>الجمهور</b><div class="row" style="flex-wrap:wrap;margin-top:10px">${DB.grades.map(g => `<button class="btn btn-sm ${UI.aud[g.id] ? 'btn-ink' : ''}" onclick="UI.aud['${g.id}']=!UI.aud['${g.id}'];A.r()">${esc(g.short)}</button>`).join('')}</div>
      <label class="row" style="margin-top:12px;font-size:14px"><input type="checkbox" ${UI.inactive ? 'checked' : ''} onchange="UI.inactive=this.checked;A.r()"> فقط من لم يمتحن منذ 7 أيام</label>
      <p class="muted" style="font-size:13px;margin-top:8px">${aud.length} طالب (يُستثنى من أوقف رسائل واتساب)</p></div>
    <div class="card"><b>الرسالة</b><p class="muted" style="font-size:12px">استخدم {الاسم} ليُستبدل باسم الطالب.</p><textarea class="input" style="min-height:140px;margin-top:8px" oninput="UI.msg=this.value;document.getElementById('bub').textContent=this.value.replaceAll('{الاسم}','${esc(sample ? sample.name.split(' ')[0] : 'سارة')}')">${esc(UI.msg)}</textarea></div>
  </div><div>
    <div class="wa-bg"><div class="bubble" id="bub">${esc(fill(sample))}</div></div>
    <div class="card" style="margin-top:12px"><div class="row" style="justify-content:space-between"><b>الإرسال اليدوي</b><span class="muted" style="font-size:13px">${Object.keys(UI.sent).filter(k => aud.some(s => s.id === k)).length} / ${aud.length} أُرسلت</span></div>
      ${aud.map(s => `<div class="lb-row"><span>${esc(s.name)}</span><span class="muted" style="font-size:12px;direction:ltr">${esc(s.phone)}</span><span class="grow"></span>${UI.sent[s.id] ? '<span class="chip" style="background:color-mix(in oklab,var(--success) 14%,var(--card))">أُرسلت</span>' : `<a class="btn btn-sm btn-ink" target="_blank" rel="noopener" href="https://wa.me/${intlPhone(s.phone)}?text=${encodeURIComponent(fill(s))}" onclick="UI.sent['${s.id}']=1;setTimeout(A.r,50)"><i class="ph ph-whatsapp-logo"></i>إرسال</a>`}</div>`).join('') || '<p class="muted">لا يوجد طلاب في هذا الجمهور.</p>'}</div>
  </div></div>`;
}

const SET_FIELDS = [['teacher', 'اسم الأستاذ'], ['initial', 'الحرف الأول (للشعار)'], ['subject', 'المادة'], ['domain', 'النطاق'], ['headline', 'العنوان الرئيسي'], ['intro', 'المقدمة', 1], ['about', 'نبذة عن الأستاذ', 1],
  ['whatsapp', 'رقم واتساب (دولي، بدون +)'], ['channel', 'رابط قناة واتساب'], ['youtube', 'يوتيوب'], ['instagram', 'إنستغرام'], ['facebook', 'فيسبوك'], ['dailyGoal', 'هدف الامتحانات اليومي'], ['adminPin', 'رمز الإدارة']];
function aSettings() {
  if (!UI.draft) UI.draft = clone(DB.settings);
  const d = UI.draft, dirty = JSON.stringify(d) !== JSON.stringify(DB.settings);
  const tabs = [['general', 'عام'], ['faq', 'الأسئلة الشائعة'], ['data', 'البيانات']];
  return `<h1>الإعدادات</h1><div class="seg" style="margin:16px 0 20px">${tabs.map(([k, l]) => `<button class="${UI.setTab === k ? 'on' : ''}" onclick="A.set('setTab','${k}')">${l}</button>`).join('')}</div>
  ${UI.setTab === 'general' ? `<div class="card" style="max-width:760px">${SET_FIELDS.map(([k, l, ta]) => `<div class="field"><label>${l}</label>${ta ? `<textarea class="input" oninput="A.draft('${k}',this.value)">${esc(d[k])}</textarea>` : `<input class="input" value="${esc(d[k])}" oninput="A.draft('${k}',this.value)">`}</div>`).join('')}</div>`
  : UI.setTab === 'faq' ? `<div class="card" style="max-width:760px">${d.faq.map((f, i) => `<div style="border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:12px"><div class="field"><label>السؤال ${i + 1}</label><input class="input" value="${esc(f[0])}" oninput="A.draftFaq(${i},0,this.value)"></div><div class="field"><label>الجواب</label><textarea class="input" style="min-height:60px" oninput="A.draftFaq(${i},1,this.value)">${esc(f[1])}</textarea></div><button class="btn btn-sm btn-danger" onclick="UI.draft.faq.splice(${i},1);A.r()">حذف</button></div>`).join('')}<button class="btn" onclick="UI.draft.faq.push(['','']);A.r()"><i class="ph ph-plus"></i>سؤال</button></div>`
  : `<div class="card" style="max-width:760px"><b>نسخة احتياطية</b><p class="muted" style="font-size:14px;margin:6px 0 14px">تُحفظ كل البيانات في هذا المتصفح. صدّرها كملف JSON لنقلها إلى جهاز آخر أو لحفظها.</p>
      <div class="row" style="flex-wrap:wrap"><button class="btn btn-ink" onclick="A.exportDb()"><i class="ph ph-download-simple"></i>تصدير</button><label class="btn"><i class="ph ph-upload-simple"></i>استيراد<input type="file" accept="application/json" hidden onchange="A.importDb(this.files[0])"></label><button class="btn btn-danger" onclick="A.resetDb()">استعادة بيانات التجربة</button></div></div>`}
  ${dirty ? `<div class="save-bar" style="max-width:760px"><span class="grow">لديك تغييرات غير محفوظة</span><button class="btn" style="background:transparent;color:var(--bg);border:1px solid color-mix(in oklab,var(--bg) 30%,transparent)" onclick="UI.draft=null;A.r()">تجاهل</button><button class="btn" onclick="A.saveSettings()">حفظ</button></div>` : ''}`;
}

function vNotFound(inner) {
  const html = `<div class="center-page" style="${inner ? 'min-height:60vh' : ''}"><div>${orb('#9A968F', 140, '', '', true)}<h1 style="font-size:28px;margin:20px 0 6px">هذه الصفحة غير موجودة</h1><p class="muted" style="margin-bottom:20px">ربما تغيّر الرابط أو حُذفت الصفحة.</p><a class="btn btn-ink btn-lg" href="#/">العودة للرئيسية</a></div></div>`;
  return html;
}

// =====================================================================
// ACTIONS
// =====================================================================
const A = window.A = {
  r: render,
  set(k, v) { UI[k] = v; render(); },
  scroll(id) { UI.menu = false; if (route().length) { go(''); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60); } else { render(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); } },
  toggleTheme() { store.set(THEME, document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); render(); },
  pickGrade(i) { const n = DB.grades.filter(g => g.stage === UI.stage).length; if (i < 0 || i >= n) return; UI.act[UI.stage] = i; render(); },
  startGrade(gid) { if (me()) go('app'); else { UI.su = { step: 2, grade: gid }; go('signup'); } },

  pin(e) {
    const el = e.target, i = +el.dataset.i, d = el.value.replace(/\D/g, '');
    if (d.length > 1) { d.slice(0, 4 - i).split('').forEach((c, k) => UI.pin[i + k] = c); }
    else UI.pin[i] = d;
    const ins = document.querySelectorAll(`[data-pin="${el.dataset.pin}"]`);
    ins.forEach((x, k) => x.value = UI.pin[k] || '');
    const nx = UI.pin.findIndex(x => !x);
    if (d && nx >= 0) ins[nx].focus(); else if (d && nx < 0) { ins[3].blur(); if (el.dataset.pin === 'in') A.signin(); }
  },
  pinKey(e) { const i = +e.target.dataset.i; if (e.key === 'Backspace' && !e.target.value && i > 0) { const ins = document.querySelectorAll(`[data-pin="${e.target.dataset.pin}"]`); UI.pin[i - 1] = ''; ins[i - 1].value = ''; ins[i - 1].focus(); e.preventDefault(); } if (e.key === 'Enter' && e.target.dataset.pin === 'in') A.signin(); },
  signin() {
    const lock = store.get(LOCK, { n: 0, until: 0 }); if (lock.until > Date.now()) return render();
    const phone = normPhone($('#phone')?.value || UI.phone || ''), pin = UI.pin.join('');
    if (phone.length < 10) { UI.err = 'أدخل رقم هاتف صحيحاً'; return render(); }
    if (pin.length < 4) { UI.err = 'أدخل الرقم السري المكوّن من 4 أرقام'; return render(); }
    const s = DB.students.find(x => normPhone(x.phone) === phone);
    if (!s || s.pin !== pin) {
      lock.n++; if (lock.n >= 5) { lock.until = Date.now() + 15 * 60e3; lock.n = 0; } store.set(LOCK, lock);
      UI.err = s ? 'الرقم السري غير صحيح' : 'لا يوجد حساب بهذا الرقم'; UI.pin = ['', '', '', '']; return render();
    }
    store.set(LOCK, { n: 0, until: 0 }); store.set(SESSION, s.id); UI.err = ''; UI.pin = ['', '', '', '']; UI.phone = ''; go('app');
  },
  suNext() {
    const su = UI.su; UI.err = '';
    if (su.step === 1) {
      if (!su.name || su.name.trim().split(/\s+/).length < 2) UI.err = 'اكتب اسمك الأول واسم العائلة';
      else if (normPhone(su.phone || '').length !== 10 || !normPhone(su.phone).startsWith('07')) UI.err = 'أدخل رقم هاتف أردني صحيحاً يبدأ بـ 07';
      else if (DB.students.some(s => normPhone(s.phone) === normPhone(su.phone))) UI.err = 'هذا الرقم مسجّل مسبقاً — سجّل الدخول';
      else su.step = su.grade ? 3 : 2;
    } else if (su.step === 2) { if (!su.grade) UI.err = 'اختر صفّك'; else su.step = 3; }
    else {
      const pin = UI.pin.join('');
      if (pin.length < 4) UI.err = 'اختر رقماً سرياً من 4 أرقام';
      else if (/^(\d)\1{3}$/.test(pin) || pin === '1234') UI.err = 'اختر رقماً أصعب من هذا';
      else if (su.terms === false) UI.err = 'يجب الموافقة على الشروط';
      else {
        const s = { id: uid('s'), name: su.name.trim(), phone: normPhone(su.phone), pin, grade: su.grade, bonus: 0, joined: new Date().toISOString(), noWa: su.wa === false };
        DB.students.push(s); save(); store.set(SESSION, s.id); UI.su = { step: 1 }; UI.pin = ['', '', '', ''];
        toast('أهلاً ' + s.name.split(' ')[0] + '! تم إنشاء حسابك'); go('app'); return;
      }
    }
    render();
  },
  suBack() { UI.err = ''; UI.su.step = Math.max(1, UI.su.step - 1); render(); },
  logout() { store.del(SESSION); UI.account = false; go(''); },
  changeGrade(g) { const s = me(); s.grade = g; save(); render(); },
  toggleWa() { const s = me(); s.noWa = !s.noWa; save(); render(); },

  startExam() { EX.started = true; saveEx(); render(); },
  answer(i, j) { if (!EX) return; EX.ans[i] = j; EX.cur = i; saveEx(); render(); },
  flag(i) { EX.flags[i] = !EX.flags[i]; saveEx(); render(); },
  goQ(i) { if (!EX || i < 0 || i >= EX.qs.length) return; EX.cur = i; saveEx(); render(); if (EX.mode === 'all') document.getElementById('q' + i)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
  mode(m) { EX.mode = m; saveEx(); render(); },
  askSubmit() { EX.confirm = true; render(); },
  closeConfirm() { EX.confirm = false; render(); },
  submit() { submitExam(false); },
  unblur() { EX.blur = false; saveEx(); render(); },
  leaveExam() { if (!EX.started || confirm('هل تريد الخروج؟ ستفقد إجاباتك في هذه المحاولة.')) { const info = examInfo(EX.key); EX = null; saveEx(); go(info?.lesson ? 'app/lesson/' + info.lesson : 'app/unit/' + info?.unit); } },

  adminLogin() { if (($('#apin')?.value || '') === String(S().adminPin)) { sessionStorage.setItem('alaa-admin', '1'); UI.err = ''; render(); } else { UI.err = 'رمز غير صحيح'; render(); } },
  adminLogout() { sessionStorage.removeItem('alaa-admin'); go(''); },
  search(v) { UI.q = v; const r = route(); if (!['questions', 'students'].includes(r[1])) { go('admin/students'); } else render(); setTimeout(() => { const el = $('#asearch'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); } }, 0); },
  qf(k, v) { UI.qf[k] = v; if (k === 'grade') { UI.qf.unit = ''; UI.qf.lesson = ''; } if (k === 'unit') UI.qf.lesson = ''; render(); },
  newQ() { const l = UI.qf.lesson || DB.lessons.find(x => !UI.qf.unit || x.unit === UI.qf.unit)?.id; if (!l) return toast('أضف درساً أولاً من «الوحدات والدروس»'); UI.edit = { id: uid('q'), lesson: l, text: '', passage: '', o: ['', '', '', ''], c: 0, why: '' }; render(); },
  editQ(id) { UI.edit = clone(DB.questions.find(q => q.id === id)); if (route()[1] !== 'questions') go('admin/questions'); else render(); },
  closeQ() { UI.edit = null; render(); },
  ed(k, v) { UI.edit[k] = v; $('#qprev').innerHTML = qPreview(UI.edit); },
  edOpt(j, v) { UI.edit.o[j] = v; $('#qprev').innerHTML = qPreview(UI.edit); },
  edC(j) { UI.edit.c = j; render(); },
  edAdd() { UI.edit.o.push(''); render(); },
  edDel(j) { const e = UI.edit; if (e.o.length <= 2) return; e.o.splice(j, 1); if (e.c === j) e.c = 0; else if (e.c > j) e.c--; render(); },
  saveQ() {
    const e = UI.edit; e.text = e.text.trim(); e.o = e.o.map(x => x.trim());
    if (!e.text) return toast('اكتب نص السؤال');
    if (e.o.some(x => !x)) return toast('املأ كل الخيارات أو احذف الفارغ منها');
    if (!e.passage) delete e.passage;
    const i = DB.questions.findIndex(q => q.id === e.id); if (i >= 0) DB.questions[i] = e; else DB.questions.push(e);
    save(); UI.edit = null; toast('تم حفظ السؤال'); render();
  },
  delQ() { if (!confirm('حذف هذا السؤال؟')) return; DB.questions = DB.questions.filter(q => q.id !== UI.edit.id); save(); UI.edit = null; toast('تم الحذف'); render(); },

  gradeEdit(id) { const g = grade(id); const n = prompt('اسم الصف', g.name); if (n == null) return; const d = prompt('الوصف المختصر', g.desc); g.name = n.trim() || g.name; if (d != null) g.desc = d.trim(); save(); render(); },
  gradeSoon(id) { const g = grade(id); g.soon = !g.soon; save(); render(); },
  addUnit(gid) { const n = prompt('اسم الوحدة الجديدة'); if (!n?.trim()) return; const colors = ['#10006B', '#1FA86B', '#C77B2E', '#C2412D', '#2D6CDF', '#B86BE0']; DB.units.push({ id: uid('u'), grade: gid, name: n.trim(), color: colors[DB.units.filter(u => u.grade === gid).length % colors.length] }); save(); render(); },
  renUnit(id) { const u = unit(id), n = prompt('اسم الوحدة', u.name); if (n?.trim()) { u.name = n.trim(); save(); render(); } },
  delUnit(id) { if (!confirm('حذف الوحدة مع كل دروسها وأسئلتها؟')) return; const ls = lessonsOf(id).map(l => l.id); DB.questions = DB.questions.filter(q => !ls.includes(q.lesson)); DB.lessons = DB.lessons.filter(l => l.unit !== id); DB.units = DB.units.filter(u => u.id !== id); save(); render(); },
  addLesson(uid_) { const n = prompt('اسم الدرس الجديد'); if (!n?.trim()) return; DB.lessons.push({ id: uid('l'), unit: uid_, name: n.trim(), video: '', dur: '' }); save(); render(); },
  renLesson(id) { const l = lesson(id), n = prompt('اسم الدرس', l.name); if (n?.trim()) { l.name = n.trim(); save(); render(); } },
  lessonVideo(id) { const l = lesson(id), v = prompt('رابط فيديو يوتيوب للدرس (اتركه فارغاً للحذف)', l.video ? 'https://youtu.be/' + ytId(l.video) : ''); if (v == null) return; if (v && !ytId(v)) return toast('رابط يوتيوب غير صالح'); l.video = ytId(v); const d = v ? prompt('مدة الفيديو (مثال 12:40)', l.dur || '') : ''; if (d != null) l.dur = d.trim(); save(); render(); },
  delLesson(id) { if (!confirm('حذف الدرس وأسئلته؟')) return; DB.questions = DB.questions.filter(q => q.lesson !== id); DB.lessons = DB.lessons.filter(l => l.id !== id); save(); render(); },

  resetPin(id) { const s = DB.students.find(x => x.id === id), p = prompt('رقم سري جديد من 4 أرقام لـ ' + s.name); if (p == null) return; if (!/^\d{4}$/.test(p)) return toast('يجب أن يكون 4 أرقام'); s.pin = p; save(); toast('تم تغيير الرقم السري'); },
  delStudent(id) { const s = DB.students.find(x => x.id === id); if (!confirm('حذف الطالب ' + s.name + ' وكل نتائجه؟')) return; DB.students = DB.students.filter(x => x.id !== id); DB.attempts = DB.attempts.filter(a => a.student !== id); save(); render(); },

  draft(k, v) { const had = JSON.stringify(UI.draft) !== JSON.stringify(DB.settings); UI.draft[k] = k === 'dailyGoal' ? Math.max(1, parseInt(v, 10) || 1) : v; const has = JSON.stringify(UI.draft) !== JSON.stringify(DB.settings); if (had !== has) { const el = document.activeElement, pos = el.selectionStart; render(); const again = [...document.querySelectorAll('.admin-main .input')].find(x => x.getAttribute('oninput')?.includes(`'${k}'`)); if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch {} } } },
  draftFaq(i, j, v) { UI.draft.faq[i][j] = v; if (!$('.save-bar')) { render(); } },
  saveSettings() { const d = UI.draft; if (!/^\d{4,}$/.test(String(d.adminPin))) return toast('رمز الإدارة يجب أن يكون 4 أرقام أو أكثر'); d.whatsapp = String(d.whatsapp).replace(/\D/g, ''); d.faq = d.faq.filter(f => f[0].trim()); DB.settings = clone(d); save(); UI.draft = null; document.title = S().teacher + ' · منصة الامتحانات'; toast('تم الحفظ'); render(); },
  exportDb() { const b = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `alaaalsharif-backup-${today()}.json`; a.click(); URL.revokeObjectURL(a.href); },
  importDb(file) { if (!file) return; file.text().then(t => { const d = JSON.parse(t); if (!d.settings || !Array.isArray(d.questions)) throw 0; DB = { ...clone(SEED), ...d, version: SEED.version }; save(); UI.draft = null; toast('تم الاستيراد'); render(); }).catch(() => toast('ملف غير صالح')); },
  resetDb() { if (!confirm('سيتم حذف كل التعديلات والطلاب والنتائج واستعادة بيانات التجربة. متابعة؟')) return; DB = clone(SEED); save(); store.del(SESSION); UI.draft = null; toast('تمت الاستعادة'); render(); }
};
window.UI = UI;

matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', render);
document.title = S().teacher + ' · منصة الامتحانات';
render();
})();
