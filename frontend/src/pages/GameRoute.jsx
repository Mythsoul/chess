import { useState, useEffect } from "react"
import { useParams, useLocation, useNavigate } from "react-router-dom"
import GamePage from "./GamePage"

export default function GameRoute() {
  const { gameRoute } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [gameData, setGameData] = useState(null)
  const [playerColor, setPlayerColor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // If we have state from navigation (from joining a game), use it
    if (location.state?.playerColor && location.state?.gameData) {
      setPlayerColor(location.state.playerColor)
      setGameData(location.state.gameData)
      setLoading(false)
      return
    }

    // Otherwise, fetch game data from API
    const fetchGameData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/game/${gameRoute}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Game not found")
          } else {
            setError("Failed to load game")
          }
          return
        }

        const game = await response.json()
        setGameData(game)
        
        // For now, default to white if we can't determine player color
        // In a real implementation, you'd check if the user is authenticated
        // and determine their color based on their user ID
        setPlayerColor('white')
        setLoading(false)
      } catch (err) {
        console.error('Error fetching game:', err)
        setError("Failed to load game")
        setLoading(false)
      }
    }

    fetchGameData()
  }, [gameRoute, location.state])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-300 text-xl">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">{error}</h1>
          <button 
            onClick={() => navigate('/')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return <GamePage playerColor={playerColor} gameData={gameData} gameRoute={gameRoute} />
}
