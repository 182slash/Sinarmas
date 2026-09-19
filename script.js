const slides = Array.from(document.querySelectorAll('.slide'));
const total = slides.length;
let current = 0;
const slideHooks = [];   // dipanggil tiap kali slide berganti (dipakai animasi slide 2 & 3)

const labels = ['TITLE','LATAR BELAKANG','MEKANISME SITE','IDENTIFIKASI MASALAH','RUMUSAN MASALAH','SOLUSI','ROADMAP','RISIKO','PENUTUP'];

const dotsWrap = document.getElementById('dots');
slides.forEach((s,i)=>{
  const b = document.createElement('button');
  b.className = 'dot-btn' + (i===0 ? ' active' : '');
  b.addEventListener('click', ()=>goTo(i));
  dotsWrap.appendChild(b);
});
const dotEls = Array.from(dotsWrap.children);

document.getElementById('totalNum').textContent = String(total).padStart(2,'0');

function render(){
  slides.forEach((s,i)=>{
    s.classList.remove('active','prev');
    if(i === current) s.classList.add('active');
    else if(i < current) s.classList.add('prev');
  });
  dotEls.forEach((d,i)=>d.classList.toggle('active', i===current));
  document.getElementById('progressFill').style.width = ((current)/(total-1))*100 + '%';
  document.getElementById('curNum').textContent = String(current+1).padStart(2,'0');
  document.getElementById('slideLabel').textContent = String(current+1).padStart(2,'0') + ' · ' + labels[current];
  document.getElementById('prevBtn').disabled = current === 0;
  document.getElementById('nextBtn').disabled = current === total-1;
  slideHooks.forEach(fn=>fn(current));
}
function goTo(i){
  if(i < 0 || i >= total) return;
  current = i;
  render();
}
document.getElementById('nextBtn').addEventListener('click', ()=>goTo(current+1));
document.getElementById('prevBtn').addEventListener('click', ()=>goTo(current-1));

window.addEventListener('keydown', (e)=>{
  if(['ArrowRight','PageDown',' '].includes(e.key)){ e.preventDefault(); goTo(current+1); }
  if(['ArrowLeft','PageUp'].includes(e.key)){ e.preventDefault(); goTo(current-1); }
  if(e.key === 'Home') goTo(0);
  if(e.key === 'End') goTo(total-1);
});
// swipe support
let touchX = null;
document.addEventListener('touchstart', e=>{ touchX = e.touches[0].clientX; });
document.addEventListener('touchend', e=>{
  if(touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if(dx < -50) goTo(current+1);
  if(dx > 50) goTo(current-1);
  touchX = null;
});

render();

/* ---- interactive node/panel logic (independent of slide nav) ---- */

// Flow diagram
const flowStations = document.querySelectorAll('.station');
const flowDetail = document.getElementById('flowDetail');
flowStations.forEach(node=>{
  node.addEventListener('click', (e)=>{
    e.stopPropagation();
    flowStations.forEach(n=>n.classList.remove('active'));
    node.classList.add('active');
    const numText = node.querySelector('.num').textContent;
    // tinggi kotak sudah fixed lewat CSS (.flow-detail{height:132px}) jadi ganti konten
    // langsung tanpa fade-out dulu -- tidak ada lagi lompatan tinggi/posisi antar node.
    flowDetail.innerHTML = `<span class="fd-num">${numText.toUpperCase()}</span><span class="fd-sep"></span><span class="fd-text">${node.dataset.detail}</span>`;
    flowDetail.classList.remove('pulse');
    // force reflow supaya animasi pulse bisa retrigger tiap klik
    void flowDetail.offsetWidth;
    flowDetail.classList.add('pulse');
  });
});

// Problem node map with connecting-line light-up animation
const problemData = {
  p1: {tag:'SIMPUL 01', title:'Kuota rendemen menekan personel site',
    text:'Kuota 22–25% CPO dari raw material diberlakukan sebagai target harian yang kaku. Saat hasil aktual di bawah itu, tekanan bergeser ke personel site untuk "menyesuaikan" angka.',
    stat:'1% = 10 ton', statLabel:'SELISIH 1% RENDEMEN DARI 1.000 TON RAW MATERIAL/HARI', lines:[]},
  p2: {tag:'SIMPUL 02', title:'Angka bisa "ditambal" antar hari',
    text:'Kekurangan output pada satu hari ditutup memakai surplus dari hasil olah hari sebelumnya. Manajemen tidak pernah melihat rendemen (OER) yang sesungguhnya.',
    stat:'0 kali', statLabel:'KOREKSI REAL-TIME YANG TERCATAT SAAT INI', lines:['ln1']},
  p3: {tag:'SIMPUL 03', title:'Laporan datang 1–2 hari setelah produksi',
    text:'Checksheet baru masuk 1–2 hari setelah crude oil selesai diolah. Tidak ada koreksi real-time ketika rendemen turun.',
    stat:'1–2 hari', statLabel:'JEDA ANTARA PRODUKSI DAN LAPORAN SAMPAI KE HQ', lines:['ln2','ln5']},
  p4: {tag:'SIMPUL 04', title:'Dua metode ukur untuk satu muatan',
    text:'Tinggi minyak diukur manual di tongkang saat muat, lalu diukur ulang lewat selang saat bongkar — metode berbeda membuat selisih sulit dilacak.',
    stat:'2 metode', statLabel:'CARA UKUR YANG BERBEDA UNTUK MUATAN YANG SAMA', lines:['ln3']},
  p5: {tag:'SIMPUL 05', title:'Antrean dan shift 2 belum terukur',
    text:'Raw material eksternal dibatasi 08.00–17.00, tapi shift 2 berjalan tanpa batas waktu sampai semua raw material selesai diolah. Data waktu tunggu & lembur belum tersedia.',
    stat:'Belum ada data', statLabel:'WAKTU TUNGGU TRUK & DURASI LEMBUR SHIFT 2', lines:['ln4']}
};
const pnodes = document.querySelectorAll('.pnode');
const problemDetail = document.getElementById('problemDetail');
const plines = document.querySelectorAll('.pline');

pnodes.forEach(node=>{
  node.addEventListener('click', (e)=>{
    e.stopPropagation();
    pnodes.forEach(n=>{
      n.classList.remove('active');
      n.querySelector('circle:not(.pulse):not(.glow-arc)').setAttribute('fill', '#33393F');
      n.querySelector('.pulse').style.opacity = 0;
    });
    node.classList.add('active');
    node.querySelector('circle:not(.pulse):not(.glow-arc)').setAttribute('fill', '#C98A2C');
    node.querySelector('.pulse').style.opacity = 1;
    plines.forEach(l=>l.classList.remove('lit'));
    const d = problemData[node.dataset.id];
    d.lines.forEach(id=>document.getElementById(id).classList.add('lit'));
    problemDetail.style.opacity = 0;
    problemDetail.classList.remove('pulse-in');
    setTimeout(()=>{
      problemDetail.innerHTML = `<div class="tag">${d.tag}</div><h3>${d.title}</h3><p>${d.text}</p><div class="stat">${d.stat}</div><div class="stat-label">${d.statLabel}</div>`;
      problemDetail.style.opacity = 1;
      problemDetail.classList.add('pulse-in');
    }, 120);
  });
});

// Rumusan triangle node map
const rumusanData = {
  1: {tag:'RM—01', title:'Bagaimana HQ melihat angka produksi yang sama dengan kondisi di site, tanpa jeda 1–2 hari?',
    text:'Selama laporan masih checksheet manual yang direkap belakangan, HQ selalu bereaksi terhadap kejadian yang sudah lewat.', lines:['rl12','rl13']},
  2: {tag:'RM—02', title:'Bagaimana mencegah angka hasil timbang dan hasil olah diubah diam-diam, tanpa menghilangkan koreksi yang sah?',
    text:'Sistem perlu membedakan koreksi sah dari penambalan data yang menutupi kekurangan output.', lines:['rl12','rl23']},
  3: {tag:'RM—03', title:'Bagaimana kuota harian tetap jadi alat kendali mutu, bukan alasan menambal data?',
    text:'Selama target dibaca sebagai pass/fail harian, penyimpangan wajar tidak punya tempat untuk dilaporkan jujur.', lines:['rl13','rl23']}
};
const rnodes = document.querySelectorAll('.rnode');
const rumusanDetail = document.getElementById('rumusanDetail');
const rlines = document.querySelectorAll('.rconn');
rnodes.forEach(node=>{
  node.addEventListener('click', (e)=>{
    e.stopPropagation();
    rnodes.forEach(n=>{
      n.classList.remove('active');
      n.querySelector('.core').setAttribute('fill', '#33393F');
      n.querySelector('.rpulse').style.opacity = 0;
    });
    node.classList.add('active');
    node.querySelector('.core').setAttribute('fill', '#C98A2C');
    node.querySelector('.rpulse').style.opacity = 1;
    rlines.forEach(l=>l.classList.remove('lit'));
    const d = rumusanData[node.dataset.r];
    d.lines.forEach(id=>document.getElementById(id).classList.add('lit'));
    rumusanDetail.style.opacity = 0;
    rumusanDetail.classList.remove('pulse-in');
    setTimeout(()=>{
      rumusanDetail.innerHTML = `<div class="tag">${d.tag}</div><h3>${d.title}</h3><p>${d.text}</p>`;
      rumusanDetail.style.opacity = 1;
      rumusanDetail.classList.add('pulse-in');
    }, 120);
  });
});

// Module accordion
document.querySelectorAll('.module-head').forEach(head=>{
  head.addEventListener('click', (e)=>{
    e.stopPropagation();
    const mod = head.parentElement;
    const wasOpen = mod.classList.contains('open');
    document.querySelectorAll('.module').forEach(m=>m.classList.remove('open'));
    if(!wasOpen) mod.classList.add('open');
  });
});

// Roadmap step click — fill the rail up to the selected phase
const rstepsList = Array.from(document.querySelectorAll('.rstep'));
const rlineFill = document.getElementById('rlineFill');
function setRoadmapFill(){
  const idx = rstepsList.findIndex(s=>s.classList.contains('active'));
  const pct = rstepsList.length > 1 ? (idx/(rstepsList.length-1))*100 : 0;
  if(rlineFill) rlineFill.style.width = pct + '%';
}
rstepsList.forEach(step=>{
  step.addEventListener('click', (e)=>{
    e.stopPropagation();
    rstepsList.forEach(s=>s.classList.remove('active'));
    step.classList.add('active');
    setRoadmapFill();
  });
});
setRoadmapFill();


/* =====================================================================
   Animasi alur (slide 02 & 03) — dihitung dari waktu, bukan dari CSS/SMIL
   ---------------------------------------------------------------------
   Material bergerak titik-ke-titik: akselerasi lalu melambat (ease in-out),
   berhenti sebentar di tiap titik (lebih lama di titik rawan), dan titik
   bereaksi saat material tiba (pegas teredam). Semua state diturunkan dari
   satu jam `tc`, jadi loop tidak pernah melompat dan bisa di-pause saat
   slide tidak aktif.
   ===================================================================== */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = v => Math.max(0, Math.min(1, v));
const easeInOutCubic = k => k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2;
const easeInOutCubicSpeed = k => (k < .5 ? 12*k*k : 12*(1-k)*(1-k)) / 3;   // turunan, dinormalkan 0..1
const easeOutCubic = k => 1 - Math.pow(1 - k, 3);

// dwells: lama singgah (detik) di tiap titik; moveDur: lama perpindahan antar titik; rest: jeda di akhir loop
function makeChoreo(dwells, moveDur, rest){
  const segs = [], arrive = [];
  let t = 0;
  dwells.forEach((d, i)=>{
    arrive.push(t);
    segs.push({dwell:true, i, t0:t, t1:t + d}); t += d;
    if(i < dwells.length - 1){ segs.push({dwell:false, i, t0:t, t1:t + moveDur}); t += moveDur; }
  });
  return {segs, arrive, dwells, run:t, cycle:t + rest, last:dwells.length - 1};
}
// posisi dalam satuan indeks titik (0..n-1, pecahan = di antara dua titik) + kecepatan 0..1
function sampleChoreo(ch, t){
  t = Math.max(0, Math.min(ch.run, t));
  for(const sg of ch.segs){
    if(t <= sg.t1){
      if(sg.dwell) return {pos:sg.i, speed:0};
      const k = (t - sg.t0) / (sg.t1 - sg.t0);
      return {pos:sg.i + easeInOutCubic(k), speed:easeInOutCubicSpeed(k)};
    }
  }
  return {pos:ch.last, speed:0};
}
// jam animasi: start() mulai dari awal (dengan jeda kecil agar transisi slide selesai), stop() membekukan
function makeLoop(ch, draw){
  let raf = 0, t0 = 0;
  const tick = now => {
    const el = (now - t0) / 1000;
    draw(el < 0 ? 0 : el % ch.cycle);
    raf = requestAnimationFrame(tick);
  };
  return {
    start(){
      cancelAnimationFrame(raf);
      if(reduceMotion){ draw(ch.run, true); return; }   // gerak dikurangi: tampilkan keadaan akhir statis
      t0 = performance.now() + 450;
      raf = requestAnimationFrame(tick);
    },
    stop(){ cancelAnimationFrame(raf); raf = 0; }
  };
}
// alpha material: muncul di awal loop, memudar di awal jeda akhir
const moverAlpha = (ch, tc) => clamp01(tc / .25) * (1 - clamp01((tc - ch.run) / .55));
// sisa jeda: semua state "menyala" dipadamkan sebentar sebelum loop mengulang
const holdAlpha = (ch, tc) => 1 - clamp01((tc - (ch.cycle - .35)) / .35);

/* ---- Slide 02: latar belakang (8 titik pencatatan) ---- */
(function(){
  const svg = document.getElementById('latarSvg');
  if(!svg) return;
  const nodes = Array.from(svg.querySelectorAll('.li-node')).map(g=>({
    risk: g.classList.contains('li-risk'),
    point: g.querySelector('.li-point'), lit: g.querySelector('.li-lit'), ripple: g.querySelector('.li-ripple')
  }));
  const fill = document.getElementById('liFill');
  const mover = document.getElementById('liMover');
  const halo = mover.querySelector('.li-halo'), core = mover.querySelector('.li-core');
  const trails = Array.from(svg.querySelectorAll('.li-trail'));
  const X0 = 20, STEP = 600 / (nodes.length - 1), R = 6;
  const ch = makeChoreo(nodes.map(n=> n.risk ? .65 : .3), .55, 1.1);

  function draw(tc, isStatic){
    const s = sampleChoreo(ch, tc);
    const x = X0 + s.pos * STEP;
    const a = isStatic ? 0 : moverAlpha(ch, tc);
    const hold = isStatic ? 1 : holdAlpha(ch, tc);

    mover.setAttribute('transform', `translate(${x.toFixed(2)},45)`);
    mover.style.opacity = a;
    core.setAttribute('rx', (5 + 5*s.speed).toFixed(2)); core.setAttribute('ry', (5 - 1.2*s.speed).toFixed(2));
    halo.setAttribute('rx', (10 + 7*s.speed).toFixed(2)); halo.setAttribute('ry', (10 - 1.5*s.speed).toFixed(2));
    trails.forEach((tr, j)=>{
      const d = (j + 1) * .09;
      const ts = sampleChoreo(ch, tc - d);
      tr.setAttribute('cx', (X0 + ts.pos * STEP).toFixed(2));
      tr.style.opacity = tc - d >= 0 ? a * (.5 - j*.15) * clamp01(s.speed * 4) : 0;   // jejak hanya terlihat saat bergerak
    });
    fill.setAttribute('x2', (isStatic ? X0 + ch.last*STEP : x).toFixed(2));
    fill.style.opacity = isStatic ? .55 : .55 * moverAlpha(ch, tc);

    nodes.forEach((n, i)=>{
      const age = tc - ch.arrive[i];
      if(age < 0 && !isStatic){ n.lit.style.opacity = 0; n.ripple.style.opacity = 0; n.point.setAttribute('r', R); n.lit.setAttribute('r', R); return; }
      const t = isStatic ? 9 : age;
      // pegas teredam: titik "membesar" lalu menetap saat material tiba
      const r = R + (n.risk ? 4 : 3) * Math.exp(-4.5*t) * Math.sin(14*t);
      n.point.setAttribute('r', r.toFixed(2)); n.lit.setAttribute('r', (r - .6).toFixed(2));
      n.lit.style.opacity = hold;
      const k = t / (n.risk ? 1.1 : .85);
      if(k >= 0 && k < 1){
        n.ripple.setAttribute('r', (R + (n.risk ? 22 : 15) * easeOutCubic(k)).toFixed(2));
        n.ripple.style.opacity = (n.risk ? .75 : .5) * (1 - k) * hold;
      } else n.ripple.style.opacity = 0;
    });
  }
  const loop = makeLoop(ch, draw);
  slideHooks.push(idx=>{ if(idx === 1) loop.start(); else loop.stop(); });
})();

/* ---- Slide 03: mekanisme site (8 station) ---- */
(function(){
  const svg = document.getElementById('flowSvg');
  if(!svg) return;
  const stations = Array.from(svg.querySelectorAll('.station'));
  const taps = Array.from(svg.querySelectorAll('.tap'));
  const fill = document.getElementById('pipeFill');
  const mover = document.getElementById('flowMover');
  const halo = mover.querySelector('.mv-halo'), core = mover.querySelector('.mv-core');
  const trails = Array.from(svg.querySelectorAll('.mv-trail'));
  const X0 = 70, STEP = 150, Y = 18;
  const risk = stations.map(st=>st.classList.contains('risk'));
  // titik rawan: material "tertahan" lebih lama; titik terakhir: singgah lebih lama sebelum memudar
  const dwells = risk.map((r, i)=> i === stations.length - 1 ? 1.2 : r ? 1.0 : .5);
  const ch = makeChoreo(dwells, .8, 1.3);
  const visitState = stations.map(()=>false), litState = stations.map(()=>false);

  function draw(tc, isStatic){
    const s = sampleChoreo(ch, tc);
    const x = X0 + s.pos * STEP;
    const a = isStatic ? 0 : moverAlpha(ch, tc);

    mover.setAttribute('transform', `translate(${x.toFixed(2)},${Y})`);
    mover.style.opacity = a;
    core.setAttribute('rx', (4 + 6*s.speed).toFixed(2)); core.setAttribute('ry', (4 - s.speed).toFixed(2));
    halo.setAttribute('rx', (10 + 9*s.speed).toFixed(2)); halo.setAttribute('ry', (10 - 1.5*s.speed).toFixed(2));
    trails.forEach((tr, j)=>{
      const d = (j + 1) * .1;
      const ts = sampleChoreo(ch, tc - d);
      tr.setAttribute('cx', (X0 + ts.pos * STEP).toFixed(2));
      tr.style.opacity = tc - d >= 0 ? a * (.55 - j*.17) * clamp01(s.speed * 4) : 0;
    });
    fill.setAttribute('x2', (isStatic ? X0 + ch.last*STEP : x).toFixed(2));
    fill.style.opacity = isStatic ? .7 : .7 * moverAlpha(ch, tc);

    const holdOn = isStatic || tc < ch.cycle - .35;
    stations.forEach((st, i)=>{
      const arrived = holdOn && (isStatic || tc >= ch.arrive[i]);
      const visiting = !isStatic && tc >= ch.arrive[i] && tc < ch.arrive[i] + dwells[i] + .15 && tc <= ch.run + .3;
      if(arrived !== litState[i]){ litState[i] = arrived; taps[i].classList.toggle('lit', arrived); }
      if(visiting !== visitState[i]){ visitState[i] = visiting; st.classList.toggle('visit', visiting); }
    });
  }
  const loop = makeLoop(ch, draw);
  slideHooks.push(idx=>{
    if(idx === 2){ loop.start(); }
    else {
      loop.stop();
      visitState.fill(false); litState.fill(false);
      stations.forEach((st, i)=>{ st.classList.remove('visit'); taps[i].classList.remove('lit'); });
    }
  });
})();

/* ---- Slide 06: kunci tinggi area modul ke state terpanjang ----
   Tanpa ini tinggi konten berubah tiap modul dibuka/ditutup, dan karena slide
   diposisikan di tengah, judul ikut naik-turun. Tinggi terpanjang diukur lalu dipakai tetap. */
(function(){
  const box = document.getElementById('modules');
  if(!box) return;
  function reserve(){
    box.style.minHeight = '';
    const mods = Array.from(box.children);
    const heads = mods.reduce((sum, m)=> sum + m.querySelector('.module-head').offsetHeight, 0);
    const bodies = mods.map(m=> m.querySelector('.module-body-inner').scrollHeight);
    box.style.minHeight = (heads + (mods.length - 1) + Math.max(...bodies)) + 'px';

    // cadangan untuk layar yang sangat pendek (HP kecil): kalau state terpanjang tetap tidak muat,
    // seluruh isi slide diperkecil proporsional dan diletakkan di antara petunjuk navigasi (atas)
    // dan tombol (bawah) — tidak ada scroll dan tidak ada yang terpotong
    const inner = box.closest('.slide-inner');
    const deck = document.getElementById('deck');
    if(!inner || !deck) return;
    inner.style.transform = '';
    const H = Math.min(window.innerHeight, deck.clientHeight);
    const top = 76, bottom = H - 70, avail = bottom - top;
    const need = inner.offsetHeight;
    if(need > avail){
      const sc = Math.max(.5, avail / need);
      const dy = (top + bottom) / 2 - (inner.offsetTop + need / 2);   // pusatkan di area yang tersedia
      inner.style.transform = `translateY(${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`;
    }
  }
  reserve();
  window.addEventListener('resize', reserve);
  window.addEventListener('load', reserve);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);
})();
