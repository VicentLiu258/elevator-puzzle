import { Node, Camera, Color, Vec3, Rect, Prefab, resources, instantiate, DirectionalLight, MeshRenderer, Material, primitives, utils, Layers, Vec4, view, screen, Quat } from 'cc';
import {pedestrianPath,segmentClear,PERSONAL_SPACE} from './core/traffic';
import { CONFIG, TRIPS, currentTrip, type GameState, type PassengerKind } from './core/game';

interface DollActor {node:Node;target:Vec3;slot:boolean;seed:number;exiting:boolean;base:Vec3;path:Vec3[];yaw:number;gait:number;stride:number;settle:number;limbs:{node:Node;rest:Quat;phase:number;arm:boolean}[];kind:PassengerKind;pending:boolean;queuePlace:number;leavingCabin:boolean;}
export class Diorama {
  root = new Node('Dollhouse');
  cabinRoot = new Node('CabinMotion');
  camera!: Camera;
  ready = false;
  private prefabs = new Map<string, Prefab>();
  private dolls = new Map<string,DollActor>();
  private pads: Node[] = [];
  private doors: Node[] = [];
  private cargo: Node | null = null;
  private lastElapsed=0;
  private time = 0;
  private walker:string|null=null;
  private routeRetry=0;
  private motionY = 0;
  private motionRoll = 0;
  private lobby!: Node;
  private shaft = new Node('TravelRails');
  private passingFloors: Node[] = [];
  private backgroundFloors: Node[] = [];
  private doorPhase = '';
  private doorStart = 1;
  private digits: Node[][] = [];
  private visualMaterials: Material[] = [];
  private displayedFloor = -1;
  private materials = new Map<string, Material>();
  private open = 1;
  private selectedMat!: Material;
  private neutralMat!: Material;
  private occupiedMat!: Material;
  private picked: string | null = null;
  private state: GameState | null = null;

  constructor(private scene: Node) {
    this.root.parent = scene; this.cabinRoot.parent = this.root;
    const backdrop = new Node('BackdropCamera'); backdrop.parent = this.root;
    const bg = backdrop.addComponent(Camera); bg.priority=-20; bg.visibility=0; bg.clearFlags=Camera.ClearFlag.SOLID_COLOR; bg.clearColor=new Color(242,238,226,255);
    const cn = new Node('FixedDioramaCamera'); cn.parent=this.root; cn.setPosition(2.5,8,14); cn.lookAt(new Vec3(0,.55,.45));
    this.camera=cn.addComponent(Camera); this.camera.projection=Camera.ProjectionType.ORTHO; this.camera.orthoHeight=3.55; this.camera.near=.1; this.camera.far=80;
    this.camera.priority=0; this.camera.clearFlags=Camera.ClearFlag.DEPTH_ONLY; this.camera.visibility=Layers.Enum.DEFAULT;
    const lightNode=new Node('WarmSoftKey'); lightNode.parent=this.root; lightNode.setRotationFromEuler(-48,-28,0);
    const light=lightNode.addComponent(DirectionalLight); light.color=new Color(255,237,207); light.illuminance=42000; light.shadowEnabled=true;light.shadowPcf=2;light.shadowBias=.002;light.shadowNormalBias=.015;
    const globals=(scene as any).globals;
    if(globals) {
      globals.ambient.skyColor=new Vec4(.63,.72,.72,1); globals.ambient.skyIllum=25000; globals.ambient.groundAlbedo=new Vec4(.25,.23,.19,1);
      globals.shadows.enabled=true; globals.shadows.type=1; globals.shadows.shadowMapSize=2048;
    }
    this.neutralMat=this.material('Stand here',new Color(222,207,172),.85);
    this.selectedMat=this.material('Selected',new Color(239,160,77),.5);
    this.occupiedMat=this.material('Occupied',new Color(132,165,144),.7);
    const floor=this.mesh('Lobby platform',primitives.box({width:6.3,height:.18,length:6.1}),this.material('Lobby stone',new Color(221,213,191),.85),this.root);
    floor.setPosition(0,-.32,.95);this.lobby=floor;
    this.visualMaterials.push(floor.getComponent(MeshRenderer)!.sharedMaterials[0]!);
    this.shaft.parent=this.root;this.shaft.active=false;
    const railMat=this.material('Shaft rail',new Color(114,139,131),.6);
    const markerMat=this.material('Passing landing',new Color(205,166,104),.45);
    this.visualMaterials.push(railMat,markerMat);
    for(const side of [-1,1]){
      const rail=this.mesh('Guide rail',primitives.box({width:.10,height:4.3,length:.12}),railMat,this.shaft);rail.setPosition(side*3.05,1.8,-.2);
      for(let i=0;i<4;i++){
        const mark=this.mesh('Floor passing marker',primitives.box({width:.66,height:.11,length:.35}),markerMat,this.shaft);
        mark.setPosition(side*3.05,i*1.15,-.2);this.passingFloors.push(mark);
      }
    }
    // A real backdrop of apartment landings provides a large, readable motion reference.
    const plaster=this.material('Apartment plaster',new Color(203,211,191),.9);
    const frame=this.material('Landing frame',new Color(111,139,128),.7);
    const glass=this.material('Warm landing window',new Color(239,205,143),.65);
    this.visualMaterials.push(plaster,frame,glass);
    for(const side of [-1,1]){
      const wall=this.mesh('Apartment shaft surround',primitives.box({width:1.40,height:4.45,length:.20}),plaster,this.root);wall.setPosition(side*3.40,1.55,-2.0);
    }
    for(let i=0;i<4;i++){
      const landing=new Node('Scrolling apartment floor');landing.parent=this.root;
      for(const side of [-1,1]){
        const pane=this.mesh('Window surround',primitives.box({width:.90,height:.85,length:.12}),frame,landing);pane.setPosition(side*3.40,0,-1.82);
        const light=this.mesh('Window light',primitives.box({width:.73,height:.67,length:.05}),glass,landing);light.setPosition(side*3.40,0,-1.72);
        const mullion=this.mesh('Window mullion',primitives.box({width:.045,height:.70,length:.06}),frame,landing);mullion.setPosition(side*3.40,0,-1.67);
        const sill=this.mesh('Floor cornice',primitives.box({width:1.42,height:.10,length:.46}),markerMat,landing);sill.setPosition(side*3.40,-.57,-1.65);
      }
      this.backgroundFloors.push(landing);
    }
    for(let i=0;i<6;i++) {
      const n=this.mesh('Slot '+(i+1),primitives.cylinder(.57,.57,.018,{radialSegments:32}),this.neutralMat,this.cabinRoot);
      n.setPosition(this.slotPosition(i)); this.pads.push(n);
    }
  }
  private material(name:string,color:Color,rough:number) {
    const m=new Material();m.name=name;m.initialize({effectName:'builtin-standard'});m.setProperty('albedo',color);m.setProperty('roughness',rough);m.setProperty('metallic',0);return m;
  }
  private mesh(name:string,g:any,m:Material,parent:Node) {
    const n=new Node(name);n.parent=parent; const r=n.addComponent(MeshRenderer);r.mesh=utils.createMesh(g);r.setMaterial(m,0);return n;
  }
  async load() {
    const names=['cabin','door','student','office','courier','traveller','mover','coach','cargo'];
    await Promise.all(names.map(name => new Promise<void>((resolve,reject) => resources.load(`models/${name}/${name}`,Prefab,(err,p)=>{
      if(err) {reject(new Error(`模型 ${name} 加载失败：${err.message}`));return;}this.prefabs.set(name,p);resolve();
    }))));
    this.make('cabin',this.cabinRoot);this.makeFloorDisplay();
    for(const x of [-1,1]) {const d=this.make('door',this.cabinRoot);d.setPosition(x*3.9,0,1.72);d.setScale(1,.48,1);this.doors.push(d);}
    this.cargo=this.make('cargo',this.cabinRoot);this.cargo.active=false;
    this.ready=true;
  }
  private makeFloorDisplay(){
    const dark=this.material('Display glass',new Color(36,65,59),.35);
    const amber=this.material('Floor digits',new Color(255,218,128),.4);
    this.visualMaterials.push(dark,amber);
    const glass=this.mesh('Live floor display',primitives.box({width:.88,height:.43,length:.05}),dark,this.cabinRoot);glass.setPosition(0,3.13,-1.20);
    const segments=[[0,.15,.16,.025],[.09,.075,.025,.13],[.09,-.075,.025,.13],[0,-.15,.16,.025],[-.09,-.075,.025,.13],[-.09,.075,.025,.13],[0,0,.16,.025]];
    for(const center of [-.20,.20])this.digits.push(segments.map(([x,y,w,h])=>{
      const n=this.mesh('LED segment',primitives.box({width:w,height:h,length:.025}),amber,this.cabinRoot);n.setPosition(center+x,3.13+y,-1.16);return n;
    }));
  }
  private showFloor(floor:number){
    if(floor===this.displayedFloor)return;this.displayedFloor=floor;
    const codes=['012345','12','01643','01236','1256','02536','023456','012','0123456','012356'];
    [Math.floor(floor/10),floor%10].forEach((v,d)=>this.digits[d]?.forEach((n,i)=>n.active=codes[v].indexOf(String(i))>=0));
  }
  /** Read-only simulation snapshot, refreshed every rendered frame for smooth motion. */
  setState(s:GameState){this.state=s;}
  private make(name:string,parent:Node):Node {
    const n=instantiate(this.prefabs.get(name)!);n.parent=parent;
    n.getComponentsInChildren(MeshRenderer).forEach(r=>{
      r.shadowCastingMode=MeshRenderer.ShadowCastingMode.ON; r.receiveShadow=1;
      r.sharedMaterials.forEach((m,i)=>{if(m) r.setMaterial(this.surface(m.name),i);});
    });return n;
  }
  private surface(name:string):Material {
    const key=name.replace(/ \(Instance\)$/, '');
    if(this.materials.has(key))return this.materials.get(key)!;
    const palette:Record<string,[string,number,number]>={skin:['edbc92',.38,0],skin2:['bf8664',.4,0],hair:['332923',.3,0],eye:['161d22',.15,0],cream:['f5ecda',.68,0],sole:['d7cbbb',.65,0],teal:['457a71',.68,0],orange:['dc744b',.6,0],navy:['34465b',.68,0],yellow:['e9b64f',.42,0],pink:['d8958a',.65,0],paper:['d2a36b',.8,0],tape:['ecd3a6',.73,0],metal:['a8b9b7',.32,.45],brass:['bca071',.34,.4],wall:['53776e',.76,0],trim:['2c4b49',.52,0],floor:['d9c8a6',.6,0],tile:['c7b694',.68,0],shadow:['394942',.9,0],light:['ffe5a2',.35,0]};
    const [hex,rough,metal]=palette[key]||['d8d1bd',.65,0];
    const col=new Color(parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16));
    const mat=this.material(key,col,rough);mat.setProperty('metallic',metal);this.materials.set(key,mat);return mat;
  }
  slotPosition(i:number):Vec3 {return new Vec3((i%3-1)*1.68,.095,i<3?-.78:.77);}
  private queuePosition(i:number,count:number):Vec3 {return new Vec3((i-(count-1)/2)*1.18,-.21,3.14);}
  sync(s:GameState,selected:string|null) {
    if(s.elapsed<this.lastElapsed){this.dolls.forEach(d=>d.node.destroy());this.dolls.clear();this.walker=null;}this.lastElapsed=s.elapsed;
    this.state=s; this.picked=selected;
    if(!this.ready)return;
    const visible=new Set<string>();
    const put=(id:string,kind:PassengerKind,pos:Vec3,inCabin:boolean,index:number)=>{
      visible.add(id);let d=this.dolls.get(id);
      if(!d) {
        const n=this.make(kind,this.root);n.setScale(1.05,1.05,1.05);let spawn=6.2;while(Array.from(this.dolls.values()).some(a=>Math.hypot(a.base.x-spawn,a.base.z-4.25)<1))spawn+=1;
        n.setPosition(s.phase==='ready'?pos.x:spawn,-.21,s.phase==='ready'?pos.z:4.25);
        const limbs:DollActor['limbs']=[];
        const scan=(node:Node)=>{if(node.name.indexOf('WalkLeg_')===0||node.name.indexOf('WalkArm_')===0)limbs.push({node,rest:node.rotation.clone(),phase:node.name.indexOf('_L')>=0?1:-1,arm:node.name.indexOf('WalkArm_')===0});node.children.forEach(scan);};scan(n);
        d={node:n,target:new Vec3(99,99,99),slot:false,seed:index*.9,exiting:false,base:n.position.clone(),path:[],yaw:-90,gait:0,stride:0,settle:0,limbs,kind,pending:false,queuePlace:-1,leavingCabin:false};this.dolls.set(id,d);
      }
      if(Vec3.distance(d.target,pos)>.01||d.slot!==inCabin||d.exiting)this.route(d,pos,inCabin);
      d.target=pos;d.slot=inCabin;d.exiting=false;
    };
    s.queue.forEach((p,i)=>{
      const old=this.dolls.get(p.id);let place=old?.queuePlace??-1;
      if(place<0){const used=new Set(Array.from(this.dolls.entries()).filter(([id,a])=>s.queue.some(p=>p.id===id)&&!a.slot&&!a.exiting).map(([,a])=>a.queuePlace));for(let j=0;j<5;j++)if(!used.has(j)){place=j;break;}}
      put(p.id,p.kind,this.queuePosition(Math.max(0,place),5),false,i);this.dolls.get(p.id)!.queuePlace=place;
    });
    s.aboard.forEach((a,i)=>{
      const p=this.slotPosition(a.slot); p.y=.13;
      if(s.phase!=='unloading'&&s.phase!=='result'&&s.phase!=='ended'){put(a.passenger.id,a.passenger.kind,p,true,i);this.dolls.get(a.passenger.id)!.queuePlace=-1;}
    });
    this.dolls.forEach((d,id)=>{if(!visible.has(id)&&!d.exiting){const end=new Vec3(-4.0,-.21,4.45);this.route(d,end,false);d.exiting=true;d.target=end;}});
    this.pads.forEach((n,i)=>{
      const a=s.aboard.find(a=>i>=a.slot&&i<a.slot+a.passenger.size);
      n.getComponent(MeshRenderer)!.setMaterial(a?(a.passenger.id===selected?this.selectedMat:this.occupiedMat):selected?this.selectedMat:this.neutralMat,0);
    });
    if(this.cargo){const mover=s.aboard.find(a=>a.passenger.kind==='mover');const owner=mover&&this.dolls.get(mover.passenger.id);this.cargo.active=!!owner&&!owner.pending&&!owner.path.length&&s.phase!=='unloading'&&s.phase!=='result'&&s.phase!=='ended';if(mover){const p=this.slotPosition(mover.slot+1);this.cargo.setPosition(p);}}
  }
  update(dt:number,paused:boolean) {
    // Keep a consistent hero region at every aspect ratio; UI uses the same 720×1280 frame.
    const sz=view.getVisibleSize();const scale=Math.min(sz.width/720,sz.height/1280);
    this.camera.rect=new Rect(0,0,1,1);
    this.camera.orthoHeight=7.5*sz.height/(1280*scale);
    if(paused) return;
    this.time+=dt;
    if(!this.ready||!this.state)return;
    const s=this.state;
    const moving=s.phase==='travel',stopping=s.phase==='stopping';
    const start=s.tripIndex?TRIPS[s.tripIndex-1].floor:1,end=currentTrip(s).floor;
    const direction=end>=start?1:-1,p=s.progress,q=p*p*(3-2*p);
    const envelope=moving?Math.sin(Math.PI*p):0;
    const settle=stopping?Math.max(0,Math.min(1,s.phaseTime/(CONFIG.stoppingSeconds+(s.emergencyReason?CONFIG.emergencyStopSeconds:0)))):0;
    const targetY=moving?direction*(.34*envelope+.014*Math.sin(s.travelTime*17)*envelope):stopping?direction*.045*Math.sin(settle*Math.PI*2)*settle:0;
    this.motionY+=(targetY-this.motionY)*Math.min(1,dt*12);
    this.motionRoll+=((moving?-s.tilt*.3:0)-this.motionRoll)*Math.min(1,dt*9);
    this.cabinRoot.setPosition(0,this.motionY,0);this.cabinRoot.setRotationFromEuler(0,0,this.motionRoll);
    this.shaft.active=true;
    // Integer landing spacing makes the destination line up without snapping at rest.
    const distance=Math.max(3,Math.abs(end-start))*1.6;
    const arrived=s.phase==='unloading'||s.phase==='result'||s.phase==='ended'||(s.phase==='opening'&&s.doorPurpose==='arrival');
    const offset=direction*distance*(moving||stopping?q:arrived?1:0);
    this.backgroundFloors.forEach((n,i)=>{
      const y=((i*1.6-offset)%6.4+6.4)%6.4-.55;
      // Scale into the solid wall at the edge rather than popping full windows in/out.
      const reveal=Math.max(0,Math.min(1,(y+.55)/.55,(3.75-y)/.55));
      n.setPosition(0,y,-.02);n.setScale(1,reveal,1);n.active=reveal>0;
    });
    this.passingFloors.forEach((n,i)=>{
      const railOffset=offset;
      const y=((i%4*1.15-railOffset)%4.6+4.6)%4.6-.45;
      n.setPosition(i<4?-3.05:3.05,y,-.2);
    });
    const depart=moving?Math.min(1,p/.12):stopping?1:0;
    const lobbyY=-.32-.75*(depart*depart*(3-2*depart));
    this.lobby.setPosition(0,this.lobby.position.y+(lobbyY-this.lobby.position.y)*Math.min(1,dt*5),.95);
    this.showFloor(arrived?end:moving||stopping?Math.round(start+(end-start)*q):start);
    const phaseKey=s.phase+':'+s.doorPurpose;
    if(phaseKey!==this.doorPhase){this.doorPhase=phaseKey;this.doorStart=this.open;}
    const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*t*(t*(t*6-15)+10);};
    if(s.phase==='closing')this.open=this.doorStart*(1-smooth(1-s.doorTime/CONFIG.closingSeconds));
    else if(s.phase==='opening'){
      const duration=s.doorPurpose==='arrival'?CONFIG.arrivalOpeningSeconds:CONFIG.reopeningSeconds;
      // The first 10% is an unlocking beat; the last section settles into the pockets.
      const t=(1-s.doorTime/duration-.10)/.90;
      this.open=this.doorStart+(1-this.doorStart)*smooth(t);
    }else this.open=moving||stopping?0:1;
    this.doors.forEach((d,i)=>{d.setPosition((i===0?-1:1)*(1.24+2.6*this.open),0,1.72);d.active=this.open<.98;});
    this.scheduleTraffic(dt);
    this.dolls.forEach((d,id)=>this.animateDoll(d,id,dt,s));
  }
  /** Visual boarding must finish before the door starts closing. */
  get boarding(){return this.disembarking||Array.from(this.dolls.values()).some(d=>!d.exiting&&d.slot&&(d.pending||d.path.length>0||Math.abs(d.yaw)>2||d.stride>.05));}
  get disembarking(){return Array.from(this.dolls.values()).some(d=>d.leavingCabin&&(d.pending||d.path.length>0));}
  private route(d:DollActor,target:Vec3,inCabin:boolean){
    d.leavingCabin=!inCabin&&(d.slot||d.leavingCabin);
    d.path=[];d.pending=Vec3.distance(d.base,target)>.03;d.settle=0;
    if(this.walker&&this.dolls.get(this.walker)===d)this.walker=null;
    this.routeRetry=0;
  }
  private scheduleTraffic(dt:number){
    const owner=this.walker&&this.dolls.get(this.walker);
    if(owner&&owner.path.length)return;
    this.walker=null;this.routeRetry-=dt;if(this.routeRetry>0)return;this.routeRetry=.15;
    const actors=Array.from(this.dolls.entries());
    const outbound=actors.some(([,d])=>d.leavingCabin&&(d.pending||d.path.length));
    // Door reservation: frontmost outgoing passenger first, then boarding, then arrivals.
    const candidates=actors.filter(([,d])=>d.pending&&(!outbound||d.leavingCabin||!d.slot));
    candidates.sort((a,b)=>Number(b[1].leavingCabin)-Number(a[1].leavingCabin)||Number(b[1].slot)-Number(a[1].slot)||(a[1].leavingCabin?b[1].base.z-a[1].base.z:0));
    for(const [id,d] of candidates){
      if(outbound&&d.slot&&!d.leavingCabin)continue;
      const people=actors.filter(([other])=>other!==id).map(([,a])=>a.base);if(this.cargo?.active)people.push(this.cargo.position);
      const path=pedestrianPath(d.base,d.target,people);if(!path)continue;
      d.path=path.map(p=>new Vec3(p.x,p.z<=1.25?.13:p.z>=2.45?-.21:.13-(p.z-1.25)/1.2*.34,p.z));
      d.pending=false;this.walker=id;return;
    }
  }
  private animateDoll(d:DollActor,id:string,dt:number,s:GameState){
    const wrap=(a:number)=>((a+180)%360+360)%360-180;
    let walked=0;
    const point=d.path[0];
    if(point&&this.walker===id){
      const delta=new Vec3();Vec3.subtract(delta,point,d.base);const distance=delta.length();
      const facing=Math.atan2(delta.x,delta.z)*180/Math.PI;
      const angle=wrap(facing-d.yaw);d.yaw=wrap(d.yaw+Math.max(-540*dt,Math.min(540*dt,angle)));
      const turnScale=Math.max(.08,1-Math.abs(angle)/100);
      const braking=d.path.length===1?Math.max(.25,Math.min(1,distance/.45)):1;
      walked=Math.min(distance,2.6*turnScale*braking*dt);
      if(distance>.001){Vec3.multiplyScalar(delta,delta,walked/distance);const next=d.base.clone();Vec3.add(next,next,delta);
        const others=Array.from(this.dolls.values()).filter(a=>a!==d).map(a=>a.base);if(this.cargo?.active)others.push(this.cargo.position);
        if(segmentClear(d.base,next,others)){d.base.set(next);}else{walked=0;d.path=[];d.pending=true;this.walker=null;}
      }
      if(d.path.length&&(distance<.008||walked>=distance)){d.base.set(point);d.path.shift();if(!d.path.length){d.settle=.35;d.leavingCabin=false;this.walker=null;}}
    }else{
      const angle=wrap(-d.yaw);d.yaw=wrap(d.yaw+Math.max(-400*dt,Math.min(400*dt,angle)));d.settle=Math.max(0,d.settle-dt);
    }
    const walking=walked>dt*.08;
    d.stride+=((walking?1:0)-d.stride)*Math.min(1,dt*12);
    d.gait+=walked*7.0;
    const swing=Math.sin(d.gait)*d.stride;
    d.limbs.forEach(l=>{
      const amplitude=l.arm?(d.kind==='courier'||d.kind==='mover'?14:6):28;
      const delta=Quat.fromEuler(new Quat(),swing*l.phase*amplitude*(l.arm?-1:1),0,0);
      const rotation=new Quat();Quat.multiply(rotation,l.rest,delta);l.node.setRotation(rotation);
    });
    const pos=d.base.clone();
    // Two grounded steps per gait cycle; a short compression settles the last footfall.
    pos.y+=Math.abs(Math.sin(d.gait))*.035*d.stride-Math.sin(d.settle/.35*Math.PI)*.025;
    if(!d.path.length)pos.y+=Math.sin(this.time*2.2+d.seed)*.006*(1-d.stride);
    const onCabin=d.base.z<1.6&&(d.slot||d.exiting);
    if(onCabin){const a=this.motionRoll*Math.PI/180,x=pos.x,y=pos.y;pos.x=x*Math.cos(a)-y*Math.sin(a);pos.y=x*Math.sin(a)+y*Math.cos(a)+this.motionY;}
    d.node.setPosition(pos);d.node.setRotationFromEuler(d.stride*2,d.yaw,onCabin&&s.phase==='travel'?-s.tilt*.45:swing*1.8);
    const sc=id===this.picked?1.12:1.05;d.node.setScale(sc,sc,sc);
    if(d.exiting&&!d.pending&&!d.path.length){d.node.destroy();this.dolls.delete(id);}
  }

  /** Canvas logical position for a world point; no invisible collider offsets. */
  project(pos:Vec3):Vec3 {
    const v=this.camera.worldToScreen(pos); const win=screen.windowSize; const sz=view.getVisibleSize();const sc=Math.min(sz.width/720,sz.height/1280);
    return new Vec3((v.x/win.width-.5)*sz.width/sc,(v.y/win.height-.5)*sz.height/sc,0);
  }
  slotScreen(i:number):Vec3 {return this.project(this.slotPosition(i));}
  passengerScreen(id:string):Vec3|null {const d=this.dolls.get(id);if(!d)return null;const p=d.node.position.clone();p.y+=.8;return this.project(p);}
  destroy(){this.root.destroy();this.neutralMat.destroy();this.selectedMat.destroy();this.occupiedMat.destroy();this.materials.forEach(m=>m.destroy());this.visualMaterials.forEach(m=>m.destroy());}
}
