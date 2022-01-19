class Projectile{
    static PROJECTILE_MATERIAL=null;
    static init = (scene)=>{
        let m = new BABYLON.StandardMaterial("laser_material", scene);
        m.emissiveColor = new BABYLON.Color3(0, 1, 0);
        m.specularColor = m.emissiveColor;
        Projectile.PROJECTILE_MATERIAL=m;
    }
    constructor(scene,id,pos,v)
    {
        this.INTERPOLATION_CONSTANT=100;
        this.scene=scene;
        this.id=id;
        this.pos=pos;
        this.mesh=BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:0.2}, scene);
        this.mesh.position=pos;
        this.prev_frame=Date.now();
        console.log(Projectile.PROJECTILE_MATERIAL)
        this.mesh.material=Projectile.PROJECTILE_MATERIAL;
    }
    dispose(){
        this.mesh.dispose();
    }
    moveTo(pos){
        this.pos=pos;
    }
    interpolateMovement(){
        let t=Date.now(),dt=t-this.prev_frame;
        let mv=this.pos.subtract(this.mesh.position);
        if(mv.length()<0.01)
        {
            this.mesh.position.addInPlace(mv)
            return;
        }
        if(dt>this.INTERPOLATION_CONSTANT/2){
            dt=this.INTERPOLATION_CONSTANT/2;
        }
        this.mesh.position.addInPlace(mv.scale(dt*1/this.INTERPOLATION_CONSTANT))
        this.prev_frame=t;
    }
}