import { Server } from "socket.io";
import http from "http"; 
import express from "express"; 
import { GameManager } from "./src/GameManager";

const server = new http.Server(app);

const io = new Server(server , { 
    cors : { 
        origin : "*"
    }
});

const GameManager = new GameManager(); 

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    GameManager.addUser(socket); 
    io.on("disconnect" , () =>{
        GameManager.removeUser(socket);
    })
});


app.get("/" , (req , res) =>{ 
    res.send("Hello World"); 
})  

server.listen(3000 , ()=>  { 
    console.log("Server is running on port 3000");  
})