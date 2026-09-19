const slides = Array.from(document.querySelectorAll('.slide'));
const total = slides.length;
let current = 0;

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
    flowDetail.style.opacity = 0;
    setTimeout(()=>{
      flowDetail.innerHTML = `<span class="fd-num">${numText.toUpperCase()}</span><span class="fd-text">${node.dataset.detail}</span>`;
      flowDetail.style.opacity = 1;
    }, 120);
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
