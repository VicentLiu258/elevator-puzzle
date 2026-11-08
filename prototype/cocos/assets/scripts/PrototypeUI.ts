import { _decorator, Component, Node, UITransform, Graphics, Label, Color, Layers, input, Input, EventKeyboard, EventTouch, KeyCode, game, Game, view, Vec3, HorizontalTextAlignment, resources, Material } from 'cc';
import { createGame, dispatch, step, currentTrip, CONFIG, TRIPS, type GameState } from './core/game';
import {GameAudio} from './GameAudio';
import {InputAdapter} from './core/input';
import {readSettings,writeSettings,browserStorage} from './core/save';
import { Diorama } from './Diorama';
const { ccclass } = _decorator;
const C={ink:new Color(40,64,58),muted:new Color(112,126,113),paper:new Color(242,238,226),white:new Color(255,253,245),line:new Color(214,216,199),green:new Color(55,94,77),pale:new Color(225,232,214),orange:new Color(218,126,76),gold:new Color(238,186,105),red:new Color(174,79,55)};
type Card={node:Node;g:Graphics;label:Label;w:number;h:number};

@ccclass('PrototypeUI')
export class PrototypeUI extends Component {
  private state:GameState=createGame();
  private content!:Node;
  private world!:Diorama;
  private selected:{id:string;origin:'queue'|'cabin'}|null=null;
  private paused=false;
  private audio=new GameAudio();
  private inputs=new InputAdapter();
  private settings=readSettings(browserStorage());
  private storageWarning=false;
  private helpOpen=false;
  private helpWasPaused=false;
  private helpOverlay!:Node;
  private savedEnd=false;
  private closeAfterBoarding=false;
  private loadingAssets=false;
  private lastPhase=this.state.phase;
  private lastCall=false;
  private loadError='';

  private drag:{id:string;origin:'queue'|'cabin';touch:number;start:Vec3}|null=null;
  private labels:Record<string,Label>={};
  private cards:Record<string,Card>={};
  private queueCards:Card[]=[];
  private queueBars:Graphics[]=[];
  private slotNumbers:Label[]=[];
  private loadBar!:Graphics;
  private balanceBar!:Graphics;
  private modal!:Node;
  private refreshTime=0;
  

  start(){
    if(typeof document!=='undefined')document.title='电梯再等一个 · 玩偶公寓';
    this.content=new Node('DesignedUI');this.content.layer=Layers.Enum.UI_2D;this.content.parent=this.node;this.content.addComponent(UITransform).setContentSize(720,1280);
    this.buildUI();this.labels.notice.string='正在打开玩偶电梯…';
    this.audio.setMuted(this.settings.muted);this.loadAssets();
    input.on(Input.EventType.KEY_DOWN,this.keyDown,this);input.on(Input.EventType.KEY_UP,this.keyUp,this);
    game.on(Game.EVENT_HIDE,this.hide,this);this.refresh();
  }
  onDestroy(){input.off(Input.EventType.KEY_DOWN,this.keyDown,this);input.off(Input.EventType.KEY_UP,this.keyUp,this);game.off(Game.EVENT_HIDE,this.hide,this);this.world?.destroy();this.audio.destroy();}
  update(dt:number){
    const v=view.getVisibleSize(),s=Math.min(v.width/720,v.height/1280);this.content.setScale(s,s,1);
    if(!this.world)return;
    const freeze=this.paused||!this.state.started||!this.world.ready||!!this.loadError;
    if(!freeze&&this.closeAfterBoarding&&!this.world.boarding){this.closeAfterBoarding=false;this.state=dispatch(this.state,{type:'close'});}
    if(!freeze){if(this.state.phase==='unloading'&&this.world.disembarking)this.state.phaseTime=Math.max(this.state.phaseTime,CONFIG.maxFrame+CONFIG.fixedStep);const before=this.state.phase;this.state=step(this.state,dt,this.inputs.direction());if(before==='loading'&&this.state.phase==='closing'&&this.world.boarding){this.state.phase='loading';this.state.doorTime=0;this.closeAfterBoarding=true;this.state.message='等乘客站稳后关门，完成最后一趟。';}}
    this.audio.motorLevel(this.state.phase==='travel'&&!freeze ? .25+this.state.load/100:0);
    if(this.lastPhase!==this.state.phase){if(this.state.phase==='closing')this.audio.play('door');if(this.state.phase==='stopping')this.audio.play(this.state.emergencyReason?'emergency':'arrive');this.clearInput();this.selected=null;this.lastPhase=this.state.phase;}
    if(!this.lastCall&&this.state.lastCallOffered&&currentTrip(this.state).lastCall)this.audio.play('request');this.lastCall=this.state.lastCallOffered;
    if(this.state.phase==='ended'&&!this.savedEnd){this.savedEnd=true;this.settings.best=Math.max(this.settings.best,this.state.total);this.settings.bestTrips=Math.max(this.settings.bestTrips,this.state.records.length);this.storageWarning=!writeSettings(browserStorage(),this.settings);}
    this.world.setState(this.state);this.world.update(Math.min(dt,.1),this.paused);
    this.slotNumbers.forEach((n,i)=>{n.node.setPosition(this.world.slotScreen(i));n.node.active=this.world.ready&&(this.state.phase==='loading'||this.state.phase==='ready');});
    this.refreshTime-=dt;if(this.refreshTime<=0){this.refreshTime=.1;this.refresh();}
  }
  private loadAssets(){
    if(this.loadingAssets)return;this.loadingAssets=true;this.loadError='';this.labels.notice.string='正在打开玩偶电梯…';
    resources.load('materials/doll-standard',Material,(err)=>{
      if(!this.isValid)return;
      if(err){this.loadingAssets=false;this.loadError=err.message;this.refresh();return;}
      try{this.world?.destroy();this.world=new Diorama(this.node.scene);this.world.load().then(()=>{if(this.isValid){this.loadingAssets=false;this.refresh();}}).catch(e=>{this.loadingAssets=false;this.loadError=e.message;this.refresh();});}
      catch(e){this.loadingAssets=false;this.loadError=String(e);this.refresh();}
    });
  }
  private keyDown(e:EventKeyboard){if(!this.paused){this.audio.unlock();if(e.keyCode===KeyCode.KEY_A)this.inputs.key('A',true);if(e.keyCode===KeyCode.KEY_D)this.inputs.key('D',true);}}
  private keyUp(e:EventKeyboard){if(e.keyCode===KeyCode.KEY_A)this.inputs.key('A',false);if(e.keyCode===KeyCode.KEY_D)this.inputs.key('D',false);}
  private clearInput(){this.inputs.clear();this.drag=null;}
  private setPaused(v:boolean){this.paused=v;this.state=dispatch(this.state,{type:v?'pause':'resume'});this.clearInput();this.audio.setPaused(v);this.refresh();}
  private hide(){this.setPaused(true);}
  private restart(){this.closeAfterBoarding=false;this.state=createGame(this.state.seed);this.selected=null;this.savedEnd=false;this.lastCall=false;this.paused=false;this.helpOpen=false;this.helpOverlay.active=false;this.audio.setPaused(false);this.clearInput();this.refresh();}
  private action(a:Parameters<typeof dispatch>[1]){if(this.paused||!this.world?.ready||this.loadError)return;if(a.type==='close'&&this.world.boarding){this.closeAfterBoarding=true;this.state.message='等乘客走入并站稳后自动关门。';this.refresh();return;}this.audio.unlock();const n=this.state.aboard.length;this.state=dispatch(this.state,a);if(this.state.aboard.length>n)this.audio.play('board');this.refresh();}
  private canLoad(){return !this.paused&&this.world?.ready&&!this.loadError&&(this.state.phase==='loading'||this.state.phase==='ready');}
  private showHelp(){this.helpWasPaused=this.paused;this.helpOpen=true;this.setPaused(true);this.helpOverlay.active=true;this.labels.helpBody.string=`本趟：${currentTrip(this.state).goal}\n\n点乘客，再点圆形站位；也可拖动。\n双格货物只占同一行相邻两格。\n\n300kg 以上减速并增加负荷；超过450kg禁止发车。\n偏载看站位，A/D或左右扶手只能小幅补救。\n侧倾≥11°持续2.5秒，或负荷满，安全停靠。\n\n净收入＝送达票款＋奖励−维护费。\n平稳奖 ¥5；准时奖按本趟提示；准时外卖额外 ¥3。\n吃力运输维护费 ¥1—8。应急收半票、无奖励，\n维护费 ¥12，额外停靠4秒；所有乘客安全下车。\n\n整局270秒，最多十趟。每趟仅一个目的楼层。\n等人、行进、停靠和结算面板均计时；暂停不计时。\n结算6秒后自动下一趟。耗尽时间后完成当前运输。\n本地仅保存静音设置和最好成绩；没有账号或支付。`;}
  private makeNode(name:string,x:number,y:number,w:number,h:number,parent=this.content){const n=new Node(name);n.layer=Layers.Enum.UI_2D;n.parent=parent;n.setPosition(x,y);n.addComponent(UITransform).setContentSize(w,h);return n;}
  private text(name:string,x:number,y:number,w:number,h:number,str:string,size:number,color=C.ink,left=false,parent=this.content){
    const n=this.nodeAt(name,x,y,w,h,parent);const l=n.addComponent(Label);l.string=str;l.fontSize=size;l.lineHeight=size+8;l.color=color;l.overflow=Label.Overflow.SHRINK;l.horizontalAlign=left?HorizontalTextAlignment.LEFT:HorizontalTextAlignment.CENTER;this.labels[name]=l;return l;
  }
  private nodeAt(name:string,x:number,y:number,w:number,h:number,parent=this.content){return this.makeNode(name,x,y,w,h,parent);}
  private card(name:string,x:number,y:number,w:number,h:number,color:Color,str='',size=24,parent=this.content):Card{
    const n=this.makeNode(name,x,y,w,h,parent),g=n.addComponent(Graphics);const l=this.text(name+'Label',0,0,w-24,h-12,str,size,C.ink,false,n);const c={node:n,g,label:l,w,h};this.paint(c,color);this.cards[name]=c;return c;
  }
  private paint(c:Card,color:Color,border?:Color){c.g.clear();c.g.fillColor=color;c.g.roundRect(-c.w/2,-c.h/2,c.w,c.h,18);c.g.fill();if(border){c.g.strokeColor=border;c.g.lineWidth=2;c.g.stroke();}}
  private click(c:Card,fn:()=>void){c.node.on(Node.EventType.TOUCH_END,fn,this);}
  private line(name:string,x:number,y:number,w:number,color:Color){const n=this.makeNode(name,x,y,w,2);const g=n.addComponent(Graphics);g.strokeColor=color;g.lineWidth=1;g.moveTo(-w/2,0);g.lineTo(w/2,0);g.stroke();}
  private buildUI(){
    this.text('eyebrow',-118,599,420,28,'青禾公寓  /  一部老电梯的小生意',19,C.muted,true);
    this.text('title',-134,548,390,68,'电梯再等一个',43,C.ink,true);
    const p=this.card('pause',288,562,72,66,C.pale,'Ⅱ',25);this.click(p,()=>{this.audio.unlock();this.setPaused(!this.paused);});
    const reset=this.card('reset',210,562,62,66,C.paper,'↺',32);this.click(reset,()=>this.restart());
    const help=this.card('help',128,562,68,66,C.pale,'规则',20);this.click(help,()=>this.showHelp());
    const mute=this.card('mute',265,612,124,40,C.paper,'声音开',17);this.click(mute,()=>{this.audio.unlock();this.settings.muted=!this.settings.muted;this.audio.setMuted(this.settings.muted);this.storageWarning=!writeSettings(browserStorage(),this.settings);this.refresh();});
    const stats=[[-220,'营业倒计时','time'],[0,'累计净收入','fare'],[220,'今日运输','trip']] as const;
    stats.forEach(([x,title,key])=>{this.card(key+'Card',x,452,208,102,C.white);this.text(key+'Name',x,477,188,27,title,18,C.muted);this.text(key,x,436,188,48,'—',31);});
    this.text('sceneCaption',-175,374,300,35,'01  /  上客时间',21,C.green,true);
    this.text('destination',204,374,245,35,'目的地  ·  6 楼 ↑',20,C.muted);
    // Transparent interaction plane. Geometry is hit-tested in camera-projected coordinates.
    const hero=this.makeNode('SceneInteraction',0,65,700,604);
    hero.on(Node.EventType.TOUCH_START,this.heroStart,this);hero.on(Node.EventType.TOUCH_END,this.heroEnd,this);hero.on(Node.EventType.TOUCH_CANCEL,(e:EventTouch)=>{if(this.inputs.end(e.getID()))this.drag=null;},this);
    for(let i=0;i<6;i++){const l=this.text('slot'+i,0,0,34,30,String(i+1),17,C.green);this.slotNumbers.push(l);}
    this.card('loadPanel',0,-212,656,73,C.white);
    this.text('load',-208,-196,215,32,'0 / 300 kg',21,C.ink,true);
    this.text('balance',196,-196,228,32,'左右平衡',20,C.muted);
    this.loadBar=this.makeNode('LoadBar',-162,-231,280,8).addComponent(Graphics);
    this.balanceBar=this.makeNode('BalanceBar',178,-231,242,8).addComponent(Graphics);
    this.text('queueTitle',-212,-275,230,28,'候梯乘客 · 点选上客',18,C.muted,true);
    this.text('queueHint',222,-275,200,28,'站位可调整',18,C.muted);
    for(let i=0;i<5;i++){
      const c=this.card('q'+i,(i-2)*132,-330,122,74,C.white,'',20);this.queueCards.push(c);
      this.click(c,()=>{if(!this.canLoad())return;const d=this.drag;this.drag=null;if(d){this.inputs.end(d.touch);if(this.state.queue.some(p=>p.id===d.id))this.select(d.id,'queue');}});
      c.node.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{const p=this.state.queue[i];if(p&&this.canLoad()&&this.inputs.claim(e.getID()))this.drag={id:p.id,origin:'queue',touch:e.getID(),start:this.local(e)};});
      c.node.on(Node.EventType.TOUCH_CANCEL,this.cardDragEnd,this);
      const g=this.makeNode('Patience',0,-31,100,3,c.node).addComponent(Graphics);this.queueBars.push(g);
    }
    this.card('info',0,-420,656,76,C.pale);
    this.text('detail',-46,-420,530,58,'选一位乘客，再点轿厢内的圆形站位。',20,C.green,true);
    const remove=this.card('remove',266,-420,102,54,C.white,'下车',20);this.click(remove,()=>{if(this.selected?.origin==='cabin'){this.action({type:'remove',passengerId:this.selected.id});this.selected=null;this.refresh();}});
    const main=this.card('main',0,-512,656,82,C.green,'关门出发  →',27);main.label.color=C.white;
    this.click(main,()=>{if(this.loadError){this.loadAssets();return;}if(this.state.phase==='ready'){this.action({type:'begin'});return;}if(this.state.phase==='loading'){this.action({type:'close'});this.selected=null;}});
    this.card('closingCount',-168,-512,320,82,C.pale,'正在关门',25);
    const reopen=this.card('reopen',165,-512,326,82,C.orange,'再等一个 · 开门',25);reopen.label.color=C.white;this.click(reopen,()=>this.action({type:'reopen'}));
    for(let i=0;i<2;i++){
      const c=this.card(i?'right':'left',i?168:-168,-512,320,82,C.green,i?'向右扶稳  D  →':'←  A  向左扶稳',24);c.label.color=C.white;
      c.node.on(Node.EventType.TOUCH_START,(e:EventTouch)=>{if(!this.paused){this.audio.unlock();this.inputs.hold(i?1:-1,e.getID());}});
      const release=(e:EventTouch)=>this.inputs.release(e.getID());c.node.on(Node.EventType.TOUCH_END,release);c.node.on(Node.EventType.TOUCH_CANCEL,release);
    }
    this.text('notice',0,-578,660,38,'多一份票款，也多一点等待。',19,C.muted);
    this.text('disclaimer',0,-615,660,24,'虚构街机规则 · 300kg 以上吃力 · 450kg 为发车上限',14,C.muted);
    this.modal=this.makeNode('ResultOverlay',0,0,720,1280);const dim=this.card('dim',0,0,720,1280,new Color(25,44,36,155),'',1,this.modal);dim.node.on(Node.EventType.TOUCH_START,()=>{});
    this.card('result',0,20,620,700,C.white,'',24,this.modal);
    this.text('resultSmall',0,318,540,30,'本 趟 营 业 完 成',21,C.muted,false,this.modal);
    this.text('resultTitle',0,254,540,62,'安全到站',38,C.ink,false,this.modal);
    this.text('resultMoney',0,163,540,90,'¥ 0',64,C.green,false,this.modal);
    this.text('resultDetails',0,77,560,66,'',21,C.muted,false,this.modal);
    this.text('resultBreakdown',0,-48,560,165,'',21,C.muted,false,this.modal);
    const again=this.card('again',0,-206,500,70,C.green,'再开一趟  →',25,this.modal);again.label.color=C.white;this.click(again,()=>{if(this.state.phase==='ended')this.restart();else this.action({type:'next'});});
    const review=this.card('review',0,-289,500,54,C.pale,'暂停查看 / 继续计时',20,this.modal);this.click(review,()=>this.setPaused(!this.paused));
    this.modal.active=false;
    this.helpOverlay=this.makeNode('RulesOverlay',0,0,720,1280);const hd=this.card('helpDim',0,0,720,1280,new Color(25,44,36,165),'',1,this.helpOverlay);hd.node.on(Node.EventType.TOUCH_START,()=>{});
    this.card('helpPanel',0,0,660,1100,C.white,'',24,this.helpOverlay);
    this.text('helpTitle',0,464,590,60,'营业手册',35,C.ink,false,this.helpOverlay);
    this.text('helpBody',0,20,590,800,'',22,C.ink,true,this.helpOverlay);
    const hc=this.card('helpClose',0,-474,520,68,C.green,'知道了 · 返回营业',25,this.helpOverlay);hc.label.color=C.white;this.click(hc,()=>{this.helpOpen=false;this.helpOverlay.active=false;this.setPaused(this.helpWasPaused);});this.helpOverlay.active=false;
  }
  private local(e:EventTouch):Vec3 {const p=e.getUILocation();return this.content.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(p.x,p.y,0));}
  private findPassenger(p:Vec3){const list=[...this.state.aboard.map(a=>({id:a.passenger.id,origin:'cabin' as const})),...this.state.queue.map(a=>({id:a.id,origin:'queue' as const}))];return list.map(x=>({ ...x,pos:this.world.passengerScreen(x.id)})).filter(x=>x.pos&&Math.abs(x.pos.x-p.x)<43&&Math.abs(x.pos.y-p.y)<68).sort((a,b)=>Vec3.distance(a.pos!,p)-Vec3.distance(b.pos!,p))[0];}
  private findSlot(p:Vec3){let best=-1,distance=70;for(let i=0;i<6;i++){const q=this.world.slotScreen(i),d=Vec3.distance(q,p);if(d<distance){best=i;distance=d;}}return best;}
  private heroStart(e:EventTouch){if(!this.canLoad())return;const p=this.local(e),who=this.findPassenger(p);if(who&&this.inputs.claim(e.getID()))this.drag={id:who.id,origin:who.origin,touch:e.getID(),start:p};}
  private heroEnd(e:EventTouch){
    if(!this.canLoad())return;
    if(this.drag&&!this.inputs.owns(e.getID()))return;
    const p=this.local(e),d=this.drag;this.drag=null;this.inputs.end(e.getID());
    if(d&&d.touch===e.getID()&&Vec3.distance(d.start,p)>18){const slot=this.findSlot(p);if(slot>=0){this.selected={id:d.id,origin:d.origin};this.place(slot);}return;}
    const slot=this.findSlot(p);if(this.selected&&slot>=0){this.place(slot);return;}
    const who=this.findPassenger(p);if(who)this.select(who.id,who.origin);
    else if(slot>=0){const a=this.state.aboard.find(a=>slot>=a.slot&&slot<a.slot+a.passenger.size);if(a)this.select(a.passenger.id,'cabin');}
  }
  private cardDragEnd(e:EventTouch){if(!this.drag||this.drag.touch!==e.getID())return;const p=this.local(e),d=this.drag;this.drag=null;this.inputs.end(e.getID());const slot=this.findSlot(p);if(slot>=0&&!this.paused){this.selected={id:d.id,origin:d.origin};this.place(slot);}}
  private select(id:string,origin:'queue'|'cabin'){this.audio.unlock();this.selected={id,origin};this.refresh();}
  private place(slot:number){if(!this.selected)return;const s=this.selected;this.action({type:s.origin==='queue'?'board':'move',passengerId:s.id,slot});if(this.state.aboard.some(a=>a.passenger.id===s.id&&a.slot===slot))this.selected=null;this.refresh();}
  private bar(g:Graphics,ratio:number,width:number,color:Color){g.clear();g.fillColor=C.line;g.roundRect(-width/2,-3,width,6,3);g.fill();g.fillColor=color;g.roundRect(-width/2,-3,Math.max(6,Math.min(1,ratio)*width),6,3);g.fill();}
  private refresh(){
    if(!this.labels.time)return;
    const s=this.state,c=currentTrip(s),p=this.selected&&(s.queue.find(p=>p.id===this.selected!.id)||s.aboard.find(a=>a.passenger.id===this.selected!.id)?.passenger);
    if(!p)this.selected=null;this.world?.sync(s,this.selected?.id||null);
    this.labels.time.string=`${Math.ceil(s.timeLeft)} s`;this.labels.time.color=s.timeLeft<30?C.red:C.ink;this.labels.fare.string=`¥ ${s.total}`;this.labels.trip.string=`${(s.tripIndex<9?'0':'')+(s.tripIndex+1)} / 10`;
    this.cards.pause.label.string=this.paused?'▶':'Ⅱ';this.cards.mute.label.string=this.settings.muted?'声音关':'声音开';
    const phases:Record<string,string>={ready:c.title,loading:c.title,closing:'再等一个？',opening:s.doorPurpose==='arrival'?'到站开门':'门正在打开',travel:'行进中',stopping:s.emergencyReason?'安全停靠':'到站减速',unloading:'乘客下车',result:'本趟已结算',ended:'今日已打烊'};
    const from=s.tripIndex?TRIPS[s.tripIndex-1].floor:1,arrow=c.floor>=from?'↑':'↓';this.labels.sceneCaption.string=`${s.tripIndex+1} / ${phases[s.phase]}`;this.labels.destination.string=s.phase==='travel'?`${arrow} ${from} → ${c.floor} 楼 · ${Math.round(s.progress*100)}%`:`目的地 · ${c.floor} 楼 ${arrow}`;
    this.labels.load.string=`${s.mass} / 300 kg${s.mass>450?' 禁发':s.mass>300?' 吃力':''}`;this.labels.load.color=s.mass>300?C.red:C.ink;
    this.bar(this.loadBar,s.mass/450,280,s.mass>300?C.orange:C.green);
    this.balanceBar.clear();this.balanceBar.fillColor=C.line;this.balanceBar.roundRect(-121,-3,242,6,3);this.balanceBar.fill();this.balanceBar.fillColor=C.green;this.balanceBar.circle(s.balance*105,0,7);this.balanceBar.fill();
    this.labels.balance.color=s.dangerTime>0||s.load>75?C.red:C.muted;
    this.labels.balance.string=s.phase==='travel'?`${Math.abs(s.tilt)>=CONFIG.tiltDanger?'危险':Math.abs(s.tilt)>=CONFIG.tiltWarning?'警戒':'平稳'} ${s.tilt.toFixed(1)}° · 负荷${Math.round(s.load)}%`:Math.abs(s.balance)<.15?'左右平衡':s.balance<0?'← 重心偏左':'重心偏右 →';
    this.queueCards.forEach((card,i)=>{const q=s.queue[i];card.node.active=!!q;if(q){card.label.string=`${q.name}\n${q.mass}kg · ¥${q.fare}`;this.paint(card,this.selected?.id===q.id?C.gold:C.white);this.bar(this.queueBars[i],q.patience/q.maxPatience,96,q.patience<10?C.orange:C.green);}});
    this.labels.queueTitle.string=`候梯 · 本趟票款 ¥${s.aboard.reduce((v,a)=>v+a.passenger.fare,0)}`;
    this.labels.queueHint.string=`${s.queue.length} 人等待 · ${s.aboard.reduce((v,a)=>v+a.passenger.size,0)}/6 格`;
    this.labels.detail.string=p?`${p.name} · ${p.mass}kg · ${p.size}格 · ¥${p.fare}\n${p.trait}${this.selected?.origin==='cabin'?' · 点空位换位':''}`:s.phase==='travel'?(s.eventText||`左右扶手微调重心 · 准时奖剩余 ${Math.max(0,Math.ceil(c.deadline-s.tripElapsed))}秒`):`${c.goal}\n本趟 ${c.deadline}秒内送达奖 ¥${c.punctualBonus}，平稳奖 ¥5`;
    this.cards.remove.node.active=this.selected?.origin==='cabin'&&this.canLoad();
    this.cards.main.node.active=!!this.loadError||s.phase==='ready'||s.phase==='loading'||s.phase==='opening';
    this.cards.main.label.string=this.loadError?'资源加载失败 · 点此重试':s.phase==='ready'?'开始营业 · 十趟挑战 →':s.phase==='opening'?'开门中…':this.closeAfterBoarding?'乘客站稳后自动关门…':'关门出发 →';
    this.cards.closingCount.node.active=s.phase==='closing';this.cards.closingCount.label.string=`关门中 ${s.doorTime.toFixed(1)}s`;
    this.cards.reopen.node.active=s.phase==='closing'&&s.timeLeft>0;this.cards.left.node.active=this.cards.right.node.active=s.phase==='travel';
    this.labels.notice.string=this.loadError?'网络或模型加载异常，未开始计时。':!this.world?.ready?'正在打开玩偶电梯…':this.paused?'已暂停 · 点右上角 ▶ 继续':s.phase==='ready'?`最好净收入 ¥${this.settings.best} · 种子 ${s.seed}`:this.storageWarning?'本机无法保存设置，仍可正常游戏。':s.eventText||s.message;
    this.modal.active=(s.phase==='result'||s.phase==='ended')&&!this.world?.disembarking;
    if(s.result){const end=s.phase==='ended';this.labels.resultSmall.string=end?'今 日 营 业 结 束':`第 ${s.tripIndex+1} 趟 · ${c.title}`;
      this.labels.resultTitle.string=end?(s.records.length===10?'十趟完成，收工！':'营业时间到'):s.result.emergency?'所有乘客安全下车':'乘客已安全到站';
      this.labels.resultMoney.string=`¥ ${end?s.total:s.result.net}`;
      this.labels.resultDetails.string=end?`累计净收入 · 完成 ${s.records.length}/10 趟\n最好成绩 ¥${this.settings.best}`:`票款 ${s.result.fares} ＋ 奖励 ${s.result.bonus} − 维护 ${s.result.maintenance}\n营业累计 ¥${s.total} · 剩余 ${Math.ceil(s.timeLeft)}秒`;
      this.labels.resultBreakdown.string=end?s.records.map(r=>`${r.trip<10?'0':''}${r.trip}  ¥${r.net}${r.emergency?'（安全停靠）':''}`).reduce((lines,v,i)=>lines+(i%2?'     '+v+'\n':v),''):`平稳奖 ¥${s.result.smoothBonus} / 准时奖 ¥${s.result.punctualBonus} / 外卖奖 ¥${s.result.courierBonus}\n${s.result.emergency?s.result.reason+'：半票、维护 ¥12、额外4秒':'吃力维护费 ¥'+s.result.maintenance+' · 空载无奖励'}\n下一趟：${TRIPS[Math.min(s.tripIndex+1,9)].title}`;
      this.cards.again.label.string=end?'再营业一局 →':`下一趟 → ${this.paused?'已暂停':Math.ceil(s.phaseTime)+'秒后自动继续'}`;this.cards.review.node.active=!end;this.cards.review.label.string=this.paused?'继续营业计时':'暂停查看结算';
    }
    this.helpOverlay.active=this.helpOpen;
  }
}
