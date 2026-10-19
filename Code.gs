/** WIRA RALLY | Google Apps Script V8 | temporary session only.
 * Add Core.gs from shared/core.js, set PIN + origin, run setup(), deploy Web App.
 * No SpreadsheetApp, Drive, participant logs or permanent participant database.
 * CacheService is best-effort: it can discard a session BEFORE its expiry.
 */
const SETUP = {
  ADMIN_PIN: 'TUKAR-PIN-INI-839271', // minimum 8 characters; never put in config.js
  ALLOWED_ORIGINS: ['https://NAMA-GITHUB.github.io'], // origin only, no repo path
  MAX_PARTICIPANTS: 100,
  SESSION_HOURS: 6 // fixed deadline from opening a session; maximum 6
};
const STATE_CACHE = 'wira-ephemeral-state-v2';
const SESSION_SECONDS = 14400;

function setup() {
  if (SETUP.ADMIN_PIN.indexOf('TUKAR-') === 0 || SETUP.ADMIN_PIN.length < 8) throw new Error('Tukar SETUP.ADMIN_PIN dahulu.');
  if (!SETUP.ALLOWED_ORIGINS.length || SETUP.ALLOWED_ORIGINS.some(x => x.indexOf('NAMA-GITHUB') !== -1 || !/^https:\/\/[^/]+$/.test(x))) throw new Error('Tetapkan ALLOWED_ORIGINS, contoh https://hafiz.github.io');
  const salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({PIN_SALT:salt,PIN_HASH:digest_(salt+':'+SETUP.ADMIN_PIN),ALLOWED_ORIGINS:JSON.stringify(SETUP.ALLOWED_ORIGINS),MAX_PARTICIPANTS:String(Math.min(100,SETUP.MAX_PARTICIPANTS)),SESSION_HOURS:String(Math.min(6,Math.max(1,SETUP.SESSION_HOURS)))});
  // Reconfiguration clears the current temporary session and invalidates tokens.
  CacheService.getScriptCache().remove(STATE_CACHE);
  console.log('Sedia. Tiada spreadsheet dicipta. Deploy Web App: Execute as Me, access Anyone.');
}
function digest_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(x=>('0'+((x+256)%256).toString(16)).slice(-2)).join(''); }
function random32_() { return parseInt(digest_(Utilities.getUuid()+':'+Utilities.getUuid()).slice(0,8),16)>>>0; }
function fresh_(now) {
  const s=WiraCore.newState(now);s.eventId='event-'+Utilities.getUuid();s.active=true;
  s.expiresAt=now+Number(PropertiesService.getScriptProperties().getProperty('SESSION_HOURS')||6)*3600000;
  s.processedOps=[];return s;
}
function inactive_(now) { const s=WiraCore.newState(0);s.eventId='none';s.active=false;s.registrationOpen=false;s.expiresAt=0;return WiraCore.publicState(s,now); }
function load_() {
  const cache=CacheService.getScriptCache(),raw=cache.get(STATE_CACHE);if(!raw)return null;
  const s=JSON.parse(raw);if(!s.expiresAt||s.expiresAt<=Date.now()){cache.remove(STATE_CACHE);return null;}return s;
}
function save_(s) {
  if(s.expiresAt<=Date.now()){CacheService.getScriptCache().remove(STATE_CACHE);throw new Error('Sesi sudah luput. Log masuk untuk buka sesi baharu.');}
  s.updatedAt=Date.now();s.version=(s.version||0)+1;const json=JSON.stringify(s);
  if(Utilities.newBlob(json).getBytes().length>95000)throw new Error('Saiz sesi terlalu besar. Pendekkan nama peserta.');
  CacheService.getScriptCache().put(STATE_CACHE,json,Math.min(21600,Math.max(1,Math.ceil((s.expiresAt-Date.now())/1000))));
}
function locked_(fn) { const lock=LockService.getScriptLock();if(!lock.tryLock(20000))throw new Error('Pelayan sibuk. Tunggu seketika dan cuba lagi.');try{return fn();}finally{lock.releaseLock();} }
function allowed_(origin) { let list=[];try{list=JSON.parse(PropertiesService.getScriptProperties().getProperty('ALLOWED_ORIGINS')||'[]');}catch(e){}return list.indexOf(origin)!==-1; }
function adminKey_(token) { const salt=PropertiesService.getScriptProperties().getProperty('PIN_SALT')||'';return 'admin:'+digest_(salt+':'+token); }
function requireAdmin_(token) {
  if(typeof token!=='string'||token.length<20)throw new Error('Sila log masuk urusetia.');
  let auth=null;try{auth=JSON.parse(CacheService.getScriptCache().get(adminKey_(token))||'null');}catch(e){}
  const state=load_();
  if(!auth||auth.expiresAt<=Date.now()||!state||auth.eventId!==state.eventId)throw new Error('Sesi urusetia tamat. Log masuk semula.');
}
function doGet(e) {
  const q=(e&&e.parameter)||{},cb=String(q.callback||'');
  if(!/^WR_[A-Za-z0-9_]{8,100}$/.test(cb))return ContentService.createTextOutput(JSON.stringify({ok:false,error:'Read-only endpoint. Callback required.'})).setMimeType(ContentService.MimeType.JSON);
  let out;
  try{
    if(!allowed_(String(q.origin||'')))throw new Error('Origin tidak dibenarkan. Semak SETUP.ALLOWED_ORIGINS.');
    let s=load_();
    if(s&&s.race&&!s.race.settled&&Date.now()>=s.race.finishAt){s=locked_(function(){const fresh=load_();if(fresh&&WiraCore.settle(fresh,Date.now()))save_(fresh);return fresh;});}
    out={ok:true,state:s?WiraCore.publicState(s,Date.now()):inactive_(Date.now())};
  }catch(err){out={ok:false,error:String(err.message||err)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(out).replace(/</g,'\\u003c')+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
function doPost(e) {
  let p,origin='',op='',out;
  try{
    const raw=e&&e.parameter&&e.parameter.payload;if(!raw||raw.length>12000)throw new Error('Permintaan tidak sah.');p=JSON.parse(raw);origin=String(p.origin||'');op=String(p.op||'');
    if(!allowed_(origin))throw new Error('Origin tidak dibenarkan.');
    if(!/^[a-zA-Z0-9-]{20,80}$/.test(op))throw new Error('ID operasi tidak sah.');
    out=locked_(function(){return {ok:true,result:dispatch_(p)};});
  }catch(err){out={ok:false,error:String(err.message||err)};}
  if(!allowed_(origin))return HtmlService.createHtmlOutput('Origin tidak dibenarkan.');
  const msg=JSON.stringify({channel:'wira-rally-v1',op:op,response:out}).replace(/</g,'\\u003c'),target=JSON.stringify(origin).replace(/</g,'\\u003c');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><script>window.top.postMessage('+msg+','+target+');<\/script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function dispatch_(p) {
  const action=p.action,d=p.data||{},now=Date.now(),props=PropertiesService.getScriptProperties(),cache=CacheService.getScriptCache();
  if(action==='login'){
    const key='login-fail',n=Number(cache.get(key)||0);if(n>=12)throw new Error('Terlalu banyak cubaan PIN. Tunggu 5 minit.');
    const expected=props.getProperty('PIN_HASH');if(!expected||digest_(props.getProperty('PIN_SALT')+':'+String(d.pin||''))!==expected){cache.put(key,String(n+1),300);throw new Error('PIN urusetia tidak betul.');}
    cache.remove(key);let s=load_();if(!s){s=fresh_(now);save_(s);}
    const token=Utilities.getUuid()+Utilities.getUuid();cache.put(adminKey_(token),JSON.stringify({expiresAt:now+SESSION_SECONDS*1000,eventId:s.eventId}),SESSION_SECONDS);
    return {token:token,expiresAt:now+SESSION_SECONDS*1000,state:WiraCore.publicState(s,now)};
  }
  if(action==='logout'){requireAdmin_(p.token);cache.remove(adminKey_(p.token));return {loggedOut:true};}
  if(action!=='register')requireAdmin_(p.token);
  const s=load_();if(!s)throw new Error('Tiada sesi aktif atau cache sesi sudah luput. Urusetia perlu membuka sesi baharu.');
  if(d.eventId!==s.eventId)throw new Error('Sesi telah berubah. Refresh paparan sebelum cuba semula.');
  let changed=WiraCore.settle(s,now);
  if(p.op&&s.processedOps&&s.processedOps.includes(p.op)){if(changed)save_(s);return {state:WiraCore.publicState(s,now)};}
  if(action==='end'){
    if(d.confirm!=='TAMAT SESI')throw new Error('Taip TAMAT SESI untuk mengesahkan.');
    cache.remove(STATE_CACHE);cache.remove(adminKey_(p.token));
    return {ended:true,state:inactive_(now)};
  }
  let participant;
  if(action==='register'){
    if(typeof d.id!=='string'||!/^p-[a-zA-Z0-9-]{20,76}$/.test(d.id))throw new Error('ID peranti tidak sah.');
    participant=s.participants.find(x=>x.id===d.id);
    if(!participant){participant=WiraCore.register(s,d,d.id,now,Number(props.getProperty('MAX_PARTICIPANTS')||100));changed=true;}
  }else if(action==='settings'){
    if(s.race&&now<s.race.rejoinAt)throw new Error('Tunggu semua peserta selesai sebelum ubah tetapan.');
    Object.assign(s,WiraCore.validateSettings(d));changed=true;
  }else if(action==='start'){
    if(s.race&&now<s.race.rejoinAt)throw new Error('Tunggu peserta berkumpul sebelum pusingan seterusnya.');
    const ids=WiraCore.eligible(s).map(x=>x.id),winner=WiraCore.chooseWinner(ids,random32_);
    WiraCore.start(s,now,winner,Utilities.getUuid(),random32_());changed=true;
  }else if(action==='remove'){
    if(s.race&&now<s.race.rejoinAt)throw new Error('Peserta tidak boleh dibuang ketika perlumbaan.');
    const person=s.participants.find(x=>x.id===d.id);if(!person)throw new Error('Peserta tidak ditemui.');if(person.won)throw new Error('Pemenang kekal dalam sejarah sesi sehingga sesi ditamatkan.');
    s.participants=s.participants.filter(x=>x.id!==d.id);changed=true;
  }else throw new Error('Tindakan tidak dikenali.');
  if(p.op){s.processedOps=(s.processedOps||[]).concat(p.op).slice(-200);changed=true;}
  if(changed)save_(s);
  const result={state:WiraCore.publicState(s,Date.now())};if(participant)result.participant=participant;return result;
}
