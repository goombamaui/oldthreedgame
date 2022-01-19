const INTERPOLATION_CONSTANT=100,
    CAMERA_OFFSET=new BABYLON.Vector3(0,0.75,0);
window.speed=5;
class Player {
    static GREEN_HEALTH_MAT;
    static YELLOW_HEALTH_MAT;
    static RED_HEALTH_MAT;
    static BLUE_TEAM_MAT;
    static RED_TEAM_MAT;
    static init(scene){
        Player.GREEN_HEALTH_MAT = new BABYLON.StandardMaterial("GHM", scene);
        Player.GREEN_HEALTH_MAT.emissiveColor = new BABYLON.Color3(0, 1, 0);
        Player.GREEN_HEALTH_MAT.specularColor = new BABYLON.Color4(0,0,0,0);
        Player.GREEN_HEALTH_MAT.diffuseColor=Player.GREEN_HEALTH_MAT.specularColor;
        Player.GREEN_HEALTH_MAT.ambientColor=Player.GREEN_HEALTH_MAT.diffuseColor;
        Player.YELLOW_HEALTH_MAT = new BABYLON.StandardMaterial("GYM", scene);
        Player.YELLOW_HEALTH_MAT.emissiveColor = new BABYLON.Color3(1, 1, 0);
        Player.YELLOW_HEALTH_MAT.specularColor = new BABYLON.Color4(0,0,0,0);
        Player.YELLOW_HEALTH_MAT.diffuseColor=Player.YELLOW_HEALTH_MAT.specularColor;
        Player.YELLOW_HEALTH_MAT.ambientColor=Player.YELLOW_HEALTH_MAT.diffuseColor;
        Player.RED_HEALTH_MAT = new BABYLON.StandardMaterial("RHM", scene);
        Player.RED_HEALTH_MAT.emissiveColor = new BABYLON.Color3(1, 0, 0);
        Player.RED_HEALTH_MAT.specularColor = new BABYLON.Color4(0,0,0,0);
        Player.RED_HEALTH_MAT.diffuseColor=Player.RED_HEALTH_MAT.specularColor;
        Player.RED_HEALTH_MAT.ambientColor=Player.RED_HEALTH_MAT.diffuseColor;
        Player.RED_TEAM_MAT = new BABYLON.StandardMaterial("RTM",scene);
        Player.RED_TEAM_MAT.emisiveColor = new BABYLON.Color3(1,0,0);
        Player.RED_TEAM_MAT.diffuseColor = Player.RED_TEAM_MAT.emisiveColor;
        Player.RED_TEAM_MAT.specularColor=Player.RED_TEAM_MAT.diffuseColor;
        Player.RED_TEAM_MAT.ambientColor=Player.RED_TEAM_MAT.diffuseColor;
        Player.BLUE_TEAM_MAT = new BABYLON.StandardMaterial("BTM",scene);
        Player.BLUE_TEAM_MAT.emisiveColor = new BABYLON.Color3(0,0,1);
        Player.BLUE_TEAM_MAT.diffuseColor = Player.BLUE_TEAM_MAT.emisiveColor;
        Player.BLUE_TEAM_MAT.specularColor=Player.BLUE_TEAM_MAT.diffuseColor;
        Player.BLUE_TEAM_MAT.ambientColor=Player.BLUE_TEAM_MAT.diffuseColor;
    }
    constructor(scene,id,team){
        this.scene=scene;
        this.mesh=BABYLON.MeshBuilder.CreateBox("player_"+id+"_mesh", {height:2,width:1,depth:1}, scene); 
        this.mesh.position = new BABYLON.Vector3(0,5,0);
        this.mesh.isPickable=false;
        this.health_mesh=BABYLON.MeshBuilder.CreatePlane("player_"+id+"_healthmesh",{height:0.25,width:1});
        this.health_mesh.billboardMode=BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
        this.health_mesh.parent=this.mesh;
        this.health_mesh.position=new BABYLON.Vector3(0,1.25,0);
        this.curr_health=0;
        this.position = new BABYLON.Vector3(0,5,0);
        this.prevTime = 0;
        this.id=id;
        this.team=team;
        if(this.team==1)
            this.mesh.material=Player.RED_TEAM_MAT;
        else if (this.team==2)
            this.mesh.material=Player.BLUE_TEAM_MAT;
    }

    dispose(){
        this.mesh.dispose();
    }

    update(r){
        this.prevTime=Date.now();
        this.position=new BABYLON.Vector3(r.x,r.y,r.z);
        if(this.curr_health!=r.h)
            this.updateHealth(r.h);
    }

    updateHealth(x){
        this.curr_health=x;
        this.health_mesh.scaling=new BABYLON.Vector3(x/100,1,1);
        if(x>66)
            this.health_mesh.material=Player.GREEN_HEALTH_MAT;
        else if (x>33)
            this.health_mesh.material=Player.YELLOW_HEALTH_MAT;
        else
            this.health_mesh.material=Player.RED_HEALTH_MAT;
        this.updateHealthBar();
    }

    interpolateMovement(){
        let mv=this.position.subtract(this.mesh.position);
        if(mv.length()<0.01)
        {
            this.mesh.position.addInPlace(mv)
            return;
        }
        let dt=Date.now()-this.prevTime;
        if(dt>INTERPOLATION_CONSTANT/2){
            dt=INTERPOLATION_CONSTANT/2;
        }
        this.mesh.position.addInPlace(mv.scale(dt*1/INTERPOLATION_CONSTANT))
    }
}


class MyPlayer extends Player{
    constructor(scene,id,socket,camera){
        super(scene,id);
        this.socket=socket;
        this.movement={"w":false,"a":false,"s":false,"d":false};
        this.prev_frame=0;
        this.server_update_int=setInterval(()=>{this.updateServer()},75);
        this.interposition=BABYLON.Vector3.Zero();
        this.camera=camera;
        this.mesh.visibility=0
        this.mesh.checkCollisions=true;
        this.jump_start=0

        this.socket.on("fixpo",(r)=>{
            this.mesh.position=new BABYLON.Vector3(r.x,r.y,r.z);
            this.jump_start=0;
        })
    }

    updateClientPosition(){
        let ct=Date.now(),dt=ct-this.prev_frame;
        this.prev_frame=ct;
        let speed=window.speed*dt/1000;
        let mt=new BABYLON.Vector3(0,0,0);
        let xT=Math.sin(this.camera.rotation.y);
        let yT=Math.cos(this.camera.rotation.y);
        
        if(this.movement.w)
        {
            mt.x+=speed*xT;
            mt.z+=speed*yT;
        }
        if(this.movement.s)
        {
            mt.x-=speed*xT;
            mt.z-=speed*yT;
        }
        if(this.movement.d)
        {
            mt.x+=speed*yT;
            mt.z-=speed*xT;
        }
        if(this.movement.a)
        {
            mt.x-=speed*yT;
            mt.z+=speed*xT;
        }
        if(this.movement.space && (this.onGround()) && this.jump_start==0)
        {
            this.jump_start=ct;
        }
        
        if(this.jump_start>0){
            let jump_height=this.calcJumpHeight(ct-this.jump_start,ct-this.jump_start-dt);
            if(jump_height<0 || ct-this.jump_start>540)
            {
                this.jump_start=0;
            }
            else
            {
                mt.y+=jump_height;
            }
        }
        mt.y-=2*dt/1000
        this.mesh.moveWithCollisions(mt);
    }

    onGround(){
        return (this.scene.pickWithRay(new BABYLON.Ray(this.mesh.position,new BABYLON.Vector3(0,-1.1,0),1)).hit)
    }

    shoot(){
        this.socket.send({type:"proj",data:{type:0,rx:this.camera.rotation.x,ry:this.camera.rotation.y}});

    }

    calcJumpHeight(curr,prev)
    {
        curr/=1000;
        prev/=1000;
        return (curr-prev)*(-5*(curr+prev)+5.4);
    }

    interpolateMovement(){
        let mv=this.mesh.position.subtract(this.interposition);
        if(mv.length()<0.05)
        {
            this.interposition.addInPlace(mv)
            this.camera.position=this.interposition.add(CAMERA_OFFSET);
            return;
        }
        let dt=Date.now()-this.prevTime;
        if(dt>INTERPOLATION_CONSTANT/2)
        {
            dt=INTERPOLATION_CONSTANT/2;
        }
        this.interposition.addInPlace(mv.scale(dt*1/INTERPOLATION_CONSTANT));
        this.camera.position=this.interposition.add(CAMERA_OFFSET);
    }

    
    updateHealthBar(){
        try{
            let hc=document.getElementById("healthbar"),c;
            hc.style.width=Math.round(this.curr_health)+"%";
            if(this.curr_health>66)
                c="rgb(0,255,0)";
            else if (this.curr_health>33)
                c="rgb(255,255,0)";
            else
                c="rgb(255,0,0)";
            hc.style.backgroundColor=c;
        }catch(err){console.log(err)}
    }

    updateServer(){
        this.socket.send({type:"upd",data:{x:this.mesh.position.x,y:this.mesh.position.y,z:this.mesh.position.z,t:this.prev_frame}});
    }
}