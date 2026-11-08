export interface Settings {version:1;muted:boolean;best:number;bestTrips:number;}
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;}
const KEY='elevator-again.v1';const BACKUP=KEY+'.backup';
export const defaults=():Settings=>({version:1,muted:false,best:0,bestTrips:0});
export function parseSave(raw:string|null):Settings|null {
 if(!raw)return null;try{const d=JSON.parse(raw);if(d.version!==1||typeof d.muted!=='boolean'||!Number.isInteger(d.best)||d.best<0||d.best>1000000||!Number.isInteger(d.bestTrips)||d.bestTrips<0||d.bestTrips>10)return null;return{version:1,muted:d.muted,best:d.best,bestTrips:d.bestTrips};}catch{return null;}
}
export function readSettings(storage:StorageLike|null):Settings {try{return storage?(parseSave(storage.getItem(KEY))||parseSave(storage.getItem(BACKUP))||defaults()):defaults();}catch{return defaults();}}
export function writeSettings(storage:StorageLike|null,value:Settings):boolean {
 if(!storage||!parseSave(JSON.stringify(value)))return false;
 try{const old=storage.getItem(KEY);if(parseSave(old))storage.setItem(BACKUP,old!);storage.setItem(KEY,JSON.stringify(value));return true;}catch{return false;}
}
export function browserStorage():StorageLike|null {try{return typeof localStorage==='undefined'?null:localStorage;}catch{return null;}}
