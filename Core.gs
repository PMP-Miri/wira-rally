/* Pure shared logic: browser + Google Apps Script. No dependencies. */
(function(root) {
  'use strict';
  const COLORS = ['#ff615e','#40c8f5','#ffcc45','#9c83ff','#47d7a0','#ff88b5','#ff9148','#69a6ff','#ca80ec','#7bd851','#f26398','#49cfce','#e6b66e','#afcdff','#f0a3ff','#ffb5a1','#b0df69','#76e0c6','#d8bdff','#f5da73','#e16c55','#349ed0','#7769dc','#dc90b6'];
  const THEMES = {
    run: {name:'Larian Wira',icon:'🏃',desc:'Pecut di stadium tropika',ground:'#4baa80',track:'#e39170',sky:'#bdeaff'},
    horse: {name:'Derbi Kuda',icon:'🏇',desc:'Derapan di padang hijau',ground:'#87b85d',track:'#cfb485',sky:'#c9eaff'},
    boat: {name:'Regata Ceria',icon:'🚤',desc:'Luncur merentas teluk',ground:'#239fc1',track:'#3ac7d5',sky:'#c0f0ff'},
    duck: {name:'Itik & Angsa',icon:'🦆',desc:'Tunggangan paling comel',ground:'#409ea0',track:'#61d1cb',sky:'#d4f4ff'},
    kart: {name:'Kart Karnival',icon:'🏎️',desc:'Pecut di litar warna-warni',ground:'#78ba96',track:'#72768f',sky:'#d6e5ff'},
    space: {name:'Roket Kosmik',icon:'🚀',desc:'Terbang di galaksi neon',ground:'#181c42',track:'#393462',sky:'#10152d'}
  };
  function hash(value) { let h=2166136261; const s=String(value); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
  function rng(seed) { let a=seed>>>0; return function(){a+=0x6D2B79F5;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}; }
  function clamp(v,a,b) { return Math.max(a,Math.min(b,v)); }
  function smooth(a,b,x) { const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t); }
  function name(value) { return String(value||'').normalize('NFKC').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,32); }
  function nameKey(value) { return name(value).toLocaleLowerCase(); }
  function newState(now) { return {schema:1,eventId:'event-'+now,active:true,expiresAt:now+21600000,version:1,title:'WIRA RALLY',registrationOpen:true,theme:'run',duration:8,prize:'Cabutan Bertuah',round:0,participants:[],winners:[],race:null,updatedAt:now}; }
  function eligible(s) { return s.participants.filter(p=>!p.won); }
  function raceRoster(s) { if(!s.race) return eligible(s); const ids=new Set(s.race.participantIds); return s.participants.filter(p=>ids.has(p.id)); }
  function chooseWinner(ids,random32) { if(!ids.length) throw Error('Tiada peserta layak.'); const limit=Math.floor(4294967296/ids.length)*ids.length; let n; for(let i=0;i<128;i++){n=random32()>>>0;if(n<limit)return ids[n%ids.length];} throw Error('Sumber rawak gagal. Cuba lagi.'); }
  function settle(s,now) { if(!s.race || s.race.settled || now<s.race.finishAt)return false; const r=s.race;const p=s.participants.find(p=>p.id===r.winnerId);if(!p)throw Error('Rekod pemenang tidak ditemui.');p.won=true;s.winners.push({id:p.id,name:p.name,gender:p.gender,color:p.color,round:r.round,prize:r.prize,theme:r.theme,at:r.finishAt});r.settled=true;return true; }
  function register(s,input,id,now,max) { if(!s.registrationOpen)throw Error('Pendaftaran telah ditutup.');if(s.race&&!s.race.settled)throw Error('Perlumbaan sedang berlangsung.');const n=name(input.name);if(n.length<2)throw Error('Nama mesti mempunyai sekurang-kurangnya 2 aksara.');if(!['male','female'].includes(input.gender))throw Error('Pilih watak lelaki atau perempuan.');const existing=s.participants.find(p=>p.id===id);if(existing)return existing;if(s.participants.length>=max)throw Error('Had '+max+' peserta telah dicapai.');if(s.participants.some(p=>nameKey(p.name)===nameKey(n)))throw Error('Nama ini sudah didaftarkan. Tambah nama keluarga atau nombor meja.');const seed=hash(id);const p={id:id,name:n,gender:input.gender,color:COLORS[seed%COLORS.length],seed:seed,joinedAt:now,won:false};s.participants.push(p);return p; }
  function gridOffset(index,count,theme) { const cols=count>64?12:count>24?10:count>8?8:Math.max(1,count);return ((index%cols)-(cols-1)/2)*(theme==='run'?2.7:3.5); }
  function position(r,id,now) { const origin=r.origins&&r.origins[id]!==undefined?r.origins[id]:r.base;const t=now-r.startAt;if(t<0)return origin+(r.rolling?t*.002:0);const p=progress(r,id,now),finish=r.base+r.distance;return p<=1?origin+(finish-origin)*p:finish+(p-1)*r.distance; }
  function start(s,now,winnerId,raceId,seed) { if(s.race&&now<s.race.rejoinAt)throw Error('Tunggu semua peserta selesai.');if(s.race&&!s.race.settled)throw Error('Pusingan ini masih berlangsung.');const ps=eligible(s);if(!ps.length)throw Error('Tiada peserta layak.');if(!ps.some(p=>p.id===winnerId))throw Error('Pemenang tidak sah.');s.registrationOpen=false;const startAt=now+5000,duration=clamp(Number(s.duration)||8,6,8),previous=s.race,origins={};ps.forEach((p,i)=>{origins[p.id]=previous?position(previous,p.id,startAt):gridOffset(i,ps.length,s.theme);});const base=previous?Math.max(...Object.values(origins)):0;s.round++;s.race={id:raceId,round:s.round,theme:s.theme,prize:s.prize,duration:duration,seed:seed>>>0,winnerId:winnerId,participantIds:ps.map(p=>p.id),origins:origins,rolling:!!previous,startAt:startAt,finishAt:startAt+duration*1000,rejoinAt:startAt+duration*1000+6500,base:base,distance:112,settled:false};return s.race; }
  // Every entry crosses; the selected winner is mathematically first. The field
  // continues beyond the checkpoint rather than jumping back to an origin.
  function progress(r,id,now) { const h=hash(id+':'+r.seed);const v=(h%10000)/10000;const winner=id===r.winnerId;const t=(now-r.startAt)/1000;const finish=r.duration+(winner?0:0.23+v*0.92);if(t<=0)return 0;
    if(t<finish){const u=clamp(t/finish,0,1);const wobble=(winner?-0.018:0.015*Math.sin((h%7)+u*9))*Math.sin(Math.PI*u);return clamp(u+wobble,0,0.999999);}
    const after=t-finish;return 1+Math.min(after,3.5)*0.058+Math.max(0,after-3.5)*(2/112);
  }
  function publicState(s,now) { return {schema:s.schema,eventId:s.eventId,active:s.active!==false,expiresAt:s.expiresAt||0,version:s.version,title:s.title,registrationOpen:s.registrationOpen,theme:s.theme,duration:s.duration,prize:s.prize,round:s.round,participants:s.participants.map(p=>({id:p.id,name:p.name,gender:p.gender,color:p.color,seed:p.seed,won:!!p.won})),winners:s.winners,race:s.race,updatedAt:s.updatedAt,serverNow:now}; }
  function validateSettings(input) { const o={};if(input.title!==undefined){o.title=name(input.title);if(!o.title)throw Error('Tajuk tidak boleh kosong.');}if(input.theme!==undefined){if(!THEMES[input.theme])throw Error('Tema tidak sah.');o.theme=input.theme;}if(input.duration!==undefined){const n=Number(input.duration);if(![6,7,8].includes(n))throw Error('Tempoh mesti 6, 7 atau 8 saat.');o.duration=n;}if(input.prize!==undefined)o.prize=name(input.prize)||'Cabutan Bertuah';if(input.registrationOpen!==undefined)o.registrationOpen=!!input.registrationOpen;return o; }
  const api={COLORS:COLORS,THEMES:THEMES,hash:hash,rng:rng,clamp:clamp,smooth:smooth,name:name,nameKey:nameKey,newState:newState,eligible:eligible,raceRoster:raceRoster,chooseWinner:chooseWinner,settle:settle,register:register,start:start,progress:progress,position:position,gridOffset:gridOffset,publicState:publicState,validateSettings:validateSettings};
  root.WiraCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
