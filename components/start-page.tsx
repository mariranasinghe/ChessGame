"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameMode, TimerMode } from "@/lib/types"

interface StartPageProps {
  onStartGame: (
    userName: string,
    player2Name: string,
    gameMode: GameMode,
    difficulty: number,
    timerMode: TimerMode,
    initialTime: number,
  ) => void
}

export default function StartPage({ onStartGame }: StartPageProps) {
  const [userName, setUserName] = useState("Player 1")
  const [player2Name, setPlayer2Name] = useState("Player 2") // New state for Player 2
  const [gameMode, setGameMode] = useState<GameMode>("local")
  const [difficulty, setDifficulty] = useState<number>(2) // 1: Easy, 2: Medium, 3: Hard
  const [timerMode, setTimerMode] = useState<TimerMode>("none") // New: Timer mode
  const [initialTime, setInitialTime] = useState<number>(0) // New: Initial time in milliseconds

  const handleStart = () => {
    if (userName.trim()) {
      let selectedInitialTime = 0
      switch (timerMode) {
        case "blitz":
          selectedInitialTime = 5 * 60 * 1000 // 5 minutes
          break
        case "rapid":
          selectedInitialTime = 10 * 60 * 1000 // 10 minutes
          break
        case "classical":
          selectedInitialTime = 30 * 60 * 1000 // 30 minutes
          break
        case "none":
        default:
          selectedInitialTime = 0 // Unlimited
          break
      }
      setInitialTime(selectedInitialTime) // Update state for consistency, though it's passed directly
      onStartGame(userName.trim(), player2Name.trim(), gameMode, difficulty, timerMode, selectedInitialTime)
    } else {
      alert("Please enter your name!")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-gray-800">Chess Game</CardTitle>
          <CardDescription className="text-gray-600 mt-2">Enter your name and choose your game mode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="userName" className="text-lg font-medium text-gray-700">
              Your Name (White)
            </label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="text-lg p-3"
            />
          </div>

          {gameMode === "local" && (
            <div className="space-y-2">
              <label htmlFor="player2Name" className="text-lg font-medium text-gray-700">
                Player 2 Name (Black)
              </label>
              <Input
                id="player2Name"
                type="text"
                placeholder="Enter Player 2's name"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                className="text-lg p-3"
              />
            </div>
          )}

          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-700">Choose Game Mode</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setGameMode("local")}
                className={`flex-1 py-3 text-lg font-semibold transition-all duration-200 ${
                  gameMode === "local"
                    ? "bg-blue-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md"
                }`}
              >
                👥 Local Multiplayer
              </Button>
              <Button
                onClick={() => setGameMode("ai")}
                className={`flex-1 py-3 text-lg font-semibold transition-all duration-200 ${
                  gameMode === "ai"
                    ? "bg-green-600 text-white shadow-lg transform scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md"
                }`}
              >
                🤖 vs AI
              </Button>
            </div>
          </div>

          {gameMode === "ai" && (
            <div className="space-y-3">
              <p className="text-lg font-medium text-gray-700">AI Difficulty</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3].map((level) => (
                  <Button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`px-5 py-2 text-base rounded-lg font-medium transition-all duration-200 ${
                      difficulty === level
                        ? "bg-orange-500 text-white shadow-md transform scale-105"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {level === 1 ? "Easy" : level === 2 ? "Medium" : "Hard"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-lg font-medium text-gray-700">Game Timer</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                onClick={() => setTimerMode("none")}
                className={`px-5 py-2 text-base rounded-lg font-medium transition-all duration-200 ${
                  timerMode === "none"
                    ? "bg-purple-500 text-white shadow-md transform scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                No Timer
              </Button>
              <Button
                onClick={() => setTimerMode("blitz")}
                className={`px-5 py-2 text-base rounded-lg font-medium transition-all duration-200 ${
                  timerMode === "blitz"
                    ? "bg-purple-500 text-white shadow-md transform scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Blitz (5+0)
              </Button>
              <Button
                onClick={() => setTimerMode("rapid")}
                className={`px-5 py-2 text-base rounded-lg font-medium transition-all duration-200 ${
                  timerMode === "rapid"
                    ? "bg-purple-500 text-white shadow-md transform scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Rapid (10+0)
              </Button>
              <Button
                onClick={() => setTimerMode("classical")}
                className={`px-5 py-2 text-base rounded-lg font-medium transition-all duration-200 ${
                  timerMode === "classical"
                    ? "bg-purple-500 text-white shadow-md transform scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Classical (30+0)
              </Button>
            </div>
          </div>

          <Button
            onClick={handleStart}
            className="w-full py-4 text-xl font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ▶️ Start Game
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
