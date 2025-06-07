import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function Results() {
  const nav = useNavigate()
  const { roomId } = useLocation().state
  const socket = io('http://localhost:1919')
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    socket.emit('getResults', { roomId })
    socket.on('results', data => setLeaderboard(data))
  }, [])

  return (
    <section className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Results</h1>
      <ol className="list-decimal pl-5 mb-4">
        {leaderboard.map((p,i) => (
          <li key={p.username} className="mb-1">
            {p.username}: {p.votes}
          </li>
        ))}
      </ol>
      <button
        onClick={() => nav('/')}
        className="bg-blue-600 text-white py-2 px-4 rounded"
      >
        Back to Lobby
      </button>
    </section>
  )
}
