import { useState, useEffect, useRef } from "react"
import socket from "../utils/socket"
import { Chess } from "chess.js"
import { GiChessKing, GiChessQueen, GiChessRook, GiChessBishop, GiChessKnight, GiChessPawn } from "react-icons/gi"
import { motion, AnimatePresence } from "framer-motion"
import { useSpring, animated, config } from "@react-spring/web"
import { useGesture } from "react-use-gesture"

const initialBoard = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  Array(8).fill(""),
  Array(8).fill(""),
  Array(8).fill(""),
  Array(8).fill(""),
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
]

const parseFEN = (fen) => {
  const [position] = fen.split(" ")
  const rows = position.split("/")
  const board = []

  for (const row of rows) {
    const boardRow = []
    for (const char of row) {
      if (isNaN(char)) {
        boardRow.push(char)
      } else {
        boardRow.push(...Array(parseInt(char)).fill(""))
      }
    }
    board.push(boardRow)
  }
  return board
}

const coordsToChessNotation = (row, col) => {
  return `${String.fromCharCode(97 + col)}${8 - row}`
}

const getPieceColor = (piece) => {
  if (!piece) return null
  return piece === piece.toUpperCase() ? "white" : "black"
}

// Static piece component - no animations
const StaticPiece = ({ piece }) => {
  const isWhite = piece === piece.toUpperCase()
  const getPieceIcon = (p) => {
    switch (p.toLowerCase()) {
      case "k": return GiChessKing
      case "q": return GiChessQueen
      case "r": return GiChessRook
      case "b": return GiChessBishop
      case "n": return GiChessKnight
      case "p": return GiChessPawn
      default: return null
    }
  }
  
  const PieceIcon = getPieceIcon(piece)
  if (!PieceIcon) return null

  return (
    <div className="flex items-center justify-center w-full h-full">
      <PieceIcon 
        className={`text-6xl select-none cursor-pointer ${
          isWhite 
            ? "text-slate-100 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]" 
            : "text-slate-900 drop-shadow-[2px_2px_4px_rgba(255,255,255,0.8)]"
        }`}
      />
    </div>
  )
}

// Static square - no animations at all
const Square = ({ piece, isDark, onClick, isSelected, isValidMove, isLastMove, row, col }) => {
  let bgColor = isDark ? "bg-amber-800" : "bg-amber-100"
  
  if (isSelected) {
    bgColor = "bg-yellow-400"
  } else if (isLastMove) {
    bgColor = isDark ? "bg-yellow-600" : "bg-yellow-300"
  } else if (isValidMove) {
    bgColor = isDark ? "bg-green-700" : "bg-green-300"
  }

  const file = String.fromCharCode(97 + col)
  const rank = 8 - row
  const showFileLabel = row === 7
  const showRankLabel = col === 0

  return (
    <div
      className={`${bgColor} aspect-square relative cursor-pointer`}
      onClick={onClick}
    >
      {/* Coordinate Labels */}
      {showFileLabel && (
        <div className="absolute bottom-1 right-1 text-xs font-bold opacity-60 text-slate-600">
          {file}
        </div>
      )}
      {showRankLabel && (
        <div className="absolute top-1 left-1 text-xs font-bold opacity-60 text-slate-600">
          {rank}
        </div>
      )}

      {/* Chess Piece */}
      {piece && (
        <StaticPiece piece={piece} />
      )}

      {/* Valid Move Indicators */}
      {isValidMove && !piece && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-green-500 rounded-full opacity-70" />
        </div>
      )}
      {isValidMove && piece && (
        <div className="absolute inset-1 border-4 border-green-500 rounded-lg opacity-70" />
      )}
    </div>
  )
}

export default function Chessboard({ playerColor = "white", onMove, onGameOver, onTurnChange }) {
  const [board, setBoard] = useState(initialBoard)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [currentTurn, setCurrentTurn] = useState("white")
  const [gameOver, setGameOver] = useState(false)
  const [gameStatus, setGameStatus] = useState("")
  const [draggedPiece, setDraggedPiece] = useState(null)

  const [chess] = useState(new Chess())
  const boardRef = useRef()

  console.log(`♟️  Turn: ${currentTurn}, Player: ${playerColor}`)

  // Setup socket listeners once
  useEffect(() => {
    console.log("🔌 Setting up socket listeners")

    const handleGameUpdate = (data) => {
      console.log("📨 Game update received:", data)
      if (data.fen) {
        chess.load(data.fen)
        setBoard(parseFEN(data.fen))
      }
      if (data.turn) {
        const newTurn = data.turn === "w" ? "white" : "black"
        console.log(`🔄 Turn changing: ${currentTurn} -> ${newTurn}`)
        setCurrentTurn(newTurn)
        onTurnChange?.(newTurn)
      }
      if (data.lastMove) {
        setLastMove(data.lastMove)
      }
      if (data.isGameOver || data.gameOver) {
        setGameOver(true)
        const reason = data.gameOver?.reason || "Game Over"
        setGameStatus(reason)
        onGameOver?.(reason)
      }
      setSelectedSquare(null)
      setValidMoves([])
    }

    const handleMoveError = (data) => {
      console.log("❌ Move error:", data.error)
      setSelectedSquare(null)
      setValidMoves([])
    }

    socket.off("gameUpdate").on("gameUpdate", handleGameUpdate)
    socket.off("moveError").on("moveError", handleMoveError)

    return () => {
      socket.off("gameUpdate")
      socket.off("moveError")
    }
  }, [chess, currentTurn, onGameOver, onTurnChange])

  // Get valid moves for a piece
  const getValidMoves = (row, col) => {
    const square = coordsToChessNotation(row, col)
    const moves = chess.moves({ square, verbose: true })
    return moves.map((move) => ({
      from: move.from,
      to: move.to,
      row: 8 - parseInt(move.to[1]),
      col: move.to.charCodeAt(0) - 97,
    }))
  }

  const isValidMoveSquare = (row, col) => {
    return validMoves.some((move) => move.row === row && move.col === col)
  }

  const isLastMoveSquare = (row, col) => {
    if (!lastMove) return false
    const square = coordsToChessNotation(row, col)
    return square === lastMove.from || square === lastMove.to
  }

  const handleSquareClick = (row, col) => {
    if (gameOver) return

    const piece = board[row][col]
    const pieceColor = getPieceColor(piece)
    const square = coordsToChessNotation(row, col)

    console.log("Clicked square:", square);
    console.log("Piece:", piece);
    console.log("Piece color:", pieceColor);
    console.log("Current turn:", currentTurn);
    console.log("Player color:", playerColor);

    // Check if it's the player's turn
    if (currentTurn !== playerColor) {
      console.log("Not your turn");
      return;
    }

    if (!selectedSquare) {
      if (piece && pieceColor === playerColor) {
        console.log("Selecting piece");
        setSelectedSquare([row, col])
        setValidMoves(getValidMoves(row, col))
      }
      return
    }

    if (selectedSquare[0] === row && selectedSquare[1] === col) {
      console.log("Deselecting piece");
      setSelectedSquare(null)
      setValidMoves([])
      return
    }

    if (piece && pieceColor === playerColor) {
      console.log("Selecting different piece");
      setSelectedSquare([row, col])
        setValidMoves(getValidMoves(row, col))
      return
    }

    // Attempt to make a move
    const [fromRow, fromCol] = selectedSquare
    const from = coordsToChessNotation(fromRow, fromCol)
    const to = square

    if (isValidMoveSquare(row, col)) {
      console.log("Making move:", from, "to", to);
      // Just send the move to server, let server handle all updates
      socket.emit("move", { from, to })
    }

    setSelectedSquare(null)
    setValidMoves([])
  }

  const getBoardToRender = () => {
    if (playerColor === "black") {
      return [...board].reverse().map((row) => [...row].reverse())
    }
    return board
  }

  const getActualCoordinates = (displayRow, displayCol) => {
    if (playerColor === "black") {
      return [7 - displayRow, 7 - displayCol]
    }
    return [displayRow, displayCol]
  }

  const isSquareSelected = (displayRow, displayCol) => {
    if (!selectedSquare) return false
    const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol)
    return selectedSquare[0] === actualRow && selectedSquare[1] === actualCol
  }

  const isSquareValidMove = (displayRow, displayCol) => {
    const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol)
    return isValidMoveSquare(actualRow, actualCol)
  }

  const isSquareLastMove = (displayRow, displayCol) => {
    const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol)
    return isLastMoveSquare(actualRow, actualCol)
  }

  const boardToRender = getBoardToRender()

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Turn Indicator */}
      <div className="bg-slate-800 text-white px-4 py-2 rounded-lg">
        <span className="font-semibold">
          {currentTurn === "white" ? "White" : "Black"} to move
        </span>
      </div>

      {/* Game Over Banner */}
      {gameOver && (
        <div className="bg-red-600 text-white px-8 py-4 rounded-lg text-center">
          <div className="text-2xl font-bold mb-2">Game Over</div>
          <div>{gameStatus}</div>
        </div>
      )}

      {/* Chess Board */}
      <div className="w-[700px] h-[700px] bg-amber-200 p-4 rounded-lg shadow-lg border-4 border-amber-900">
        <div className="grid grid-cols-8 h-full w-full rounded overflow-hidden">
          {boardToRender.map((row, displayRow) =>
            row.map((piece, displayCol) => {
              const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol)
              return (
                <Square
                  key={`${displayRow}-${displayCol}`}
                  piece={piece}
                  isDark={(displayRow + displayCol) % 2 === 1}
                  isSelected={isSquareSelected(displayRow, displayCol)}
                  isValidMove={isSquareValidMove(displayRow, displayCol)}
                  isLastMove={isSquareLastMove(displayRow, displayCol)}
                  row={actualRow}
                  col={actualCol}
                  onClick={() => {
                    const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol)
                    handleSquareClick(actualRow, actualCol)
                  }}
                />
              )
            }),
          )}
        </div>
      </div>
    </div>
  )
}
