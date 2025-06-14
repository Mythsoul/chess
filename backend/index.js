import { Server } from "socket.io";
import http from "http"; 
import express from "express"; 
import { GameManager } from "./src/GameManager.js";
import { db } from "./src/database.js";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const server = new http.Server(app);

// CORS configuration
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
};

app.use(cors(corsOptions));

const io = new Server(server, { 
    cors: corsOptions
});

const gameManager = new GameManager();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Authentication
    socket.on("authenticate", async (userData) => {
        console.log("User authenticating:", userData);
        await gameManager.authenticateUser(socket, userData);
    });

    // Init game request
    socket.on("init_game", async () => {
        console.log("Player requesting game:", socket.id);
        await gameManager.addToMatchmaking(socket);
    });

    // Cancel matchmaking
    socket.on("cancel_matchmaking", () => {
        gameManager.waitingPlayers = gameManager.waitingPlayers.filter(p => p.socket.id !== socket.id);
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
                // Include time information in the move result
                moveResult.timeRemaining = game.getTimeRemaining();
                
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

                // If game is over, stop all timers and send additional notification
                if (moveResult.gameOver) {
                    game.stopAllTimers();
                    [game.player1, game.player2].forEach(player => {
                        const isWinner = player.id === moveResult.gameOver.winner;
                        player.emit("gameOver", {
                            ...moveResult.gameOver,
                            playerResult: isWinner ? 'win' : (moveResult.gameOver.winner ? 'loss' : 'draw')
                        });
                    });
                    
                    // Clean up the game
                    setTimeout(() => gameManager.cleanupGame(game), 5000); // 5 second delay
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
                console.log("Resignation successful:", resignResult.gameResult);
                
                // Stop all timers
                game.stopAllTimers();
                
                // Notify both players with personalized results
                [game.player1, game.player2].forEach(player => {
                    const isWinner = (player === game.player1 ? game.whitePlayer.id : game.blackPlayer.id) === resignResult.gameResult.winner;
                    player.emit("gameOver", {
                        type: 'resignation',
                        winner: resignResult.gameResult.winner,
                        winnerColor: resignResult.gameResult.winnerColor,
                        resignedBy: resignResult.gameResult.resignedBy,
                        resignedColor: resignResult.gameResult.resignedColor,
                        reason: resignResult.gameResult.reason,
                        playerResult: isWinner ? 'win' : 'loss'
                    });
                });
                
                // Clean up the game after resignation
                setTimeout(() => gameManager.cleanupGame(game), 5000); // 5 second delay
            } else {
                socket.emit("error", { message: resignResult.error });
            }
        } else {
            socket.emit("error", { message: "No active game found" });
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
                    // Stop all timers
                    game.stopAllTimers();
                    
                    // Game ended in draw
                    [game.player1, game.player2].forEach(player => {
                        player.emit("gameOver", {
                            type: 'draw',
                            winner: null,
                            result: drawResult.gameResult,
                            playerResult: 'draw'
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
                // Stop all timers
                game.stopAllTimers();
                
                [game.player1, game.player2].forEach(player => {
                    player.emit("gameOver", {
                        type: 'draw',
                        winner: null,
                        result: drawResult.gameResult,
                        playerResult: 'draw'
                    });
                });
                
                // Clean up the game after draw
                setTimeout(() => gameManager.cleanupGame(game), 5000); // 5 second delay
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
                    result: resignResult.gameResult,
                    playerResult: 'win'
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
        gameManager.waitingPlayers = gameManager.waitingPlayers.filter(p => p.socket.id !== socket.id);
        
        // Note: Don't remove from games immediately - allow for reconnection
    });

    // Handle reconnection
    socket.on("reconnect_to_game", async ({ gameRoute, userData }) => {
        console.log("Player attempting to reconnect to game:", gameRoute, "User:", userData?.username);
        
        try {
            // First, authenticate the user
            if (userData) {
                await gameManager.authenticateUser(socket, userData);
            }
            
            const user = gameManager.getUserBySocket(socket.id);
            if (!user) {
                socket.emit('reconnect_failed', { error: 'Authentication required' });
                return;
            }
            
            // Get the game from memory (active games) or database (if needed to restore)
            let game = gameManager.getGameByRoute(gameRoute);
            
            if (!game) {
                // Try to get from database and restore if it's an active game
                const dbGame = await db.getGameByRoute(gameRoute);
                if (!dbGame || dbGame.status !== 'active') {
                    socket.emit('reconnect_failed', { error: 'Game not found or no longer active' });
                    return;
                }
                
                // Check if user is part of this game
                if (!gameManager.canUserAccessGame(user.id, dbGame)) {
                    socket.emit('reconnect_failed', { error: 'Not authorized for this game' });
                    return;
                }
                
                // For now, reject reconnection to games not in memory
                // TODO: Implement game restoration from database
                socket.emit('reconnect_failed', { error: 'Game session expired. Please start a new game.' });
                return;
            }
            
            // Check if user is part of this game
            if (!game.isPlayerInGame(user.id)) {
                socket.emit('reconnect_failed', { error: 'Not authorized for this game' });
                return;
            }
            
            // Update socket reference in game
            if (user.id === game.whitePlayer.id) {
                game.player1 = socket;
            } else if (user.id === game.blackPlayer.id) {
                game.player2 = socket;
            }
            
            // Update mappings
            gameManager.userGames.set(socket.id, gameRoute);
            
            // Handle reconnection in game
            const reconnectResult = game.handleReconnect(socket);
            
            if (reconnectResult && reconnectResult.reconnected) {
                // Notify opponent about reconnection
                const opponent = game.getOpponent(socket);
                if (opponent) {
                    opponent.emit("playerReconnected", {
                        reconnectedPlayer: socket.id,
                        message: "Opponent reconnected. Game continues."
                    });
                }
                
                // Send current game state to reconnected player
                socket.emit("game_reconnected", {
                    gameState: game.getCurrentGameState(),
                    message: "Reconnected successfully",
                    playerColor: user.id === game.whitePlayer.id ? 'white' : 'black'
                });
                
                console.log(`Player ${user.username} successfully reconnected to game ${gameRoute}`);
            } else {
                socket.emit('reconnect_failed', { error: 'Failed to reconnect to game' });
            }
        } catch (error) {
            console.error('Error during reconnection:', error);
            socket.emit('reconnect_failed', { error: 'Reconnection failed' });
        }
    });
});

// Middleware
app.use(express.json());

// Routes
app.get("/", (req, res) => { 
    res.send("Chess Game Backend is running!"); 
});

// Get game by route
app.get("/game/:route", async (req, res) => {
    try {
        const { route } = req.params;
        const game = await db.getGameByRoute(route);
        
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }
        
        res.json({
            id: game.id,
            route: game.route,
            status: game.status,
            whitePlayer: {
                id: game.whitePlayer.id,
                username: game.whitePlayer.username,
                rating: game.whitePlayer.rating,
                avatar: game.whitePlayer.avatar
            },
            blackPlayer: {
                id: game.blackPlayer.id,
                username: game.blackPlayer.username,
                rating: game.blackPlayer.rating,
                avatar: game.blackPlayer.avatar
            },
            moves: game.moves,
            pgn: game.pgn,
            fen: game.fen,
            result: game.result,
            endReason: game.endReason,
            startedAt: game.startedAt,
            endedAt: game.endedAt
        });
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get user's active games
app.get("/user/:userId/games/active", async (req, res) => {
    try {
        const { userId } = req.params;
        const games = await db.getActiveGamesForUser(userId);
        
        res.json(games.map(game => ({
            id: game.id,
            route: game.route,
            status: game.status,
            whitePlayer: {
                id: game.whitePlayer.id,
                username: game.whitePlayer.username,
                rating: game.whitePlayer.rating
            },
            blackPlayer: {
                id: game.blackPlayer.id,
                username: game.blackPlayer.username,
                rating: game.blackPlayer.rating
            },
            startedAt: game.startedAt
        })));
    } catch (error) {
        console.error('Error fetching user games:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get user's game history
app.get("/user/:userId/games/history", async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const games = await db.getUserGameHistory(userId, limit);
        
        res.json(games.map(game => ({
            id: game.id,
            route: game.route,
            status: game.status,
            result: game.result,
            endReason: game.endReason,
            whitePlayer: {
                id: game.whitePlayer.id,
                username: game.whitePlayer.username,
                rating: game.whitePlayer.rating
            },
            blackPlayer: {
                id: game.blackPlayer.id,
                username: game.blackPlayer.username,
                rating: game.blackPlayer.rating
            },
            startedAt: game.startedAt,
            endedAt: game.endedAt
        })));
    } catch (error) {
        console.error('Error fetching user game history:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create or get user
app.post("/user", async (req, res) => {
    try {
        const { email, username, avatar } = req.body;
        
        let user = await db.getUserByEmail(email);
        if (!user) {
            user = await db.createUser({
                email,
                username: username || email.split('@')[0],
                avatar: avatar || null
            });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error creating/getting user:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Join game by route (for spectating or rejoining)
app.post("/game/:route/join", async (req, res) => {
    try {
        const { route } = req.params;
        const { userId } = req.body;
        
        const game = await db.getGameByRoute(route);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }
        
        // Check if user is part of this game
        const isPlayer = game.whiteId === userId || game.blackId === userId;
        
        // Check access permissions
        if (!isPlayer) {
            // For non-players, only allow access to completed games that aren't guest-only
            if (game.status === 'active') {
                return res.status(403).json({ error: "You are not authorized to view this active game" });
            }
            
            // Check if both players are guests
            const whiteIsGuest = game.whitePlayer.email?.includes('@chess.local') || game.whitePlayer.email?.startsWith('guest_');
            const blackIsGuest = game.blackPlayer.email?.includes('@chess.local') || game.blackPlayer.email?.startsWith('guest_');
            
            if (whiteIsGuest && blackIsGuest) {
                return res.status(404).json({ error: "Game not found" });
            }
        }
        
        res.json({
            game: {
                id: game.id,
                route: game.route,
                status: game.status,
                whitePlayer: {
                    id: game.whitePlayer.id,
                    username: game.whitePlayer.username,
                    rating: game.whitePlayer.rating,
                    avatar: game.whitePlayer.avatar
                },
                blackPlayer: {
                    id: game.blackPlayer.id,
                    username: game.blackPlayer.username,
                    rating: game.blackPlayer.rating,
                    avatar: game.blackPlayer.avatar
                },
                moves: game.moves,
                pgn: game.pgn,
                fen: game.fen,
                result: game.result,
                endReason: game.endReason,
                startedAt: game.startedAt,
                endedAt: game.endedAt
            },
            isPlayer,
            playerColor: isPlayer ? (game.whiteId === userId ? 'white' : 'black') : null
        });
    } catch (error) {
        console.error('Error joining game:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});


const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});