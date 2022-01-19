
class Projectile
{
    constructor(id,type,p,v,owner,tf,scene)
    {
        this.id=id;
        this.p=p;
        this.v=v;
        this.type=type;
        this.owner=owner;
        this.prev_frame=Date.now();
        this.time_frame=tf;
        this.scene=scene;
    }

    move(){
        let t=Date.now(),dt=t-this.prev_frame;
        this.time_frame-=dt;
        if(this.time_frame<0){
            dt+=this.time_frame;
        }
        let mv_ray=new BABYLON.Ray(this.p,this.v,dt/1000);
        let coll=this.scene.pickWithRay(mv_ray,(msh)=>{
            if(msh.name==this.owner.mesh.name||msh.team==this.owner.team)
            {
                return false;
            }
            return true;
        })
        if(coll.hit){
            if(coll.pickedMesh.name.startsWith("player_")){
                return parseInt(coll.pickedMesh.name.slice(7));
            }
            return true;
        }
        this.p.addInPlace(this.v.scale(dt/1000));
        this.prev_frame=t;
        return this.time_frame<=0;
    }

    clientData(){
        return {t:this.type,x:this.p.x,y:this.p.y,z:this.p.z};
    }
}
exports.Projectile=Projectile;