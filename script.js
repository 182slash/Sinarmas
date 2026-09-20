const slides = Array.from(document.querySelectorAll('.slide'));
const total = slides.length;
let current = 0;
const fitTop = () => window.innerWidth <= 900 ? 100 : 84;   // batas atas area konten (di bawah logo watermark)
const slideHooks = [];   // dipanggil tiap kali slide berganti (dipakai animasi slide 2 & 3)

const labels = ['TITLE','LATAR BELAKANG','MEKANISME SITE','IDENTIFIKASI MASALAH','RUMUSAN MASALAH','SOLUSI','ROADMAP','PENUTUP','GAIA — ORBIT','GAIA — JARINGAN','GAIA — MANFAAT'];

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
const fdHTML = (num, text)=> `<span class="fd-num">${num.toUpperCase()}</span><span class="fd-text">${text}</span>`;
const fdPlaceholder = flowDetail.innerHTML;
function showFlowDetail(html){
  flowDetail.style.opacity = 0;
  setTimeout(()=>{ flowDetail.innerHTML = html; flowDetail.style.opacity = 1; }, 120);
}
// outline bergerak untuk node aktif: dua rect di sekeliling plate (statis tipis + segmen yang berlari)
flowStations.forEach(st=>{
  const plate = st.querySelector('.plate');
  if(!plate) return;
  ['act-ring','act-run'].forEach(cls=>{
    const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('class', cls);
    r.setAttribute('x', -55); r.setAttribute('y', 27); r.setAttribute('width', 110); r.setAttribute('height', 134); r.setAttribute('rx', 6);
    r.setAttribute('pathLength', 100);
    plate.parentNode.insertBefore(r, plate.nextSibling);
  });
});
flowStations.forEach((node, idx)=>{
  node.addEventListener('click', (e)=>{
    e.stopPropagation();
    const wasActive = node.classList.contains('active');
    flowStations.forEach(n=>n.classList.remove('active'));
    if(wasActive){                       // klik node aktif sekali lagi: lepas pilihan, animasi jalur berjalan lagi
      showFlowDetail(fdPlaceholder);
      if(window.flowPark) window.flowPark(null);
      return;
    }
    node.classList.add('active');
    showFlowDetail(fdHTML(node.querySelector('.num').textContent, node.dataset.detail));
    if(window.flowPark) window.flowPark(idx);   // material berhenti di node ini
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
    point: g.querySelector('.li-point'), lit: g.querySelector('.li-lit'),
    ripple: g.querySelector('.li-ripple'), ripple2: g.querySelector('.li-ripple2'),
    diamond: g.querySelector('.li-diamond'), spark: g.querySelector('.li-spark'),
    stem: g.querySelector('.li-stem'), num: g.querySelector('.li-num'),
    tag: g.querySelector('.li-tag')
  }));
  const fill = document.getElementById('liFill');
  const sweep = document.getElementById('liSweep');
  const mover = document.getElementById('liMover');
  const halo = mover.querySelector('.li-halo'), core = mover.querySelector('.li-core');
  const trails = Array.from(svg.querySelectorAll('.li-trail'));
  const X0 = 20, STEP = 600 / (nodes.length - 1), R = 6;
  const ch = makeChoreo(nodes.map(n=> n.risk ? .75 : .32), .55, 1.2);

  function draw(tc, isStatic){
    const s = sampleChoreo(ch, tc);
    const x = X0 + s.pos * STEP;
    const a = isStatic ? 0 : moverAlpha(ch, tc);
    const hold = isStatic ? 1 : holdAlpha(ch, tc);

    // kepala material + cahaya sekitarnya
    mover.setAttribute('transform', `translate(${x.toFixed(2)},45)`);
    mover.style.opacity = a;
    core.setAttribute('rx', (5 + 5.5*s.speed).toFixed(2)); core.setAttribute('ry', (5 - 1.2*s.speed).toFixed(2));
    halo.setAttribute('rx', (10 + 9*s.speed).toFixed(2)); halo.setAttribute('ry', (10 - 1.5*s.speed).toFixed(2));

    // sorot lembut yang ikut bergerak bersama material
    sweep.setAttribute('cx', x.toFixed(2));
    sweep.style.opacity = isStatic ? 0 : a * (.35 + .65*clamp01(s.speed*3));

    trails.forEach((tr, j)=>{
      const d = (j + 1) * .07;
      const ts = sampleChoreo(ch, tc - d);
      tr.setAttribute('cx', (X0 + ts.pos * STEP).toFixed(2));
      tr.setAttribute('r', (3 - j*.35).toFixed(2));
      tr.style.opacity = tc - d >= 0 ? a * (.55 - j*.1) * clamp01(s.speed * 4) : 0;
    });

    fill.setAttribute('x2', (isStatic ? X0 + ch.last*STEP : x).toFixed(2));
    fill.style.opacity = isStatic ? .8 : .8 * moverAlpha(ch, tc);

    nodes.forEach((n, i)=>{
      const age = tc - ch.arrive[i];
      const before = age < 0 && !isStatic;
      if(before){
        n.lit.style.opacity = 0; n.ripple.style.opacity = 0; n.ripple2.style.opacity = 0;
        n.spark.style.opacity = 0; n.stem.style.opacity = 0; n.num.style.opacity = 0;
        if(n.diamond) n.diamond.style.opacity = 0;
        if(n.tag) n.tag.style.opacity = 0;
        n.point.setAttribute('r', R); n.lit.setAttribute('r', R);
        return;
      }
      const t = isStatic ? 9 : age;

      // pegas teredam: titik "membesar" lalu menetap saat material tiba
      const r = R + (n.risk ? 4.5 : 3) * Math.exp(-4.5*t) * Math.sin(14*t);
      n.point.setAttribute('r', r.toFixed(2)); n.lit.setAttribute('r', (r - .6).toFixed(2));
      // titik rawan berdenyut terus — mengingatkan celah yang belum tertutup
      const pulse = (n.risk && !isStatic) ? (.72 + .28*Math.sin(tc*4.2 + i)) : 1;
      n.lit.style.opacity = hold * pulse;

      // dua gelombang beriringan
      const k = t / (n.risk ? 1.15 : .9);
      if(k >= 0 && k < 1){
        n.ripple.setAttribute('r', (R + (n.risk ? 24 : 16) * easeOutCubic(k)).toFixed(2));
        n.ripple.style.opacity = (n.risk ? .8 : .5) * (1 - k) * hold;
      } else n.ripple.style.opacity = 0;
      const k2 = (t - .18) / (n.risk ? 1.3 : 1.0);
      if(k2 >= 0 && k2 < 1){
        n.ripple2.setAttribute('r', (R + (n.risk ? 34 : 23) * easeOutCubic(k2)).toFixed(2));
        n.ripple2.style.opacity = (n.risk ? .45 : .28) * (1 - k2) * hold;
      } else n.ripple2.style.opacity = 0;

      // percikan singkat tepat saat material menyentuh titik
      const ks = t / .45;
      if(ks >= 0 && ks < 1){
        n.spark.setAttribute('transform', `scale(${(1 + 1.5*easeOutCubic(ks)).toFixed(3)})`);
        n.spark.style.opacity = ((1 - ks) * (n.risk ? .95 : .7) * hold).toFixed(3);
      } else n.spark.style.opacity = 0;

      // penanda nomor titik naik perlahan setelah tersentuh
      const kl = clamp01((t - .1) / .45);
      n.stem.style.opacity = (.55 * kl * hold).toFixed(3);
      n.num.style.opacity = (kl * hold).toFixed(3);
      if(n.diamond) n.diamond.style.opacity = (.75 * kl * hold).toFixed(3);
      if(n.tag) n.tag.style.opacity = (kl * hold * (isStatic ? 1 : .55 + .45*Math.sin(tc*4.2 + i))).toFixed(3);
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

  let lastTc = 0;
  function draw(tc, isStatic){
    lastTc = tc;
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

  /* ---- mode "berhenti di node terpilih" ----
     Klik node: loop dihentikan, material meluncur (easing sama seperti loop) dari posisinya sekarang
     ke node itu lalu diam di sana; jalur terisi & titik tap menyala sampai node tersebut. */
  let parked = null, parkRaf = 0, curPos = 0;
  function paintPos(pos, speed, trailAt){
    const x = X0 + pos * STEP;
    mover.setAttribute('transform', `translate(${x.toFixed(2)},${Y})`);
    mover.style.opacity = 1;
    core.setAttribute('rx', (4 + 6*speed).toFixed(2)); core.setAttribute('ry', (4 - speed).toFixed(2));
    halo.setAttribute('rx', (10 + 9*speed).toFixed(2)); halo.setAttribute('ry', (10 - 1.5*speed).toFixed(2));
    trails.forEach((tr, j)=>{
      const p = trailAt ? trailAt((j + 1) * .1) : pos;
      tr.setAttribute('cx', (X0 + p * STEP).toFixed(2));
      tr.style.opacity = trailAt ? (.55 - j*.17) * clamp01(speed * 4) : 0;
    });
    fill.setAttribute('x2', x.toFixed(2)); fill.style.opacity = .7;
    stations.forEach((st, i)=>{
      const on = i <= pos + .02;
      if(on !== litState[i]){ litState[i] = on; taps[i].classList.toggle('lit', on); }
      if(visitState[i]){ visitState[i] = false; st.classList.remove('visit'); }
    });
    curPos = pos;
  }
  function parkTo(idx){
    cancelAnimationFrame(parkRaf);
    if(idx === null){ resume(); return; }
    // titik awal: posisi material sekarang; kalau loop sedang di jeda/awal (material belum tampak), mulai dari ujung kiri jalur
    const from = parked !== null ? curPos : (moverAlpha(ch, lastTc) < .3 ? 0 : sampleChoreo(ch, lastTc).pos);
    loop.stop();
    parked = idx;
    mover.classList.remove('parked');
    const dist = Math.abs(idx - from);
    const dur = (reduceMotion || dist < .001) ? 0 : Math.min(1.6, .45 + .28 * dist);
    const t0 = performance.now();
    const at = t => from + (idx - from) * easeInOutCubic(dur ? clamp01(t / dur) : 1);
    const step = now => {
      const t = (now - t0) / 1000, k = dur ? clamp01(t / dur) : 1;
      if(k < 1){
        paintPos(at(t), easeInOutCubicSpeed(k), d => at(t - d));
        parkRaf = requestAnimationFrame(step);
      } else {
        paintPos(idx, 0, null);
        mover.classList.add('parked');
      }
    };
    step(t0);
  }
  function resume(){
    cancelAnimationFrame(parkRaf);
    parked = null; mover.classList.remove('parked');
    mover.style.opacity = 0; fill.style.opacity = 0;
    trails.forEach(tr=>{ tr.style.opacity = 0; });
    litState.fill(false); taps.forEach(t=>t.classList.remove('lit'));
    loop.start();
  }
  window.flowPark = parkTo;

  slideHooks.push(idx=>{
    if(idx === 2){ if(parked === null) loop.start(); }
    else {
      loop.stop(); cancelAnimationFrame(parkRaf);
      if(parked !== null){ paintPos(parked, 0, null); mover.classList.add('parked'); }   // selesaikan gerak yang terpotong
      else {
        visitState.fill(false); litState.fill(false);
        stations.forEach((st, i)=>{ st.classList.remove('visit'); taps[i].classList.remove('lit'); });
      }
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
    const top = fitTop(), bottom = H - 70, avail = bottom - top;
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

/* ---- Slide 04: kunci tinggi kotak penjelasan ke isi terpanjang ----
   Isi tiap simpul beda panjang. Tanpa ini kotak berubah tinggi tiap klik, dan kalau isinya
   lebih panjang dari tinggi minimum, teks terakhir terlihat menempel ke garis bawah. */
(function(){
  const box = document.getElementById('problemDetail');
  if(!box || typeof problemData === 'undefined') return;
  function reserve(){
    const keep = box.innerHTML;
    box.style.minHeight = '';
    let max = 0;
    Object.values(problemData).forEach(d=>{
      box.innerHTML = `<div class="tag">${d.tag}</div><h3>${d.title}</h3><p>${d.text}</p><div class="stat">${d.stat}</div><div class="stat-label">${d.statLabel}</div>`;
      max = Math.max(max, box.offsetHeight);
    });
    box.innerHTML = keep;
    if(max) box.style.minHeight = max + 'px';
  }
  reserve();
  window.addEventListener('resize', reserve);
  window.addEventListener('load', reserve);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);
})();

/* ---- Slide 08: penutup — gambar kerja arsitektural ----
   Diputar ulang setiap kali slide dibuka. Semua gerak utama ada di CSS (kelas .play);
   script hanya memecah judul jadi kata, menghitung mundur "90 hari", dan parallax halus. */
(function(){
  const idx = slides.length - 1, slide = slides[idx];   // penutup = slide terakhir
  if(!slide) return;
  const title = document.getElementById('closingTitle');
  const cCount = document.getElementById('cCount');
  const par = document.getElementById('csPar');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // judul: satu span per kata (untuk munculnya kata demi kata)
  if(title){
    const words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map((w,i)=>`<span class="w" style="--w:${i}" aria-hidden="true">${w}</span>`).join(' ');
  }

  let raf = 0, hideTimer = 0, on = false;
  function countUp(){
    cancelAnimationFrame(raf);
    if(!cCount) return;
    if(reduce){ cCount.textContent = '90'; return; }
    const t0 = performance.now() + 3600, dur = 1400;      // mulai saat garis dimensi selesai tergambar
    cCount.textContent = '0';
    (function tick(now){
      const t = Math.min(1, Math.max(0, (now - t0) / dur));
      cCount.textContent = String(Math.round(90 * (1 - Math.pow(1 - t, 3))));
      if(t < 1) raf = requestAnimationFrame(tick);
    })(performance.now());
  }

  slideHooks.push(i=>{
    if(i === idx && !on){
      on = true;
      clearTimeout(hideTimer);
      slide.classList.remove('play');
      void slide.offsetWidth;                              // paksa animasi mulai dari awal
      slide.classList.add('play');
      countUp();
    } else if(i !== idx && on){
      on = false;
      cancelAnimationFrame(raf);
      hideTimer = setTimeout(()=>slide.classList.remove('play'), 700);   // tunggu transisi keluar selesai
      if(par) par.style.transform = '';
    }
  });

  // parallax halus mengikuti kursor
  if(!reduce && par){
    document.addEventListener('mousemove', e=>{
      if(!on) return;
      const x = e.clientX / window.innerWidth - .5, y = e.clientY / window.innerHeight - .5;
      par.style.transform = `translate3d(${(x * -16).toFixed(1)}px, ${(y * -12).toFixed(1)}px, 0)`;
    });
  }
  slideHooks.forEach(fn=>fn(current));                     // kalau halaman dibuka langsung di slide ini
})();

/* ---- Slide 03: kunci tinggi kotak detail ke isi terpanjang ----
   Slide diletakkan di tengah layar; kalau tinggi kotak berubah tiap klik, seluruh konten ikut
   naik-turun. Tinggi terpanjang diukur sekali lalu dipakai tetap. Kalau layar terlalu pendek,
   seluruh isi slide diperkecil proporsional (tidak ada scroll, tidak ada yang terpotong). */
(function(){
  const box = document.getElementById('flowDetail');
  const inner = box && box.closest('.slide-inner');
  const deck = document.getElementById('deck');
  if(!box || !inner) return;
  const stationList = Array.from(document.querySelectorAll('.station'));
  const placeholder = box.innerHTML;
  function reserve(){
    const keep = box.innerHTML;
    box.style.minHeight = ''; inner.style.transform = '';
    let max = 0;
    const states = [placeholder].concat(stationList.map(n=> fdHTML(n.querySelector('.num').textContent, n.dataset.detail)));
    states.forEach(html=>{ box.innerHTML = html; max = Math.max(max, box.offsetHeight); });
    box.innerHTML = keep;
    box.style.minHeight = max + 'px';

    const H = Math.min(window.innerHeight, deck.clientHeight);
    const top = fitTop(), bottom = H - 70, avail = bottom - top, need = inner.offsetHeight;
    if(need > avail){
      const sc = Math.max(.5, avail / need);
      const dy = (top + bottom) / 2 - (inner.offsetTop + need / 2);
      inner.style.transform = `translateY(${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`;
    }
  }
  reserve();
  window.addEventListener('resize', reserve);
  window.addEventListener('load', reserve);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);
})();

/* ---- Slide 05: kunci tinggi kotak rumusan ke isi terpanjang (sama seperti slide 04) ---- */
(function(){
  const box = document.getElementById('rumusanDetail');
  if(!box || typeof rumusanData === 'undefined') return;
  function reserve(){
    const keep = box.innerHTML;
    box.style.minHeight = '';
    let max = 0;
    Object.values(rumusanData).forEach(d=>{
      box.innerHTML = `<div class="tag">${d.tag}</div><h3>${d.title}</h3><p>${d.text}</p>`;
      max = Math.max(max, box.offsetHeight);
    });
    box.innerHTML = keep;
    if(max) box.style.minHeight = max + 'px';
  }
  reserve();
  window.addEventListener('resize', reserve);
  window.addEventListener('load', reserve);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(reserve);
})();

/* ---- Cadangan untuk layar pendek / HP: kalau isi slide lebih tinggi dari area yang tersedia
   (di antara bar atas dan tombol bawah), seluruh isi diperkecil proporsional supaya tidak terpotong.
   Slide 03 dan 06 punya logika sendiri di atas, jadi dilewati di sini. ---- */
(function(){
  const skip = new Set([2, 5]);
  const deck = document.getElementById('deck');
  function fit(){
    slides.forEach((s, i)=>{
      if(skip.has(i)) return;
      const inner = s.querySelector('.slide-inner');
      if(!inner) return;
      inner.style.transform = '';
      const H = Math.min(window.innerHeight, deck.clientHeight);
      const top = fitTop(), bottom = H - 70, avail = bottom - top, need = inner.offsetHeight;
      if(need > avail){
        const sc = Math.max(.45, avail / need);
        const dy = (top + bottom) / 2 - (inner.offsetTop + need / 2);
        inner.style.transformOrigin = '50% 50%';
        inner.style.transform = `translateY(${dy.toFixed(1)}px) scale(${sc.toFixed(3)})`;
      }
    });
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
