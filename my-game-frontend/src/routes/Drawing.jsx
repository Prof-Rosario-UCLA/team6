// src/routes/Drawing.jsx
import CanvasTool from '../components/CanvasTool'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Drawing() {
  const nav = useNavigate()
  const location = useLocation()
  const { roomId, username } = location.state || {}

  const handleNext = () => {
    // In a real app, you might POST the final drawing to REST first.
    // Here we simply navigate to Voting, carrying roomId & username forward.
    nav('/voting', { state: { roomId, username } })
  }

  if (!roomId || !username) {
    return (
      <section className="p-4">
        <p className="text-red-600">Error: Missing room or username. Go back to Lobby.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="drawing-title">
      <h1 id="drawing-title" className="text-2xl font-bold mb-4">Drawing (Room: {roomId})</h1>

      {/* CanvasTool handles all real-time drawing */}
      <CanvasTool roomId={roomId} username={username} />

      <button
        onClick={handleNext}
        className="mt-4 bg-green-600 text-white py-2 px-4 rounded"
      >
        Next: Submit Drawing
      </button>
    </section>
  )
}
