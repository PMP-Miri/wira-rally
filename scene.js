import * as THREE from 'three';
const C = globalThis.WiraCore;
const UP = new THREE.Vector3(0,1,0);
const dummy = new THREE.Object3D();
const temp = new THREE.Vector3();
const THEMES=C.THEMES;
const palette={skin:['#f4bd92','#d99566','#b97850','#875033','#f7d2ae'],hair:['#24223a','#3d2630','#56362a','#242932','#764c32']};
function hex(s){return new THREE.Color(s);}
function capsule(){return new THREE.CapsuleGeometry(.5,1,4,8);}

class Batch {
  constructor(scene,capacity=7000){
    this.scene=scene;this.items={};this.color=new THREE.Color();
    const geometries={sphere:new THREE.SphereGeometry(1,12,8),capsule:capsule(),cylinder:new THREE.CylinderGeometry(1,1,1,10),cone:new THREE.ConeGeometry(1,1,10),ring:new THREE.TorusGeometry(1,.22,6,16),box:new THREE.BoxGeometry(1,1,1),plane:new THREE.PlaneGeometry(1,1)};
    const material=new THREE.MeshStandardMaterial({roughness:.72,metalness:.03});
    Object.entries(geometries).forEach(([key,g])=>{const mesh=new THREE.InstancedMesh(g,material,capacity);mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);this.items[key]={mesh,n:0};});
    this.material=material;
  }
  begin(){for(const x of Object.values(this.items))x.n=0;}
  add(kind,matrix,color){const b=this.items[kind];if(b.n>=b.mesh.instanceMatrix.count)return;const i=b.n++;b.mesh.setMatrixAt(i,matrix);b.mesh.setColorAt(i,this.color.set(color));}
  shape(kind,pos,scale,color,rot=[0,0,0]){dummy.position.set(...pos);dummy.scale.set(...scale);dummy.rotation.set(...rot);dummy.updateMatrix();this.add(kind,dummy.matrix,color);}
  end(){for(const b of Object.values(this.items)){b.mesh.count=b.n;b.mesh.instanceMatrix.needsUpdate=true;if(b.mesh.instanceColor)b.mesh.instanceColor.needsUpdate=true;}}
  dispose(){Object.values(this.items).forEach(b=>{this.scene.remove(b.mesh);b.mesh.geometry.dispose();b.mesh.dispose();});this.material.dispose();}
}
function node(parent,pos=[0,0,0],rot=[0,0,0]){const n=new THREE.Object3D();n.position.set(...pos);n.rotation.set(...rot);parent.add(n);return n;}
function part(parent,kind,pos,scale,color,rot=[0,0,0]){const n=node(parent,pos,rot);n.scale.set(...scale);n.userData.part={kind,color};return n;}
function limb(parent,pos,color,skin){const pivot=node(parent,pos);part(pivot,'capsule',[0,-.24,0],[.13,.27,.13],color);part(pivot,'sphere',[0,-.55,0],[.13,.16,.13],skin);return pivot;}
function makeHuman(p){
  const root=node(new THREE.Object3D());const body=node(root,[0,.97,0]);const skin=palette.skin[p.seed%palette.skin.length],hair=palette.hair[(p.seed>>>4)%palette.hair.length];
  part(body,'capsule',[0,0,0],[.43,.38,.32],p.color);
  part(body,'sphere',[.08,.14,.29],[.21,.1,.035],'#ffffff');
  part(body,'capsule',[0,-.46,0],[.33,.17,.3],'#263458');
  const head=node(body,[0,.7,0]);part(head,'sphere',[0,0,0],[.45,.47,.41],skin);
  part(head,'sphere',[0,.23,-.025],[.46,.3,.42],hair);
  part(head,'sphere',[-.19,.28,.3],[.25,.12,.12],hair,[0,0,.4]);
  [-1,1].forEach(side=>{part(head,'sphere',[side*.17,.015,.37],[.11,.13,.055],'#ffffff');part(head,'sphere',[side*.17,.005,.415],[.055,.075,.027],'#24243a');part(head,'sphere',[side*.18,.03,.437],[.017,.022,.009],'#ffffff');part(head,'sphere',[side*.39,-.09,0],[.12,.14,.11],skin);part(head,'sphere',[side*.28,-.14,.345],[.08,.04,.025],'#e79483');});
  part(head,'sphere',[0,-.115,.4],[.065,.065,.06],skin);
  part(head,'sphere',[0,-.25,.351],[.115,.035,.025],'#743b42');
  if(p.gender==='female'){part(head,'sphere',[0,.12,-.42],[.3,.34,.31],hair);part(head,'capsule',[0,-.17,-.49],[.18,.32,.18],hair,[.45,0,0]);part(head,'sphere',[.34,.29,.16],[.14,.1,.1],p.color);}
  const leftArm=limb(body,[-.44,.19,0],p.color,skin),rightArm=limb(body,[.44,.19,0],p.color,skin);
  const legs=[];[-1,1].forEach(side=>{const leg=node(body,[side*.2,-.52,0]);part(leg,'capsule',[0,-.27,0],[.15,.27,.15],skin);part(leg,'sphere',[0,-.58,.1],[.19,.13,.28],'#f7f8ff');part(leg,'sphere',[0,-.62,.16],[.19,.055,.27],p.color);legs.push(leg);});
  root.rotation.y=1.08;
  return {root,body,head,leftArm,rightArm,legs};
}
function addMount(actor,theme,p){
  const root=actor.root;const mount=node(root);actor.mount=mount;const c=p.color;
  if(theme==='run'){actor.body.position.y=1.05;return;}
  actor.body.position.y=theme==='horse'?2.05:theme==='duck'?1.67:theme==='space'?1.32:1.15;
  actor.legs.forEach((leg,i)=>{leg.rotation.x=-1.2;leg.rotation.z=i?-.2:.2;});
  if(theme==='horse'){
    const coat=['#b77345','#e7d1b6','#6f493b','#d4a16d','#8c8991'][p.seed%5];
    part(mount,'capsule',[0,1.04,0],[.48,.68,.42],coat,[Math.PI/2,0,0]);part(mount,'capsule',[0,1.49,.47],[.24,.42,.23],coat,[-.5,0,0]);part(mount,'capsule',[0,1.86,.75],[.23,.32,.23],coat,[Math.PI/2,0,0]);
    part(mount,'sphere',[0,1.75,1.02],[.23,.2,.25],'#f1d7b5');
    [-1,1].forEach(s=>{part(mount,'cone',[s*.15,2.17,.62],[.12,.3,.1],coat);part(mount,'sphere',[s*.22,1.95,.85],[.045,.055,.04],'#1f2638');});
    part(mount,'capsule',[0,1.5,-.43],[.12,.45,.13],'#342636',[.7,0,0]);part(mount,'sphere',[0,1.45,-.05],[.51,.12,.5],c);
    actor.mountLegs=[];for(let i=0;i<4;i++){const l=node(mount,[(i%2?1:-1)*.29,.9,i<2?.38:-.38]);part(l,'capsule',[0,-.36,0],[.1,.36,.1],coat);part(l,'sphere',[0,-.73,.05],[.13,.13,.18],'#352c39');actor.mountLegs.push(l);}
  }else if(theme==='boat'){
    part(mount,'sphere',[0,.29,0],[.79,.25,1.32],c);part(mount,'sphere',[0,.46,.12],[.57,.13,.83],'#fff3d9');part(mount,'sphere',[0,.5,.9],[.65,.2,.45],c);part(mount,'sphere',[0,.62,.39],[.53,.24,.07],'#8de2ed');
    const paddle=node(mount,[.8,.8,.1],[0,0,-.6]);part(paddle,'capsule',[0,0,0],[.035,.7,.035],'#72503c');part(paddle,'sphere',[0,-.72,0],[.19,.3,.06],'#ffc956');actor.paddle=paddle;
  }else if(theme==='duck'){
    const white=p.seed%3===0;part(mount,'sphere',[0,.63,0],[.7,.52,.93],white?'#f7f4e5':'#ffda56');part(mount,'capsule',[0,1.01,.69],[.24,.35,.24],white?'#fff9ef':'#ffe66b',[-.2,0,0]);part(mount,'sphere',[0,1.42,.8],[.37,.35,.37],white?'#fff9ef':'#ffe66b');part(mount,'sphere',[0,1.34,1.15],[.28,.1,.26],'#ff9857');[-1,1].forEach(s=>{part(mount,'sphere',[s*.26,1.48,1.02],[.055,.07,.04],'#292841');part(mount,'sphere',[s*.62,.75,-.03],[.12,.26,.52],white?'#e4e5f0':'#f8bd3d',[0,0,s*.2]);});
  }else if(theme==='kart'){
    part(mount,'sphere',[0,.44,0],[.87,.28,1.13],c);part(mount,'sphere',[0,.61,.75],[.8,.18,.45],c);part(mount,'capsule',[0,.65,-.65],[.67,.17,.14],'#202944',[0,0,Math.PI/2]);actor.wheels=[];
    for(let i=0;i<4;i++){const w=node(mount,[(i%2?1:-1)*.82,.33,i<2?.65:-.6],[0,0,Math.PI/2]);part(w,'cylinder',[0,0,0],[.32,.28,.32],'#283044');part(w,'cylinder',[0,.15,0],[.16,.025,.16],'#eaf3fa');actor.wheels.push(w);}
  }else if(theme==='space'){
    part(mount,'capsule',[0,.7,0],[.47,.87,.47],'#ecf1ff',[Math.PI/2,0,0]);part(mount,'cone',[0,.7,1.08],[.47,.7,.47],c,[Math.PI/2,0,0]);[-1,1].forEach(s=>part(mount,'sphere',[s*.49,.55,-.42],[.44,.09,.49],c));part(mount,'sphere',[0,.7,-1.02],[.27,.27,.43],'#ffad4f');part(mount,'sphere',[0,.7,-1.32],[.15,.16,.4],'#ffe38a');
  }
}
function makeActor(p,theme){const a=makeHuman(p);a.p=p;a.x=null;a.z=0;a.theme=theme;addMount(a,theme,p);return a;}

export class RaceScene {
  constructor(canvas,labelCanvas,{quality='auto',preserveDrawingBuffer=false,onError=()=>{}}={}){
    this.canvas=canvas;this.labels=labelCanvas;this.ctx=labelCanvas.getContext('2d');this.quality=quality;this.onError=onError;this.actors=new Map();this.state=null;this.theme='run';this.last=0;this.cameraX=null;this.disposed=false;this.motion=1;
    try{this.renderer=new THREE.WebGLRenderer({canvas,antialias:quality==='high',alpha:false,preserveDrawingBuffer,powerPreference:'high-performance'});}catch(e){onError(e);throw e;}
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(THEMES.run.sky);this.scene.fog=new THREE.Fog(THEMES.run.sky,65,165);
    this.camera=new THREE.PerspectiveCamera(36,1,.1,260);
    this.scene.add(new THREE.HemisphereLight('#e5f7ff','#536675',2.25));const sun=new THREE.DirectionalLight('#fff2d3',3.2);sun.position.set(-20,45,30);this.scene.add(sun);
    this.dynamic=new Batch(this.scene,9000);this.scenery=new Batch(this.scene,1800);
    this.ro=new ResizeObserver(()=>this.resize());this.ro.observe(canvas.parentElement);this.resize();
    this.contextLost=e=>{e.preventDefault();this.onError(new Error('WebGL terhenti. Muat semula atau pilih kualiti Rendah.'));};canvas.addEventListener('webglcontextlost',this.contextLost);
  }
  setQuality(q){this.quality=q;this.resize();}
  resize(){const rect=this.canvas.parentElement.getBoundingClientRect();const w=Math.max(1,rect.width),h=Math.max(1,rect.height);this.w=w;this.h=h;this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.quality==='high'?1.7:this.quality==='low'?1:1.3));this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.labels.width=Math.round(w*(devicePixelRatio||1));this.labels.height=Math.round(h*(devicePixelRatio||1));this.labels.style.width=w+'px';this.labels.style.height=h+'px';this.ctx.setTransform(devicePixelRatio||1,0,0,devicePixelRatio||1,0,0);}
  setState(state){
    if(this.state&&this.state.eventId!==state.eventId){this.actors.clear();this.cameraX=null;this.last=0;}
    this.state=state;const theme=state.race?state.race.theme:state.theme;
    const raceEntries=state.race?C.raceRoster(state):[];
    const inRace=new Set(raceEntries.map(p=>p.id));
    const selected=raceEntries.concat(C.eligible(state).filter(p=>!inRace.has(p.id)));
    const visible=selected.filter(p=>!p.won||(state.race&&p.id===state.race.winnerId));
    const ids=new Set(visible.map(p=>p.id));for(const id of this.actors.keys())if(!ids.has(id))this.actors.delete(id);
    for(const p of visible){const old=this.actors.get(p.id);if(!old||old.theme!==theme){const a=makeActor(p,theme);if(old){a.x=old.x;a.z=old.z;}this.actors.set(p.id,a);}else old.p=p;}
    this.theme=theme;this.scene.background.set(THEMES[theme].sky);this.scene.fog.color.set(THEMES[theme].sky);
  }
  drawScenery(center,width,depth,now){
    const b=this.scenery,t=THEMES[this.theme],water=['boat','duck'].includes(this.theme),space=this.theme==='space';b.begin();
    b.shape('box',[center,-.31,0],[320,.45,Math.max(36,depth+15)],t.ground);
    b.shape('box',[center,-.045,0],[320,.12,depth+6],t.track);
    const laneCount=Math.max(3,Math.ceil(this.actors.size/12));for(let i=0;i<=laneCount;i++)b.shape('box',[center,.025,-depth/2-1+i*(depth+2)/laneCount],[310,.018,.055],water?'#a2edf0':space?'#6f659d':'#f3d4ad');
    const cell=Math.floor(center/18);
    for(let i=cell-6;i<=cell+7;i++){
      const x=i*18,rand=C.rng(C.hash('tree'+i));
      for(const side of [-1,1]){const z=side*(depth/2+8+rand()*8);
        if(space){b.shape('sphere',[x,4+rand()*5,z],[.13,.13,.13],'#ffe8a9');b.shape('sphere',[x+5,7,z+3],[.2,.2,.2],'#a2dfff');}
        else{b.shape('cylinder',[x,1.2,z],[.3,2.5,.3],'#b87c57');b.shape('sphere',[x,3.1,z],[1.8,1.9,1.6],i%2?'#47a37d':'#70c78b');b.shape('sphere',[x+1.1,3.2,z],[1.2,1.5,1.3],'#8ccf7e');if(i%2===0){b.shape('cone',[x+6,2,z-2],[2.7,4,2.7],['#ffa384','#a698e9','#ffd978'][Math.abs(i)%3]);b.shape('cylinder',[x+6,.7,z-2],[.13,1.4,.13],'#ffffff');}}
      }
      if(water){for(let k=0;k<4;k++){const z=(k-1.5)*(depth/4);b.shape('sphere',[x+k*2,.035+Math.sin(now*.001+i)*.015,z],[1.2,.018,.05],'#a0ede7');}}
      if(!space){b.shape('sphere',[x+8,15,-depth-24],[4,1,1.6],'#f8fcff');b.shape('sphere',[x+10,15.7,-depth-24],[2.3,1.3,1.4],'#ffffff');}
    }
    // Continuing chevrons and distance markers, not a resetting start line.
    for(let i=cell-5;i<cell+8;i++){const x=i*18;for(const side of [-1,1]){b.shape('cylinder',[x,1.1,side*(depth/2+3.7)],[.065,2.2,.065],'#f7f4dd');b.shape('box',[x+.55,1.9,side*(depth/2+3.7)],[1.1,.6,.055],i%2?'#ffbd5a':'#aa8af8');}}
    const r=this.state&&this.state.race;
    if(r){const fx=r.base+r.distance;
      // Checkpoint spans the full field, with a single exact x-coordinate.
      for(let k=0;k<Math.ceil(depth+6);k++)for(let j=0;j<2;j++)b.shape('box',[fx+(j-.5)*.55,.046,k-depth/2-2.5],[.55,.025,1],(j+k)%2?'#ffffff':'#293449');
      for(const side of [-1,1]){const z=side*(depth/2+4);b.shape('cylinder',[fx,4,z],[.23,8,.23],'#f4f7ff');b.shape('sphere',[fx,8,z],[.55,.55,.55],'#ffcc66');}
      b.shape('box',[fx,7.5,0],[.6,.8,depth+8],'#6656c9');
    }
    b.end();
  }
  frame(now,forcedDt){
    if(this.disposed||!this.state)return;if(this.w<2||this.h<2)this.resize();const dt=forcedDt??Math.min(.05,this.last?(now-this.last)/1000:1/60);this.last=now;
    const state=this.state,r=state.race;const roster=[...this.actors.values()];const n=roster.length;const cols=n>64?12:n>24?10:n>8?8:Math.max(1,n);const rows=Math.max(1,Math.ceil(n/cols));const spacing=this.theme==='run'?2.1:2.7;const depth=Math.max(7,(rows-1)*spacing+5);
    const racing=r&&now>=r.startAt&&now<=r.rejoinAt;const idleTime=now*.001;
    let sum=0;const moving=[];
    for(let i=0;i<n;i++){
      const a=roster[i],p=a.p;const rank=i%cols,row=Math.floor(i/cols);const target=r?C.position(r,p.id,now):C.gridOffset(i,n,this.theme);
      const removed=r&&p.id===r.winnerId&&now>r.rejoinAt;
      // Keep the winner for celebration, then let them exit upwards. The next
      // roster removes this actor without moving everyone back to x = 0.
      if(a.x===null||r)a.x=target;else a.x+=(target-a.x)*(1-Math.exp(-dt*5));
      const targetZ=(row-(rows-1)/2)*spacing+(rank%2?.28:-.28);
      a.z+=(targetZ-a.z)*(1-Math.exp(-dt*5));a.hidden=!!removed;
      const speed=racing?1:.27;const cycle=idleTime*(this.theme==='run'?13:10)*speed+p.seed%10;
      const bodyBob=Math.abs(Math.sin(cycle))*(racing?.115:.035);
      a.root.position.set(a.x,removed?Math.min(8,(now-r.rejoinAt)*.003):0,a.z);a.root.scale.setScalar(removed?Math.max(0,1-(now-r.rejoinAt)/2500):1);
      if(this.theme==='run'){
        a.body.position.y=1.05+bodyBob;a.body.rotation.x=racing?.13:0;
        a.leftArm.rotation.x=Math.sin(cycle)*.8;a.rightArm.rotation.x=-Math.sin(cycle)*.8;
        a.legs[0].rotation.x=-Math.sin(cycle)*.85;a.legs[1].rotation.x=Math.sin(cycle)*.85;
      }else{
        a.body.position.y=(this.theme==='horse'?2.05:this.theme==='duck'?1.67:this.theme==='space'?1.32:1.15)+bodyBob*.6;
        a.leftArm.rotation.x=-.8+Math.sin(cycle)*.13;a.rightArm.rotation.x=-.8-Math.sin(cycle)*.13;
        if(a.mountLegs)a.mountLegs.forEach((l,j)=>l.rotation.x=Math.sin(cycle+j*2)*.7);
        if(a.paddle)a.paddle.rotation.x=Math.sin(cycle)*.8;
        if(a.wheels)a.wheels.forEach(w=>w.rotation.x=idleTime*speed*8);
        if(['duck','boat','space'].includes(this.theme))a.mount.position.y=Math.sin(cycle*.4)*.06;
      }
      a.head.rotation.y=Math.sin(idleTime+p.seed)*.05;a.root.updateMatrixWorld(true);if(!removed){sum+=a.x;moving.push(a);}
    }
    const targetCam=moving.length?sum/moving.length:(r?r.base+r.distance:0);if(this.cameraX===null)this.cameraX=targetCam;this.cameraX+=(targetCam-this.cameraX)*(1-Math.exp(-dt*4));
    const wide=Math.max(24,cols*2.7+8);const dist=Math.max(29,wide/(this.camera.aspect*.6),depth*1.5);
    this.camera.position.set(this.cameraX+4,dist*.49+depth*.36,dist);this.camera.lookAt(this.cameraX+1,1,0);this.camera.updateMatrixWorld();
    this.drawScenery(this.cameraX,wide,depth,now);this.dynamic.begin();
    for(const a of roster){if(a.hidden&&now>r.rejoinAt+2600)continue;a.root.traverse(o=>{const p=o.userData.part;if(p)this.dynamic.add(p.kind,o.matrixWorld,p.color);});
      this.dynamic.shape('sphere',[a.x,.03,a.z],[this.theme==='run'?.65:.95,.018,this.theme==='run'?.5:1.2],['boat','duck'].includes(this.theme)?'#9aeee0':'#588774');
      if(racing&&['boat','duck'].includes(this.theme)){for(let k=0;k<2;k++)this.dynamic.shape('sphere',[a.x-.9-k*.5,.09,a.z+(k?-.45:.45)],[.45,.05,.14],'#d9ffef');}
    }
    this.dynamic.end();this.renderer.render(this.scene,this.camera);this.drawLabels(roster,now);
  }
  drawLabels(roster,now){
    const ctx=this.ctx;ctx.clearRect(0,0,this.w,this.h);const r=this.state.race;const count=roster.length;
    const candidates=roster.filter(a=>!a.hidden).map(a=>{temp.set(a.x,3.5+(a.theme==='horse'?.7:0),a.z).project(this.camera);return {a,x:(temp.x*.5+.5)*this.w,y:(-.5*temp.y+.5)*this.h,z:temp.z};}).filter(o=>o.z<1&&o.x>0&&o.x<this.w&&o.y>0&&o.y<this.h);
    candidates.sort((a,b)=>{const aw=r&&a.a.p.id===r.winnerId&&now>=r.finishAt?1:0,bw=r&&b.a.p.id===r.winnerId&&now>=r.finishAt?1:0;return bw-aw||b.y-a.y;});
    const rects=[];const max=this.w<650?14:count>55?32:45;let drawn=0;
    for(const o of candidates){if(drawn>=max)break;const p=o.a.p;const winner=r&&p.id===r.winnerId&&now>=r.finishAt;ctx.font=(winner?'700 13px':'600 11px')+' system-ui, sans-serif';const text=(winner?'★ ':'')+p.name;const w=Math.min(148,ctx.measureText(text).width+18),h=24,x=o.x-w/2,y=o.y-16;
      if(!winner&&rects.some(z=>x<z.x+z.w+4&&x+w>z.x-4&&y<z.y+z.h+3&&y+h>z.y-3))continue;
      ctx.fillStyle=winner?'#ffe095':'rgba(23,31,53,.86)';ctx.beginPath();ctx.roundRect(x,y,w,h,8);ctx.fill();ctx.fillStyle=winner?'#382641':'#ffffff';ctx.save();ctx.beginPath();ctx.rect(x+6,y,w-12,h);ctx.clip();ctx.fillText(text,x+9,y+16);ctx.restore();ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(o.x,y+h+4,2.7,0,Math.PI*2);ctx.fill();rects.push({x,y,w,h});drawn++;
    }
  }
  dispose(){this.disposed=true;this.ro.disconnect();this.canvas.removeEventListener('webglcontextlost',this.contextLost);this.dynamic.dispose();this.scenery.dispose();this.renderer.dispose();}
}
