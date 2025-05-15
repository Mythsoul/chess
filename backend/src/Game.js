import { Chess } from "chess.js";
export class Game {
    player1 = null ; 
    player2 = null ; 
    moves = [] ; 
    winner = null ;
    board = []; 
 
    constructor (player1 , player2){ 
        this.player1 = player1 ; 
        this.player2 = player2 ; 


    
    }
  

    makeMove(socket, move) {
        if(socket === this.player1){ 
         this.moves.push(move);
         this.board =this.moves ; 
        }else if(socket === this.player2){ 
            this.moves.push(move); 
            this.board =this.moves ;
        }
        th
    }
    
}