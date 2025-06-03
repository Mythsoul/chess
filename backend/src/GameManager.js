import { Game } from "./Game.js";
import { db } from "./database.js";
import { nanoid } from "nanoid";

export class GameManager {
    constructor() {
        this.games = new Map(); // gameRoute -> Game instance
        this.userGames = new Map(); // socketId -> gameRoute
        this.userSockets = new Map(); // userId -> socket
        this.socketUsers = new Map(); // socketId -> user
        this.waitingPlayers = []; // array of { socket, user }
    }

    // Authenticate user and store mapping
    async authenticateUser(socket, userData) {
        try {
            let user;
            if (userData.id) {
                // Get existing user
                user = await db.getUserById(userData.id);
            } else if (userData.email) {
                // Get user by email or create if doesn't exist
                user = await db.getUserByEmail(userData.email);
                if (!user) {
                    user = await db.createUser({
                        email: userData.email,
                        username: userData.username || userData.email.split('@')[0],
                        avatar: userData.avatar || null
                    });
                }
            } else {
                // Create guest user
                user = await db.createUser({
                    email: `guest_${nanoid(8)}@chess.local`,
                    username: userData.username || `Guest${nanoid(4)}`,
                    avatar: userData.avatar || null
                });
            }

            // Store user-socket mapping
            this.socketUsers.set(socket.id, user);
            this.userSockets.set(user.id, socket);
            socket.userId = user.id;
            socket.user = user;
            
            socket.emit('authenticated', { user });
            return user;
        } catch (error) {
            console.error('Authentication error:', error);
            socket.emit('auth_error', { error: 'Authentication failed' });
            return null;
        }
    }

    // Add user to matchmaking queue
    async addToMatchmaking(socket) {
        let user = this.socketUsers.get(socket.id);
        if (!user) {
            // Auto-authenticate as guest user for backwards compatibility
            console.log('Auto-authenticating user as guest:', socket.id);
            user = await this.authenticateUser(socket, { 
                username: `Guest${nanoid(4)}` 
            });
            if (!user) {
                socket.emit('error', { message: 'Authentication failed' });
                return;
            }
        }

        // Check if user is already in a game
        if (this.userGames.has(socket.id)) {
            const existingGameRoute = this.userGames.get(socket.id);
            socket.emit('already_in_game', { gameRoute: existingGameRoute });
            return;
        }

        // Check if user is already waiting
        const alreadyWaiting = this.waitingPlayers.find(p => p.user.id === user.id);
        if (alreadyWaiting) {
            socket.emit('already_waiting', { message: 'Already in matchmaking queue' });
            return;
        }

        // Add to waiting players
        this.waitingPlayers.push({ socket, user });
        socket.emit('waiting', { message: 'Waiting for opponent...' });
        
        await this.tryMatchPlayers();
    }

    // Try to match waiting players
    async tryMatchPlayers() {
        while (this.waitingPlayers.length >= 2) {
            const player1 = this.waitingPlayers.shift();
            const player2 = this.waitingPlayers.shift();
            
            // Prevent self-matching
            if (player1.user.id === player2.user.id) {
                console.log('Prevented self-match for user:', player1.user.id);
                // Put player2 back in queue and try again
                this.waitingPlayers.unshift(player2);
                // Put player1 back too if there are no other players
                if (this.waitingPlayers.length === 1) {
                    this.waitingPlayers.unshift(player1);
                    break;
                }
                continue;
            }
            
            await this.createGame(player1, player2);
        }
    }

    // Create a new game with database persistence
    async createGame(player1, player2) {
        try {
            // Create game in database
            const dbGame = await db.createGame(player1.user.id, player2.user.id);
            
            // Create game instance
            const game = new Game(player1.socket, player2.socket, {
                id: dbGame.id,
                route: dbGame.route,
                whitePlayer: player1.user,
                blackPlayer: player2.user
            });
            
            // Store game mappings
            this.games.set(dbGame.route, game);
            this.userGames.set(player1.socket.id, dbGame.route);
            this.userGames.set(player2.socket.id, dbGame.route);
            
            // Notify players with game route
            player1.socket.emit('game_start', {
                gameId: dbGame.id,
                gameRoute: dbGame.route,
                color: 'white',
                opponent: { 
                    id: player2.user.id, 
                    username: player2.user.username,
                    rating: player2.user.rating,
                    avatar: player2.user.avatar
                },
                player: {
                    id: player1.user.id,
                    username: player1.user.username,
                    rating: player1.user.rating,
                    avatar: player1.user.avatar
                }
            });
            
            player2.socket.emit('game_start', {
                gameId: dbGame.id,
                gameRoute: dbGame.route,
                color: 'black',
                opponent: { 
                    id: player1.user.id, 
                    username: player1.user.username,
                    rating: player1.user.rating,
                    avatar: player1.user.avatar
                },
                player: {
                    id: player2.user.id,
                    username: player2.user.username,
                    rating: player2.user.rating,
                    avatar: player2.user.avatar
                }
            });
            
            console.log(`Game created: ${dbGame.route} between ${player1.user.username} vs ${player2.user.username}`);
            return game;
        } catch (error) {
            console.error('Error creating game:', error);
            player1.socket.emit('error', { message: 'Failed to create game' });
            player2.socket.emit('error', { message: 'Failed to create game' });
        }
    }

    // Get game by socket ID
    getGame(socketId) {
        const gameRoute = this.userGames.get(socketId);
        return gameRoute ? this.games.get(gameRoute) : null;
    }

    // Get game by route
    getGameByRoute(route) {
        return this.games.get(route);
    }

    // Remove user from system
    removeUser(socket) {
        const user = this.socketUsers.get(socket.id);
        if (user) {
            // Remove from waiting players
            this.waitingPlayers = this.waitingPlayers.filter(p => p.user.id !== user.id);
            
            // Clean up mappings
            this.socketUsers.delete(socket.id);
            this.userSockets.delete(user.id);
            
            const gameRoute = this.userGames.get(socket.id);
            if (gameRoute) {
                this.userGames.delete(socket.id);
                // Note: Don't remove game immediately, allow for reconnection
            }
        }
    }

    // Handle reconnection
    async reconnectUser(socket, gameRoute) {
        const game = this.games.get(gameRoute);
        if (!game) {
            socket.emit('reconnect_failed', { error: 'Game not found' });
            return false;
        }

        const user = this.socketUsers.get(socket.id);
        if (!user) {
            socket.emit('reconnect_failed', { error: 'User not authenticated' });
            return false;
        }

        // Check if user is actually part of this game
        if (!game.isPlayerInGame(user.id)) {
            socket.emit('reconnect_failed', { error: 'Not authorized for this game' });
            return false;
        }

        // Update socket reference in game
        if (user.id === game.whitePlayer.id) {
            game.player1 = socket;
        } else {
            game.player2 = socket;
        }

        // Update mappings
        this.userGames.set(socket.id, gameRoute);
        
        const reconnectResult = game.handleReconnect(socket);
        return reconnectResult;
    }
}
