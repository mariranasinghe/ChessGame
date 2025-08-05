"use client"
import { useState } from "react"
import StartPage from "@/components/start-page"
import GamePageComponent from "@/components/game-page"
import StatsPage from "@/components/stats-page"
import type { GameMode, GameState, GameStats, Move, TimerMode } from "@/lib/types"

type PieceType = "pawn" | "rook" | "knight" | "bishop" | "queen" | "king" | null
type PieceColor = "white" | "black" | null

interface Piece {
  type: PieceType
  color: PieceColor
}

interface Position {
  row: number
  col: number
}

const PIECE_SYMBOLS = {
  white: {
    pawn: "♙",
    rook: "♖",
    knight: "♘",
    bishop: "♗",
    queen: "♕",
    king: "♔",
  },
  black: {
    pawn: "♟",
    rook: "♜",
    knight: "♞",
    bishop: "♝",
    queen: "♛",
    king: "♚",
  },
}

const PIECE_VALUES = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 1000,
}

const HomePage = () => {
  const [gameState, setGameState] = useState<GameState>("start")
  const [userName, setUserName] = useState("")
  const [player2Name, setPlayer2Name] = useState("") // New state for Player 2
  const [mode, setMode] = useState<GameMode>("local")
  const [diff, setDiff] = useState(2)
  const [timerMode, setTimerMode] = useState<TimerMode>("none") // New: Timer mode
  const [initialTime, setInitialTime] = useState<number>(0) // New: Initial time in milliseconds
  const [finalGameStats, setFinalGameStats] = useState<GameStats | null>(null)
  const [finalMoveHistory, setFinalMoveHistory] = useState<Move[]>([])

  const handleStartGame = (
    name: string,
    p2Name: string,
    mode: GameMode,
    diff: number,
    timer: TimerMode,
    time: number,
  ) => {
    setUserName(name)
    setPlayer2Name(p2Name) // Set Player 2 name
    setMode(mode)
    setDiff(diff)
    setTimerMode(timer) // Set timer mode
    setInitialTime(time) // Set initial time
    setGameState("playing")
  }

  const handleGameOver = (stats: GameStats, history: Move[]) => {
    setFinalGameStats(stats)
    setFinalMoveHistory(history)
    setGameState("stats")
  }

  const handlePlayAgain = () => {
    setGameState("start")
    setFinalGameStats(null)
    setFinalMoveHistory([])
  }

  const handleExit = () => {
    setGameState("exit")
    console.log("Thank you for playing! Have a pleasant day.")
    // In a real app, you might redirect or close the window here.
  }

  switch (gameState) {
    case "start":
      return <StartPage onStartGame={handleStartGame} />
    case "playing":
      return (
        <GamePageComponent
          userName={userName}
          player2Name={player2Name} // Pass Player 2 name
          gameMode={mode}
          difficulty={diff}
          timerMode={timerMode} // Pass timer mode
          initialTime={initialTime} // Pass initial time
          onGameOver={handleGameOver}
        />
      )
    case "stats":
      return finalGameStats ? (
        <StatsPage
          userName={userName}
          gameMode={mode}
          gameStats={finalGameStats}
          moveHistory={finalMoveHistory}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      ) : null
    case "exit":
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <h1 className="text-5xl font-bold text-gray-800">Thank you for playing, {userName}!</h1>
          <p className="text-2xl text-gray-600 mt-4">Have a pleasant day.</p>
        </div>
      )
    default:
      return null
  }
}

export default HomePage
