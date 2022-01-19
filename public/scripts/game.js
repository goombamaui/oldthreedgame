class Game{
    constructor(engine,scene,canvas){
        this.engine=engine;
        this.scene=scene;
        this.socket=io();
        this.socket.on("message",(r)=>this.messageHandler(r))
        this.players={};
        this.projectiles={};
        this.my_player=null;
        this.camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(-10, 0, -10), scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.attachControl(canvas, true);
        this.camera.inertia=0;
        this.camera.minZ=0;
        this.setupListeners();
    }

    messageHandler(r){
        if(r.type=="update")
        {
            let i;
            for(i in r.data.players){
                this.updatePlayer(i,r.data.players[i]);
            }
            this.updateProjectiles(r.data.projectiles);
            return;
        }
        if(r.type=="newp")
            this.createPlayer(r.data);
        else if(r.type=="unewp")
            this.createMyPlayer(r.data);
        else if (r.type=="delp")
            this.deletePlayer(r.data);
        else if (r.type=="clearp")
            this.clearPlayer(r.data);
        else if (r.type=="allp")
            r.data.forEach(k=>this.createPlayer(k));
    }

    createPlayer(r){
        this.players[r.id]=new Player(this.scene,r.id,r.team);
    }

    updateProjectiles(data){
        let proj_ids=Object.keys(this.projectiles);
        for(let id in data){
            let server_proj=data[id], proj=this.projectiles[id];
            let spos=new BABYLON.Vector3(server_proj.x,server_proj.y,server_proj.z);
            if(proj==undefined)
                this.projectiles[id]=new Projectile(this.scene,id,spos,new BABYLON.Vector3(0,0,0));
            else
                proj.moveTo(spos);
            proj_ids.splice(proj_ids.indexOf(id),1);
        }
        let del_proj;
        for(let i of proj_ids){
            del_proj=this.projectiles[i];
            del_proj.dispose();
            delete this.projectiles[i];
        }
    }

    createProjectile(d){
        try{this.projectiles[d.id].dispose()}catch(err){};
    }

    createMyPlayer(r){
        this.my_player=new MyPlayer(this.scene,r.id,this.socket,this.camera);
        this.players[r.id]=this.my_player;
    }

    deletePlayer(r){
        this.players[r.id].dispose();
        delete this.players[r.id];
    }

    updatePlayer(i,d){
        try{
            this.players[i].update(d);
        }catch(e){}
    }

    renderPlayers(){
        for (let i in this.players)
            this.players[i].interpolateMovement();
    }

    renderProjectiles(){
        for( let i in this.projectiles ){
            this.projectiles[i].interpolateMovement();
        }
    }

    render(){this.renderPlayers();this.renderProjectiles()}

    setupListeners(){
        document.addEventListener("keydown",(r)=>{
            if(r.key=="w")
                this.my_player.movement.w=true;
            else if (r.key=="s")
                this.my_player.movement.s=true;
            else if (r.key=="d")
                this.my_player.movement.d=true;
            else if (r.key=="a")
                this.my_player.movement.a=true;
            else if (r.key==" ")
                this.my_player.movement.space=true;
        });
        document.addEventListener("keyup",(r)=>{
            if(r.key=="w")
                this.my_player.movement.w=false;
            else if (r.key=="s")
                this.my_player.movement.s=false;
            else if (r.key=="d")
                this.my_player.movement.d=false;
            else if (r.key=="a")
                this.my_player.movement.a=false;
            else if (r.key==" ")
                this.my_player.movement.space=false;
            else if (r.key=="e")
                autoshoot=!autoshoot;
        });
        let shooting=false;
        let autoshoot=false;
        document.addEventListener("mousedown",(r) => {
            if(r.button==0)
                shooting=true;
        })
        document.addEventListener("mouseup",(r)=>{
            if(r.button==0)
                shooting=false;
        })

        setInterval(()=>{(autoshoot||shooting)&&this.my_player.shoot()},50)
    }

    updateClientPosition(){

    }
}