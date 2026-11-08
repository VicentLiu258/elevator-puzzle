/** Explicit pointer ownership: a second finger cannot replace the first drag. */
export class InputAdapter {
 private left=new Set<number>();private right=new Set<number>();private keys=new Set<string>();
 private owner:number|null=null;
 hold(side:-1|1,id:number){(side<0?this.left:this.right).add(id);}
 release(id:number){this.left.delete(id);this.right.delete(id);}
 key(code:string,down:boolean){if(down)this.keys.add(code);else this.keys.delete(code);}
 direction():-1|0|1 {const l=this.left.size>0||this.keys.has('A'),r=this.right.size>0||this.keys.has('D');return l===r?0:l?-1:1;}
 claim(id:number):boolean {if(this.owner!==null)return false;this.owner=id;return true;}
 owns(id:number):boolean{return this.owner===id;}
 end(id:number):boolean{if(!this.owns(id))return false;this.owner=null;return true;}
 clear(){this.left.clear();this.right.clear();this.keys.clear();this.owner=null;}
}
