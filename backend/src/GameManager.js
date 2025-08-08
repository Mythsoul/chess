import { Game } from "./Game.js";

export class GameManager {
    constructor() {
        this.games = new Map();
        this.users = new Map();
        this.waitingPlayers = []; 
    }

    addUser(socket) {
        this.users.set(socket.id, socket);
        if (!this.waitingPlayer) {
            this.waitingPlayer = socket;
        } else {
            this.createGame(this.waitingPlayer, socket);
            this.waitingPlayer = null;
        }
    }

    removeUser(socket) {
        this.users.delete(socket.id);
        if (this.waitingPlayer === socket) {
            this.waitingPlayer = null;
        }
    }

    addToMatchmaking(socket) {
        this.waitingPlayers.push(socket);
        socket.emit("waiting", { message: "Waiting for opponent..." });
        this.tryMatchPlayers();
    }

    tryMatchPlayers() {
        if (this.waitingPlayers.length >= 2) {
            const player1 = this.waitingPlayers.shift();
            const player2 = this.waitingPlayers.shift();
            const game = this.createGame(player1, player2);
            
            // Notify players
            [player1, player2].forEach((player, index) => {
                player.emit("game_start", {
                    gameId: game.id,
                    color: index === 0 ? "white" : "black",
                    opponent: { id: index === 0 ? player2.id : player1.id }
                });
            });
        }
    }

    createGame(player1, player2) {
        const game = new Game(player1, player2);
        this.games.set(player1.id, game);
        this.games.set(player2.id, game);
        return game;
    }

    getGame(socketId) {
        return this.games.get(socketId);
    }
}