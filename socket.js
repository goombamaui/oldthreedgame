const { Server } = require("socket.io");
const Game=require("./game.js").Game;

let id=0;
function io(server){
    const io = new Server(server);
    const g1 = new Game("g1",io);
    g1.startGame();
    io.on("connection",function(socket){
        let player_id=g1.createPlayer(socket).id;
        socket.on("disconnect",function(){
            g1.deletePlayer(player_id);
        });
    });
    return io;
}

exports.io=io;