const C=window.WiraCore;
export const uuid=()=>crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,'0')).join('');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export class API {
  constructor(config,{demo=false}={}){
    this.url=config.apiUrl;this.demo=demo;this.offset=0;this.pending=new Map();this.channel=null;this.demoState=null;
    this.listener=e=>{const allowed=e.origin==='https://script.google.com'||/^https:\/\/[a-zA-Z0-9.-]+\.googleusercontent\.com$/.test(e.origin);const d=e.data;if(!allowed||!d||d.channel!=='wira-rally-v1')return;const pending=this.pending.get(d.op);if(pending)pending(d.response);};window.addEventListener('message',this.listener);
  }
  get ready(){return this.demo||/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(this.url||'');}
  now(){return Date.now()+this.offset;}
  sync(s,started){if(s&&s.serverNow)this.offset=s.serverNow-(started+Date.now())/2;return s;}
  inactive(){const s=C.newState(0);s.eventId='none';s.active=false;s.expiresAt=0;s.registrationOpen=false;return s;}
  async state(){
    const started=Date.now();if(this.demo){const s=this.demoLoad();if(C.settle(s,Date.now()))this.demoSave(s);return this.sync(C.publicState(s,Date.now()),started);}
    if(!this.ready)throw Error('Backend belum dikonfigurasi. Isi apiUrl dalam config.js.');
    const out=await new Promise((resolve,reject)=>{const cb='WR_'+uuid().replace(/-/g,'');const el=document.createElement('script');let timer;const done=()=>{clearTimeout(timer);el.remove();delete window[cb];};window[cb]=data=>{done();resolve(data);};el.onerror=()=>{done();reject(Error('Tidak dapat menghubungi pelayan. Semak deployment dan rangkaian.'));};timer=setTimeout(()=>{done();reject(Error('Pelayan lambat memberi respons. Cuba semula.'));},18000);el.src=this.url+'?callback='+cb+'&origin='+encodeURIComponent(location.origin)+'&t='+Date.now();document.head.append(el);});
    if(!out.ok)throw Error(out.error);return this.sync(out.state,started);
  }
  async write(action,data={},token=''){
    if(this.demo)return this.demoWrite(action,data,token);
    if(!this.ready)throw Error('Backend belum dikonfigurasi.');
    const started=Date.now(),op=uuid(),payload={op,origin:location.origin,action,data,token};
    const response=await new Promise((resolve,reject)=>{
      const frame=document.createElement('iframe');frame.name='wr_'+op;frame.hidden=true;frame.title='Sambungan pelayan';
      const form=document.createElement('form');form.method='POST';form.action=this.url;form.target=frame.name;form.hidden=true;
      const input=document.createElement('input');input.name='payload';input.value=JSON.stringify(payload);form.append(input);document.body.append(frame,form);
      const cleanup=()=>{clearTimeout(timer);this.pending.delete(op);form.remove();frame.remove();};
      const timer=setTimeout(()=>{cleanup();reject(Error('Tiada pengesahan pelayan. Permintaan mungkin sudah diterima. Semak paparan sebelum cuba semula.'));},35000);
      this.pending.set(op,res=>{cleanup();resolve(res);});form.submit();
    });if(!response.ok)throw Error(response.error);if(response.result?.state)this.sync(response.result.state,started);return response.result;
  }
  // Demo participants exist only in this tab's RAM. No localStorage or database.
  demoLoad(){if(this.demoState&&this.demoState.expiresAt<=Date.now())this.demoState=null;return this.demoState||this.inactive();}
  demoSave(s){s.version++;s.updatedAt=Date.now();this.demoState=s;}
  async demoWrite(action,data,token){
    await sleep(80);let s=this.demoLoad();C.settle(s,Date.now());let result={};
    if(action==='login'){if(!s.active){s=C.newState(Date.now());s.eventId='demo-'+uuid();this.demoSave(s);}return {token:'demo-session',expiresAt:Date.now()+14400000,state:C.publicState(s,Date.now())};}
    if(action!=='register'&&token!=='demo-session')throw Error('Log masuk demo dahulu.');
    if(action==='logout')return {loggedOut:true};
    if(!s.active)throw Error('Tiada sesi aktif. Log masuk urusetia dahulu.');
    if(data.eventId!==s.eventId)throw Error('Sesi telah berubah. Cuba semula.');
    if(action==='end'){if(data.confirm!=='TAMAT SESI')throw Error('Pengesahan diperlukan.');this.demoState=null;return {ended:true,state:C.publicState(this.inactive(),Date.now())};}
    if(action==='register'){result.participant=s.participants.find(p=>p.id===data.id)||C.register(s,data,data.id,Date.now(),100);}
    else if(action==='start'){if(s.race&&Date.now()<s.race.rejoinAt)throw Error('Tunggu semua peserta selesai.');const ids=C.eligible(s).map(p=>p.id);C.start(s,Date.now(),C.chooseWinner(ids,()=>crypto.getRandomValues(new Uint32Array(1))[0]),uuid(),crypto.getRandomValues(new Uint32Array(1))[0]);}
    else if(action==='settings'){if(s.race&&Date.now()<s.race.rejoinAt)throw Error('Tunggu semua peserta selesai.');Object.assign(s,C.validateSettings(data));}
    else if(action==='remove'){if(s.race&&Date.now()<s.race.rejoinAt)throw Error('Tunggu perlumbaan tamat.');s.participants=s.participants.filter(p=>p.id!==data.id||p.won);}
    else if(action==='seed'){if(s.race&&!s.race.settled)throw Error('Tunggu perlumbaan tamat.');const names=['Aiman','Sofia','Hafiz','Nadia','Danish','Alya','Amir','Hana','Irfan','Maya','Adam','Zara','Farid','Nurin','Arif','Iman','Hakim','Sarah','Rizal','Yasmin'];const count=Math.min(100-s.participants.length,Number(data.count)||20);for(let i=0;i<count;i++){C.register(s,{name:names[i%names.length]+' '+(s.participants.length+1),gender:i%2?'female':'male'},'p-'+uuid(),Date.now(),100);}}
    else throw Error('Tindakan tidak dikenali.');
    this.demoSave(s);result.state=C.publicState(s,Date.now());return result;
  }
  dispose(){window.removeEventListener('message',this.listener);this.channel?.close();this.demoState=null;}
}
