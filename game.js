const Player = require("./player.js").Player;
const BABYLON = require("babylonjs");
const BABYLON_LOADERS = require('babylonjs-loaders');
const mazeMap = require("./public/scripts/maze_map.js").mazeMap;
const Projectile = require("./projectile.js").Projectile;
global.XMLHttpRequest = require('xhr2').XMLHttpRequest;

class Game{
    constructor(name,io){
        this.current_player_id=0;
        this.current_projectile_id=0;
        this.name=name;
        this.io=io;
        this.players={};
        this.projectiles=[];
        this.engine=new BABYLON.NullEngine();
        this.cli_upd_int=0;
        this.game_upd_int=0;
        this.prev_frame=0;
    }

    startGame(){
        this.scene=new BABYLON.Scene(this.engine);
        mazeMap(this.scene,"http://localhost/");
        let mock_camera=new BABYLON.UniversalCamera("mockcam",new BABYLON.Vector3(0,0,0),this.scene);
        this.cli_upd_int=setInterval(()=>{this.updateClients()},33);
        this.game_upd_int=setInterval(()=>{this.updateGame();},33);
    }

    updateGame(){
        let t=Date.now(),dt=t-this.prev_frame;
        try{
            this.scene.render();
        } catch(err){}
        this.updateAllProjectiles();
        for(let i in this.players)
            this.players[i].update(dt);
        this.prev_frame=t;
    }

    createPlayer(sock){
        let currid=this.current_player_id;
        this.current_player_id+=1;
        if(this.current_player_id>Number.MAX_SAFE_INTEGER)
            this.current_player_id=0;
        sock.join(this.name);
        let new_player=new Player(sock,currid,this.scene,this);
        this.players[currid]=new_player;
        sock.to(this.name).emit("message",{type:"newp",data:{id:currid}});
        sock.send({type:"unewp",data:{id:currid}});
        this.sendAllPlayers(currid);
        return new_player;
    }

    createProjectile(ty,p,v,o)
    {
        let currid=this.current_projectile_id;
        this.current_projectile_id+=1;
        if(this.current_projectile_id>Number.MAX_SAFE_INTEGER)
            this.current_projectile_id=0;
        this.projectiles.push(new Projectile(currid,ty,p.add(new BABYLON.Vector3(0,0,0)),v.scale(100),o,1000,this.scene));
    }

    updateAllProjectiles()
    {
        for(let i=this.projectiles.length-1;i>=0;i--)
        {
            let proj=this.projectiles[i],hit=proj.move();
            if(hit!==false)
            {
                this.projectiles.splice(i,1);
                if(hit!==true)
                {
                    this.players[hit].dealDamage(20);
                }
            }
        }
    }

    sendAllPlayers(player_id){
        let packet=[],sock,ply;
        for(let i in this.players){
            ply=this.players[i];
            if(ply.id==player_id){
                sock=ply.socket;
            } else {
                packet.push({id:ply.id});
            }
        }
        this.players[player_id].socket.send({type:"allp",data:packet});
    }

    deletePlayer(id){
        let del_player=this.players[id];
        this.io.to(this.name).emit("message",{type:"delp",data:{id:id}});
        del_player.dispose();
        delete this.players[id];
    }

    updateClients(){
        let packet={"players":{},"projectiles":{}},i;
        for(i in this.players){
            packet.players[i]=this.players[i].clientData();
        }
        for(i of this.projectiles)
            packet.projectiles[i.id]=i.clientData();
        this.io.to(this.name).emit("message",{type:"update",data:packet})
    }
}

exports.Game=Game;