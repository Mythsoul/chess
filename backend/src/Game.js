import { Chess } from "chess.js";
export class Game {
    player1 = null;
    player2 = null;
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
    
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.chess = new Chess();
        this.gameStartTime = Date.now();
        this.lastMoveTime = Date.now();
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

                if (this.chess.isGameOver()) {
                    if (this.chess.isCheckmate()) {
                        this.winner = socket;
                        this.gameOver = true;
                        this.gameResult = {
                            winner: socket.id,
                            reason: 'checkmate',
                            winnerColor: socket === this.player1 ? 'white' : 'black'
                        };
                        gameState.gameOver = this.gameResult;
                    } else if (this.chess.isDraw() || this.chess.isStalemate()) {
                        this.gameOver = true;
                        this.gameResult = {
                            winner: null,
                            reason: this.chess.isStalemate() ? 'stalemate' : 'draw'
                        };
                        gameState.gameOver = this.gameResult;
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
        
        this.gameOver = true;
        this.winner = winner;
        this.gameResult = {
            winner: winner.id,
            reason: 'resignation',
            resignedBy: socket.id,
            resignedColor: resigningPlayerColor
        };

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
                    result: this.gameResult
                });
            }
        }, 30000); // 30 second timeout
        
        this.disconnectTimers.set(socket.id, timer);
        
        return {
            disconnectedPlayer: socket.id,
            remainingPlayer: remainingPlayer.id,
            timeout: 30000
        };
    }

    handleReconnect(socket) {
        this.disconnectedPlayers.delete(socket.id);
        
        // Clear disconnect timer
        if (this.disconnectTimers.has(socket.id)) {
            clearTimeout(this.disconnectTimers.get(socket.id));
            this.disconnectTimers.delete(socket.id);
        }
        
        return {
            reconnectedPlayer: socket.id,
            gameState: this.getGameState()
        };
    }

    getOpponent(socket) {
        return socket === this.player1 ? this.player2 : this.player1;
    }

    isPlayerInGame(socket) {
        return socket === this.player1 || socket === this.player2;
    }
}
