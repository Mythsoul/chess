import { useState, useEffect, useRef } from "react"
import socket from "../utils/socket"
import { Chess } from "chess.js"
import { GiChessKing, GiChessQueen, GiChessRook, GiChessBishop, GiChessKnight, GiChessPawn } from "react-icons/gi"
import { motion, AnimatePresence } from "framer-motion"

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
        boardRow.push(...Array(Number.parseInt(char)).fill(""))
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

const Square = ({ piece, isDark, onClick, isSelected, isValidMove, isLastMove, row, col }) => {
  let bgColor = isDark ? "bg-slate-700" : "bg-slate-200"

  if (isSelected) {
    bgColor = "bg-emerald-400"
  } else if (isLastMove) {
    bgColor = isDark ? "bg-amber-600" : "bg-amber-300"
  } else if (isValidMove) {
    bgColor = isDark ? "bg-emerald-600/70" : "bg-emerald-300/70"
  }

  const getPieceComponent = (p) => {
    const isWhite = p === p.toUpperCase()
    const color = isWhite ? "text-slate-50" : "text-slate-900"
    const shadow = isWhite ? "drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" : "drop-shadow-[0_4px_12px_rgba(255,255,255,0.5)]"

    const props = {
      className: `text-5xl ${color} ${shadow} transition-all duration-700 ease-out`,
    }

    switch (p.toLowerCase()) {
      case "k":
        return <GiChessKing {...props} />
      case "q":
        return <GiChessQueen {...props} />
      case "r":
        return <GiChessRook {...props} />
      case "b":
        return <GiChessBishop {...props} />
      case "n":
        return <GiChessKnight {...props} />
      case "p":
        return <GiChessPawn {...props} />
      default:
        return null
    }
  }

  // File and rank labels
  const file = String.fromCharCode(97 + col)
  const rank = 8 - row
  const showFileLabel = row === 7
  const showRankLabel = col === 0

  return (
    <motion.div
      className={`${bgColor} aspect-square flex items-center justify-center cursor-pointer relative group overflow-hidden`}
      onClick={onClick}
      initial={{ opacity: 0.85 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ 
        scale: 1.04,
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
    >
      {/* Coordinate labels */}
      {showFileLabel && (
        <motion.div 
          className="absolute bottom-1 right-1 text-xs font-bold opacity-60 text-slate-500"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        >
          {file}
        </motion.div>
      )}
      {showRankLabel && (
        <motion.div 
          className="absolute top-1 left-1 text-xs font-bold opacity-60 text-slate-500"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        >
          {rank}
        </motion.div>
      )}

      {/* Piece - removed bouncing effect */}
      <AnimatePresence mode="wait">
        {piece && (
          <motion.div
            key={piece}
            initial={{ scale: 0.6, opacity: 0, y: -15 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 25,
                duration: 0.8
              }
            }}
            exit={{ 
              scale: 0.6, 
              opacity: 0, 
              y: 15,
              transition: { duration: 0.4, ease: "easeIn" }
            }}
            whileHover={{
              scale: 1.15,
              y: -4,
              transition: { 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94]
              }
            }}
          >
            {getPieceComponent(piece)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Valid move indicator */}
      {isValidMove && !piece && (
        <motion.div
          className="w-6 h-6 bg-emerald-500 rounded-full opacity-70 shadow-lg"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.7,
            transition: { 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.6
            }
          }}
          whileHover={{
            scale: 1.3,
            opacity: 0.9,
            boxShadow: "0 0 20px rgba(16, 185, 129, 0.6)",
            transition: { duration: 0.3, ease: "easeOut" }
          }}
        />
      )}

      {/* Valid capture indicator */}
      {isValidMove && piece && (
        <motion.div
          className="absolute inset-0 border-3 border-emerald-500 rounded-sm opacity-70 shadow-lg"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 0.7,
            transition: { 
              type: "spring", 
              stiffness: 400, 
              damping: 25,
              duration: 0.6
            }
          }}
          whileHover={{
            opacity: 0.9,
            scale: 1.02,
            boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.3)",
            transition: { duration: 0.3, ease: "easeOut" }
          }}
        />
      )}

      {/* Hover effect - enhanced glow */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 rounded-sm"
        whileHover={{ 
          opacity: 0.2,
          transition: { duration: 0.4, ease: "easeOut" }
        }}
      />

      {/* Selected square effect */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-emerald-400 -z-10 shadow-xl shadow-emerald-400/60"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }
          }}
        />
      )}

      {/* Last move effect */}
      {isLastMove && (
        <motion.div
          className="absolute inset-0 -z-10 shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: { 
              duration: 0.6, 
              ease: [0.25, 0.46, 0.45, 0.94] 
            }
          }}
        />
      )}

      {/* Enhanced ripple effect on click */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-white/40 to-transparent rounded-sm pointer-events-none"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0 }}
        whileTap={{
          opacity: [0, 0.6, 0],
          scale: [0.5, 1.5, 1.8],
          transition: { duration: 0.6, ease: "easeOut" }
        }}
      />

      {/* Subtle breathing effect for selected piece - removed bouncing */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 bg-emerald-300/20 rounded-sm -z-5"
          animate={{
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  )
}

export default function Chessboard({ playerColor = "white" }) {
  const [board, setBoard] = useState(initialBoard)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const [gameStatus, setGameStatus] = useState("")
  const [chess] = useState(new Chess())
  const [currentTurn, setCurrentTurn] = useState("white")
  const [moveHistory, setMoveHistory] = useState([])
  const boardRef = useRef(null)

  // Debug logging for turn changes
  useEffect(() => {
    console.log("Current turn:", currentTurn);
    console.log("Player color:", playerColor);
  }, [currentTurn, playerColor]);

  useEffect(() => {
    setBoard(parseFEN(chess.fen()))

    socket.on("gameUpdate", (update) => {
      try {
        if (update.fen) {
          chess.load(update.fen)
          setBoard(parseFEN(update.fen))
          
          // Set current turn based on chess.js turn() method
          const newTurn = chess.turn() === "w" ? "white" : "black"
          console.log("Turn updated from server:", newTurn)
          setCurrentTurn(newTurn)
        }

        if (update.lastMove) {
          setLastMove(update.lastMove)
          setMoveHistory((prev) => [...prev, update.lastMove])
        }

        if (update.gameOver) {
          setGameOver(true)
          setGameStatus(update.result || "Game Over")
        }

        setSelectedSquare(null)
        setValidMoves([])
      } catch (error) {
        console.error("Error processing game update:", error)
      }
    })

    socket.on("invalidMove", (data) => {
      console.warn("Invalid move:", data.message)
      setBoard(parseFEN(chess.fen()))
      setCurrentTurn(chess.turn() === "w" ? "white" : "black")
    })

    return () => {
      socket.off("gameUpdate")
      socket.off("invalidMove")
    }
  }, [chess])

  const getValidMovesForSquare = (row, col) => {
    const square = coordsToChessNotation(row, col)
    const moves = chess.moves({ square, verbose: true })
    return moves.map((move) => ({
      from: move.from,
      to: move.to,
      row: 8 - Number.parseInt(move.to[1]),
      col: move.to.charCodeAt(0) - 97,
      captured: move.captured,
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
        setValidMoves(getValidMovesForSquare(row, col))
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
      setValidMoves(getValidMovesForSquare(row, col))
      return
    }

    // Attempt to make a move
    const [fromRow, fromCol] = selectedSquare
    const from = coordsToChessNotation(fromRow, fromCol)
    const to = square

    if (isValidMoveSquare(row, col)) {
      try {
        const testChess = new Chess(chess.fen())
        const move = testChess.move({ from, to })

        if (move) {
          console.log("Making move:", from, "to", to);
          const isCapture = board[row][col] !== ""
          socket.emit("move", { from, to })
          setLastMove({ from, to, captured: isCapture })
          
          // Update the turn locally as well
          const nextTurn = currentTurn === "white" ? "black" : "white"
          console.log("Setting next turn to:", nextTurn);
          setCurrentTurn(nextTurn)
        }
      } catch (error) {
        console.error("Invalid move:", error)
      }
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
    <div className="flex flex-col items-center space-y-4 md:space-y-8 p-4 md:p-8 max-w-4xl mx-auto">
      {/* Enhanced Turn Indicator */}
      <motion.div
        className="flex items-center space-x-2 md:space-x-4 bg-slate-800/95 backdrop-blur-xl rounded-2xl px-4 md:px-6 py-2 md:py-3 border border-slate-600/60 shadow-2xl"
        initial={{ y: -30, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          delay: 0.2
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 0 40px rgba(0,0,0,0.4)",
          transition: { duration: 0.3 }
        }}
      >
        <motion.div
          className={`w-4 h-4 rounded-full ${currentTurn === "white" ? "bg-slate-100" : "bg-slate-800"} shadow-xl`}
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.6, 1, 0.6],
            boxShadow: currentTurn === "white" 
              ? ["0 0 0 rgba(255,255,255,0)", "0 0 25px rgba(255,255,255,0.8)", "0 0 0 rgba(255,255,255,0)"]
              : ["0 0 0 rgba(0,0,0,0)", "0 0 25px rgba(0,0,0,0.8)", "0 0 0 rgba(0,0,0,0)"]
          }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.span 
          className="text-slate-200 font-semibold"
          animate={{ 
            opacity: [0.7, 1, 0.7],
            textShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 8px rgba(255,255,255,0.6)", "0 0 0px rgba(255,255,255,0)"]
          }}
          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          {currentTurn === "white" ? "White" : "Black"} to move
        </motion.span>
      </motion.div>

      {/* Enhanced Game Over Banner */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white px-10 py-5 rounded-2xl shadow-2xl border-2 border-red-400"
            initial={{ opacity: 0, scale: 0.7, y: -30 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 15,
                duration: 0.8
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.7, 
              y: -30,
              transition: { duration: 0.5, ease: "easeIn" }
            }}
          >
            <div className="text-center">
              <motion.div 
                className="text-4xl font-bold mb-3"
                animate={{ 
                  scale: [1, 1.08, 1],
                  textShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 15px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0)"]
                }}
                transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                🏁 Game Over
              </motion.div>
              <motion.div 
                className="text-xl"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                {gameStatus}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ultra-Enhanced Chess Board */}
      <motion.div
        className="relative"
        ref={boardRef}
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          transition: { 
            type: "spring", 
            stiffness: 200, 
            damping: 15, 
            delay: 0.4,
            duration: 1.2
          }
        }}
      >
        <motion.div 
          className="w-full max-w-2xl aspect-square bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 p-5 rounded-3xl shadow-[0_0_80px_rgba(15,23,42,0.8)] border-2 border-slate-600/60"
          whileHover={{
            boxShadow: "0 0 120px rgba(15,23,42,1), 0 0 40px rgba(16, 185, 129, 0.3)",
            scale: 1.01,
            transition: { duration: 0.5, ease: "easeOut" }
          }}
          animate={{
            boxShadow: [
              "0 0 80px rgba(15,23,42,0.8)",
              "0 0 100px rgba(15,23,42,0.9)",
              "0 0 80px rgba(15,23,42,0.8)"
            ]
          }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <motion.div 
            className="grid grid-cols-8 h-full w-full rounded-2xl overflow-hidden shadow-inner border-2 border-slate-600/60"
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            {boardToRender.map((row, displayRow) =>
              row.map((piece, displayCol) => {
                const [actualRow, actualCol] = getActualCoordinates(displayRow, displayCol)
                return (
                  <motion.div
                    key={`${displayRow}-${displayCol}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: (displayRow + displayCol) * 0.02 + 0.8,
                      duration: 0.6,
                      ease: "easeOut"
                    }}
                  >
                    <Square
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
                  </motion.div>
                )
              }),
            )}
          </motion.div>
        </motion.div>

        {/* Enhanced multi-layered glow effects */}
        <motion.div 
          className="absolute inset-0 -z-10 bg-emerald-500/15 blur-3xl rounded-full"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{ 
            duration: 5, 
            repeat: Number.POSITIVE_INFINITY, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute inset-0 -z-20 bg-blue-500/10 blur-[60px] rounded-full"
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [0.9, 1.3, 0.9]
          }}
          transition={{ 
            duration: 7, 
            repeat: Number.POSITIVE_INFINITY, 
            ease: "easeInOut",
            delay: 1
          }}
        />
      </motion.div>
    </div>
  )
}
