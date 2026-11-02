/* =====================================================================
   Smart Waste · ระบบแจ้งและติดตามปัญหาขยะล้น  (SPU Khon Kaen · S.M.A.R.T. Campus)
   ข้อมูลทั้งหมดเก็บในเบราว์เซอร์เครื่องนี้ (localStorage) ไม่มีข้อมูลตัวอย่างตั้งต้น
   ===================================================================== */
const MIN = 60000;
const TYPES = { general: 'ทั่วไป', recycle: 'รีไซเคิล', organic: 'อินทรีย์', hazard: 'อันตราย' };
const TYPE_COLOR = { general: 'น้ำเงิน', recycle: 'เหลือง', organic: 'เขียว', hazard: 'แดง' };
const PROBLEMS = ['ขยะล้น', 'ถังเต็ม', 'ขยะตกพื้น', 'มีกลิ่น'];
const STATUS = { wait: 'รอดำเนินการ', doing: 'กำลังดำเนินการ', done: 'ดำเนินการแล้ว' };
const ESC_MIN = 30, REMIND_MIN = 20;
const STORE_KEY = 'smartwaste.v3', THEME_KEY = 'smartwaste.theme';

/* ---------- แผนผังวิทยาเขต (ข้อมูลตามภาพ "แผนผังวิทยาเขต") ----------
   พิกัด x,y ของถังและอาคารเป็นพิกเซลบนภาพ assets/campus-map.png (1152 × 502) */
const MAP = { w: 1152, h: 502, src: 'assets/campus-map.png', full: 'assets/campus-full.png' };
const BUILDINGS = ['อาคาร 1', 'อาคาร 2', 'อาคาร 3', 'อาคาร 4', 'ลานกลาง', 'ที่จอดรถ'];
const ZONE_OF = { 'อาคาร 1': 'Z-A', 'อาคาร 2': 'Z-A', 'ที่จอดรถ': 'Z-A', 'อาคาร 3': 'Z-B', 'อาคาร 4': 'Z-B', 'ลานกลาง': 'Z-B' };
const BIN_ZONE_LABEL = { 'Z-A': 'โซน A', 'Z-B': 'โซน B' };

const BLD = {
  'อาคาร 1': { n: 1, color: '#d6246e', soft: '#fbe0ec', title: 'อาคาร 1', sub: 'บริการนักศึกษา · คณะ', box: [910, 41, 97, 420],
    rooms: [
      { c: '1-101', n: 'USR Theater' },
      { c: '1-104', n: 'เลขานุการคณะ' },
      { c: '1-106', n: 'สำนักบริการการศึกษา', s: ['งานวิชาการ', 'งานสหกิจศึกษา'] },
      { c: '1-107', n: 'One Stop Service Center', s: ['งานทะเบียน'] },
      { c: '1-108', n: 'Admission Office', s: ['งานสมัครนักศึกษาใหม่', 'งานกองทุน', 'งานการเงิน'] },
      { c: '1-201', n: 'ห้องปฏิบัติการคอมพิวเตอร์ Mac' },
      { c: '1-202', n: 'คณะเทคโนโลยีสารสนเทศ' },
      { c: '1-204', n: 'คณะนิเทศศาสตร์' },
      { c: '1-206', n: 'ห้องผู้ช่วยรองอธิการบดี / งานบุคคล' }] },
  'อาคาร 2': { n: 2, color: '#0b7e9a', soft: '#d9f0f6', title: 'อาคาร 2', sub: 'คณะ · วิทยาลัย · Book Center', box: [60, 157, 97, 304],
    rooms: [
      { c: '2-102', n: 'ศูนย์หนังสือ / Book Center' },
      { c: '2-104', n: 'วิทยาลัยโลจิสติกส์และซัพพลายเชน' },
      { c: '2-106', n: 'วิทยาลัยการท่องเที่ยวและการบริการ' },
      { c: '2-205', n: 'คณะบริหารธุรกิจ' },
      { c: '2-206', n: 'คณะบัญชี' },
      { c: '2-207', n: 'คณะศิลปศาสตร์' }] },
  'อาคาร 3': { n: 3, color: '#7b3fb5', soft: '#ece0f8', title: 'อาคาร 3', sub: 'ห้องประชุม · บัณฑิตวิทยาลัย', box: [60, 41, 301, 96],
    rooms: [
      { f: 1, n: 'ห้องประชุม / ห้องสัมมนา' },
      { c: '3-201', n: 'ห้องรับรอง VIP' },
      { c: '3-206', n: 'ห้องประชุมพุทธยากรณ์' },
      { c: '3-301', n: 'วิทยาลัยบัณฑิตศึกษาด้านการจัดการ' },
      { c: '3-401', n: 'Auditorium Room / Board Game' },
      { c: '3-405', n: 'หลักสูตรประกาศนียบัตรบัณฑิตวิชาชีพครู' }] },
  'อาคาร 4': { n: 4, color: '#f0b400', soft: '#fff0c4', title: 'อาคาร 4', sub: 'Food Court · ห้องสมุด · นิติศาสตร์', box: [380, 41, 521, 96],
    rooms: [
      { c: '4-101', n: 'ศูนย์มีเดีย / Studio / ศูนย์อาหาร / FOOD COURT' },
      { f: 2, n: 'ห้องสมุด / Home@spu' },
      { c: '4-301', n: 'หลักสูตรนิติศาสตรมหาบัณฑิต' },
      { c: '4-307', n: 'คณะนิติศาสตร์' },
      { c: '4-400', n: 'สำนักศึกษาทั่วไป' }] },
};
/* ปลายทางยอดนิยม ("ไปที่ไหนดี" ในภาพ) */
const QUICK = [
  { t: 'One Stop Service · 1-107', b: 'อาคาร 1' }, { t: 'Admission Office · 1-108', b: 'อาคาร 1' },
  { t: 'Book Center · 2-102', b: 'อาคาร 2' }, { t: 'ห้องรับรอง VIP · 3-201', b: 'อาคาร 3' },
  { t: 'Food Court · 4-101', b: 'อาคาร 4' }, { t: 'ห้องสมุด · อาคาร 4 ชั้น 2', b: 'อาคาร 4' },
];
const AREA_BOX = { 'ลานกลาง': [177, 157, 713, 304], 'ที่จอดรถ': [1031, 201, 106, 260] };
const bldBox = b => (BLD[b] ? BLD[b].box : AREA_BOX[b]);
const bldColor = b => (BLD[b] ? BLD[b].color : b === 'ลานกลาง' ? '#3f9b5f' : '#6b7280');
const floorOf = r => r.f || (r.c ? Number(r.c.split('-')[1][0]) : null);
const roomLabel = (bName, r) => `${r.c ? 'ห้อง ' + r.c : 'ชั้น ' + floorOf(r)} ${r.n} (${bName}${r.c ? ' ชั้น ' + floorOf(r) : ''})`;

/* ถังขยะ (ตำแหน่งตัวอย่างเริ่มต้น ปรับ x,y หรือเพิ่มถังได้ที่นี่) */
const BINS = [
  { id: 'BIN-101-G', b: 'อาคาร 1', spot: 'ชั้น 1 หน้า One Stop Service (1-107)', type: 'general', x: 958, y: 335 },
  { id: 'BIN-102-Y', b: 'อาคาร 1', spot: 'ชั้น 1 หน้า Admission Office (1-108)', type: 'recycle', x: 958, y: 380 },
  { id: 'BIN-103-R', b: 'อาคาร 1', spot: 'ชั้น 2 มุมแบตเตอรี่ ห้อง Mac (1-201)', type: 'hazard', x: 958, y: 425 },
  { id: 'BIN-201-G', b: 'อาคาร 2', spot: 'ชั้น 1 หน้า Book Center (2-102)', type: 'general', x: 108, y: 392 },
  { id: 'BIN-202-Y', b: 'อาคาร 2', spot: 'ชั้น 1 หน้าวิทยาลัยโลจิสติกส์ฯ (2-104)', type: 'recycle', x: 108, y: 432 },
  { id: 'BIN-301-G', b: 'อาคาร 3', spot: 'ชั้น 1 หน้าห้องประชุม', type: 'general', x: 300, y: 108 },
  { id: 'BIN-302-Y', b: 'อาคาร 3', spot: 'ชั้น 2 หน้าห้องรับรอง VIP (3-201)', type: 'recycle', x: 340, y: 108 },
  { id: 'BIN-401-O', b: 'อาคาร 4', spot: 'ชั้น 1 Food Court (4-101)', type: 'organic', x: 690, y: 100 },
  { id: 'BIN-402-G', b: 'อาคาร 4', spot: 'ชั้น 1 ทางออก Food Court', type: 'general', x: 742, y: 100 },
  { id: 'BIN-403-Y', b: 'อาคาร 4', spot: 'ชั้น 2 ห้องสมุด / Home@spu', type: 'recycle', x: 794, y: 100 },
  { id: 'BIN-404-R', b: 'อาคาร 4', spot: 'ชั้น 2 ห้องสมุด มุมแบตเตอรี่', type: 'hazard', x: 846, y: 100 },
  { id: 'BIN-Y01-G', b: 'ลานกลาง', spot: 'ข้างสนามบาสเกตบอล', type: 'general', x: 840, y: 430 },
  { id: 'BIN-Y02-Y', b: 'ลานกลาง', spot: 'ใกล้เสาธง', type: 'recycle', x: 240, y: 340 },
  { id: 'BIN-P01-G', b: 'ที่จอดรถ', spot: 'ทางเข้าลานจอดรถ', type: 'general', x: 1084, y: 232 },
];
const binById = id => BINS.find(b => b.id === id);
const binsOf = b => BINS.filter(x => x.b === b);

/* ---------- สถานะแอป ---------- */
const state = {
  role: 'reporter', tab: 'home', zone: 'Z-A',
  offset: 0, seq: 0,
  draft: null, lastId: null, filter: 'all', mapFilter: 'all', mapSel: null, mapBld: null, mapQ: '', mapZoom: 1, mapFocus: null,
  jobId: null, jobStatus: null, jobNote: '', jobAfter: null, jobErr: '',
  period: 'day', chat: [],
  reports: [], notifs: [],
};
const now = () => Date.now() + state.offset;

/* ---------- ฟังก์ชันช่วย ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const hhmm = t => { const d = new Date(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const mmss = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); };
const THAI_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const THAI_D = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const startOfDay = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
const dayLabel = t => {
  const diff = Math.round((startOfDay(now()) - startOfDay(t)) / 86400000);
  if (diff === 0) return 'วันนี้ ' + hhmm(t);
  if (diff === 1) return 'เมื่อวาน';
  const d = new Date(t);
  return d.getDate() + ' ' + THAI_M[d.getMonth()] + ' ' + hhmm(t);
};
const ago = t => Math.max(0, Math.floor((now() - t) / MIN));
const idFor = n => { const d = new Date(now()); return 'SW-' + pad(d.getFullYear() % 100) + pad(d.getMonth() + 1) + '-' + String(n).padStart(4, '0'); };
const typeDot = t => `<span class="dot ${t}"></span>`;
const pill = s => `<span class="pill ${s}">${STATUS[s]}</span>`;
const SAMPLE_PHOTO = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#cfe3df"/><rect x="22" y="30" width="36" height="38" rx="4" fill="#2f6bb5"/><rect x="18" y="26" width="44" height="8" rx="3" fill="#24558f"/><circle cx="30" cy="22" r="7" fill="#e9b824"/><rect x="40" y="14" width="14" height="12" rx="2" fill="#e08a12"/></svg>');

const ICON = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z',
  map: 'M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  chat: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4',
  chart: 'M5 20V10M12 20V4M19 20v-7',
  tasks: 'M9 6h11M9 12h11M9 18h11M4 6l1.2 1.2L7 5M4 12l1.2 1.2L7 11M4 18l1.2 1.2L7 17',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  pin: 'M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z',
};
const ico = (n, w = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}

/* ---------- เก็บข้อมูลในเครื่อง ---------- */
let saveWarned = false;
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ reports: state.reports, notifs: state.notifs, seq: state.seq, offset: state.offset }));
  } catch (e) {
    if (!saveWarned) { saveWarned = true; toast('พื้นที่เก็บข้อมูลในเครื่องเต็ม ข้อมูลล่าสุดอาจไม่ถูกบันทึก'); }
  }
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY); if (!raw) return;
    const d = JSON.parse(raw);
    if (Array.isArray(d.reports)) state.reports = d.reports.filter(r => r && binById(r.bin));
    if (Array.isArray(d.notifs)) state.notifs = d.notifs;
    state.seq = Number(d.seq) || state.reports.length;
    state.offset = Number(d.offset) || 0;
  } catch (e) { /* ข้อมูลเสียหาย เริ่มใหม่ */ }
}

/* ---------- ข้อมูลตัวอย่าง (โหลดเองเมื่อกดปุ่มท้ายหน้า เท่านั้น) ---------- */
function loadDemo() {
  const t = now(), day = 24 * 60 * MIN;
  const mk = (bin, prob, detail, agoMin, status, extra = {}) => {
    const r = {
      id: idFor(++state.seq), bin, problem: prob, detail, created: t - agoMin * MIN, status,
      mine: true, count: 1, photo: SAMPLE_PHOTO, after: null, assignee: null, accepted: null, resolved: null,
      escalated: false, reminded: false, live: false, by: 'นักศึกษา',
      log: [{ s: 'wait', by: 'นักศึกษา', at: t - agoMin * MIN, note: 'แจ้งเรื่อง' }], ...extra };
    state.reports.push(r); state.notifs.push({ k: 'N1', rid: r.id, at: r.created });
    return r;
  };
  const sm = 'สมชาย (เจ้าหน้าที่โซน B)', ml = 'มาลี (เจ้าหน้าที่โซน A)';
  const fin = (r, accMin, doneMin, who) => {
    r.status = 'done'; r.accepted = r.created + accMin * MIN; r.resolved = r.created + doneMin * MIN; r.assignee = who;
    r.log.push({ s: 'doing', by: who, at: r.accepted, note: 'รับงานแล้ว' }, { s: 'done', by: who, at: r.resolved, note: 'เก็บเรียบร้อย' });
    state.notifs.push({ k: 'N5', rid: r.id, at: r.accepted }, { k: 'N4', rid: r.id, at: r.resolved });
  };
  mk('BIN-401-O', 'ถังเต็ม', 'เศษอาหารล้นถัง มีแมลงวัน', 21, 'wait', { mine: false, reminded: true, by: 'บุคลากร' });
  state.notifs.push({ k: 'N2', rid: state.reports[state.reports.length - 1].id, at: t - 1 * MIN });
  mk('BIN-101-G', 'ขยะล้น', 'ถังขยะเต็ม มีขยะวางด้านข้าง', 12, 'wait');
  const d = mk('BIN-403-Y', 'ถังเต็ม', 'ขวดพลาสติกเต็มถัง', 55, 'doing', { accepted: t - 46 * MIN, assignee: sm });
  d.log.push({ s: 'doing', by: 'สมชาย', at: d.accepted, note: 'รับงานแล้ว' }); state.notifs.push({ k: 'N5', rid: d.id, at: d.accepted });
  fin(mk('BIN-402-G', 'ขยะตกพื้น', 'ขยะตกรอบถัง', day + 40, 'wait'), 12, 30, sm);
  fin(mk('BIN-Y01-G', 'ขยะล้น', 'ขยะล้นข้างสนามบาส', 3 * day + 90, 'wait'), 9, 20, sm);
  fin(mk('BIN-201-G', 'มีกลิ่น', 'กลิ่นเหม็นหน้า Book Center', 2 * day + 300, 'wait'), 14, 35, ml);
}
function resetAll() {
  state.reports = []; state.notifs = []; state.seq = 0; state.offset = 0; state.lastId = null; state.jobId = null; state.draft = null;
  state.mapSel = null; state.mapBld = null; state.mapQ = ''; state.chat = [];
}

/* ---------- ตรรกะธุรกิจ ---------- */
const remaining = r => r.created + ESC_MIN * MIN - now();
const zoneOf = r => ZONE_OF[binById(r.bin).b];
const staffName = () => state.role === 'supervisor' ? 'ผู้ดูแลพื้นที่' : 'เจ้าหน้าที่โซน ' + (state.zone === 'Z-B' ? 'B' : 'A') + ' (คุณ)';

function timerSpan(r, mode) {
  if (r.status !== 'wait') return '';
  const rem = remaining(r);
  const cls = r.escalated ? 'esc' : rem < 10 * MIN ? 'late' : '';
  const txt = r.escalated ? 'เกินเวลา ส่งต่อผู้ดูแลแล้ว' : mode === 's' ? 'เหลือ ' + mmss(rem) : 'เหลือ ' + Math.ceil(rem / MIN) + ' น. ก่อนแจ้งผู้ดูแล';
  return `<span class="timer ${cls}" data-cd="${r.id}" data-mode="${mode}">${txt}</span>`;
}
function setStatus(r, s, by, note) {
  const t = now();
  r.status = s;
  if (s === 'doing') { r.accepted = r.accepted || t; r.assignee = by; }
  if (s === 'done') { r.resolved = t; r.accepted = r.accepted || t; r.assignee = r.assignee || by; }
  if (s === 'wait') { r.accepted = null; r.assignee = null; r.resolved = null; }
  r.log.push({ s, by, at: t, note });
  if (s === 'doing') state.notifs.push({ k: 'N5', rid: r.id, at: t });
  if (s === 'done') state.notifs.push({ k: 'N4', rid: r.id, at: t });
}
function acceptJob(r, by) { setStatus(r, 'doing', by || staffName(), 'รับงานแล้ว'); toast('รับงานแล้ว หยุดนับเวลา และแจ้งผู้แจ้งทันที'); }

function submitReport() {
  const d = state.draft, t = now();
  if (!d.photo) { d.err = 'ต้องแนบรูปอย่างน้อย 1 รูป เพื่อให้เจ้าหน้าที่เห็นสภาพจริง'; render(); return; }
  const dup = state.reports.find(r => r.bin === d.bin && r.status !== 'done' && t - r.created < ESC_MIN * MIN);
  if (dup) {
    dup.count++;
    dup.log.push({ s: dup.status, by: 'นักศึกษา', at: t, note: 'มีผู้แจ้งซ้ำ รวมเป็นเรื่องเดียว' });
    state.lastId = dup.id; state.tab = 'done'; state.draft = null;
    toast('ถังนี้มีผู้แจ้งแล้ว ระบบรวมเป็นเรื่องเดียว (ผู้แจ้ง ' + dup.count + ' คน)');
    render(); window.scrollTo(0, 0); return;
  }
  state.seq++;
  const r = {
    id: idFor(state.seq), bin: d.bin, problem: d.problem, detail: d.detail.trim(), created: t, status: 'wait',
    mine: true, count: 1, photo: d.photo, after: null, assignee: null, accepted: null, resolved: null,
    escalated: false, reminded: false, live: true, by: 'นักศึกษา',
    log: [{ s: 'wait', by: 'นักศึกษา', at: t, note: 'แจ้งเรื่อง' }],
  };
  state.reports.unshift(r);
  state.notifs.push({ k: 'N1', rid: r.id, at: t });
  state.lastId = r.id; state.tab = 'done'; state.draft = null;
  render(); window.scrollTo(0, 0);
}

/* ---------- แผนที่ย่อ (ตัดจากแผนผังวิทยาเขต ให้ถังอยู่กึ่งกลาง) ---------- */
function miniMap(bin, label) {
  const k = 2.6, ar = 1.8, ratio = MAP.h / MAP.w;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const left = clamp(50 - 100 * k * (bin.x / MAP.w), -(k - 1) * 100, 0);
  const top = clamp(50 - 100 * k * ar * ratio * (bin.y / MAP.h), 100 * (1 - k * ar * ratio), 0);
  const at = o => ({ x: left + 100 * k * (o.x / MAP.w), y: top + 100 * k * ar * ratio * (o.y / MAP.h) });
  const dots = BINS.filter(o => o.id !== bin.id).map(o => {
    const p = at(o); if (p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100) return '';
    return `<i class="md" style="left:${p.x}%;top:${p.y}%"></i>`;
  }).join('');
  const p = at(bin);
  return `<div class="minimap" role="img" aria-label="${esc(label || 'ตำแหน่งถัง ' + bin.id + ' ' + bin.b)}" style="aspect-ratio:${ar}/1">
    <img src="${MAP.src}" alt="" style="width:${k * 100}%;left:${left}%;top:${top}%" draggable="false">${dots}
    <span class="mp" style="left:${p.x}%;top:${p.y}%"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-7 8-12.5A8 8 0 004 9.5C4 15 12 22 12 22z" style="fill:var(--red)" stroke="#fff" stroke-width="1.6"/><circle cx="12" cy="9.5" r="3" fill="#fff"/></svg></span></div>`;
}

/* ---------- มุมมอง ---------- */
function itemHtml(r) {
  const b = binById(r.bin);
  return `<button type="button" class="item" data-act="open" data-id="${r.id}">
    <span class="thumb"><img src="${r.photo || SAMPLE_PHOTO}" alt=""></span>
    <span style="min-width:0"><span class="id">${r.id}</span><br>
      <span class="meta">${esc(b.b)} · ${typeDot(b.type)}${TYPES[b.type]}${r.count > 1 ? ' · ผู้แจ้ง ' + r.count + ' คน' : ''}</span></span>
    <span style="text-align:right">${pill(r.status)}<br><span class="meta small muted">${dayLabel(r.created)}</span></span></button>`;
}
const mine = () => state.reports.filter(r => r.mine).sort((a, b) => b.created - a.created);

function viewHome() {
  const m = mine().slice(0, 2);
  return `<div class="stack" style="max-width:760px;margin:0 auto">
    <section class="card hero">
      <div class="small" style="opacity:.7">ถังเต็ม?</div>
      <h1 class="big">เลือกจุด <em>ถ่าย</em> ส่ง<br>แจ้งขยะล้นได้ในไม่กี่วินาที</h1>
      <p>เจอถังขยะเต็มหรือขยะล้น เลือกอาคารและจุดที่พบ ถ่ายรูป แล้วส่ง เจ้าหน้าที่ประจำโซนจะได้รับแจ้งทันที</p>
      <div style="margin-top:18px;max-width:340px"><button type="button" class="btn primary lg" data-act="tab" data-tab="report">${ico('camera')} แจ้งขยะล้นเลย</button></div>
    </section>
    <div class="tiles">
      <button type="button" class="tile" data-act="tab" data-tab="list">${ico('list')}รายการแจ้งปัญหา</button>
      <button type="button" class="tile" data-act="tab" data-tab="map">${ico('map')}แผนผังวิทยาเขต</button>
      <button type="button" class="tile" data-act="tab" data-tab="dash">${ico('chart')}Dashboard</button>
      <button type="button" class="tile" data-act="tab" data-tab="chat">${ico('chat')}Chatbot</button>
    </div>
    <section class="card"><div class="h">เรื่องล่าสุดของฉัน</div>
      <div class="list">${m.length ? m.map(itemHtml).join('') : '<p class="muted">ยังไม่มีเรื่องที่แจ้ง เริ่มจากกด "แจ้งขยะล้นเลย" ด้านบน</p>'}</div></section>
  </div>`;
}

function viewReport() {
  const d = state.draft;
  const bin = binById(d.bin);
  const spots = binsOf(d.building);
  return `<div class="grid2"><form class="card" id="reportForm" novalidate>
    <h2 class="title" style="margin-bottom:2px">แจ้งขยะล้น</h2><p class="muted small" style="margin-bottom:16px">กรอกให้ครบแล้วกดส่ง</p>
    ${d.fromMap ? `<div class="autofill field"><small>เลือกจากแผนผังแล้ว</small><b class="mono">${bin.id}</b> · ถัง${TYPES[bin.type]} (${TYPE_COLOR[bin.type]})<small>${esc(bin.b)} ${esc(bin.spot)}</small></div>` : ''}
    <div class="field"><span class="lab" id="lp">ประเภทปัญหา</span>
      <div class="chips" role="group" aria-labelledby="lp">${PROBLEMS.map(p => `<button type="button" class="chip sel" data-act="problem" data-p="${p}" aria-pressed="${d.problem === p}">${p}</button>`).join('')}</div></div>
    <div class="field"><label for="fBuilding">สถานที่</label>
      <select class="input" id="fBuilding">${BUILDINGS.map(b => `<option ${b === d.building ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
    <div class="field"><label for="fBin">ถัง / จุดที่พบ</label>
      <select class="input" id="fBin">${spots.map(b => `<option value="${b.id}" ${b.id === d.bin ? 'selected' : ''}>${b.id} · ${esc(b.spot)} (${TYPES[b.type]})</option>`).join('')}</select>
      <button type="button" class="btn sm" style="justify-self:start" data-act="pickmap">เลือกจากแผนผังวิทยาเขต</button></div>
    <div class="field"><label for="fDetail">รายละเอียดเพิ่มเติม <span class="muted" style="font-weight:400">(ไม่บังคับ)</span></label>
      <textarea class="input" id="fDetail" maxlength="200" placeholder="เช่น ถังขยะเต็ม มีขยะวางด้านข้าง">${esc(d.detail)}</textarea>
      <span class="small muted num" id="fCount" style="text-align:right">${d.detail.length}/200</span></div>
    <div class="field"><span class="lab">รูปภาพ <span style="color:var(--red-ink)">*</span></span>
      <div class="photo"><span class="pv" id="fPv">${d.photo ? `<img src="${d.photo}" alt="รูปที่แนบ">` : ico('camera')}</span>
        <label class="drop" for="fPhoto">+ แนบรูป หรือถ่ายใหม่</label>
        <input type="file" id="fPhoto" accept="image/*" capture="environment" hidden>
        <button type="button" class="btn sm" data-act="samplePhoto" style="align-self:center">ใช้รูปตัวอย่าง</button></div></div>
    <div class="field"><span class="lab">ตำแหน่งบนแผนผัง</span>
      <div class="gps">${ico('pin')}<div class="gt"><b>${esc(bin.b)}</b><span>${esc(bin.spot)} · ${typeDot(bin.type)}ถัง${TYPES[bin.type]}</span></div></div>
      ${miniMap(bin)}</div>
    <p class="err" role="alert" id="fErr">${esc(d.err)}</p>
    <button type="submit" class="btn primary lg">ส่งแจ้งปัญหา</button></form>
    <aside class="stack"><section class="card flat"><div class="h">ขั้นตอนหลังส่ง</div>
      <ol class="small" style="margin:0;padding-left:18px;display:grid;gap:6px">
        <li>ระบบสร้างรหัสเรื่อง และตั้งสถานะ รอดำเนินการ</li><li>ส่ง LINE ถึงเจ้าหน้าที่ประจำโซนทันที</li>
        <li>เตือนซ้ำที่นาทีที่ ${REMIND_MIN} ถ้ายังไม่มีผู้รับงาน</li><li>ครบ ${ESC_MIN} นาที ส่งต่อผู้ดูแลพื้นที่อัตโนมัติ</li></ol></section>
      <section class="card flat small muted">ถังเดียวกันที่ถูกแจ้งซ้ำภายใน ${ESC_MIN} นาที จะรวมเป็นเรื่องเดียวและนับจำนวนผู้แจ้ง</section></aside></div>`;
}

function viewDone() {
  const r = state.reports.find(x => x.id === state.lastId);
  if (!r) return '<p class="muted">ไม่พบเรื่องที่เลือก</p>';
  const b = binById(r.bin);
  const step = (cls, label, t) => `<li class="${cls}"><span>${label}</span><span class="small muted num">${t || ''}</span></li>`;
  const fresh = r.live && r.log.length === 1 && now() - r.created < 2 * MIN;
  return `<div class="grid2"><div class="stack">
    <section class="ok-hero">${fresh ? `<div class="ck">${ico('check', 3)}</div><h2 class="title">ส่งแจ้งปัญหาแล้ว</h2>` : `<h2 class="title">ติดตามเรื่องที่แจ้ง</h2>`}
      <p class="small" style="margin-top:4px">${esc(b.b)} · ${esc(b.spot)} · ${typeDot(b.type)}${TYPES[b.type]}</p></section>
    <section class="card"><div class="row" style="margin-bottom:14px"><div><div class="small muted">รหัสเรื่อง</div><div class="title mono">${r.id}</div></div><span class="sp"></span>${pill(r.status)}</div>
      <ul class="tl">
        ${step('done', 'ส่งเรื่องเข้าระบบ', hhmm(r.created))}
        ${step('done', 'แจ้งเจ้าหน้าที่' + BIN_ZONE_LABEL[zoneOf(r)], hhmm(r.created))}
        ${r.escalated ? step('done', 'ส่งต่อผู้ดูแลพื้นที่', hhmm(r.created + ESC_MIN * MIN)) : ''}
        ${r.accepted ? step('done', 'เจ้าหน้าที่รับงาน', hhmm(r.accepted)) : step('now', 'เจ้าหน้าที่รับงาน', 'รอ')}
        ${r.resolved ? step('done', 'ดำเนินการแล้ว', hhmm(r.resolved)) : step('off', 'ดำเนินการแล้ว', '')}
      </ul>
      ${r.count > 1 ? `<p class="small" style="margin-top:10px">มีผู้แจ้งเรื่องนี้ ${r.count} คน ระบบรวมเป็นเรื่องเดียว</p>` : ''}
    </section>
    ${r.status === 'wait' ? `<section class="card" style="background:var(--amber-soft);border-color:transparent"><div class="row"><b style="color:var(--amber-ink)">เหลือเวลารับงาน</b><span class="sp"></span>${timerSpan(r, 's')}</div>
        <p class="small" style="margin-top:6px">ครบ ${ESC_MIN} นาทีแล้วยังไม่มีผู้รับงาน ระบบแจ้งผู้ดูแลพื้นที่อัตโนมัติ</p></section>` : ''}
    ${r.status === 'doing' ? `<section class="card flat small">รับงานโดย <b>${esc(r.assignee)}</b> เมื่อ ${hhmm(r.accepted)} จะแจ้งให้ทราบเมื่อเสร็จ</section>` : ''}
    ${r.status === 'done' ? `<section class="card flat"><div class="h">รูปหลังเก็บ</div><div class="thumb" style="width:120px;height:120px"><img src="${r.after || SAMPLE_PHOTO}" alt="รูปหลังเก็บ"></div><p class="small" style="margin-top:8px">ขอบคุณที่ช่วยแจ้งให้มหาวิทยาลัยสะอาดขึ้น</p></section>` : ''}
    <div class="row"><button type="button" class="btn dark" style="flex:1" data-act="tab" data-tab="list">ดูรายการ</button>
      <button type="button" class="btn" style="flex:1" data-act="tab" data-tab="report">แจ้งเรื่องอื่น</button></div></div>
    <aside class="stack"><section class="card flat"><div class="h">ตำแหน่งถัง</div>${miniMap(b)}
      <div class="row" style="margin-top:10px"><span class="small muted">${esc(b.b)} · ${b.id}</span><span class="sp"></span><button type="button" class="btn sm" data-act="showbin" data-bin="${b.id}">ดูบนแผนผัง</button></div></section></aside></div>`;
}

function viewList() {
  const f = state.filter;
  const rows = mine().filter(r => f === 'all' || r.status === f);
  const chip = (k, t) => `<button type="button" class="chip" data-act="filter" data-f="${k}" aria-pressed="${f === k}">${t}</button>`;
  return `<div class="stack" style="max-width:720px;margin:0 auto">
    <div class="row"><div><h2 class="title">รายการแจ้งปัญหา</h2><span class="small muted">ของฉัน ${mine().length} เรื่อง</span></div><span class="sp"></span>
      <button type="button" class="btn primary" data-act="tab" data-tab="report">+ แจ้งเรื่องใหม่</button></div>
    <div class="chips">${chip('all', 'ทั้งหมด')}${chip('wait', 'รอ')}${chip('doing', 'กำลัง')}${chip('done', 'เสร็จ')}</div>
    <div class="list">${rows.length ? rows.map(itemHtml).join('') : `<p class="muted card flat">${mine().length ? 'ไม่มีเรื่องในสถานะนี้' : 'ยังไม่มีเรื่องที่แจ้ง กด "+ แจ้งเรื่องใหม่" เพื่อเริ่มต้น'}</p>`}</div></div>`;
}

/* ---------- ฝั่งเจ้าหน้าที่ ---------- */
function scopeReports() {
  return state.reports.filter(r => state.zone === 'all' || zoneOf(r) === state.zone);
}
function viewJobs() {
  const rs = scopeReports();
  const today = new Date(now()).toDateString();
  const doneToday = rs.filter(r => r.status === 'done' && new Date(r.resolved).toDateString() === today);
  const wait = rs.filter(r => r.status === 'wait').sort((a, b) => a.created - b.created);
  const doing = rs.filter(r => r.status === 'doing').sort((a, b) => a.created - b.created);
  const sup = state.role === 'supervisor';
  const card = r => {
    const b = binById(r.bin);
    return `<article class="job ${r.status}"><div class="top"><span class="mono" style="font-weight:500">${r.id}</span>${pill(r.status)}</div>
      <div><b>${esc(b.b)} ${esc(b.spot)}</b><div class="small muted">${typeDot(b.type)}${TYPES[b.type]} · ${r.status === 'doing' ? 'รับเมื่อ ' + hhmm(r.accepted) : r.status === 'done' ? 'เสร็จ ' + hhmm(r.resolved) : 'รอมา ' + ago(r.created) + ' น.'}${r.count > 1 ? ' · ผู้แจ้ง ' + r.count + ' คน' : ''}</div></div>
      ${timerSpan(r, 'm')}
      <div class="row">
        ${r.status === 'wait' ? `<button type="button" class="btn primary sm" style="flex:1" data-act="accept" data-id="${r.id}">รับงาน</button>` : ''}
        ${r.status === 'doing' ? `<button type="button" class="btn sm" style="flex:1;background:var(--green);color:#fff;border-color:var(--green)" data-act="finish" data-id="${r.id}">เสร็จแล้ว</button>` : ''}
        ${sup && r.status === 'wait' ? `<button type="button" class="btn sm" data-act="reassign" data-id="${r.id}">มอบหมายใหม่</button>` : ''}
        <button type="button" class="btn sm" data-act="open" data-id="${r.id}">รายละเอียด</button></div></article>`;
  };
  const empty = state.reports.length
    ? 'ไม่มีงานค้างในโซนนี้'
    : 'ยังไม่มีงาน เมื่อผู้แจ้งส่งเรื่อง งานจะขึ้นที่นี่ (สลับเป็นบทบาท "ผู้แจ้ง" เพื่อแจ้งเรื่องแรก)';
  return `<div class="stack">
    <div class="row"><div><h2 class="title">${sup ? 'ภาพรวมงานในพื้นที่' : 'งาน' + (state.zone === 'Z-B' ? 'โซน B' : 'โซน A')}</h2><span class="small muted">${sup ? 'ผู้ดูแลพื้นที่' : 'เจ้าหน้าที่เก็บขยะ'}</span></div><span class="sp"></span>
      <label class="small muted" for="zoneSel">โซน</label><select class="input" id="zoneSel" style="width:auto">
        <option value="Z-A" ${state.zone === 'Z-A' ? 'selected' : ''}>โซน A (อาคาร 1-2 · ที่จอดรถ)</option><option value="Z-B" ${state.zone === 'Z-B' ? 'selected' : ''}>โซน B (อาคาร 3-4 · ลานกลาง)</option>
        ${sup ? `<option value="all" ${state.zone === 'all' ? 'selected' : ''}>ทุกโซน</option>` : ''}</select></div>
    <div class="kpis" style="max-width:520px"><div class="kpi red"><b class="num">${wait.length}</b><span>รอ</span></div>
      <div class="kpi amber"><b class="num">${doing.length}</b><span>กำลังทำ</span></div>
      <div class="kpi green"><b class="num">${doneToday.length}</b><span>เสร็จวันนี้</span></div></div>
    <div class="jobs">${[...wait, ...doing, ...doneToday].map(card).join('') || `<p class="muted card flat" style="grid-column:1/-1">${empty}</p>`}</div></div>`;
}

function viewJob() {
  const r = state.reports.find(x => x.id === state.jobId);
  if (!r) return '<p class="muted">ไม่พบงาน</p>';
  const b = binById(r.bin), s = state.jobStatus;
  const seg = (k, t) => `<button type="button" class="s-${k}" data-act="jstatus" data-s="${k}" aria-pressed="${s === k}">${t}</button>`;
  return `<div class="grid2"><div class="stack">
    <button type="button" class="btn sm" data-act="back" style="justify-self:start">← กลับ</button>
    <section class="card"><div class="row" style="margin-bottom:12px"><h2 class="title mono">${r.id}</h2>${pill(r.status)}${timerSpan(r, 'm')}</div>
      <div class="thumb" style="width:100%;height:210px;border-radius:12px"><img src="${r.photo || SAMPLE_PHOTO}" alt="รูปจากผู้แจ้ง" style="object-fit:cover"></div>
      <p class="small muted" style="margin:6px 0 14px">รูปจากผู้แจ้ง · 1 รูป</p>
      <dl style="display:grid;grid-template-columns:76px minmax(0,1fr);gap:8px 12px;margin:0">
        <dt class="muted">ที่ตั้ง</dt><dd style="margin:0"><b>${esc(b.b)} ${esc(b.spot)}</b></dd>
        <dt class="muted">ถัง</dt><dd style="margin:0" class="mono">${b.id} · ${TYPES[b.type]} (${TYPE_COLOR[b.type]})</dd>
        <dt class="muted">ปัญหา</dt><dd style="margin:0">${esc(r.problem)}${r.detail ? ' · ' + esc(r.detail) : ''}</dd>
        <dt class="muted">เวลาแจ้ง</dt><dd style="margin:0">${dayLabel(r.created)} · ${esc(r.by)}${r.count > 1 ? ' และอีก ' + (r.count - 1) + ' คน' : ''}</dd>
        ${r.assignee ? `<dt class="muted">ผู้รับงาน</dt><dd style="margin:0">${esc(r.assignee)}</dd>` : ''}</dl></section></div>
    <div class="stack"><section class="card">
      <div style="margin-bottom:12px">${miniMap(b)}</div>
      <div class="row" style="margin-bottom:16px"><span class="small muted">${esc(b.b)} · ${esc(b.spot)}</span><span class="sp"></span>
        <button type="button" class="btn sm primary" data-act="showbin" data-bin="${b.id}">ดูบนแผนผัง</button></div>
      <div class="field"><span class="lab">เปลี่ยนสถานะ</span><div class="seg" role="group" aria-label="สถานะงาน">${seg('wait', 'รอ')}${seg('doing', 'กำลังทำ')}${seg('done', 'เสร็จ')}</div></div>
      <div class="field"><label for="jNote">หมายเหตุ</label><textarea class="input" id="jNote" placeholder="เช่น เก็บขยะเสร็จ เปลี่ยนถุงใหม่">${esc(state.jobNote)}</textarea></div>
      <div class="field"><span class="lab">รูปหลังเก็บ ${s === 'done' ? '<span style="color:var(--red-ink)">* ต้องแนบก่อนปิดงาน</span>' : ''}</span>
        <div class="photo"><span class="pv" id="jPv">${state.jobAfter ? `<img src="${state.jobAfter}" alt="รูปหลังเก็บ">` : ico('camera')}</span>
          <label class="drop" for="jPhoto">แนบรูปหลังเก็บ</label><input type="file" id="jPhoto" accept="image/*" capture="environment" hidden>
          <button type="button" class="btn sm" data-act="sampleAfter" style="align-self:center">ใช้รูปตัวอย่าง</button></div></div>
      <p class="err" role="alert">${esc(state.jobErr)}</p>
      <button type="button" class="btn dark lg" data-act="saveJob">บันทึกสถานะ</button>
      <p class="small muted" style="margin-top:8px">บันทึกแล้วระบบแจ้งผู้แจ้งทันที และเก็บผู้เปลี่ยน เวลา หมายเหตุไว้ใน status_log</p></section>
      <section class="card flat"><div class="h">ประวัติสถานะ (status_log)</div><ul class="tl">${r.log.map(l => `<li class="done"><span>${STATUS[l.s]} <span class="muted small">· ${esc(l.by)}${l.note ? ' · ' + esc(l.note) : ''}</span></span><span class="small muted num">${hhmm(l.at)}</span></li>`).join('')}</ul></section></div></div>`;
}

/* ---------- แผนผังวิทยาเขต ---------- */
function binState(bin) {
  const r = state.reports.filter(x => x.bin === bin.id && x.status !== 'done').sort((a, b) => a.created - b.created)[0];
  return r ? r.status : 'done';
}
const SCOL = { wait: 'var(--red)', doing: 'var(--amber)', done: 'var(--green)' };
const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
function roomMatches(b, r, q) {
  if (!q) return true;
  const hay = norm([b, r.c, r.n, (r.s || []).join(' '), r.f ? 'ชั้น' + r.f : ''].join(' '));
  return hay.includes(q);
}
function binMatches(b, q) { return !q || norm([b.id, b.b, b.spot, TYPES[b.type]].join(' ')).includes(q); }

function roomsHtml(bName, q) {
  const rooms = BLD[bName].rooms.filter(r => roomMatches(bName, r, q));
  return rooms.map(r => `<li><span class="rc" style="background:${BLD[bName].soft};color:var(--ink)">${r.c || 'ชั้น ' + r.f}</span><span>${esc(r.n)}${(r.s || []).length ? `<small>${r.s.map(esc).join(' · ')}</small>` : ''}</span></li>`).join('');
}
function bldCard(bName, q) {
  const B = BLD[bName], rooms = roomsHtml(bName, q);
  if (!rooms) return '';
  return `<section class="bcard"><button type="button" class="bhead" style="background:${B.color};color:${B.n === 4 ? '#2a1d00' : '#fff'}" data-act="bld" data-b="${bName}" aria-label="${bName} ดูบนแผนผัง">
      <span class="bn">${B.n}</span><span><b>${B.title}</b><small>${B.sub}</small></span></button><ul class="rooms">${rooms}</ul></section>`;
}

function viewMap() {
  const f = state.mapFilter, q = norm(state.mapQ);
  const sel = state.mapSel ? binById(state.mapSel) : null;
  const selB = state.mapBld;
  const chip = (k, t) => `<button type="button" class="chip" data-act="mfilter" data-f="${k}" aria-pressed="${f === k}">${t}</button>`;
  const roomHit = b => BLD[b] && BLD[b].rooms.some(r => roomMatches(b, r, q));
  const hits = q ? Object.keys(BLD).filter(roomHit) : [];

  const zones = Object.keys({ ...BLD, ...AREA_BOX }).map(b => {
    const [x, y, w, h] = bldBox(b), on = selB === b, hit = hits.includes(b);
    return `<button type="button" class="bhit ${on ? 'on' : ''} ${hit ? 'hit' : ''}" data-act="bld" data-b="${b}" aria-label="${b}" aria-pressed="${on}"
      style="left:${x / MAP.w * 100}%;top:${y / MAP.h * 100}%;width:${w / MAP.w * 100}%;height:${h / MAP.h * 100}%"></button>`;
  }).join('');
  const pins = BINS.map(b => {
    const st = binState(b);
    const match = (f === 'all' || f === st) && binMatches(b, q);
    return `<button type="button" class="mpin ${match ? '' : 'dim'} ${sel && sel.id === b.id ? 'sel' : ''}" data-act="pin" data-bin="${b.id}"
      style="left:${b.x / MAP.w * 100}%;top:${b.y / MAP.h * 100}%;background:${SCOL[st]}" aria-pressed="${!!(sel && sel.id === b.id)}"
      aria-label="${b.id} ${esc(b.b)} ${esc(b.spot)} ${STATUS[st]}"><span class="tdot ${b.type}"></span></button>`;
  }).join('');

  const act = sel ? state.reports.find(x => x.bin === sel.id && x.status !== 'done') : null;
  let side;
  if (sel) {
    side = `<section class="card"><div class="row"><b class="mono">${sel.id}</b><span class="sp"></span>${pill(act ? act.status : 'done')}</div>
      <p style="margin:6px 0">${esc(sel.b)} · ${esc(sel.spot)}</p><p class="small muted">${typeDot(sel.type)}ถัง${TYPES[sel.type]} (${TYPE_COLOR[sel.type]}) ${act ? '· ล่าสุด ' + act.id : '· ไม่มีเรื่องค้าง'}</p>
      <div class="row" style="margin-top:12px">
        ${state.role === 'reporter' ? `<button type="button" class="btn primary sm" data-act="reportbin" data-bin="${sel.id}">แจ้งปัญหาที่ถังนี้</button>` : ''}
        ${act && state.role !== 'reporter' ? `<button type="button" class="btn primary sm" data-act="open" data-id="${act.id}">ดูงาน</button>` : ''}
        <button type="button" class="btn sm" data-act="clearsel">ปิด</button></div></section>`;
  } else if (selB) {
    const bins = binsOf(selB);
    const B = BLD[selB];
    side = `<section class="card"><div class="row"><b style="font-size:17px">${selB}</b><span class="sp"></span><button type="button" class="btn sm" data-act="clearsel">ปิด</button></div>
      <p class="small muted" style="margin:2px 0 10px">${B ? B.sub : selB === 'ลานกลาง' ? 'ลานกิจกรรม สนามกีฬา เสาธง' : 'ลานจอดรถ'} · ${BIN_ZONE_LABEL[ZONE_OF[selB]]}</p>
      <div class="h" style="margin-bottom:6px">ถังขยะในพื้นที่ (${bins.length})</div>
      <div class="list">${bins.map(b => { const st = binState(b); return `<button type="button" class="binrow" data-act="pin" data-bin="${b.id}"><span class="sdot" style="background:${SCOL[st]}"></span><span style="min-width:0"><b class="mono">${b.id}</b><br><span class="small muted">${esc(b.spot)} · ${typeDot(b.type)}${TYPES[b.type]}</span></span></button>`; }).join('') || '<p class="small muted">ยังไม่มีถังในพื้นที่นี้</p>'}</div></section>`;
  } else {
    side = `<section class="card flat small muted">แตะหมุดบนแผนผังเพื่อดูข้อมูลถังและสถานะล่าสุด หรือแตะอาคารเพื่อดูถังในอาคารนั้น</section>`;
  }
  const quick = QUICK.map(x => `<button type="button" class="chip" data-act="bld" data-b="${x.b}">${esc(x.t)}</button>`).join('');
  const dirs = Object.keys(BLD).map(b => bldCard(b, q)).join('');
  const zoom = state.mapZoom;
  return `<div class="stack"><div class="row"><div><h2 class="title">แผนผังวิทยาเขต</h2><span class="small muted">SPU Khon Kaen · ตำแหน่งอาคาร ห้อง และถังขยะ</span></div><span class="sp"></span>
      <label class="small muted" for="mapQ">ค้นหา</label><input class="input" id="mapQ" style="width:min(280px,100%)" placeholder="ห้อง อาคาร หรือรหัสถัง เช่น 1-107" value="${esc(state.mapQ)}"></div>
    <div class="grid2"><div class="stack">
      <div class="chips">${chip('all', 'ทั้งหมด')}${chip('wait', 'รอ')}${chip('doing', 'กำลังทำ')}${chip('done', 'เรียบร้อย')}</div>
      <section class="card mapcard"><div class="maptools"><span class="small muted">ซูม</span>
        <button type="button" class="btn sm" data-act="zoom" data-d="-1" aria-label="ซูมออก" ${zoom <= 1 ? 'disabled' : ''}>−</button>
        <span class="small num" style="min-width:42px;text-align:center">${Math.round(zoom * 100)}%</span>
        <button type="button" class="btn sm" data-act="zoom" data-d="1" aria-label="ซูมเข้า" ${zoom >= 3 ? 'disabled' : ''}>+</button>
        <span class="sp"></span><a class="small" href="${MAP.full}" target="_blank" rel="noopener">ดูภาพแผนผังเต็ม ↗</a></div>
        <div class="mapview" tabindex="0" role="group" aria-label="แผนผังวิทยาเขต เลื่อนเพื่อดูส่วนอื่น"><div class="mapin" style="width:${zoom * 100}%">
          <img src="${MAP.src}" alt="แผนผังวิทยาเขต SPU ขอนแก่น อาคาร 1 ถึง 4 ลานกลาง และที่จอดรถ" draggable="false" width="${MAP.w}" height="${MAP.h}">${zones}${pins}</div></div>
        <div class="legend small"><span class="pill wait">รอดำเนินการ</span><span class="pill doing">กำลังดำเนินการ</span><span class="pill done">เรียบร้อย</span>
          <span class="muted">· จุดสีในหมุด = ประเภทถัง: ${typeDot('general')}ทั่วไป ${typeDot('recycle')}รีไซเคิล ${typeDot('organic')}อินทรีย์ ${typeDot('hazard')}อันตราย</span></div></section>
      <section class="card flat"><div class="h">ไปที่ไหนดี</div><div class="chips">${quick}</div></section></div>
    <aside class="stack">${side}
      <section class="card flat"><div class="h">วิธีอ่านเลขห้อง</div>
        <div class="row" style="gap:12px"><div class="roomex"><b style="color:#d6246e">1</b><i>-</i><b style="color:var(--teal-ink)">108</b></div>
          <p class="small muted" style="flex:1;min-width:160px">เลขแรกคืออาคาร ส่วนเลขหลักแรกของเลขห้องคือเลขชั้น เช่น <b class="mono">1-108</b> คืออาคาร 1 ห้อง 108 อยู่ชั้น 1</p></div></section></aside></div>
    <div><div class="h">ห้องสำคัญในแต่ละอาคาร${q ? ' · ผลค้นหา' : ''}</div>
      <div class="bgrid">${dirs || '<p class="card flat muted" style="grid-column:1/-1">ไม่พบห้องหรืออาคารที่ค้นหา ลองพิมพ์เลขห้อง เช่น 2-102 หรือชื่อห้อง เช่น Book Center</p>'}</div></div></div>`;
}

/* ---------- Dashboard (แสดงเฉพาะข้อมูลที่เพิ่มเข้ามาจริง) ---------- */
function periodInfo() {
  const t = now(), d0 = startOfDay(t), per = state.period;
  const inRange = x => x >= d0 && x < d0 + 86400000;
  if (per === 'day') {
    const hrs = state.reports.filter(r => inRange(r.created)).map(r => new Date(r.created).getHours());
    const lo = Math.min(8, ...hrs), hi = Math.max(16, ...hrs), labels = [];
    for (let h = lo; h <= hi; h++) labels.push(pad(h));
    return { labels, idx: r => new Date(r.created).getHours() - lo, from: d0, to: d0 + 86400000, title: `จำนวนเรื่องตามช่วงเวลา (${pad(lo)}:00–${pad(hi)}:59)` };
  }
  if (per === 'week') {
    const from = d0 - 6 * 86400000, labels = [];
    for (let i = 0; i < 7; i++) labels.push(THAI_D[new Date(from + i * 86400000 + 43200000).getDay()]);
    return { labels, idx: r => Math.round((startOfDay(r.created) - from) / 86400000), from, to: d0 + 86400000, title: 'จำนวนเรื่องรายวัน (7 วันล่าสุด)' };
  }
  const d = new Date(t), from = new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  const days = Math.round((to - from) / 86400000), nW = Math.ceil(days / 7);
  const labels = Array.from({ length: nW }, (_, i) => 'สัปดาห์ ' + (i + 1));
  return { labels, idx: r => Math.min(nW - 1, Math.floor((new Date(r.created).getDate() - 1) / 7)), from, to, title: 'จำนวนเรื่องรายสัปดาห์ (เดือนนี้)' };
}
function metrics() {
  const p = periodInfo();
  const rs = state.reports.filter(r => r.created >= p.from && r.created < p.to);
  const vals = p.labels.map(() => 0), spots = {};
  rs.forEach(r => { const i = p.idx(r); if (i >= 0 && i < vals.length) vals[i]++; const b = binById(r.bin).b; spots[b] = (spots[b] || 0) + 1; });
  const done = rs.filter(r => r.status === 'done').length;
  const acc = rs.filter(r => r.accepted).map(r => Math.max(0, Math.round((r.accepted - r.created) / MIN)));
  return { p, rs, vals, spots, total: rs.length, pct: rs.length ? Math.round(done / rs.length * 100) : null, acc: acc.length ? Math.round(acc.reduce((a, b) => a + b, 0) / acc.length) : null };
}
function viewDash() {
  const per = state.period, reporter = state.role === 'reporter';
  const head = `<div><h2 class="title">Dashboard</h2><span class="small muted">ภาพรวมทั้งวิทยาเขต · สรุปจากเรื่องที่แจ้งเข้ามาจริง</span></div>`;
  if (!state.reports.length) {
    return `<div class="stack" style="max-width:720px;margin:0 auto"><div class="row">${head}</div>
      <section class="card emptydash"><svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M10 54V30M26 54V16M42 54V38M58 54H6"/></svg>
        <h3 class="title" style="font-size:18px">ยังไม่มีข้อมูล</h3>
        <p class="muted">Dashboard จะแสดงสถิติหลังมีการแจ้งปัญหา เมื่อเพิ่มเรื่องแล้ว จะเห็นจำนวนเรื่อง เวลารับงานเฉลี่ย สัดส่วนที่แก้ไขแล้ว และจุดที่ล้นบ่อย</p>
        ${reporter ? `<button type="button" class="btn primary" data-act="tab" data-tab="report">${ico('camera')} แจ้งเรื่องแรก</button>`
          : `<p class="small muted">สลับเป็นบทบาท "ผู้แจ้ง" ด้านบน แล้วแจ้งเรื่องแรกเพื่อเริ่มมีข้อมูล</p>`}</section></div>`;
  }
  const m = metrics();
  const W = 520, H = 220, L = 30, B = 26, T = 18, n = m.vals.length, max = Math.max(...m.vals, 0);
  const top = Math.max(4, Math.ceil(max / 4) * 4), bw = (W - L - 10) / n;
  const pk = max > 0 && m.vals.filter(v => v === max).length === 1 ? m.vals.indexOf(max) : -1;
  const grid = [0, .5, 1].map(g => { const y = T + (H - T - B) * (1 - g); return `<line class="grid" x1="${L}" x2="${W - 6}" y1="${y}" y2="${y}"/><text x="${L - 6}" y="${y + 4}" text-anchor="end">${Math.round(top * g)}</text>`; }).join('');
  const bars = m.vals.map((v, i) => { const h = (H - T - B) * v / top, x = L + i * bw + bw * .18, y = H - B - h;
    return `<rect class="${i === pk ? 'bar-pk' : 'bar-n'}" x="${x}" y="${y}" width="${bw * .64}" height="${h}" rx="3"/>
      <text x="${x + bw * .32}" y="${y - 4}" text-anchor="middle">${v}</text><text x="${x + bw * .32}" y="${H - 8}" text-anchor="middle">${m.p.labels[i]}</text>`; }).join('');
  const spots = Object.entries(m.spots).sort((a, b) => b[1] - a[1]).slice(0, 6), sm = spots.length ? spots[0][1] : 1;
  const chip = (k, t) => `<button type="button" class="chip" data-act="period" data-p="${k}" aria-pressed="${per === k}">${t}</button>`;
  const summary = m.vals.map((v, i) => m.p.labels[i] + ' ' + v).join(', ');
  return `<div class="stack"><div class="row">${head}<span class="sp"></span>
      <div class="chips">${chip('day', 'วันนี้')}${chip('week', '7 วัน')}${chip('month', 'เดือนนี้')}</div></div>
    <div class="kpis" style="max-width:560px"><div class="kpi"><b class="num">${m.total}</b><span>เรื่องทั้งหมด</span></div>
      <div class="kpi amber"><b class="num">${m.acc === null ? '–' : m.acc + ' น.'}</b><span>รับงานเฉลี่ย</span></div><div class="kpi green"><b class="num">${m.pct === null ? '–' : m.pct + '%'}</b><span>แก้ไขแล้ว</span></div></div>
    <div class="${reporter ? '' : 'grid2'}"><section class="card"><div class="h">${m.p.title}</div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${m.p.title} ${summary}">${grid}${bars}</svg>
      <p class="small muted">${!m.total ? 'ช่วงเวลานี้ยังไม่มีเรื่องที่แจ้ง ลองเลือกช่วงเวลาอื่น' : pk >= 0 ? 'แท่งสีแดงคือช่วงที่เกิดเรื่องมากที่สุด' : 'ทุกช่วงมีจำนวนเรื่องใกล้เคียงกัน'}</p></section>
      ${reporter ? '' : `<section class="card"><div class="h">จุดที่ล้นบ่อยที่สุด</div>
        ${spots.length ? spots.map(([k, v]) => `<div class="rank"><span>${esc(k)}</span><span class="tr"><i style="width:${v / sm * 100}%"></i></span><b class="num">${v}</b></div>`).join('') : '<p class="small muted">ยังไม่มีข้อมูลในช่วงนี้</p>'}
        <div style="margin-top:12px"><button type="button" class="btn sm" data-act="csv" ${m.total ? '' : 'disabled'}>ดาวน์โหลดรายงาน CSV</button></div></section>`}</div></div>`;
}
function exportCsv() {
  const m = metrics(), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const dt = t => t ? new Date(t).toLocaleString('sv-SE').replace('T', ' ') : '';
  const rows = [['รหัสเรื่อง', 'สถานที่', 'จุดที่พบ', 'รหัสถัง', 'ประเภทถัง', 'ปัญหา', 'สถานะ', 'ผู้แจ้ง(คน)', 'เวลาแจ้ง', 'เวลารับงาน', 'เวลาปิดงาน', 'ผู้รับงาน']];
  m.rs.slice().sort((a, b) => a.created - b.created).forEach(r => { const b = binById(r.bin);
    rows.push([r.id, b.b, b.spot, b.id, TYPES[b.type], r.problem, STATUS[r.status], r.count, dt(r.created), dt(r.accepted), dt(r.resolved), r.assignee]); });
  const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  const d = new Date(now()); a.download = `smart-waste-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('ดาวน์โหลดรายงาน CSV แล้ว');
}

/* ---------- Chatbot ---------- */
function findRooms(text) {
  const t = norm(text), code = text.match(/([1-4])\s*[-–]?\s*(\d{3})/);
  const q2 = t.replace(/ห้อง(?=\d)/g, '').replace(/อยู่ที่ไหน|อยู่ไหน|ที่ไหน|อยู่ที่|หน่อย|ครับ|ค่ะ|คะ|ไหน/g, '');
  const out = [];
  Object.keys(BLD).forEach(b => BLD[b].rooms.forEach(r => {
    const byCode = code && r.c === code[1] + '-' + code[2];
    const nm = norm(r.n);
    const byName = t.includes(nm) || nm.split('/').some(p => p.length > 3 && t.includes(p)) || (r.s || []).some(s => t.includes(norm(s))) ||
      (q2.length >= 3 && !code && (nm.includes(q2) || (r.s || []).some(s => norm(s).includes(q2))));
    if (byCode || byName) out.push(roomLabel(b, r));
  }));
  return out;
}
function botReply(text) {
  const t = text.trim(), low = t.toLowerCase();
  const id = (t.match(/SW-\d{4}-\d{4}/i) || [])[0];
  if (id) {
    const r = state.reports.find(x => x.id.toLowerCase() === id.toLowerCase());
    if (!r) return `ไม่พบเรื่อง ${id.toUpperCase()} ลองตรวจรหัสอีกครั้ง`;
    const b = binById(r.bin);
    return `${r.id} · ${b.b}\nสถานะ: ${STATUS[r.status]}\n` + (r.status === 'wait' ? (r.escalated ? 'เกินเวลา ส่งต่อผู้ดูแลพื้นที่แล้ว' : 'ยังไม่มีผู้รับงาน เหลือเวลาอีก ' + Math.ceil(remaining(r) / MIN) + ' นาที ก่อนส่งต่อผู้ดูแล') : r.status === 'doing' ? `เจ้าหน้าที่รับงานแล้วเมื่อ ${hhmm(r.accepted)} จะแจ้งให้ทราบเมื่อเสร็จ` : `ปิดงานเมื่อ ${hhmm(r.resolved)}`);
  }
  if (/สถานะ|เช็ก|เช็ค/.test(low)) { const r = mine()[0]; return r ? botReply(r.id) : 'ยังไม่มีเรื่องที่คุณแจ้ง'; }
  const kinds = [['รีไซเคิล', 'recycle'], ['อินทรีย์', 'organic'], ['อันตราย', 'hazard'], ['ทั่วไป', 'general']];
  if (/ถัง/.test(low)) {
    const k = kinds.find(x => low.includes(x[0]));
    const bld = BUILDINGS.find(b => low.includes(norm(b)) || low.includes(b.toLowerCase()));
    const list = BINS.filter(b => (!k || b.type === k[1]) && (!bld || b.b === bld));
    if (!list.length) return 'ไม่พบถังตามที่ถาม ลองระบุประเภท (ทั่วไป/รีไซเคิล/อินทรีย์/อันตราย) หรืออาคาร';
    return `ถัง${k ? k[0] : ''}${bld ? 'ที่' + bld : ''} มี ${list.length} จุด:\n` + list.slice(0, 4).map(b => `• ${b.id} ${b.b} ${b.spot}`).join('\n') + (list.length > 4 ? `\nและอีก ${list.length - 4} จุด` : '') + '\n(ดูตำแหน่งได้ที่เมนู แผนผัง)';
  }
  const rooms = findRooms(t);
  if (rooms.length) return rooms.slice(0, 3).join('\n') + (rooms.length > 3 ? `\nและอีก ${rooms.length - 3} รายการ` : '') + '\n(ดูตำแหน่งอาคารได้ที่เมนู แผนผัง)';
  if (/แจ้ง|ล้น|เต็ม/.test(low)) return 'แตะปุ่ม "แจ้ง" ที่เมนูด้านบน เลือกอาคารและจุดที่พบ ถ่ายรูป แล้วกดส่ง';
  return 'ผมตอบได้ 4 เรื่อง: แจ้งขยะล้น เช็กสถานะ (พิมพ์รหัส SW-...) หาถังขยะ (เช่น ถังรีไซเคิลอยู่ไหน) และหาห้อง (เช่น Book Center อยู่ไหน หรือ ห้อง 1-107)';
}
function viewChat() {
  if (!state.chat.length) state.chat.push({ me: false, t: 'สวัสดีครับ ผมช่วยแจ้งขยะล้น เช็กสถานะ หาถังขยะ และบอกตำแหน่งห้องในอาคาร 1-4 ได้' });
  const q = (t, v) => `<button type="button" data-act="quick" data-q="${v}">${t}</button>`;
  return `<div style="max-width:620px;margin:0 auto"><section class="card chat"><div class="ch"><b>Chatbot ช่วยเหลือ</b><div class="small" style="opacity:.7">ตอบทันที ตลอด 24 ชั่วโมง · ตอบตามกฎที่กำหนด</div></div>
    <div class="log" id="chatLog">${state.chat.map(m => `<div class="bub ${m.me ? 'me' : ''}">${esc(m.t).replace(/\n/g, '<br>')}</div>`).join('')}
      <div class="qr-row">${q('แจ้งขยะล้น', 'แจ้งขยะล้น')}${q('เช็กสถานะ', 'เช็กสถานะ')}${q('ถังรีไซเคิลอยู่ไหน', 'ถังรีไซเคิลอยู่ไหน')}${q('Book Center อยู่ไหน', 'Book Center อยู่ไหน')}${q('ห้อง 1-107', 'ห้อง 1-107')}</div></div>
    <form id="chatForm" autocomplete="off"><input class="input" id="chatIn" placeholder="พิมพ์ข้อความ..." aria-label="พิมพ์ข้อความ"><button class="btn primary" type="submit">ส่ง</button></form></section></div>`;
}

/* ---------- ข้อความแจ้งเตือน ---------- */
function notifHtml(n) {
  const r = state.reports.find(x => x.id === n.rid); if (!r) return '';
  const b = binById(r.bin), where = `${b.b} ${b.spot}`;
  const dl = rows => `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
  const when = `<span class="small muted" style="margin-left:auto;font-weight:400;opacity:.9">${hhmm(n.at)}</span>`;
  const head = (cls, t) => `<div class="mh row" style="gap:8px">${t}${when}</div>`;
  if (n.k === 'N1') return `<article class="msg n1">${head('', 'LINE · N1 งานใหม่')}<div class="mb"><b>งานใหม่ ${r.id}</b>${dl([['สถานที่', esc(where)], ['ถัง', `<span class="mono">${b.id}</span> · ขยะ${TYPES[b.type]}`], ['ปัญหา', esc(r.problem) + (r.detail ? ' · ' + esc(r.detail) : '')], ['เวลา', hhmm(r.created) + ' · มีรูปแนบ 1 รูป']])}
    <div class="acts">${r.status === 'wait' ? `<button type="button" class="btn sm primary" data-act="accept" data-id="${r.id}">รับงาน</button>` : `<span class="pill ${r.status}">${STATUS[r.status]}</span>`}<button type="button" class="btn sm" data-act="showbin" data-bin="${b.id}">ดูบนแผนผัง</button></div>
    <div class="cond">เงื่อนไข: ทันทีที่ส่งเรื่อง · ผู้รับ: กลุ่มเจ้าหน้าที่${BIN_ZONE_LABEL[zoneOf(r)]}</div></div></article>`;
  if (n.k === 'N2') return `<article class="msg n2">${head('', 'LINE · N2 เตือนก่อนครบเวลา')}<div class="mb"><b>ยังไม่มีผู้รับงาน ${r.id}</b>${dl([['เหลือเวลา', `${ESC_MIN - REMIND_MIN} นาที ก่อนแจ้งผู้ดูแลพื้นที่`], ['สถานที่', esc(where)]])}
    <div class="acts">${r.status === 'wait' ? `<button type="button" class="btn sm primary" data-act="accept" data-id="${r.id}">รับงาน</button>` : `<span class="pill ${r.status}">${STATUS[r.status]}</span>`}</div>
    <div class="cond">เงื่อนไข: นาทีที่ ${REMIND_MIN} ยังไม่มีผู้รับงาน · ผู้รับ: กลุ่มเจ้าหน้าที่${BIN_ZONE_LABEL[zoneOf(r)]}</div></div></article>`;
  if (n.k === 'N3') return `<article class="msg n3">${head('', 'LINE · N3 Escalation')}<div class="mb"><b>เกินเวลา ${r.id} ยังไม่มีผู้รับงาน</b>${dl([['รอมา', ESC_MIN + ' นาที'], ['โซน', BIN_ZONE_LABEL[zoneOf(r)] + ' · แจ้งเจ้าหน้าที่ประจำโซนแล้ว'], ['สถานที่', esc(where)]])}
    <div class="acts">${r.status === 'wait' ? `<button type="button" class="btn sm red" data-act="reassign" data-id="${r.id}">มอบหมายใหม่</button>` : `<span class="pill ${r.status}">${STATUS[r.status]}</span>`}<button type="button" class="btn sm" data-act="call">โทรติดตาม</button></div>
    <div class="cond">เงื่อนไข: ครบ ${ESC_MIN} นาทียังไม่มีผู้รับงาน · ผู้รับ: ผู้ดูแลพื้นที่</div></div></article>`;
  if (n.k === 'N4') return `<article class="msg n4">${head('', 'Push Notification · N4 งานเสร็จ')}<div class="mb"><b>เรื่องของคุณดำเนินการแล้ว</b>${dl([['รหัสเรื่อง', `<span class="mono">${r.id}</span>`], ['ปิดงาน', hhmm(r.resolved || n.at) + ' · ใช้เวลา ' + Math.max(1, Math.round(((r.resolved || n.at) - r.created) / MIN)) + ' นาที'], ['ขอบคุณ', 'ที่ช่วยแจ้งให้มหาวิทยาลัยสะอาดขึ้น']])}
    <div class="cond">เงื่อนไข: เมื่อสถานะเป็นดำเนินการแล้ว · ผู้รับ: ผู้แจ้ง</div></div></article>`;
  return `<article class="msg n5">${head('', 'Push Notification · เจ้าหน้าที่รับงานแล้ว')}<div class="mb"><b>เรื่อง ${r.id} มีผู้รับงานแล้ว</b>${dl([['ผู้รับงาน', esc(r.assignee || '')], ['เวลา', hhmm(r.accepted || n.at)]])}
    <div class="cond">เงื่อนไข: เมื่อเจ้าหน้าที่กดรับงาน · ผู้รับ: ผู้แจ้ง</div></div></article>`;
}
function viewNotif() {
  const role = state.role;
  const ok = n => { const r = state.reports.find(x => x.id === n.rid); if (!r) return false;
    if (role === 'reporter') return r.mine && (n.k === 'N4' || n.k === 'N5');
    if (role === 'staff') return (n.k === 'N1' || n.k === 'N2') && (state.zone === 'all' || zoneOf(r) === state.zone);
    return n.k === 'N3'; };
  const list = state.notifs.filter(ok).sort((a, b) => b.at - a.at);
  const empty = role === 'supervisor' ? 'ยังไม่มีเรื่องที่เกินเวลา ลองกด "เร่งเวลา +10 นาที" ด้านบนเพื่อดูการส่งต่อเมื่อครบ 30 นาที' : role === 'reporter' ? 'ยังไม่มีการแจ้งเตือน เมื่อเจ้าหน้าที่รับงานหรือทำเสร็จ ข้อความจะขึ้นที่นี่' : 'ยังไม่มีงานใหม่';
  return `<div class="grid2"><div class="stack"><h2 class="title">ข้อความแจ้งเตือน</h2>
    ${list.length ? list.map(notifHtml).join('') : `<p class="card flat muted">${empty}</p>`}</div>
    <aside class="stack"><section class="card flat"><div class="h">ช่องทางและการส่งซ้ำ</div><ol class="small" style="margin:0;padding-left:18px;display:grid;gap:6px">
      <li>LINE Messaging API เป็นช่องทางหลักสำหรับเจ้าหน้าที่และผู้ดูแล</li><li>Telegram Bot เป็นช่องทางสำรอง</li><li>Web Push สำหรับผู้แจ้ง</li></ol>
      <p class="small muted" style="margin-top:10px">ถ้าส่งไม่สำเร็จ ลองซ้ำทุก 1 นาทีสูงสุด 3 ครั้ง แล้วสลับไปช่องทางสำรอง และบันทึกผลในตาราง notifications</p></section>
      <section class="card flat small muted">LINE Notify ปิดให้บริการตั้งแต่เดือนมีนาคม 2568 ระบบจึงออกแบบให้ใช้ LINE Messaging API แทน</section></aside></div>`;
}

/* ---------- แอป: เมนู, render, เหตุการณ์ ---------- */
const TABS = {
  reporter: [['home', 'หน้าหลัก', 'home'], ['list', 'รายการ', 'list'], ['report', 'แจ้ง', 'camera'], ['map', 'แผนผัง', 'map'], ['dash', 'Dashboard', 'chart'], ['chat', 'Chatbot', 'chat'], ['notif', 'แจ้งเตือน', 'bell']],
  staff: [['jobs', 'งานของโซน', 'tasks'], ['map', 'แผนผัง', 'map'], ['dash', 'Dashboard', 'chart'], ['notif', 'ข้อความ LINE', 'bell']],
  supervisor: [['jobs', 'ภาพรวมงาน', 'tasks'], ['map', 'แผนผัง', 'map'], ['dash', 'Dashboard', 'chart'], ['notif', 'Escalation', 'bell']],
};
const NAV_KEY = { report: 'report', done: 'list', job: 'jobs' };
const VIEWS = { home: viewHome, report: viewReport, done: viewDone, list: viewList, jobs: viewJobs, job: viewJob, map: viewMap, dash: viewDash, chat: viewChat, notif: viewNotif };

function newDraft(binId, fromMap) {
  const b = binById(binId);
  return { bin: b.id, building: b.b, fromMap: !!fromMap, problem: 'ขยะล้น', detail: '', photo: null, err: '' };
}
function go(tab) { state.tab = tab; render(); window.scrollTo(0, 0); }
function showBin(binId) { state.mapSel = binId; state.mapBld = null; state.mapQ = ''; state.mapFilter = 'all'; state.mapFocus = binId; if (state.mapZoom < 2) state.mapZoom = 2; go('map'); }

function badges() {
  const waiting = scopeReports().filter(r => r.status === 'wait').length;
  const esc_ = state.reports.filter(r => r.status === 'wait' && r.escalated).length;
  return { jobs: waiting, notif: state.role === 'supervisor' ? esc_ : 0 };
}
function render() {
  const ae = document.activeElement, keep = ae && ae.id && $('#app').contains(ae) ? { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd } : null;
  const mv0 = $('.mapview'), sc = mv0 ? { l: mv0.scrollLeft, t: mv0.scrollTop } : null;
  const cur = NAV_KEY[state.tab] || state.tab, bd = badges();
  $('#tabs').innerHTML = TABS[state.role].map(([k, t, i]) =>
    `<button type="button" data-act="nav" data-tab="${k}" ${k === cur ? 'aria-current="page"' : ''}>${ico(i)}${t}${bd[k] ? `<span class="badge">${bd[k]}</span>` : ''}</button>`).join('');
  $$('.roles button').forEach(b => b.setAttribute('aria-pressed', b.dataset.role === state.role));
  if (state.tab === 'report' && !state.draft) state.draft = newDraft(BINS[0].id, false);
  $('#app').innerHTML = VIEWS[state.tab]();
  if (keep) { const el = document.getElementById(keep.id); if (el) { el.focus(); try { el.setSelectionRange(keep.s, keep.e); } catch (_) {} } }
  const lg = $('#chatLog'); if (lg) lg.scrollTop = lg.scrollHeight;
  const mv = $('.mapview');
  if (mv) {
    if (state.mapFocus) {
      const p = mv.querySelector(`.mpin[data-bin="${state.mapFocus}"]`);
      if (p) { mv.scrollLeft = p.offsetLeft - mv.clientWidth / 2; mv.scrollTop = p.offsetTop - mv.clientHeight / 2; }
      state.mapFocus = null;
    } else if (sc) { mv.scrollLeft = sc.l; mv.scrollTop = sc.t; }
  }
  save();
}

/* ---------- เวลา: เตือน, Escalation ---------- */
function process() {
  let changed = false;
  state.reports.forEach(r => {
    if (r.status !== 'wait') return;
    const el = now() - r.created;
    if (!r.reminded && el >= REMIND_MIN * MIN) { r.reminded = true; state.notifs.push({ k: 'N2', rid: r.id, at: r.created + REMIND_MIN * MIN }); changed = true; }
    if (!r.escalated && el >= ESC_MIN * MIN) {
      r.escalated = true; changed = true;
      state.notifs.push({ k: 'N3', rid: r.id, at: r.created + ESC_MIN * MIN });
      r.log.push({ s: 'wait', by: 'ระบบ', at: r.created + ESC_MIN * MIN, note: 'ครบ 30 นาที ส่งต่อผู้ดูแลพื้นที่' });
      toast('ครบ 30 นาที ระบบแจ้งผู้ดูแลพื้นที่แล้ว (' + r.id + ')');
    }
  });
  return changed;
}
function tickUi() {
  $$('[data-cd]').forEach(el => {
    const r = state.reports.find(x => x.id === el.dataset.cd); if (!r || r.status !== 'wait') return;
    const rem = remaining(r);
    el.className = 'timer ' + (r.escalated ? 'esc' : rem < 10 * MIN ? 'late' : '');
    el.textContent = r.escalated ? 'เกินเวลา ส่งต่อผู้ดูแลแล้ว' : el.dataset.mode === 's' ? 'เหลือ ' + mmss(rem) : 'เหลือ ' + Math.ceil(rem / MIN) + ' น. ก่อนแจ้งผู้ดูแล';
  });
}
setInterval(() => {
  const ch = process();
  if (ch && !['report', 'job', 'chat'].includes(state.tab)) render(); else if (ch) { render_tabsOnly(); save(); }
  tickUi();
}, 1000);
function render_tabsOnly() {
  const bd = badges();
  $$('#tabs button').forEach(b => { const k = b.dataset.tab; let sp = $('.badge', b); if (bd[k]) { if (!sp) { sp = document.createElement('span'); sp.className = 'badge'; b.appendChild(sp); } sp.textContent = bd[k]; } else if (sp) sp.remove(); });
}

/* ---------- เหตุการณ์ ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const d = el.dataset, find = id => state.reports.find(r => r.id === id);
  switch (d.act) {
    case 'nav': if (d.tab === 'report') state.draft = null; go(d.tab); break;
    case 'tab': if (d.tab === 'report') state.draft = null; go(d.tab); break;
    case 'reportbin': { const old = state.draft; state.draft = newDraft(d.bin, true);
      if (old) Object.assign(state.draft, { problem: old.problem, detail: old.detail, photo: old.photo });
      go('report'); break; }
    case 'pickmap': state.mapSel = state.draft ? state.draft.bin : null; state.mapBld = null; state.mapFocus = state.mapSel; if (state.mapZoom < 2) state.mapZoom = 2; go('map'); break;
    case 'showbin': showBin(d.bin); break;
    case 'problem': state.draft.problem = d.p; render(); break;
    case 'samplePhoto': state.draft.photo = SAMPLE_PHOTO; state.draft.err = ''; render(); break;
    case 'open': {
      const r = find(d.id); if (!r) break;
      if (state.role === 'reporter') { state.lastId = r.id; go('done'); }
      else { state.jobId = r.id; state.jobStatus = r.status; state.jobNote = ''; state.jobAfter = null; state.jobErr = ''; go('job'); }
      break; }
    case 'back': go(state.role === 'reporter' ? 'list' : 'jobs'); break;
    case 'accept': { const r = find(d.id); if (r && r.status === 'wait') { acceptJob(r); render(); } break; }
    case 'finish': { const r = find(d.id); if (!r) break; state.jobId = r.id; state.jobStatus = 'done'; state.jobNote = ''; state.jobAfter = null; state.jobErr = ''; go('job'); break; }
    case 'reassign': { const r = find(d.id); if (r && r.status === 'wait') { setStatus(r, 'doing', 'ทีมสำรอง (ผู้ดูแลมอบหมายใหม่)', 'ผู้ดูแลมอบหมายใหม่'); toast('มอบหมายใหม่แล้ว แจ้งผู้แจ้งและบันทึกใน status_log'); render(); } break; }
    case 'jstatus': state.jobStatus = d.s; render(); break;
    case 'call': toast('บันทึกการโทรติดตามแล้ว (จำลอง)'); break;
    case 'sampleAfter': state.jobAfter = SAMPLE_PHOTO; state.jobErr = ''; render(); break;
    case 'saveJob': {
      const r = find(state.jobId), s = state.jobStatus; if (!r) break;
      if (s === 'done' && !state.jobAfter && !r.after) { state.jobErr = 'ปิดงานต้องมีรูปหลังเก็บ'; render(); break; }
      if (state.jobAfter) r.after = state.jobAfter;
      if (s !== r.status) setStatus(r, s, staffName(), state.jobNote.trim());
      else if (state.jobNote.trim()) r.log.push({ s: r.status, by: staffName(), at: now(), note: state.jobNote.trim() });
      toast('บันทึกแล้ว ระบบแจ้งผู้แจ้งทันที'); go('jobs'); break; }
    case 'filter': state.filter = d.f; render(); break;
    case 'mfilter': state.mapFilter = d.f; render(); break;
    case 'pin': { const b = binById(d.bin); state.mapSel = d.bin; state.mapBld = null; state.mapFocus = null; render(); break; }
    case 'bld': state.mapBld = d.b; state.mapSel = null; state.mapFocus = null; if (state.tab !== 'map') go('map'); else render(); break;
    case 'clearsel': state.mapSel = null; state.mapBld = null; render(); break;
    case 'zoom': state.mapZoom = Math.min(3, Math.max(1, state.mapZoom + Number(d.d) * .5)); render(); break;
    case 'period': state.period = d.p; render(); break;
    case 'csv': exportCsv(); break;
    case 'quick': chatSend(d.q); break;
    case 'demo': if (state.reports.length && !confirm('มีข้อมูลอยู่แล้ว เพิ่มข้อมูลตัวอย่างเข้าไปด้วยหรือไม่?')) break; loadDemo(); process(); toast('โหลดข้อมูลตัวอย่างแล้ว'); render(); break;
    case 'reset': if (confirm('ล้างข้อมูลทั้งหมดในเครื่องนี้ (เรื่องที่แจ้ง การแจ้งเตือน และเวลาที่เร่ง) ใช่หรือไม่?')) { resetAll(); toast('ล้างข้อมูลแล้ว'); go(state.role === 'reporter' ? 'home' : 'jobs'); } break;
  }
});
document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'fDetail') { state.draft.detail = e.target.value; $('#fCount').textContent = e.target.value.length + '/200'; }
  else if (id === 'jNote') state.jobNote = e.target.value;
  else if (id === 'mapQ') { state.mapQ = e.target.value; render(); }
});
/* ย่อรูปก่อนเก็บ เพื่อไม่ให้พื้นที่ในเครื่องเต็ม */
function readPhoto(file, cb) {
  if (!file) return;
  const raw = () => { const rd = new FileReader(); rd.onload = () => cb(rd.result); rd.readAsDataURL(file); };
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    try {
      const k = Math.min(1, 960 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', .72));
    } catch (_) { raw(); }
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { URL.revokeObjectURL(url); raw(); };
  img.src = url;
}
document.addEventListener('change', e => {
  const id = e.target.id, d = state.draft;
  if (id === 'fBuilding') { d.building = e.target.value; d.bin = binsOf(d.building)[0].id; d.fromMap = false; render(); }
  else if (id === 'fBin') { d.bin = e.target.value; d.fromMap = false; render(); }
  else if (id === 'fPhoto') readPhoto(e.target.files[0], u => { d.photo = u; d.err = ''; render(); });
  else if (id === 'jPhoto') readPhoto(e.target.files[0], u => { state.jobAfter = u; state.jobErr = ''; render(); });
  else if (id === 'zoneSel') { state.zone = e.target.value; render(); }
});
document.addEventListener('submit', e => {
  e.preventDefault();
  if (e.target.id === 'reportForm') submitReport();
  if (e.target.id === 'chatForm') { const i = $('#chatIn'); const v = i.value.trim(); if (v) chatSend(v); }
});
function chatSend(text) {
  state.chat.push({ me: true, t: text });
  state.chat.push({ me: false, t: botReply(text) });
  render();
}
$$('.roles button').forEach(b => b.addEventListener('click', () => {
  state.role = b.dataset.role; state.mapSel = null; state.mapBld = null;
  state.zone = state.role === 'supervisor' ? 'all' : 'Z-A';
  state.tab = state.role === 'reporter' ? 'home' : 'jobs'; render(); window.scrollTo(0, 0);
}));
$('#skip').addEventListener('click', () => {
  state.offset += 10 * MIN; const ch = process(); render(); if (!ch) toast('เร่งเวลาไปข้างหน้า 10 นาที');
});

/* ธีม: อัตโนมัติ → สว่าง → มืด */
const THEMES = ['auto', 'light', 'dark'], THEME_LABEL = { auto: 'ธีม: อัตโนมัติ', light: 'ธีม: สว่าง', dark: 'ธีม: มืด' };
function applyTheme(t) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  const b = $('#theme'); if (b) b.textContent = THEME_LABEL[t];
}
let theme = 'auto';
try { theme = THEMES.includes(localStorage.getItem(THEME_KEY)) ? localStorage.getItem(THEME_KEY) : 'auto'; } catch (_) {}
applyTheme(theme);
$('#theme').addEventListener('click', () => {
  theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]; applyTheme(theme);
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
});

load();
if (window.matchMedia && matchMedia('(max-width:640px)').matches) state.mapZoom = 2;
process();
render();
