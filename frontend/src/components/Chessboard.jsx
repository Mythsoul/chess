import { useState, useEffect } from 'react';
import socket from '../utils/socket';
import { Chess } from 'chess.js';
import { 
  GiChessKing, GiChessQueen, GiChessRook, 
  GiChessBishop, GiChessKnight, GiChessPawn 
} from 'react-icons/gi';

const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  Array(8).fill(''),
  Array(8).fill(''),
  Array(8).fill(''),
  Array(8).fill(''),
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

const parseFEN = (fen) => {
  const [position] = fen.split(' ');
  const rows = position.split('/');
  const board = [];
  
  for (const row of rows) {
    const boardRow = [];
    for (const char of row) {
      if (isNaN(char)) {
        boardRow.push(char);
      } else {
        boardRow.push(...Array(parseInt(char)).fill(''));
      }
    }
    board.push(boardRow);
  }
  return board;
};

// Convert board coordinates to chess notation
const coordsToChessNotation = (row, col) => {
  return `${String.fromCharCode(97 + col)}${8 - row}`;
};

// Get piece color
const getPieceColor = (piece) => {
  if (!piece) return null;
  return piece === piece.toUpperCase() ? 'white' : 'black';
};

const Square = ({ piece, isDark, onClick, isSelected, isValidMove, isLastMove }) => {
  let bgColor = isDark ? 'bg-amber-800' : 'bg-amber-100';
  
  if (isSelected) {
    bgColor = 'bg-yellow-400';
  } else if (isLastMove) {
    bgColor = isDark ? 'bg-yellow-600' : 'bg-yellow-300';
  } else if (isValidMove) {
    bgColor = isDark ? 'bg-green-700' : 'bg-green-300';
  }
  
  const getPieceComponent = (p) => {
    const color = p === p.toUpperCase() ? "text-white" : "text-black";
    const props = { className: `text-4xl ${color} drop-shadow-lg` };
    
    switch(p.toLowerCase()) {
      case 'k': return <GiChessKing {...props} />;
      case 'q': return <GiChessQueen {...props} />;
      case 'r': return <GiChessRook {...props} />;
      case 'b': return <GiChessBishop {...props} />;
      case 'n': return <GiChessKnight {...props} />;
      case 'p': return <GiChessPawn {...props} />;
      default: return null;
    }
  };

  return (
    <div 
      className={`${bgColor} aspect-square flex items-center justify-center cursor-pointer border border-amber-900/20 transition-colors duration-150 hover:brightness-110`}
      onClick={onClick}
    >
      {piece && getPieceComponent(piece)}
      {isValidMove && !piece && (
        <div className="w-4 h-4 bg-green-600 rounded-full opacity-60"></div>
      )}
    </div>
  );
};

export default function Chessboard({ playerColor = 'white' }) {
  const [board, setBoard] = useState(initialBoard);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStatus, setGameStatus] = useState('');
  const [chess] = useState(new Chess());
  const [currentTurn, setCurrentTurn] = useState('white');

  useEffect(() => {
    // Initialize chess position
    setBoard(parseFEN(chess.fen()));
    
    socket.on('gameUpdate', (update) => {
      try {
        if (update.fen) {
          chess.load(update.fen);
          setBoard(parseFEN(update.fen));
          setCurrentTurn(chess.turn() === 'w' ? 'white' : 'black');
        }
        
        if (update.lastMove) {
          setLastMove(update.lastMove);
        }
        
        if (update.gameOver) {
          setGameOver(true);
          setGameStatus(update.result || 'Game Over');
        }
        
        // Clear selection and valid moves on update
        setSelectedSquare(null);
        setValidMoves([]);
      } catch (error) {
        console.error('Error processing game update:', error);
      }
    });

    socket.on('invalidMove', (data) => {
      console.warn('Invalid move:', data.message);
      // Reset to current chess position
      setBoard(parseFEN(chess.fen()));
      setCurrentTurn(chess.turn() === 'w' ? 'white' : 'black');
    });

    return () => {
      socket.off('gameUpdate');
      socket.off('invalidMove');
    };
  }, [chess]);

  const getValidMovesForSquare = (row, col) => {
    const square = coordsToChessNotation(row, col);
    const moves = chess.moves({ square, verbose: true });
    return moves.map(move => ({
      from: move.from,
      to: move.to,
      row: 8 - parseInt(move.to[1]),
      col: move.to.charCodeAt(0) - 97
    }));
  };

  const isValidMoveSquare = (row, col) => {
    return validMoves.some(move => move.row === row && move.col === col);
  };

  const isLastMoveSquare = (row, col) => {
    if (!lastMove) return false;
    const square = coordsToChessNotation(row, col);
    return square === lastMove.from || square === lastMove.to;
  };

  const handleSquareClick = (row, col) => {
    if (gameOver) return;

    const piece = board[row][col];
    const pieceColor = getPieceColor(piece);
    const square = coordsToChessNotation(row, col);

    // If no square is selected
    if (!selectedSquare) {
      // Only select if it's a piece of the current player's color and it's their turn
      if (piece && pieceColor === playerColor && currentTurn === playerColor) {
        setSelectedSquare([row, col]);
        setValidMoves(getValidMovesForSquare(row, col));
      }
      return;
    }

    // If clicking the same square, deselect
    if (selectedSquare[0] === row && selectedSquare[1] === col) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    // If selecting a different piece of the same color
    if (piece && pieceColor === playerColor && currentTurn === playerColor) {
      setSelectedSquare([row, col]);
      setValidMoves(getValidMovesForSquare(row, col));
      return;
    }

    // Attempt to make a move
    if (currentTurn === playerColor) {
      const [fromRow, fromCol] = selectedSquare;
      const from = coordsToChessNotation(fromRow, fromCol);
      const to = square;

      // Check if this is a valid move
      if (isValidMoveSquare(row, col)) {
        try {
          // Test the move locally first
          const testChess = new Chess(chess.fen());
          const move = testChess.move({ from, to });
          
          if (move) {
            // Send the move to the server
            socket.emit('move', { from, to });
            setLastMove({ from, to });
          }
        } catch (error) {
          console.error('Invalid move:', error);
        }
      }
    }

    // Clear selection
    setSelectedSquare(null);
    setValidMoves([]);
  };

  // Determine board orientation
  const getBoardToRender = () => {
    if (playerColor === 'black') {
      return [...board].reverse().map(row => [...row].reverse());
    }
    return board;
  };

  // Convert display coordinates to actual board coordinates for black player
  const getActualCoordinates = (displayRow, displayCol) => {
    if (playerColor === 'black') {
      return [7 - displayRow, 7 - displayCol];
    }
    return [displayRow, displayCol];
  };

  // Check if square is selected (accounting for board orientation)
  const isSquareSelected = (displayRow, displayCol) => {
    if (!selectedSquare) return false;
    const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol);
    return selectedSquare[0] === actualRow && selectedSquare[1] === actualCol;
  };

  // Check if square is a valid move (accounting for board orientation)
  const isSquareValidMove = (displayRow, displayCol) => {
    const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol);
    return isValidMoveSquare(actualRow, actualCol);
  };

  // Check if square is part of last move (accounting for board orientation)
  const isSquareLastMove = (displayRow, displayCol) => {
    const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol);
    return isLastMoveSquare(actualRow, actualCol);
  };

  const boardToRender = getBoardToRender();

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <div className="text-lg font-semibold">
          Current Turn: <span className={currentTurn === 'white' ? 'text-gray-800' : 'text-gray-600'}>
            {currentTurn === 'white' ? 'White' : 'Black'}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          You are playing as: <span className="font-medium capitalize">{playerColor}</span>
        </div>
      </div>

      {gameOver && (
        <div className="text-xl font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg border-2 border-red-200">
          🏁 {gameStatus}
        </div>
      )}

      <div className="w-full max-w-2xl aspect-square">
        <div className="grid grid-cols-8 h-full w-full border-4 border-amber-900 rounded-lg overflow-hidden shadow-lg">
          {boardToRender.map((row, displayRow) => 
            row.map((piece, displayCol) => (
              <Square
                key={`${displayRow}-${displayCol}`}
                piece={piece}
                isDark={(displayRow + displayCol) % 2 === 1}
                isSelected={isSquareSelected(displayRow, displayCol)}
                isValidMove={isSquareValidMove(displayRow, displayCol)}
                isLastMove={isSquareLastMove(displayRow, displayCol)}
                onClick={() => {
                  const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol);
                  handleSquareClick(actualRow, actualCol);
                }}
              />
            ))
          )}
        </div>
      </div>

      <div className="text-center space-y-1">
        <div className="text-sm text-gray-600">
          {selectedSquare && `Selected: ${coordsToChessNotation(selectedSquare[0], selectedSquare[1])}`}
        </div>
        {validMoves.length > 0 && (
          <div className="text-xs text-green-600">
            Valid moves: {validMoves.map(m => m.to).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}