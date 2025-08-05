"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameMode, GameStats, Move, PieceColor } from "@/lib/types"
import { PIECE_SYMBOLS } from "@/lib/chess-utils"

interface StatsPageProps {
  userName: string
  gameMode: GameMode
  gameStats: GameStats
  moveHistory: Move[]
  onPlayAgain: () => void
  onExit: () => void
}

export default function StatsPage({ userName, gameMode, gameStats, moveHistory, onPlayAgain, onExit }: StatsPageProps) {
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getWinnerText = (winner: PieceColor | "draw" | null) => {
    if (!winner) return "Game ended"
    if (winner === "draw") return "It's a Draw!"
    if (gameStats.reason === `${userName} quit the game`) {
      return `${userName} quit the game. ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`
    }
    return `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`
  }

  const getTimerModeName = (mode: string) => {
    switch (mode) {
      case "none":
        return "No Timer"
      case "blitz":
        return "Blitz (5+0)"
      case "rapid":
        return "Rapid (10+0)"
      case "classical":
        return "Classical (30+0)"
      default:
        return "N/A"
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl shadow-2xl border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-gray-800 mb-2">Game Over!</CardTitle>
          <CardDescription className="text-xl text-gray-700 font-semibold">
            {getWinnerText(gameStats.winner)}
          </CardDescription>
          {gameStats.reason && gameStats.reason !== `${userName} quit the game` && (
            <p className="text-lg text-gray-600 mt-1">Reason: {gameStats.reason}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold text-gray-700">Player:</div>
              <div className="text-2xl font-bold text-blue-600">{userName}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold text-gray-700">Mode:</div>
              <div className="text-2xl font-bold text-green-600 capitalize">{gameMode.replace("-", " ")}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold text-gray-700">Total Moves:</div>
              <div className="text-2xl font-bold text-purple-600">{gameStats.totalMoves}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold text-gray-700">Game Duration:</div>
              <div className="text-2xl font-bold text-orange-600">
                {gameStats.gameEndTime ? formatTime(gameStats.gameEndTime - gameStats.gameStartTime) : "N/A"}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold text-gray-700">White Captures:</div>
              <div className="text-2xl font-bold text-red-600">{gameStats.whiteCaptures}</div>
            </div>
            <div className="bg-teal-50 rounded-lg p-4 shadow-md">
              <div className="text-lg font-semibold text-gray-700">Black Captures:</div>
              <div className="text-2xl font-bold text-teal-600">{gameStats.blackCaptures}</div>
            </div>
            {gameStats.timerMode !== "none" && (
              <div className="bg-yellow-50 rounded-lg p-4 shadow-md col-span-full">
                <div className="text-lg font-semibold text-gray-700">Timer Mode:</div>
                <div className="text-2xl font-bold text-yellow-600">{getTimerModeName(gameStats.timerMode)}</div>
                <div className="text-sm text-gray-600">Initial Time: {formatTime(gameStats.initialTime)}</div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">Move Log</h3>
            <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4 border border-gray-200">
              {moveHistory.length === 0 ? (
                <p className="text-gray-500 text-center italic">No moves recorded</p>
              ) : (
                <div className="space-y-2">
                  {moveHistory.map((move, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg text-sm ${index % 2 === 0 ? "bg-white shadow-sm" : "bg-blue-50"}`}
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

          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={onPlayAgain}
              className="px-8 py-4 text-xl font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Play Again?
            </Button>
            <Button
              onClick={onExit}
              className="px-8 py-4 text-xl font-bold bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Exit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
