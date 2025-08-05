"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { initializeBoard, PIECE_SYMBOLS, getBestMove, isCheckmate, isStalemate, getLegalMoves } from "@/lib/chess-utils"
import type { Piece, Position, Move, GameMode, GameStats, TimerMode } from "@/lib/types"

interface GamePageProps {
  userName: string
  player2Name: string // Added for local multiplayer
  gameMode: GameMode
  difficulty: number
  timerMode: TimerMode // New: Pass timer mode
  initialTime: number // New: Pass initial time in milliseconds
  onGameOver: (stats: GameStats, history: Move[]) => void
}

export default function GamePage({
  userName,
  player2Name,
  gameMode,
  difficulty,
  timerMode,
  initialTime,
  onGameOver,
}: GamePageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<Piece[][]>([])
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "black">("white")
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null)
  const [gameStatus, setGameStatus] = useState<string>("White to move")
  const [moveHistory, setMoveHistory] = useState<Move[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [gameStats, setGameStats] = useState<GameStats>({
    whiteCaptures: 0,
    blackCaptures: 0,
    totalMoves: 0,
    gameStartTime: Date.now(),
    winner: null,
    reason: "",
    timerMode: timerMode, // Initialize with passed prop
    initialTime: initialTime, // Initialize with passed prop
  })

  // New: Timer states
  const [whiteTime, setWhiteTime] = useState(initialTime)
  const [blackTime, setBlackTime] = useState(initialTime)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize board and game stats on component mount or game reset
  useEffect(() => {
    setBoard(initializeBoard())
    setGameStats((prev) => ({ ...prev, gameStartTime: Date.now(), timerMode, initialTime }))
    setWhiteTime(initialTime)
    setBlackTime(initialTime)
  }, [timerMode, initialTime])

  // Timer logic
  useEffect(() => {
    if (gameStats.winner || timerMode === "none") {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }

    if (isThinking && gameMode === "ai" && currentPlayer === "black") {
      // Pause timer when AI is thinking
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      return
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }

    timerIntervalRef.current = setInterval(() => {
      if (currentPlayer === "white") {
        setWhiteTime((prev) => {
          const newTime = prev - 1000 // Decrement by 1 second
          if (newTime <= 0) {
            handleTimeout("white")
            return 0
          }
          return newTime
        })
      } else {
        setBlackTime((prev) => {
          const newTime = prev - 1000 // Decrement by 1 second
          if (newTime <= 0) {
            handleTimeout("black")
            return 0
          }
          return newTime
        })
      }
    }, 1000) // Update every second

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [currentPlayer, gameStats.winner, timerMode, isThinking, gameMode])

  const handleTimeout = useCallback(
    (timedOutColor: "white" | "black") => {
      if (gameStats.winner) return // Game already over

      const winnerColor = timedOutColor === "white" ? "black" : "white"
      setGameStatus(`${timedOutColor.charAt(0).toUpperCase() + timedOutColor.slice(1)} ran out of time!`)
      onGameOver(
        {
          ...gameStats,
          winner: winnerColor,
          reason: `${timedOutColor.charAt(0).toUpperCase() + timedOutColor.slice(1)} ran out of time`,
          gameEndTime: Date.now(),
        },
        moveHistory,
      )
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    },
    [gameStats, moveHistory, onGameOver],
  )

  // Draw the chess board
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const squareSize = 80
    canvas.width = squareSize * 8
    canvas.height = squareSize * 8

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw squares with coordinates
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const x = col * squareSize
        const y = row * squareSize

        // Alternate square colors
        ctx.fillStyle = (row + col) % 2 === 0 ? "#f0d9b5" : "#b58863"
        ctx.fillRect(x, y, squareSize, squareSize)

        // Draw coordinates
        ctx.fillStyle = (row + col) % 2 === 0 ? "#b58863" : "#f0d9b5"
        ctx.font = "12px Arial"
        if (col === 0) {
          ctx.fillText((8 - row).toString(), x + 2, y + 12)
        }
        if (row === 7) {
          ctx.fillText(String.fromCharCode(97 + col), x + squareSize - 10, y + squareSize - 2)
        }

        // Highlight selected square
        if (selectedSquare && selectedSquare.row === row && selectedSquare.col === col) {
          ctx.fillStyle = "rgba(255, 255, 0, 0.6)"
          ctx.fillRect(x, y, squareSize, squareSize)
        }

        // Highlight possible moves
        if (
          selectedSquare &&
          getLegalMoves(currentPlayer, board, moveHistory[moveHistory.length - 1]).some(
            (m) =>
              m.from.row === selectedSquare.row &&
              m.from.col === selectedSquare.col &&
              m.to.row === row &&
              m.to.col === col,
          )
        ) {
          ctx.fillStyle = "rgba(0, 255, 0, 0.3)"
          ctx.beginPath()
          ctx.arc(x + squareSize / 2, y + squareSize / 2, 15, 0, 2 * Math.PI)
          ctx.fill()
        }

        // Highlight last move
        if (moveHistory.length > 0) {
          const lastMove = moveHistory[moveHistory.length - 1]
          if (
            (lastMove.from.row === row && lastMove.from.col === col) ||
            (lastMove.to.row === row && lastMove.to.col === col) ||
            (lastMove.rookMove &&
              ((lastMove.rookMove.from.row === row && lastMove.rookMove.from.col === col) ||
                (lastMove.rookMove.to.row === row && lastMove.rookMove.to.col === col))) ||
            (lastMove.isEnPassantCapture &&
              lastMove.capturedPawnPosition &&
              lastMove.capturedPawnPosition.row === row &&
              lastMove.capturedPawnPosition.col === col)
          ) {
            ctx.fillStyle = "rgba(0, 150, 255, 0.4)"
            ctx.fillRect(x, y, squareSize, squareSize)
          }
        }

        // Draw pieces with shadow effect
        const piece = board[row]?.[col]
        if (piece && piece.type && piece.color) {
          const symbol = PIECE_SYMBOLS[piece.color][piece.type]
          const centerX = x + squareSize / 2
          const centerY = y + squareSize / 2

          // Shadow
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
          ctx.font = "48px serif"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(symbol, centerX + 2, centerY + 2)

          // Main piece
          ctx.fillStyle = piece.color === "white" ? "#ffffff" : "#000000"
          ctx.strokeStyle = piece.color === "white" ? "#000000" : "#ffffff"
          ctx.lineWidth = 2
          ctx.strokeText(symbol, centerX, centerY)
          ctx.fillText(symbol, centerX, centerY)
        }
      }
    }

    // Draw thinking indicator
    if (isThinking) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
      ctx.fillRect(0, 0, canvas.width, 30)
      ctx.fillStyle = "white"
      ctx.font = "20px Arial"
      ctx.textAlign = "center"
      ctx.fillText("AI is thinking...", canvas.width / 2, 20)
    }
  }, [board, selectedSquare, moveHistory, isThinking, currentPlayer])

  const makeMove = useCallback(
    (from: Position, to: Position) => {
      const newBoard = board.map((row) => [...row])
      const piece = newBoard[from.row][from.col]
      let capturedPiece = newBoard[to.row][to.col] // Default captured piece

      // Find the specific move from legal moves to get castling/en passant info
      const currentLegalMoves = getLegalMoves(currentPlayer, board, moveHistory[moveHistory.length - 1])
      const moveDetails = currentLegalMoves.find(
        (m) => m.from.row === from.row && m.from.col === from.col && m.to.row === to.row && m.to.col === to.col,
      )

      // Apply king move
      newBoard[to.row][to.col] = { ...piece, hasMoved: true }
      newBoard[from.row][from.col] = { type: null, color: null }

      // Handle castling: move rook if it's a castling move
      if (moveDetails?.rookMove) {
        const rookFrom = moveDetails.rookMove.from
        const rookTo = moveDetails.rookMove.to
        const rook = newBoard[rookFrom.row][rookFrom.col]
        newBoard[rookTo.row][rookTo.col] = { ...rook, hasMoved: true }
        newBoard[rookFrom.row][rookFrom.col] = { type: null, color: null }
      }

      // Handle en passant: remove the captured pawn from its actual position
      if (moveDetails?.isEnPassantCapture && moveDetails.capturedPawnPosition) {
        capturedPiece = newBoard[moveDetails.capturedPawnPosition.row][moveDetails.capturedPawnPosition.col] // The actual captured pawn
        newBoard[moveDetails.capturedPawnPosition.row][moveDetails.capturedPawnPosition.col] = {
          type: null,
          color: null,
        }
      }

      const move: Move = {
        from,
        to,
        piece,
        captured: capturedPiece.type ? capturedPiece : undefined,
        notation:
          moveDetails?.notation ||
          `${piece.type}${String.fromCharCode(97 + from.col)}${8 - from.row}-${String.fromCharCode(97 + to.col)}${8 - to.row}`,
        timestamp: Date.now(),
        initialPieceHasMoved: piece.hasMoved, // Store initial hasMoved status of the king
        rookMove: moveDetails?.rookMove, // Store rook move details for undo
        initialRookHasMoved: moveDetails?.initialRookHasMoved, // Store initial hasMoved status of the rook
        isEnPassantCapture: moveDetails?.isEnPassantCapture, // Store en passant flag
        capturedPawnPosition: moveDetails?.capturedPawnPosition, // Store captured pawn position for en passant undo
      }

      setBoard(newBoard)
      setMoveHistory((prev) => [...prev, move])

      // Update game stats
      setGameStats((prev) => ({
        ...prev,
        totalMoves: prev.totalMoves + 1,
        whiteCaptures: capturedPiece.type && currentPlayer === "white" ? prev.whiteCaptures + 1 : prev.whiteCaptures,
        blackCaptures: capturedPiece.type && currentPlayer === "black" ? prev.blackCaptures + 1 : prev.blackCaptures,
      }))

      const nextPlayer = currentPlayer === "white" ? "black" : "white"
      setCurrentPlayer(nextPlayer)
      setSelectedSquare(null)

      // Check for game over conditions
      if (isCheckmate(newBoard, nextPlayer)) {
        const winner = nextPlayer === "white" ? "black" : "white"
        setGameStatus(`Checkmate! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`)
        onGameOver({ ...gameStats, winner, reason: "Checkmate", gameEndTime: Date.now() }, [...moveHistory, move])
      } else if (isStalemate(newBoard, nextPlayer)) {
        setGameStatus("Stalemate! It's a draw.")
        onGameOver({ ...gameStats, winner: "draw", reason: "Stalemate", gameEndTime: Date.now() }, [
          ...moveHistory,
          move,
        ])
      } else {
        setGameStatus(`${nextPlayer.charAt(0).toUpperCase() + nextPlayer.slice(1)} to move`)
      }
    },
    [board, currentPlayer, gameStats, moveHistory, onGameOver],
  )

  const makeAIMove = useCallback(async () => {
    if (currentPlayer !== "black" || gameMode !== "ai" || isThinking) return

    setIsThinking(true)
    setGameStatus("AI is thinking...")

    const thinkingTime = difficulty * 800 + Math.random() * 500

    setTimeout(() => {
      const bestMove = getBestMove(board, difficulty, moveHistory[moveHistory.length - 1])
      if (bestMove) {
        makeMove(bestMove.from, bestMove.to)
      }
      setIsThinking(false)
    }, thinkingTime)
  }, [currentPlayer, gameMode, isThinking, board, difficulty, makeMove, moveHistory])

  useEffect(() => {
    makeAIMove()
  }, [makeAIMove])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isThinking || (gameMode === "ai" && currentPlayer === "black") || gameStats.winner) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const col = Math.floor(x / 80)
    const row = Math.floor(y / 80)

    if (row < 0 || row >= 8 || col < 0 || col >= 8) return

    const clickedPosition = { row, col }

    if (!selectedSquare) {
      const piece = board[row][col]
      if (piece && piece.type && piece.color === currentPlayer) {
        setSelectedSquare(clickedPosition)
      }
    } else {
      if (selectedSquare.row === row && selectedSquare.col === col) {
        setSelectedSquare(null)
      } else {
        // Check if the move is legal
        const legalMoves = getLegalMoves(currentPlayer, board, moveHistory[moveHistory.length - 1])
        const isLegal = legalMoves.some(
          (m) =>
            m.from.row === selectedSquare.row &&
            m.from.col === selectedSquare.col &&
            m.to.row === clickedPosition.row &&
            m.to.col === clickedPosition.col,
        )

        if (isLegal) {
          makeMove(selectedSquare, clickedPosition)
        } else {
          const piece = board[row][col]
          if (piece && piece.type && piece.color === currentPlayer) {
            setSelectedSquare(clickedPosition) // Select new piece if it's current player's
          } else {
            setGameStatus("Invalid move!")
            setSelectedSquare(null) // Deselect on invalid move
          }
        }
      }
    }
  }

  const undoMove = () => {
    if (moveHistory.length === 0 || isThinking || gameStats.winner) return

    const movesToUndo = gameMode === "ai" ? Math.min(2, moveHistory.length) : 1

    for (let i = 0; i < movesToUndo; i++) {
      if (moveHistory.length === 0) break

      const lastMove = moveHistory[moveHistory.length - 1]
      const newBoard = board.map((row) => [...row])

      // Undo castling: move rook back if it was a castling move
      if (lastMove.rookMove) {
        const rookFrom = lastMove.rookMove.from
        const rookTo = lastMove.rookMove.to
        const rook = newBoard[rookTo.row][rookTo.col] // Get the rook from its castled position
        newBoard[rookFrom.row][rookFrom.col] = { ...rook, hasMoved: lastMove.initialRookHasMoved } // Move rook back, restore hasMoved
        newBoard[rookTo.row][rookTo.col] = { type: null, color: null }
      }

      // Undo en passant: restore captured pawn
      if (lastMove.isEnPassantCapture && lastMove.capturedPawnPosition && lastMove.captured) {
        newBoard[lastMove.capturedPawnPosition.row][lastMove.capturedPawnPosition.col] = lastMove.captured
      }

      // Restore main piece
      newBoard[lastMove.from.row][lastMove.from.col] = { ...lastMove.piece, hasMoved: lastMove.initialPieceHasMoved } // Restore original hasMoved state
      newBoard[lastMove.to.row][lastMove.to.col] =
        lastMove.captured?.type && !lastMove.isEnPassantCapture ? lastMove.captured : { type: null, color: null }

      setBoard(newBoard)
      setMoveHistory((prev) => prev.slice(0, -1))
      setCurrentPlayer(currentPlayer === "white" ? "black" : "white")
      setGameStats((prev) => ({
        ...prev,
        totalMoves: prev.totalMoves - 1,
        whiteCaptures:
          lastMove.captured && lastMove.piece.color === "white" ? prev.whiteCaptures - 1 : prev.whiteCaptures,
        blackCaptures:
          lastMove.captured && lastMove.piece.color === "black" ? prev.blackCaptures - 1 : prev.blackCaptures,
      }))
    }

    setSelectedSquare(null)
    setGameStatus(`${currentPlayer === "white" ? "Black" : "White"} to move`)
  }

  const handleQuitGame = () => {
    const opponentColor = currentPlayer === "white" ? "black" : "white"
    onGameOver(
      {
        ...gameStats,
        winner: opponentColor, // Opponent wins if current player quits
        reason: `${userName} quit the game`,
        gameEndTime: Date.now(),
      },
      moveHistory,
    )
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getDifficultyName = (level: number) => {
    switch (level) {
      case 1:
        return "Easy"
      case 2:
        return "Medium"
      case 3:
        return "Hard"
      default:
        return "Medium"
    }
  }

  const currentPlayerName = currentPlayer === "white" ? userName : gameMode === "ai" ? "AI" : player2Name

  return (
    <div className="flex flex-col xl:flex-row items-start justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 gap-6">
      {/* Game Board */}
      <Card className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">Chess Game</CardTitle>
          <p className="text-xl font-semibold text-gray-800 mt-4">
            {isThinking ? (
              <span className="text-orange-600 animate-pulse">🤔 AI is thinking...</span>
            ) : (
              <>
                {currentPlayerName} to move
                {gameMode === "ai" && (
                  <span className="text-sm text-gray-600 ml-2">{currentPlayer === "white" ? "(You)" : "(AI)"}</span>
                )}
              </>
            )}
          </p>
          {timerMode !== "none" && (
            <div className="flex justify-around text-lg font-semibold mt-2">
              <div
                className={`p-2 rounded-md ${currentPlayer === "white" ? "bg-blue-100 text-blue-800" : "text-gray-700"}`}
              >
                {userName}: {formatTime(whiteTime)}
              </div>
              <div
                className={`p-2 rounded-md ${currentPlayer === "black" ? "bg-blue-100 text-blue-800" : "text-gray-700"}`}
              >
                {gameMode === "ai" ? "AI" : player2Name}: {formatTime(blackTime)}
              </div>
            </div>
          )}
          <div className="text-sm text-gray-600">Game time: {formatTime(Date.now() - gameStats.gameStartTime)}</div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`border-4 border-gray-800 rounded-lg shadow-lg ${
                  isThinking || (gameMode === "ai" && currentPlayer === "black") || gameStats.winner
                    ? "cursor-not-allowed opacity-75"
                    : "cursor-pointer hover:shadow-xl transition-shadow"
                }`}
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              onClick={undoMove}
              disabled={moveHistory.length === 0 || isThinking || gameStats.winner}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              ↶ Undo Move
            </Button>
            <Button
              onClick={handleQuitGame}
              disabled={gameStats.winner !== null} // Disable if game is already over
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              🛑 Quit Game
            </Button>
          </div>

          <div className="text-sm text-gray-600 text-center bg-gray-50 rounded-lg p-4">
            <p className="font-semibold mb-2">🎮 How to play:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
              <p>• Click a piece to select it</p>
              <p>• Click a valid square to move</p>
              <p>• Green dots show possible moves</p>
              <p>• Blue squares show last move</p>
              {gameMode === "ai" && <p>• You play as White ♔</p>}
              <p>• Castling: Move king 2 squares towards rook</p>
              <p>• En Passant: Pawn captures adjacent pawn that moved 2 squares</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Information Panel */}
      <Card className="bg-white rounded-xl shadow-2xl p-6 w-full xl:w-96 border border-gray-200">
        {/* Game Statistics */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 Game Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{gameStats.totalMoves}</div>
              <div className="text-sm text-gray-600">Total Moves</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{Math.floor(gameStats.totalMoves / 2) + 1}</div>
              <div className="text-sm text-gray-600">Current Turn</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{gameStats.whiteCaptures}</div>
              <div className="text-sm text-gray-600">White Captures</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{gameStats.blackCaptures}</div>
              <div className="text-sm text-gray-600">Black Captures</div>
            </div>
          </div>
          {gameMode === "ai" && (
            <div className="mt-4 bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-orange-600">AI: {getDifficultyName(difficulty)}</div>
              <div className="text-sm text-gray-600">Difficulty Level</div>
            </div>
          )}
          {timerMode !== "none" && (
            <div className="mt-4 bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-yellow-600">
                Timer: {timerMode.charAt(0).toUpperCase() + timerMode.slice(1)}
              </div>
              <div className="text-sm text-gray-600">Initial Time: {formatTime(initialTime)}</div>
            </div>
          )}
        </div>

        {/* Move History */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">📝 Move History</h2>
          <div className="max-h-80 overflow-y-auto bg-gray-50 rounded-lg p-4">
            {moveHistory.length === 0 ? (
              <p className="text-gray-500 text-center italic">No moves yet</p>
            ) : (
              <div className="space-y-2">
                {moveHistory.map((move, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm transition-all duration-200 ${
                      index % 2 === 0 ? "bg-white shadow-sm" : "bg-blue-50"
                    } ${index === moveHistory.length - 1 ? "ring-2 ring-blue-300" : ""}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">
                        {Math.floor(index / 2) + 1}.{index % 2 === 0 ? " " : ".. "}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(move.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">
                        {move.piece.color && move.piece.type ? PIECE_SYMBOLS[move.piece.color][move.piece.type] : ""}
                      </span>
                      <span className="capitalize font-medium text-gray-700">
                        {move.piece.color} {move.piece.type}
                      </span>
                      <span className="text-gray-600 text-xs">{move.notation}</span>
                    </div>
                    {move.captured && (
                      <div className="text-red-600 text-xs mt-1 font-medium">
                        ⚔️ Captured{" "}
                        {move.captured.color && move.captured.type
                          ? PIECE_SYMBOLS[move.captured.color][move.captured.type]
                          : ""}{" "}
                        {move.captured.type}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
