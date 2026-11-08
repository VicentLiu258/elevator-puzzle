/** Original synthesized sounds, no external recordings. Audio starts only in a user gesture. */
export class GameAudio {
 private ctx:AudioContext|null=null;private master:GainNode|null=null;
 private motor:OscillatorNode|null=null;private motorGain:GainNode|null=null;
 private voices=new Set<OscillatorNode>();private unavailable=false;
 muted=false;paused=false;
 unlock(){
  if(this.unavailable)return;
  try{if(!this.ctx){const Ctor=typeof window!=='undefined'&&(window.AudioContext||(window as any).webkitAudioContext);if(!Ctor){this.unavailable=true;return;}this.ctx=new Ctor();this.master=this.ctx!.createGain();this.master.gain.value=this.muted?0:.35;this.master.connect(this.ctx!.destination);}
   if(this.ctx!.state==='suspended')this.ctx!.resume().catch(()=>{});
  }catch{this.unavailable=true;}
 }
 setMuted(v:boolean){this.muted=v;if(this.ctx&&this.master)this.master.gain.setTargetAtTime(v?0:.35,this.ctx.currentTime,.025);}
 setPaused(v:boolean){this.paused=v;if(v){this.voices.forEach(o=>{try{o.stop();}catch{}});this.voices.clear();}this.motorLevel(0);}
 private tone(frequency:number,duration:number,delay=0,type:OscillatorType='sine',endFrequency=frequency){
  const c=this.ctx;if(!c||c.state!=='running'||this.muted||this.paused)return;
  const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(endFrequency,t+duration);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master!);o.start(t);o.stop(t+duration+.02);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};
 }
 play(kind:'board'|'door'|'request'|'arrive'|'emergency'){
  if(kind==='board')this.tone(540,.10,0,'sine',720);
  if(kind==='door'){this.tone(660,.16);this.tone(660,.16,.22);}
  if(kind==='request'){this.tone(380,.18,0,'triangle',700);this.tone(600,.22,.13,'sine',420);}
  if(kind==='arrive'){this.tone(880,.65);this.tone(1320,.5,.1);}
  if(kind==='emergency'){this.tone(440,.25);this.tone(330,.3,.3);}
 }
 motorLevel(level:number){
  const c=this.ctx;if(!c||c.state!=='running')return;
  if(!this.motor){this.motor=c.createOscillator();this.motorGain=c.createGain();this.motor.type='sine';this.motor.frequency.value=65;this.motorGain.gain.value=0;this.motor.connect(this.motorGain);this.motorGain.connect(this.master!);this.motor.start();}
  this.motor.frequency.setTargetAtTime(65+25*level,c.currentTime,.15);this.motorGain!.gain.setTargetAtTime(this.paused?0:Math.max(0,level)*.055,c.currentTime,.15);
 }
 destroy(){this.voices.forEach(o=>{try{o.stop();}catch{}});this.motor?.stop();this.ctx?.close().catch(()=>{});}
}
