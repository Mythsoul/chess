import { Chess } from "chess.js";
import { db } from "./database.js";

export class Game {
    player1 = null; // socket
    player2 = null; // socket
    moves = [];
    winner = null;
    chess = null;
    gameOver = false;
    gameResult = null;
    drawOffers = new Set();
    disconnectedPlayers = new Set();
    disconnectTimers = new Map();
    gameStartTime = null;
    lastMoveTime = null;
    
    // Database info
    id = null;
    route = null;
    whitePlayer = null; // user object
    blackPlayer = null; // user object
    
    // Premove system
    premoves = new Map(); // socketId -> premove object
    
    constructor(player1Socket, player2Socket, gameData = {}) {
        this.player1 = player1Socket; // white player socket
        this.player2 = player2Socket; // black player socket
        this.chess = new Chess();
        this.gameStartTime = Date.now();
        this.lastMoveTime = Date.now();
        
        // Database info
        this.id = gameData.id;
        this.route = gameData.route;
        this.whitePlayer = gameData.whitePlayer;
        this.blackPlayer = gameData.blackPlayer;
        
        // Time controls (10 minutes each side)
        this.timeControl = {
            initial: 10 * 60 * 1000, // 10 minutes in milliseconds
            increment: 0 // no increment for now
        };
        
        this.timeRemaining = {
            white: this.timeControl.initial,
            black: this.timeControl.initial
        };
        
        this.timeTimers = {
            white: null,
            black: null
        };
        
        this.activeTimer = null;
        this.startTimer('white'); // White starts
    }
  
    makeMove(socket, move) {
        const isPlayer1Turn = this.moves.length % 2 === 0;
        const currentPlayer = isPlayer1Turn ? this.player1 : this.player2;
        const otherPlayer = isPlayer1Turn ? this.player2 : this.player1;

        console.log("Move validation:");
        console.log("- Total moves:", this.moves.length);
        console.log("- Is player1 turn:", isPlayer1Turn);
        console.log("- Current player ID:", currentPlayer.id);
        console.log("- Requesting player ID:", socket.id);
        console.log("- Players match:", socket === currentPlayer);

        if (socket !== currentPlayer) {
            return {
                valid: false,
                error: 'Not your turn',
                color: isPlayer1Turn ? 'white' : 'black'
            };
        }

        try {
            const result = this.chess.move(move);
            if (result) {
                this.moves.push(result);
                this.lastMoveTime = Date.now();
                
                // Switch timer after a successful move
                this.switchTimer();
                
                const gameState = {
                    valid: true,
                    move: result,
                    fen: this.chess.fen(),
                    lastMove: {
                        from: result.from,
                        to: result.to,
                        piece: result.piece,
                        color: result.color,
                        san: result.san
                    },
                    isCheck: this.chess.isCheck(),
                    isCheckmate: this.chess.isCheckmate(),
                    isDraw: this.chess.isDraw(),
                    isGameOver: this.chess.isGameOver(),
                    turn: this.chess.turn()
                };

                // Persist move to database
                this.saveMoveToDatabase(result);

                // Check for premove execution after the move
                let premoveResult = null;
                if (!this.chess.isGameOver()) {
                    // Try to execute opponent's premove
                    premoveResult = this.executePremove(otherPlayer);
                    if (premoveResult && premoveResult.success) {
                        // Premove was executed successfully
                        this.moves.push(premoveResult.move);
                        this.lastMoveTime = Date.now();
                        this.switchTimer(); // Switch timer again for premove
                        
                        // Update game state with premove
                        gameState.premoveExecuted = {
                            move: premoveResult.move,
                            fen: this.chess.fen(),
                            turn: this.chess.turn(),
                            isCheck: this.chess.isCheck(),
                            isCheckmate: this.chess.isCheckmate(),
                            isDraw: this.chess.isDraw(),
                            isGameOver: this.chess.isGameOver()
                        };
                        
                        // Save premove to database
                        this.saveMoveToDatabase(premoveResult.move);
                        
                        // Check if game ended after premove
                        if (this.chess.isGameOver()) {
                            if (this.chess.isCheckmate()) {
                                this.winner = otherPlayer;
                                this.gameOver = true;
                                const winnerId = otherPlayer === this.player1 ? this.whitePlayer.id : this.blackPlayer.id;
                                this.gameResult = {
                                    winner: winnerId,
                                    reason: 'checkmate',
                                    winnerColor: otherPlayer === this.player1 ? 'white' : 'black'
                                };
                                gameState.premoveExecuted.gameOver = this.gameResult;
                                this.endGameInDatabase('1-0', 'checkmate', winnerId);
                            } else if (this.chess.isDraw() || this.chess.isStalemate()) {
                                this.gameOver = true;
                                this.gameResult = {
                                    winner: null,
                                    reason: this.chess.isStalemate() ? 'stalemate' : 'draw'
                                };
                                gameState.premoveExecuted.gameOver = this.gameResult;
                                this.endGameInDatabase('1/2-1/2', this.chess.isStalemate() ? 'stalemate' : 'draw', null);
                            }
                        }
                    }
                }

                if (this.chess.isGameOver()) {
                    if (this.chess.isCheckmate()) {
                        this.winner = socket;
                        this.gameOver = true;
                        const winnerId = socket === this.player1 ? this.whitePlayer.id : this.blackPlayer.id;
                        this.gameResult = {
                            winner: winnerId,
                            reason: 'checkmate',
                            winnerColor: socket === this.player1 ? 'white' : 'black'
                        };
                        gameState.gameOver = this.gameResult;
                        
                        // End game in database
                        this.endGameInDatabase('1-0', 'checkmate', winnerId);
                    } else if (this.chess.isDraw() || this.chess.isStalemate()) {
                        this.gameOver = true;
                        this.gameResult = {
                            winner: null,
                            reason: this.chess.isStalemate() ? 'stalemate' : 'draw'
                        };
                        gameState.gameOver = this.gameResult;
                        
                        // End game in database
                        this.endGameInDatabase('1/2-1/2', this.chess.isStalemate() ? 'stalemate' : 'draw', null);
                    }
                }

                return gameState;
            }
            return { valid: false, error: 'Invalid move' };
        } catch (e) {
            return { valid: false, error: 'Invalid move format' };
        }
    }
    
    getGameState() {
        return {
            board: this.chess.board(),
            turn: this.chess.turn(),
            isCheck: this.chess.isCheck(),
            isGameOver: this.chess.isGameOver(),
            winner: this.winner?.id || null
        };
    }

    resign(socket) {
        if (this.gameOver) {
            return { success: false, error: 'Game is already over' };
        }

        const isPlayer1 = socket === this.player1;
        const winner = isPlayer1 ? this.player2 : this.player1;
        const resigningPlayerColor = isPlayer1 ? 'white' : 'black';
        const winnerId = isPlayer1 ? this.blackPlayer.id : this.whitePlayer.id;
        
        this.gameOver = true;
        this.winner = winner;
        this.gameResult = {
            winner: winnerId,
            reason: 'resignation',
            resignedBy: socket.id,
            resignedColor: resigningPlayerColor,
            winnerColor: resigningPlayerColor === 'white' ? 'black' : 'white'
        };

        // End game in database
        const result = resigningPlayerColor === 'white' ? '0-1' : '1-0';
        this.endGameInDatabase(result, 'resignation', winnerId);

        return {
            success: true,
            gameResult: this.gameResult
        };
    }

    offerDraw(socket) {
        if (this.gameOver) {
            return { success: false, error: 'Game is already over' };
        }

        const otherPlayer = socket === this.player1 ? this.player2 : this.player1;
        
        // If other player already offered a draw, accept it
        if (this.drawOffers.has(otherPlayer.id)) {
            this.gameOver = true;
            this.gameResult = {
                winner: null,
                reason: 'draw_agreement',
                agreedBy: [this.player1.id, this.player2.id]
            };
            
            // End game in database
            this.endGameInDatabase('1/2-1/2', 'draw_agreement', null);
            
            return {
                success: true,
                drawAccepted: true,
                gameResult: this.gameResult
            };
        }

        // Add draw offer
        this.drawOffers.add(socket.id);
        return {
            success: true,
            drawOffered: true,
            offeredBy: socket.id
        };
    }

    rejectDraw(socket) {
        const otherPlayer = socket === this.player1 ? this.player2 : this.player1;
        this.drawOffers.delete(otherPlayer.id);
        
        return {
            success: true,
            drawRejected: true
        };
    }

    handleDisconnect(socket) {
        if (this.gameOver) return null;

        const isPlayer1 = socket === this.player1;
        const disconnectedPlayer = socket;
        const remainingPlayer = isPlayer1 ? this.player2 : this.player1;
        
        this.disconnectedPlayers.add(socket.id);
        
        // Set a timer for automatic win (30 seconds)
        const timer = setTimeout(() => {
            if (!this.gameOver && this.disconnectedPlayers.has(socket.id)) {
                this.gameOver = true;
                this.winner = remainingPlayer;
                this.gameResult = {
                    winner: remainingPlayer.id,
                    reason: 'abandonment',
                    abandonedBy: socket.id,
                    abandonedColor: isPlayer1 ? 'white' : 'black'
                };
                
                // Notify remaining player
                remainingPlayer.emit('gameOver', {
                    type: 'abandonment',
                    winner: remainingPlayer.id,
                    result: this.gameResult,
                    playerResult: 'win'
                });
            }
        }, 30000); // 30 second timeout
        
        this.disconnectTimers.set(socket.id, timer);
        
        return {
            timeout: 30000,
            disconnectedPlayer: socket.id
        };
    }
    
    handleReconnect(socket) {
        if (this.disconnectedPlayers.has(socket.id)) {
            // Clear disconnect timer
            const timer = this.disconnectTimers.get(socket.id);
            if (timer) {
                clearTimeout(timer);
                this.disconnectTimers.delete(socket.id);
            }
            
            this.disconnectedPlayers.delete(socket.id);
            return { reconnected: true };
        }
        return { reconnected: false };
    }
    
    getOpponent(socket) {
        return socket === this.player1 ? this.player2 : this.player1;
    }

    isPlayerInGame(socketOrUserId) {
        if (typeof socketOrUserId === 'string') {
            // User ID check
            return this.whitePlayer?.id === socketOrUserId || this.blackPlayer?.id === socketOrUserId;
        } else {
            // Socket check
            return socketOrUserId === this.player1 || socketOrUserId === this.player2;
        }
    }

    // Database helper methods
    async saveMoveToDatabase(move) {
        try {
            if (this.id) {
                await db.addMoveToGame(this.id, {
                    ...move,
                    fen: this.chess.fen(),
                    pgn: this.chess.pgn()
                });
                console.log(`Move saved to database for game ${this.id}`);
            }
        } catch (error) {
            console.error('Error saving move to database:', error);
        }
    }

    async endGameInDatabase(result, endReason, winnerId) {
        try {
            if (this.id) {
                await db.endGame(this.id, result, endReason, winnerId);
                console.log(`Game ${this.id} ended in database: ${result} (${endReason})`);
            }
        } catch (error) {
            console.error('Error ending game in database:', error);
        }
    }

    // Time control methods
    startTimer(color) {
        if (this.gameOver) return;
        
        this.stopAllTimers();
        this.activeTimer = color;
        this.lastMoveTime = Date.now();
        
        const timer = setInterval(() => {
            if (this.gameOver) {
                clearInterval(timer);
                return;
            }
            
            this.timeRemaining[color] -= 1000;
            
            // Broadcast time update
            this.broadcastTimeUpdate();
            
            // Check if time has run out
            if (this.timeRemaining[color] <= 0) {
                this.handleTimeOut(color);
                clearInterval(timer);
            }
        }, 1000);
        
        this.timeTimers[color] = timer;
    }
    
    stopAllTimers() {
        Object.values(this.timeTimers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
        this.timeTimers = { white: null, black: null };
    }
    
    switchTimer() {
        if (this.gameOver) return;
        
        const currentColor = this.activeTimer;
        const nextColor = currentColor === 'white' ? 'black' : 'white';
        
        // Add increment if any
        if (this.timeControl.increment > 0) {
            this.timeRemaining[currentColor] += this.timeControl.increment;
        }
        
        this.startTimer(nextColor);
    }
    
    handleTimeOut(color) {
        if (this.gameOver) return;
        
        this.gameOver = true;
        this.stopAllTimers();
        
        const winner = color === 'white' ? this.player2 : this.player1;
        const winnerId = color === 'white' ? this.blackPlayer.id : this.whitePlayer.id;
        
        this.winner = winner;
        this.gameResult = {
            winner: winnerId,
            reason: 'timeout',
            timeOutColor: color,
            winnerColor: color === 'white' ? 'black' : 'white'
        };
        
        // End game in database
        const result = color === 'white' ? '0-1' : '1-0';
        this.endGameInDatabase(result, 'timeout', winnerId);
        
        // Notify both players
        [this.player1, this.player2].forEach(player => {
            const isWinner = (player === this.player1 ? this.whitePlayer.id : this.blackPlayer.id) === winnerId;
            player.emit('gameOver', {
                type: 'timeout',
                winner: winnerId,
                winnerColor: this.gameResult.winnerColor,
                timeOutColor: color,
                reason: 'timeout',
                playerResult: isWinner ? 'win' : 'loss'
            });
        });
    }
    
    broadcastTimeUpdate() {
        const timeUpdate = {
            white: Math.max(0, this.timeRemaining.white),
            black: Math.max(0, this.timeRemaining.black),
            activeTimer: this.activeTimer
        };
        
        [this.player1, this.player2].forEach(player => {
            player.emit('timeUpdate', timeUpdate);
        });
    }
    
    getTimeRemaining() {
        return {
            white: Math.max(0, this.timeRemaining.white),
            black: Math.max(0, this.timeRemaining.black),
            activeTimer: this.activeTimer
        };
    }
    
    // Check if both players are guest users
    areBothPlayersGuests() {
        const whiteIsGuest = this.whitePlayer?.email?.includes('@chess.local') || this.whitePlayer?.email?.startsWith('guest_');
        const blackIsGuest = this.blackPlayer?.email?.includes('@chess.local') || this.blackPlayer?.email?.startsWith('guest_');
        return whiteIsGuest && blackIsGuest;
    }
    
    // Get current game state for reconnection
    getCurrentGameState() {
        return {
            board: this.chess.board(),
            fen: this.chess.fen(),
            pgn: this.chess.pgn(),
            turn: this.chess.turn(),
            moves: this.moves,
            isCheck: this.chess.isCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isDraw: this.chess.isDraw(),
            isGameOver: this.chess.isGameOver(),
            gameOver: this.gameOver,
            gameResult: this.gameResult,
            timeRemaining: this.getTimeRemaining(),
            whitePlayer: this.whitePlayer,
            blackPlayer: this.blackPlayer,
            gameId: this.id,
            gameRoute: this.route
        };
    }
    
    // Premove system methods
    setPremove(socket, move) {
        // Only allow premoves when it's not the player's turn
        const isWhiteTurn = this.chess.turn() === 'w';
        const isWhitePlayer = socket === this.player1;
        
        if (isWhiteTurn === isWhitePlayer) {
            // It's the player's turn, they should make a regular move
            return { success: false, error: "Cannot premove on your turn" };
        }
        
        // Validate the premove against current position
        const tempChess = new Chess(this.chess.fen());
        try {
            const moveResult = tempChess.move(move);
            if (!moveResult) {
                return { success: false, error: "Invalid premove" };
            }
            
            // Store the premove
            this.premoves.set(socket.id, {
                move: move,
                timestamp: Date.now(),
                validated: true
            });
            
            return { success: true, premove: move };
        } catch (error) {
            return { success: false, error: "Invalid premove format" };
        }
    }
    
    clearPremove(socket) {
        this.premoves.delete(socket.id);
        return { success: true };
    }
    
    executePremove(socket) {
        const premove = this.premoves.get(socket.id);
        if (!premove) {
            return null;
        }
        
        // Clear the premove first
        this.premoves.delete(socket.id);
        
        // Try to execute the premove
        try {
            const moveResult = this.chess.move(premove.move);
            if (moveResult) {
                return {
                    success: true,
                    move: moveResult,
                    wasPremove: true
                };
            }
        } catch (error) {
            console.log("Premove execution failed:", error);
        }
        
        return { success: false, error: "Premove no longer valid" };
    }

    // Clean up all resources
    cleanup() {
        this.stopAllTimers();
        
        // Clear all disconnect timers
        for (const timer of this.disconnectTimers.values()) {
            if (timer) clearTimeout(timer);
        }
        this.disconnectTimers.clear();
        
        // Clear premoves
        this.premoves.clear();
        
        // Clear other resources
        this.drawOffers.clear();
        this.disconnectedPlayers.clear();
    }
}
