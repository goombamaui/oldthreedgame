const express = require ('express');
const http = require ('http');
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 80;

app.use(express.static('public'))

const io=require("./socket.js").io(server);


app.get('/', (req,res) => {
    res.sendFile('views/index.html',{root:__dirname});
});

server.listen(port, () => {
    console.log("App starting at port "+port);
});