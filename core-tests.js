/* Runs in tests.html and in an isolated JS sandbox. */
(function(root){
  function runCoreTests(){
    const C=root.WiraCore;let assertions=0;const results=[];
    const ok=(v,m)=>{assertions++;if(!v)throw Error(m);};
    const throws=(fn,m)=>{let did=false;try{fn();}catch(e){did=true;}ok(did,m);};
    function test(name,fn){fn();results.push(name);}
    test('Nama, sanitasi dan tetapan',()=>{ok(C.name('  Ali   Baba <x>\n')==='Ali Baba x','name cleaning');ok(C.name('a'.repeat(60)).length===32,'name length');throws(()=>C.validateSettings({theme:'evil'}),'invalid theme');throws(()=>C.validateSettings({duration:9}),'invalid duration');ok(C.validateSettings({duration:6}).duration===6,'valid duration');ok(Object.keys(C.THEMES).length===6,'six themes');ok(C.COLORS.length>=20,'many colours');});
    test('100 peserta, duplikasi dan kapasiti',()=>{const s=C.newState(1000);for(let i=0;i<100;i++)C.register(s,{name:'Peserta '+i,gender:i%2?'male':'female'},'p-'+i,1000+i,100);ok(s.participants.length===100,'100 participants');throws(()=>C.register(s,{name:'Orang tambahan',gender:'male'},'p-extra',2000,100),'capacity');const z=C.newState(1000);C.register(z,{name:'Ali Baba',gender:'male'},'a',1000,100);throws(()=>C.register(z,{name:' ALI  BABA ',gender:'female'},'b',1001,100),'duplicate names');throws(()=>C.register(z,{name:'A',gender:'male'},'c',1002,100),'short name');throws(()=>C.register(z,{name:'Bob',gender:'other'},'d',1003,100),'invalid gender');});
    test('Rejection sampling mengelakkan modulo bias',()=>{let called=0;const sequence=[4294967295,2];const id=C.chooseWinner(['a','b','c'],()=>sequence[called++]);ok(id==='c'&&called===2,'reject out of range');throws(()=>C.chooseWinner([],()=>0),'empty draw');for(let i=0;i<100;i++)ok(C.chooseWinner(Array.from({length:100},(_,j)=>'p'+j),()=>i)==='p'+i,'index '+i);});
    test('100 lap, tepat satu pemenang, tiada kemenangan berulang',()=>{
      const s=C.newState(10000),random=C.rng(951);for(let i=0;i<100;i++)C.register(s,{name:'Wira '+i,gender:i%2?'female':'male'},'id'+i,10000+i,100);
      const seen=new Set();let now=20000;
      for(let round=1;round<=100;round++){
        const ids=C.eligible(s).map(p=>p.id),winner=C.chooseWinner(ids,()=>Math.floor(random()*4294967296));C.start(s,now,winner,'race'+round,round);const r=s.race;
        ok(r.participantIds.length===101-round,'eligible roster');ok(!seen.has(winner),'winner repeat');seen.add(winner);ok(!s.registrationOpen,'registration closes');
        ok(C.progress(r,winner,r.finishAt)>=1,'winner at finish');ok(Math.abs(C.position(r,winner,r.finishAt)-(r.base+r.distance))<1e-8,'winner reaches exact finish');
        for(const id of ids){if(id!==winner)ok(C.progress(r,id,r.finishAt)<1,'nonwinner not first');ok(C.progress(r,id,r.finishAt+1200)>=1,'everyone finishes');}
        ok(!C.settle(s,r.finishAt-1),'no premature settle');ok(C.settle(s,r.finishAt),'settle winner');ok(!C.settle(s,r.finishAt+1),'settle idempotent');ok(s.winners.length===round,'one record');ok(C.eligible(s).length===100-round,'winner removed');
        const oldBase=r.base;now=r.rejoinAt+30000;if(round<100){const oldPositions=Object.fromEntries(C.eligible(s).map(p=>[p.id,C.position(r,p.id,now)]));const nextWinner=C.eligible(s)[0].id;const clone=JSON.parse(JSON.stringify(s));C.start(clone,now,nextWinner,'next',55);for(const p of C.eligible(s)){ok(Math.abs(C.position(clone.race,p.id,now)-oldPositions[p.id])<1e-8,'no jump between laps');ok(C.position(clone.race,p.id,clone.race.startAt)>=oldPositions[p.id],'countdown keeps moving forward');}}
      }
      ok(seen.size===100,'100 unique winners');throws(()=>C.start(s,now,'id0','extra',1),'no eligible participants');
    });
    test('Animasi maju, semua tema dan 6/7/8 saat',()=>{for(const theme of Object.keys(C.THEMES))for(const duration of [6,7,8]){const s=C.newState(1);s.theme=theme;s.duration=duration;for(let i=0;i<5;i++)C.register(s,{name:'Wira '+i,gender:'male'},'i'+i,1,100);C.start(s,1000,'i3','r',151);const r=s.race;for(const id of r.participantIds){let previous=-1;for(let ms=0;ms<=duration*1000+5000;ms+=25){const p=C.progress(r,id,r.startAt+ms);ok(p+1e-9>=previous,'monotonic '+theme+' '+id);previous=p;}}ok(r.finishAt-r.startAt===duration*1000,'duration');}});
    test('Public snapshot tidak mendedahkan medan pentadbiran',()=>{const s=C.newState(1);s.pin='secret';s.token='secret';const p=C.publicState(s,100);ok(!('pin' in p)&&!('token' in p),'private fields omitted');ok(p.serverNow===100,'server clock');});
    return {passed:true,suites:results,assertions};
  }
  root.runCoreTests=runCoreTests;
})(typeof globalThis!=='undefined'?globalThis:this);
