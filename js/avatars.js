(() => {
'use strict';
const $ = (selector, root=document) => root.querySelector(selector);
const PACKS=[{id:'cats',name:'Kucing',icon:'cat'},{id:'students',name:'Siswa',icon:'users'},{id:'animals',name:'Hewan',icon:'paw'},{id:'fantasy',name:'Robot & Fantasi',icon:'robot'}];

const RAW=[

['miki','Miki','cats','cat','#f4cc8a','#67866a','Kucing jingga','stripe'],['miko','Miko','cats','cat','#efede0','#7896ba','Kucing putih','patch'],['mochi','Mochi','cats','cat','#e5c4cd','#bd8098','Kucing manis','bow'],['kuro','Kuro','cats','cat','#737b85','#d2b967','Kucing malam','star'],['yuki','Yuki','cats','cat','#e8f1ef','#84bcb2','Kucing salju','scarf'],['nori','Nori','cats','cat','#a6b49b','#6c8279','Kucing kebun','leaf'],['chiko','Chiko','cats','cat','#d8a46f','#9d6f55','Kucing karamel','stripe'],['tama','Tama','cats','cat','#e8d6b0','#819ab8','Kucing belang','patch'],['luna','Luna','cats','cat','#c6c8e1','#8888ae','Kucing bulan','star'],['boba','Boba','cats','cat','#c3a58e','#6b8274','Kucing cokelat','scarf'],

['aira','Aira','students','girl','#efd1ba','#879bb4','Siswi TJKT','bob'],['naya','Naya','students','girl','#bb8766','#7c957e','Siswi TJKT','braid'],['sasha','sasha','students','girl','#f1d2b4','#ab8c9c','Siswi TJKT','pony'],['rani','Rani','students','hijab','#d1a37f','#6e99a1','Siswi TJKT','badge'],['lila','Lila','students','girl','#e9c4a0','#b7a063','Siswi TJKT','glasses'],['arka','Arka','students','boy','#e4b992','#6f9485','Siswa TJKT','spike'],['raka','Raka','students','boy','#c1906d','#8c9eb8','Siswa TJKT','glasses'],['dito','Dito','students','boy','#f0c9aa','#bd9581','Siswa TJKT','cap'],['bima','Bima','students','boy','#b98565','#88937a','Siswa TJKT','curl'],['niko','Niko','students','boy','#d6ab89','#8e91b0','Siswa TJKT','side'],

['pipi','Pipi','animals','rabbit','#f3e5e1','#c394a5','Kelinci','bow'],['bao','Bao','animals','panda','#f3f1e8','#7b9c87','Panda','scarf'],['fio','Fio','animals','fox','#e5a068','#769d9a','Rubah','scarf'],['kuma','Kuma','animals','bear','#b89375','#8d9d6f','Beruang','cap'],['koko','Koko','animals','koala','#b4c2ca','#b4a168','Koala','leaf'],['pingu','Pingu','animals','penguin','#7d8b9a','#cb9e72','Penguin','bow'],['tobi','Tobi','animals','dog','#d4ae7e','#7f9fae','Anjing','patch'],['ruru','Ruru','animals','raccoon','#b8b4aa','#9b9ba9','Rakun','scarf'],['otto','Otto','animals','otter','#c5a384','#7fa68b','Berang-berang','badge'],['bibi','Bibi','animals','bee','#ead17e','#868f71','Lebah','stripe'],

['bolt','Bolt','fantasy','robot','#b0c4ca','#d5a775','Robot penjelajah','antenna'],['bleep','Bleep','fantasy','robot','#b6c5aa','#8b9d78','Robot kebun','leaf'],['pixel','Pixel','fantasy','robot','#c3b7cf','#939fc0','Robot kreatif','star'],['nova','Nova','fantasy','alien','#b3d99b','#8eaaa1','Alien ramah','antenna'],['lumi','Lumi','fantasy','cloud','#ecf0ed','#90b5c8','Awan kecil','star'],['momo','Momo','fantasy','monster','#c6bcdb','#a196bb','Monster lembut','horn'],['draco','Draco','fantasy','dragon','#accba5','#d9ac75','Naga kecil','horn'],['piko','Piko','fantasy','mushroom','#eee1c7','#ba8c7e','Jamur ceria','dot'],['orbit','Orbit','fantasy','astronaut','#e4bd9d','#b0bdc7','Penjelajah angkasa','badge'],['sprout','Sprout','fantasy','plant','#b7d79f','#a99170','Tunas kecil','leaf']

];

const AVATARS=RAW.map(([id,name,pack,type,fur,shirt,label,accessory])=>({id,name,pack,type,fur,shirt,label,accessory}));

const char=id=>AVATARS.find(a=>a.id===id)||AVATARS[0];

const stroke='stroke="#35443d" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"';

function headShape(a){

 const f='fill="var(--fur)"';

 const base=`<rect x="24" y="25" width="72" height="54" rx="25" ${f}/>`;

 const animal=a.type;

 if(animal==='cat')return `<path d="M25 45 22 13 44 27Q60 21 77 28L98 13 95 48" ${f}/><path d="m28 22 3 19 12-9M91 22l-3 19-11-9" fill="#e8b8ab" stroke="none"/>${base}${a.accessory==='stripe'?'<path d="m50 26 3 9m7-10v9m10-8-3 9" stroke="#bf925c"/>':''}${a.accessory==='patch'?'<path d="M27 44q2-18 22-18l-6 22Z" fill="#b3a391" stroke="none"/>':''}<path d="m25 56-9-2m10 8-9 2m78-8 9-2m-10 8 9 2" stroke-width="1.5"/>`;

 if(animal==='rabbit')return `<ellipse cx="40" cy="21" rx="10" ry="21" ${f}/><ellipse cx="80" cy="21" rx="10" ry="21" ${f}/><path d="M40 10v20m40-20v20" stroke="#ddb6be" stroke-width="7"/>${base}`;

 if(['bear','panda','koala','otter','raccoon'].includes(animal)){let ears=animal==='panda'?'#66736b':'var(--fur)';return `<circle cx="28" cy="29" r="${animal==='koala'?17:12}" fill="${ears}"/><circle cx="92" cy="29" r="${animal==='koala'?17:12}" fill="${ears}"/>${base}${animal==='panda'?'<ellipse cx="44" cy="49" rx="12" ry="14" fill="#77847b" stroke="none"/><ellipse cx="76" cy="49" rx="12" ry="14" fill="#77847b" stroke="none"/>':''}${animal==='raccoon'?'<path d="M26 43q16-11 34 1 18-12 34-1v13q-18 10-34-1-16 11-34 1Z" fill="#7e8782" stroke="none"/>':''}${animal==='koala'?'<ellipse cx="60" cy="58" rx="6" ry="8" fill="#657578" stroke="none"/>':'<ellipse cx="60" cy="62" rx="18" ry="12" fill="#f4e7d7" stroke="none"/>'}`}

 if(animal==='fox')return `<path d="m24 45 0-30 25 19h24l23-19v32q10 36-36 36-45 0-36-38Z" ${f}/><path d="M26 49q16 0 34 24 18-24 34-24-3 29-34 31-29-1-34-31" fill="#f9e9d1" stroke="none"/>`;

 if(animal==='dog')return `${base}<path d="M31 29q-22-8-19 26 3 15 15 5l7-28M89 29q22-8 19 26-3 15-15 5l-7-28" fill="#9c8064"/>`;

 if(animal==='penguin')return `${base}<path d="M30 51q0-23 18-19l12 9 12-9q18-4 18 19v10q-2 16-30 16-27 0-30-16Z" fill="#f6f0df" stroke="none"/><path d="m55 58 5-4 5 4-5 5Z" fill="#e9bb6d" stroke-width="1.5"/>`;

 if(animal==='bee')return `<path d="m44 29-5-15m37 15 5-15"/><circle cx="39" cy="12" r="4" fill="#73806c"/><circle cx="81" cy="12" r="4" fill="#73806c"/>${base}<path d="M47 27v8m26-8v8" stroke="#908264" stroke-width="5"/>`;

 if(['girl','boy','hijab'].includes(animal)){

  const hair=a.id==='sasha'||a.id==='dito'?'#a78366':a.id==='aira'||a.id==='niko'?'#665c52':'#46504a';

  const back=animal==='girl'?`<path d="M21 70V38q0-24 39-24t39 24v40l-18 3-4-33H42l-6 33-15-2Z" fill="${hair}"/>`:'';

  if(animal==='hijab')return `<path d="M19 74V43q0-29 41-29t41 29v40H19Z" fill="var(--shirt)"/>${base}<path d="M25 38q20 7 35-14 10 16 36 16l-3-13q-34-29-65 0Z" fill="var(--shirt)"/><path d="m27 72 14 16h39l12-16" fill="var(--shirt)"/>`;

  let hairTop=animal==='girl'?`<path d="M25 45V34q1-21 35-20t35 23v9Q75 42 64 26 57 43 25 45Z" fill="${hair}"/>`:`<path d="M24 44 23 26l12 2 4-12 14 6 12-8 6 9 14-2 11 14-2 11-12-11-40 3-18 9Z" fill="${hair}"/>`;

  if(a.accessory==='curl')hairTop=`<path d="M24 43q-14-20 5-20-2-18 17-12 10-14 23-3 17-9 23 7 17 1 10 21l-7 12-9-14-45 1-16 12Z" fill="${hair}"/>`;

  if(a.accessory==='pony')hairTop+=`<path d="M88 31q25-6 19 22L96 70l-7-21" fill="${hair}"/><circle cx="96" cy="32" r="4" fill="#dbbb82"/>`;

  if(a.accessory==='braid')hairTop+=`<path d="M28 53v31m64-31v31" stroke="${hair}" stroke-width="10"/><path d="M24 72h8m56 0h8" stroke="#c899ad" stroke-width="4"/>`;

  return `${back}<circle cx="24" cy="53" r="6" ${f}/><circle cx="96" cy="53" r="6" ${f}/>${base}${hairTop}`;

 }

 if(animal==='robot')return `<path d="M60 25V13"/><circle cx="60" cy="9" r="5" fill="var(--shirt)"/><rect x="16" y="42" width="9" height="20" rx="3" fill="var(--shirt)"/><rect x="95" y="42" width="9" height="20" rx="3" fill="var(--shirt)"/><rect x="24" y="25" width="72" height="54" rx="15" ${f}/><rect x="32" y="36" width="56" height="32" rx="9" fill="#e7eee3" stroke-width="1.5"/><circle cx="38" cy="30" r="1"/><circle cx="82" cy="30" r="1"/>`;

 if(animal==='alien')return `<path d="m40 29-6-17m46 17 6-17"/><circle cx="33" cy="10" r="5" fill="var(--shirt)"/><circle cx="87" cy="10" r="5" fill="var(--shirt)"/><path d="M23 48q0-28 37-28t37 28q0 31-37 36-37-5-37-36Z" ${f}/>`;

 if(animal==='cloud')return `<path d="M24 76C5 72 9 48 23 45c-5-19 14-29 27-20 7-22 36-14 37 4 19-4 27 16 15 28 14 20-7 29-18 24Z" ${f}/>`;

 if(animal==='mushroom')return `${base}<path d="M13 40Q19 7 60 10q40 0 47 30-40 19-94 0Z" fill="#ce8980"/><circle cx="38" cy="28" r="7" fill="#faecd8" stroke="none"/><circle cx="76" cy="24" r="8" fill="#faecd8" stroke="none"/><circle cx="94" cy="38" r="4" fill="#faecd8" stroke="none"/>`;

 if(animal==='astronaut')return `<rect x="18" y="19" width="84" height="66" rx="32" fill="#e2e8e3"/><rect x="25" y="29" width="70" height="48" rx="24" ${f}/><path d="M30 39q0-10 15-13" stroke="white" stroke-width="5"/><path d="M22 78h76" stroke="var(--shirt)" stroke-width="6"/>`;

 if(animal==='plant')return `<path d="M59 28Q28 24 33 5q28-1 27 21 2-25 29-22-1 24-29 24" fill="#86b779"/>${base}`;

 if(['monster','dragon'].includes(animal))return `<path d="m28 33-3-21 21 14m26 0 21-14-3 21" fill="#ebcb92"/>${base}${animal==='dragon'?'<path d="m20 49-10-6 4 17 13 7m73-18 10-6-4 17-13 7" fill="#9db690"/>':'<path d="m48 65 4 8 5-8m9 0 4 8 5-8" fill="white" stroke-width="1.5"/>'}`;

 return base;

}

function accessory(a){let x=a.accessory;

 if(x==='bow')return '<path d="M71 29 63 19l-10 10 10 2-10 9 12-1 6-10 6 10 12 1-10-9 10-2-10-10Z" fill="#c9828b" stroke-width="1.5" transform="translate(10 -9) scale(.85)"/>';

 if(x==='glasses')return '<g fill="none" stroke-width="1.8"><rect x="32" y="41" width="22" height="19" rx="6"/><rect x="66" y="41" width="22" height="19" rx="6"/><path d="M54 47h12M25 45h7m56 0h7"/></g>';

 if(x==='cap')return '<path d="M23 32q5-24 38-20 30 1 32 23H23Z" fill="var(--shirt)"/><path d="M19 34h80" stroke-width="5"/>';

 if(x==='star')return '<path d="m86 20 2 5 5 1-4 4 1 5-4-3-5 3 1-5-4-4 6-1Z" fill="#ead08b" stroke-width="1.3"/>';

 if(x==='leaf'&&a.type!=='plant')return '<path d="M60 25Q44 23 46 10q17-1 14 15 1-13 14-13 0 12-14 13Z" fill="#7caa68" stroke-width="1.5"/>';

 return '';

}

const has=id=>AVATARS.some(a=>a.id===id);

const MOODS={
 idle:{parts:['e-normal','m-normal'],label:'Santai'},
 happy:{parts:['e-happy','m-grin','blush'],label:'Senang'},
 laugh:{parts:['e-happy','m-laugh','blush'],label:'Terbahak'},
 wink:{parts:['e-wink','m-smile','blush'],label:'Kedip'},
 love:{parts:['e-love','m-smile','blush2'],label:'Sayang'},
 star:{parts:['e-star','m-laugh','sparkle'],label:'Kagum'},
 cool:{parts:['e-cool','m-smirk'],label:'Keren'},
 think:{parts:['e-side','m-flat','sweat'],label:'Berpikir'},
 shy:{parts:['e-normal','m-wavy','blush2'],label:'Malu'},
 sleepy:{parts:['e-sleepy','m-yawn','zzz'],label:'Ngantuk'},
 sad:{parts:['e-sad','m-sad','tears'],label:'Sedih'},
 cry:{parts:['e-cry','m-open','tears'],label:'Menangis'},
 shock:{parts:['e-shock','m-shock','sweat'],label:'Kaget'},
 scared:{parts:['e-shock','m-wavy','sweat'],label:'Takut'},
 angry:{parts:['e-angry','m-cat','anger'],label:'Marah'},
 suspicious:{parts:['e-side','m-smirk'],label:'Curiga'},
 cheer:{parts:['e-happy','m-open','sparkle'],label:'Sorak'},
 proud:{parts:['e-normal','m-smile','blush','sparkle'],label:'Bangga'},
 confused:{parts:['e-shock','m-wavy','sweat'],label:'Bingung'},
 playful:{parts:['e-wink','m-tongue','blush'],label:'Jail'}
};
const MOOD_ALIASES={neutral:'idle',smile:'happy',excited:'cheer',surprised:'shock',wow:'shock',sleep:'sleepy',lol:'laugh',tired:'sleepy',mad:'angry',hmm:'think',thinking:'think',nervous:'shy',glad:'happy',ok:'idle',reveal:'happy',select:'happy',success:'cheer',win:'cheer',error:'sad',fail:'sad',lose:'sad',warn:'scared',tick:'idle',focus:'think'};
const MOOD_NAMES=Object.keys(MOODS);
function moodOf(name){
 const key=String(name||'').toLowerCase();
 if(MOODS[key])return key;
 if(MOOD_ALIASES[key]&&MOODS[MOOD_ALIASES[key]])return MOOD_ALIASES[key];
 return 'idle';
}
function moodStyle(name){
 const mood=MOODS[moodOf(name)];
 return mood.parts.map(part=>'--'+part+':block').join(';');
}

/* Sprite holder diciptakan sendiri kalau halaman tidak menyediakan #symbols,
   supaya simbol avatar selalu ada saat <use href="#avatar-..."> dipanggil. */
let symbolsBuilt=false;

function spriteRoot(){
  let root=$('#symbols');
  if(root)return root;
  root=document.createElementNS('http://www.w3.org/2000/svg','svg');
  root.id='symbols';
  root.setAttribute('aria-hidden','true');
  root.setAttribute('focusable','false');
  root.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
  (document.body||document.documentElement).insertBefore(root,document.body?document.body.firstChild:null);
  return root;
}

function buildSymbols(){
  if(symbolsBuilt)return;
  symbolsBuilt=true;

const face=`<g class="rig-eyes"><g style="display:var(--e-normal,none)"><ellipse cx="44" cy="51" rx="3.4" ry="4.7" fill="#304139"/><ellipse cx="76" cy="51" rx="3.4" ry="4.7" fill="#304139"/><circle cx="45" cy="49.5" r="1" fill="white"/><circle cx="77" cy="49.5" r="1" fill="white"/></g><g style="display:var(--e-happy,none)" fill="none" stroke="#304139" stroke-width="2.8" stroke-linecap="round"><path d="M39 52q5-7 10 0m22 0q5-7 10 0"/></g><g style="display:var(--e-shock,none)" fill="white" stroke="#304139" stroke-width="2"><circle cx="44" cy="50" r="7"/><circle cx="76" cy="50" r="7"/><circle cx="44" cy="51" r="2" fill="#304139" stroke="none"/><circle cx="76" cy="51" r="2" fill="#304139" stroke="none"/></g><g style="display:var(--e-wink,none)"><path d="M39 51q5-7 10 0" fill="none" stroke="#304139" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="76" cy="51" rx="3.4" ry="4.7" fill="#304139"/><circle cx="77" cy="49.5" r="1" fill="white"/></g><g style="display:var(--e-love,none)" fill="#d2556f" stroke="#a2405a" stroke-width="1.2"><path d="M44 56c-7-5-4-12 0-8 4-4 7 3 0 8Z"/><path d="M76 56c-7-5-4-12 0-8 4-4 7 3 0 8Z"/></g><g style="display:var(--e-star,none)" fill="#f2c14e" stroke="#9c7a26" stroke-width="1.1"><path d="m44 45 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7Z"/><path d="m76 45 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7Z"/></g><g style="display:var(--e-sleepy,none)" fill="none" stroke="#304139" stroke-width="2.8" stroke-linecap="round"><path d="M39 51q5 5 10 0m22 0q5 5 10 0"/></g><g style="display:var(--e-side,none)"><ellipse cx="42" cy="50" rx="3.4" ry="4.7" fill="#304139"/><ellipse cx="74" cy="50" rx="3.4" ry="4.7" fill="#304139"/><circle cx="41" cy="48.5" r="1" fill="white"/><circle cx="73" cy="48.5" r="1" fill="white"/></g><g style="display:var(--e-sad,none)"><ellipse cx="44" cy="53" rx="3.4" ry="3.2" fill="#304139"/><ellipse cx="76" cy="53" rx="3.4" ry="3.2" fill="#304139"/><path d="M38 46l11 3m23-3-11 3" fill="none" stroke="#304139" stroke-width="2.2" stroke-linecap="round"/></g><g style="display:var(--e-cry,none)" fill="none" stroke="#304139" stroke-width="2.8" stroke-linecap="round"><path d="M50 47l-10 4 10 4m20-8 10 4-10 4"/></g><g style="display:var(--e-angry,none)"><ellipse cx="44" cy="53" rx="3.4" ry="3.6" fill="#304139"/><ellipse cx="76" cy="53" rx="3.4" ry="3.6" fill="#304139"/><path d="M37 46l12 4m24-4-12 4" fill="none" stroke="#304139" stroke-width="2.6" stroke-linecap="round"/></g><g style="display:var(--e-cool,none)" fill="#2b3630" stroke="#35443d" stroke-width="1.8"><path d="M30 47h60" fill="none" stroke-width="2.6"/><rect x="31" y="46" width="23" height="13" rx="5.5"/><rect x="66" y="46" width="23" height="13" rx="5.5"/><path d="M54 51h6" fill="none"/></g></g><g style="display:var(--blush,none)"><ellipse cx="34" cy="61" rx="6" ry="3" fill="#db9e96" opacity=".6"/><ellipse cx="86" cy="61" rx="6" ry="3" fill="#db9e96" opacity=".6"/></g><g style="display:var(--blush2,none)"><ellipse cx="33" cy="61" rx="7.5" ry="4" fill="#dd8b86" opacity=".8"/><ellipse cx="87" cy="61" rx="7.5" ry="4" fill="#dd8b86" opacity=".8"/></g><g style="display:var(--m-normal,none)"><path d="M54 64q6 6 12 0" fill="none" stroke="#35443d" stroke-width="2" stroke-linecap="round"/></g><g style="display:var(--m-grin,none)"><path d="M52 63h16q-1 13-8 13-7 0-8-13Z" fill="#806052" stroke="#35443d" stroke-width="1.5"/></g><g style="display:var(--m-laugh,none)"><path d="M48 61h24q-2 17-12 17-10 0-12-17Z" fill="#806052" stroke="#35443d" stroke-width="1.5"/><path d="M54 72h12q-1 7-6 7-5 0-6-7Z" fill="#e0757f" stroke-width="1.2"/></g><g style="display:var(--m-smile,none)"><path d="M49 63q11 9 22 0" fill="none" stroke="#35443d" stroke-width="2.2" stroke-linecap="round"/></g><g style="display:var(--m-flat,none)"><path d="M52 66h16" fill="none" stroke="#35443d" stroke-width="2.2" stroke-linecap="round"/></g><g style="display:var(--m-wavy,none)"><path d="M49 66q4-4 7 0t7 0 7 0" fill="none" stroke="#35443d" stroke-width="2" stroke-linecap="round"/></g><g style="display:var(--m-sad,none)"><path d="M53 69q7-7 14 0" fill="none" stroke="#35443d" stroke-width="2.2" stroke-linecap="round"/></g><g style="display:var(--m-shock,none)"><ellipse cx="60" cy="67" rx="4" ry="5" fill="#806052" stroke="#35443d" stroke-width="1.5"/></g><g style="display:var(--m-open,none)"><ellipse cx="60" cy="68" rx="6.5" ry="6" fill="#806052" stroke="#35443d" stroke-width="1.5"/></g><g style="display:var(--m-yawn,none)"><ellipse cx="60" cy="68" rx="5" ry="8" fill="#7a5c50" stroke="#35443d" stroke-width="1.5"/></g><g style="display:var(--m-cat,none)"><path d="M50 63q5 8 10 0 5 8 10 0" fill="none" stroke="#35443d" stroke-width="2" stroke-linecap="round"/><path d="m56 67 2 3 2-3Z" fill="white" stroke-width="1.2"/></g><g style="display:var(--m-tongue,none)"><path d="M50 63q10 8 20 0" fill="none" stroke="#35443d" stroke-width="2.2" stroke-linecap="round"/><path d="M58 67q6 2 5 7-4 3-7-1-1-3 2-6Z" fill="#e0757f" stroke-width="1.4"/></g><g style="display:var(--m-smirk,none)"><path d="M52 67q9 4 15-3" fill="none" stroke="#35443d" stroke-width="2.2" stroke-linecap="round"/></g><g style="display:var(--sweat,none)"><path d="M96 34q-9 11-2 13 9 1 2-13Z" fill="#9bc9dc" stroke="#6c9eab" stroke-width="1"/></g><g style="display:var(--tears,none)"><path d="M40 56q-5 12 1 14 7-2 2-14Z" fill="#8fc3de" stroke="#6c9eab" stroke-width="1"/><path d="M80 56q-5 12 1 14 7-2 2-14Z" fill="#8fc3de" stroke="#6c9eab" stroke-width="1"/></g><g style="display:var(--zzz,none)" fill="none" stroke="#7c8b95" stroke-width="2.4" stroke-linecap="round"><path d="M92 30h9l-9 10h9"/><path d="M106 20h6l-6 7h6"/></g><g style="display:var(--anger,none)" fill="none" stroke="#d2556f" stroke-width="2.6" stroke-linecap="round"><path d="M90 26l7 7m0-7-7 7"/></g><g style="display:var(--sparkle,none)" fill="#f2c14e" stroke="#9c7a26" stroke-width="1"><path d="m94 30 1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8Z"/><path d="m26 26 1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4Z"/></g>`;

 spriteRoot().innerHTML=`<symbol id="rig-face" viewBox="0 0 120 120">${face}</symbol><symbol id="rig-body" viewBox="0 0 120 120"><g ${stroke}><path d="M43 91v17q-9 8-12-1l4-16m42 0v17q9 8 12-1l-4-16" fill="var(--fur)"/><path d="M34 91q-12 8-14 0 0-7 17-12" fill="var(--fur)"/><path d="M41 71h38l9 26q-27 10-56 0Z" fill="var(--shirt)"/><path d="m52 75 8 9 8-9" fill="#fbf4df" stroke-width="1.5"/></g><circle cx="60" cy="91" r="2" fill="#f5efdb"/></symbol>`;

 for(const a of AVATARS){

  const s=document.createElementNS('http://www.w3.org/2000/svg','symbol');s.id='avatar-'+a.id;s.setAttribute('viewBox','0 0 120 120');

  s.innerHTML=`<g style="--fur:${a.fur};--shirt:${a.shirt}"><ellipse cx="60" cy="111" rx="30" ry="4" fill="#35443d" opacity=".1"/><g class="rig-motion"><g class="rig-breathe"><use href="#rig-body"/><g class="rig-arm" ${stroke}><path d="M83 79q19 8 18 15-3 8-17-3" fill="var(--fur)"/></g><g ${stroke}>${headShape(a)}</g><use href="#rig-face"/><g ${stroke}>${accessory(a)}</g>${a.accessory==='scarf'?'<path d="M37 78q22 13 46 0l-2 9-22 2-4 15-9-2 3-16-11-2Z" fill="var(--shirt)" stroke="#35443d" stroke-width="1.5"/>':''}${a.pack==='students'?'<rect x="70" y="89" width="8" height="6" rx="1" fill="#f4f1e7"/><path d="M72 92h4" stroke="#658986" stroke-width="1"/>':''}</g></g></g>`;

  spriteRoot().append(s);

 }

}

let avatarSeq=0;

function av(id,expression='idle',cls=''){const a=char(id);const mood=moodOf(expression);return `<svg class="avatar ${cls}" data-expression="${mood}" style="${moodStyle(mood)}" data-avatar="${a.id}" data-testid="avatar-${++avatarSeq}" role="img" aria-label="${a.name}, ${expression}" viewBox="0 0 120 120"><use href="#avatar-${a.id}"/></svg>`}


window.NekoAvatarPack = { PACKS, AVATARS, char, av, buildSymbols, has, MOODS, MOOD_NAMES, MOOD_ALIASES, moodOf, moodStyle };
buildSymbols();
})();
