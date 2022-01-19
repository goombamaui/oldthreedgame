const BABYLON = require("babylonjs");

class Player {
    constructor(socket,id,scene,game){
        this.socket=socket;
        this.game=game;
        this.id=id;
        this.scene=scene;
        this.mesh=BABYLON.MeshBuilder.CreateBox("player_"+id,{size:2,height:2,width:1,depth:1},this.scene);
        this.mesh.position=new BABYLON.Vector3(0,5,0);
        this.prev_cli_frame=0;
        this.jump_start=0;
        this.prev=0;
        this.health=100;
        this.reload=0;
        this.prev_variations=[];
        //this.serverCheckInt=setInterval((x) => this.serverPosCheck(x),1000,1250);
        socket.on("message",(r)=>{
            if(r.type=="upd")
                this.updatePosition(r.data.x,r.data.y,r.data.z,r.data.t);
            else if (r.type=="proj")
            {
                if(this.reload<Date.now()){
                    this.reload=Date.now()+100;
                    this.createProjectile(r.data.type,r.data.rx,r.data.ry)
                }
            }
        });
    }

    createProjectile(type,rx,ry)
    {
        let mc=Math.cos(rx), v=new BABYLON.Vector3(mc*Math.sin(ry),Math.sin(-1*rx),mc*Math.cos(ry));
        this.game.createProjectile(type,BABYLON.Vector3.Zero().copyFrom(this.mesh.position),v,this);
    }

    rayPredicate(msh){
        if(msh.name.startsWith("player_"))
            return false;
        return true;
    }
    
    pickWithRay(r,f=function(){return true}){
        return this.scene.pickWithRay(r,(msh)=>this.rayPredicate(msh)&&f(msh));
    }

    dealDamage(x){
        this.health-=x;
        if(this.health<=0)
            this.die();
    }
    
    die(){
        this.health=100;
        this.respawn();
    }

    respawn(){
        this.mesh.position=new BABYLON.Vector3(0,5,0);
    }

    dispose()
    {
        this.mesh.dispose();
    }

    updatePosition(x,y,z,t){
        for(let mesh of this.scene.meshes){
            if(mesh.name=="ground")
            {
                /*
                console.log(this.mesh.intersectsMesh(mesh));
                console.log(mesh.position.y);
                console.log(this.mesh.position.y);*/
            }
        }
        let np=new BABYLON.Vector3(x,y,z),now=Date.now(),sdt=now-this.prev,dt=t-this.prev_cli_frame,xz_mask=new BABYLON.Vector3(1,0,1),
        variation=Math.abs(dt-sdt);
        this.prev=now;
        this.prev_variations.pop();
        this.prev_variations.unshift(variation);
        if(variation>100||Math.abs(variation-this.prev_variations.reduce((a,b)=>a+b,0))>100)
        {
            this.rejectPosition(sdt);
            this.prev_cli_frame=t;
            return;
        }
        if(dt<0||t<this.prev_cli_frame||t>now+10000||t<now-10000){
            this.rejectPosition(sdt);
            this.prev_cli_frame=0;
            return;
        } else {
            this.prev_cli_frame=t;
        }
        if((this.pickWithRay(this.rayBetweenTwoPoints(np,this.mesh.position)).hit)||
        this.mesh.position.subtract(np).multiply(xz_mask).length()>4.25/1000*dt||this.mesh.position.y-np.y>0.00201*dt){
            this.rejectPosition(dt);
        } else {
            if(!(this.vOnGround(np)||Math.round((this.mesh.position.y-np.y)*1000)==Math.round(2*dt)))
            {
                let diff=np.y-this.mesh.position.y;
                if(!this.jump_start&&this.dToGround(this.mesh.position)<1.1+0.002*dt)
                    this.jump_start=t;
                else if (t-this.jump_start>600)
                {
                    this.rejectPosition(dt);
                    return;
                }
                if(diff>0&&diff>this.getJumpBound(t-this.jump_start,t-dt-this.jump_start)+0.01)
                {
                    this.rejectPosition(dt);
                    return;
                }
            } else {
                this.jump_start=0;
            }
            this.mesh.position=np;
        }
    }

    onGround(){
        return (this.pickWithRay(new BABYLON.Ray(this.mesh.position,new BABYLON.Vector3(0,-1.1,0),1)).hit)
    }

    vOnGround(r){
        return (this.pickWithRay(new BABYLON.Ray(r,new BABYLON.Vector3(0,-1.1,0),1)).hit)
    }

    dToGround(r){
        return (r.y-this.pickWithRay(new BABYLON.Ray(r,new BABYLON.Vector3(0,-1,0),10000)).pickedPoint.y)
    }


    getJumpBound(curr,prev){
        curr/=1000;
        prev/=1000;
        return (curr-prev)*(-5*(curr+prev)+3.4);
    }

    doneJumping(f){
        return this.jump_start>=0.54+f;
    }

    serverPosCheck(del){
        if(del*0.003<this.mesh.position.subtract(this.prevposition).length())
        {
            //cheating?
            console.log("OH OH :(");
        }
        this.prevposition=this.mesh.position;
    }

    rayBetweenTwoPoints(a,b){
        return new BABYLON.Ray(a,b.subtract(a),1);
    }

    update(dt){
        let h=this.health+dt*2.5/1000
        this.health=Math.min(100,h);
    }

    rejectPosition(dt=0)
    {
        let dtg=this.dToGround(this.mesh.position);
        this.mesh.position.y+=(dtg-1>0.002*dt?-0.002*dt:1-dtg)
        this.forcePosition(this.mesh.position.x,this.mesh.position.y,this.mesh.position.z)
    }

    forcePosition(x,y,z){
        this.socket.emit("fixpo",{x:x,y:y,z:z,t:Date.now()});
    }
    
    clientData(){
        return {x:this.mesh.position.x,y:this.mesh.position.y,z:this.mesh.position.z,h:this.health}
    }
}

exports.Player=Player;