import { Server } from "socket.io";
import http from "http"; 
import express from "express"; 
import { GameManager } from "./src/GameManager.js";
const app = express();
const server = new http.Server(app);

const io = new Server(server , { 
    cors : { 
        origin : "*"
    }
});

const gameManager = new GameManager();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Init game request
    socket.on("init_game", () => {
        console.log("Player requesting game:", socket.id);
        gameManager.addToMatchmaking(socket);
    });

    // Cancel matchmaking
    socket.on("cancel_matchmaking", () => {
        gameManager.waitingPlayers = gameManager.waitingPlayers.filter(p => p.id !== socket.id);
        socket.emit("matchmaking_cancelled");
    });

    // Handle game moves
    socket.on("move", (move) => {
        const game = gameManager.getGame(socket.id);
        if (game) {
            const moveResult = game.makeMove(socket, move);
            
            if (moveResult.valid) {
                // Notify both players
                const moveNotification = {
                    type: 'move',
                    ...moveResult,
                    playerId: socket.id
                };

                [game.player1, game.player2].forEach(player => {
                    player.emit("gameUpdate", moveNotification);
                });

                // If game is over, send additional notification
                if (moveResult.gameOver) {
                    [game.player1, game.player2].forEach(player => {
                        player.emit("gameOver", moveResult.gameOver);
                    });
                }
            } else {
                // Send error only to player who made invalid move
                socket.emit("moveError", {
                    error: moveResult.error,
                    attempted: move
                });
            }
        }
    });
   
    socket.on("disconnect", () => {
        gameManager.removeUser(socket);
        gameManager.waitingPlayers = gameManager.waitingPlayers.filter(p => p.id !== socket.id);
    });
});


app.get("/" , (req , res) =>{ 
    res.send("Hello World"); 
})  

server.listen(8080 , ()=>  { 
    console.log("Server is running on port 3000");  
})