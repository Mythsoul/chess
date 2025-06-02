import { Chess } from "chess.js";
export class Game {
    player1 = null;
    player2 = null;
    moves = [];
    winner = null;
    chess = null;
    
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.chess = new Chess();
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
                    this.winner = this.chess.isCheckmate() ? socket : null;
                    gameState.gameOver = {
                        winner: this.winner?.id || null,
                        reason: this.chess.isCheckmate() ? 'checkmate' : 
                               this.chess.isDraw() ? 'draw' : 
                               this.chess.isStalemate() ? 'stalemate' : 'unknown'
                    };
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
}