export class Sound {
  constructor(){this.enabled=false;this.ctx=null;this.lastBeat=0;this.step=0;}
  async toggle(){this.enabled=!this.enabled;if(this.enabled){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){this.enabled=false;return false;}this.ctx=this.ctx||new AC();await this.ctx.resume();}return this.enabled;}
  tone(freq,duration=.16,type='sine',volume=.06,delay=0){if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration+.03);}
  beep(n){this.tone(n?600:950,.16,'triangle',.11);}
  win(){[523.25,659.25,783.99,1046.5,1318.5].forEach((n,i)=>this.tone(n,.55,'triangle',.1,i*.12));}
  tick(now,racing){if(!this.enabled||now-this.lastBeat<300)return;this.lastBeat=now;const notes=[130.81,196,164.81,196,146.83,220,174.61,220];this.tone(notes[this.step%8],.14,'sine',racing?.045:.025);if(this.step%2===0)this.tone(notes[this.step%8]*4,.1,'triangle',.018);this.step++;}
}
export class Confetti {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.bits=[];this.last=0;}
  burst(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;this.bits=Array.from({length:150},()=>({x:w/2,y:h*.32,vx:(Math.random()-.5)*650,vy:-100-Math.random()*480,g:280+Math.random()*180,life:3+Math.random()*2,rot:Math.random()*6,color:['#bdf36b','#ffc56d','#a893ff','#ff8eac','#ffffff'][Math.floor(Math.random()*5)]}));}
  frame(now){const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}const dt=Math.min(.05,this.last?(now-this.last)/1000:1/60);this.last=now;const ctx=this.ctx;ctx.clearRect(0,0,w,h);this.bits=this.bits.filter(p=>p.life>0);for(const p of this.bits){p.life-=dt;p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.rot+=dt*4;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.min(1,p.life);ctx.fillStyle=p.color;ctx.fillRect(-4,-3,8,6);ctx.restore();}}
}
