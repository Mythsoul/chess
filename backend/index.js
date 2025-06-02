import { Server } from "socket.io";
import http from "http"; 
import express from "express"; 
import { GameManager } from "./src/GameManager.js";

const app = express();
const server = new http.Server(app);

const io = new Server(server, { 
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
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
        console.log("Move received from", socket.id, ":", move);
        const game = gameManager.getGame(socket.id);
        if (game) {
            const moveResult = game.makeMove(socket, move);
            console.log("Move result:", moveResult);
            
            if (moveResult.valid) {
                // Notify both players
                const moveNotification = {
                    type: 'move',
                    ...moveResult,
                    playerId: socket.id
                };

                console.log("Broadcasting to players:", game.player1.id, game.player2.id);
                [game.player1, game.player2].forEach(player => {
                    console.log("Sending gameUpdate to", player.id);
                    player.emit("gameUpdate", moveNotification);
                });

                // If game is over, send additional notification
                if (moveResult.gameOver) {
                    [game.player1, game.player2].forEach(player => {
                        const isWinner = player.id === moveResult.gameOver.winner;
                        player.emit("gameOver", {
                            ...moveResult.gameOver,
                            playerResult: isWinner ? 'win' : (moveResult.gameOver.winner ? 'loss' : 'draw')
                        });
                    });
                }
            } else {
                console.log("Invalid move from", socket.id, ":", moveResult.error);
                // Send error only to player who made invalid move
                socket.emit("moveError", {
                    error: moveResult.error,
                    attempted: move
                });
            }
        } else {
            console.log("No game found for socket", socket.id);
        }
    });

    // Handle resignation
    socket.on("resign", () => {
        console.log("Player resigned:", socket.id);
        const game = gameManager.getGame(socket.id);
        if (game) {
            const resignResult = game.resign(socket);
            if (resignResult.success) {
                // Notify both players with personalized results
                [game.player1, game.player2].forEach(player => {
                    const isWinner = player.id === resignResult.gameResult.winner;
                    player.emit("gameOver", {
                        type: 'resignation',
                        winner: resignResult.gameResult.winner,
                        result: {
                            ...resignResult.gameResult,
                            playerResult: isWinner ? 'win' : 'loss'
                        }
                    });
                });
            }
        }
    });

    // Handle draw offers
    socket.on("offer_draw", () => {
        console.log("Draw offered by:", socket.id);
        const game = gameManager.getGame(socket.id);
        if (game) {
            const drawResult = game.offerDraw(socket);
            if (drawResult.success) {
                if (drawResult.drawAccepted) {
                    // Game ended in draw
                    [game.player1, game.player2].forEach(player => {
                        player.emit("gameOver", {
                            type: 'draw',
                            winner: null,
                            result: drawResult.gameResult
                        });
                    });
                } else {
                    // Offer draw to opponent
                    const opponent = game.getOpponent(socket);
                    opponent.emit("drawOffer", {
                        offeredBy: socket.id
                    });
                    socket.emit("drawOffered", {
                        message: "Draw offer sent"
                    });
                }
            }
        }
    });

    // Handle draw responses
    socket.on("accept_draw", () => {
        console.log("Draw accepted by:", socket.id);
        const game = gameManager.getGame(socket.id);
        if (game) {
            const drawResult = game.offerDraw(socket); // This will accept if opponent offered
            if (drawResult.success && drawResult.drawAccepted) {
                [game.player1, game.player2].forEach(player => {
                    player.emit("gameOver", {
                        type: 'draw',
                        winner: null,
                        result: drawResult.gameResult
                    });
                });
            }
        }
    });

    socket.on("reject_draw", () => {
        console.log("Draw rejected by:", socket.id);
        const game = gameManager.getGame(socket.id);
        if (game) {
            const rejectResult = game.rejectDraw(socket);
            if (rejectResult.success) {
                const opponent = game.getOpponent(socket);
                opponent.emit("drawRejected", {
                    rejectedBy: socket.id
                });
            }
        }
    });

    // Handle leave game
    socket.on("leave_game", () => {
        console.log("Player leaving game:", socket.id);
        const game = gameManager.getGame(socket.id);
        if (game) {
            const resignResult = game.resign(socket);
            if (resignResult.success) {
                const opponent = game.getOpponent(socket);
                opponent.emit("gameOver", {
                    type: 'resignation',
                    winner: resignResult.gameResult.winner,
                    result: resignResult.gameResult
                });
            }
        }
        gameManager.removeUser(socket);
    });
   
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
        
        // Handle game disconnection
        const game = gameManager.getGame(socket.id);
        if (game && !game.gameOver) {
            const disconnectResult = game.handleDisconnect(socket);
            if (disconnectResult) {
                // Notify opponent about disconnection
                const opponent = game.getOpponent(socket);
                opponent.emit("playerDisconnected", {
                    disconnectedPlayer: socket.id,
                    timeout: disconnectResult.timeout,
                    message: "Opponent disconnected. They have 30 seconds to reconnect."
                });
            }
        }
        
        // Remove from matchmaking
        gameManager.waitingPlayers = gameManager.waitingPlayers.filter(p => p.id !== socket.id);
        
        // Note: Don't remove from games immediately - allow for reconnection
    });

    // Handle reconnection
    socket.on("reconnect", (gameId) => {
        console.log("Player attempting to reconnect:", socket.id);
        const game = gameManager.getGame(socket.id);
        if (game) {
            const reconnectResult = game.handleReconnect(socket);
            if (reconnectResult) {
                // Notify opponent about reconnection
                const opponent = game.getOpponent(socket);
                opponent.emit("playerReconnected", {
                    reconnectedPlayer: socket.id,
                    message: "Opponent reconnected. Game continues."
                });
                
                // Send current game state to reconnected player
                socket.emit("gameReconnected", {
                    gameState: reconnectResult.gameState,
                    message: "Reconnected successfully"
                });
            }
        }
    });
});

app.get("/", (req, res) => { 
    res.send("Chess Game Backend is running!"); 
});


const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});