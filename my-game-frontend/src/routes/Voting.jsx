// src/routes/Voting.jsx
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'

export default function Voting() {
  const location = useLocation()
  const { roomId, username } = location.state || {}
  const socketRef = useRef(null)

  // Local state: list of drawings and vote counts
  const [drawings, setDrawings] = useState([
    // Example placeholder; in a real app you’d fetch this from REST or server
    // { id: 'd1', url: '/uploads/d1.png', votes: 0 },
    // { id: 'd2', url: '/uploads/d2.png', votes: 0 },
  ])
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (!roomId || !username) return

    // 1) Connect to Socket.io
    socketRef.current = io('http://localhost:1919', {
      transports: ['websocket'],
    })

    // 2) Join the room (so that this client can both emit and receive)
    socketRef.current.emit('joinRoom', { roomId, username })

    // 3) Listen for others’ vote clicks
    socketRef.current.on('voteClick', (message) => {
      // `message` could be something like { drawingId, voter: 'Bob' }
      // You’ll likely update local `drawings` array here
      // For example, increment the votes for that drawing:
      setDrawings(prev =>
        prev.map(d =>
          d.id === message.drawingId
            ? { ...d, votes: d.votes + 1 }
            : d
        )
      )
    })

    // 4) (Optional) On mount, request current vote state:
    socketRef.current.emit('getCurrentVotes', { roomId })
    // If you implement a 'currentVotes' handler on the server, you can sync up.

    // Cleanup
    return () => {
      socketRef.current.disconnect()
    }
  }, [roomId, username])

  const handleVote = e => {
    e.preventDefault()
    if (!selectedId || !roomId || !username) return

    // Emit a voteClick event to server, so that server can broadcast to all others
    socketRef.current.emit('voteClick', {
      roomId,
      message: { drawingId: selectedId, voter: username }
    })

    // Locally increment immediately (optimistic UI)
    setDrawings(prev =>
      prev.map(d =>
        d.id === selectedId
          ? { ...d, votes: d.votes + 1 }
          : d
      )
    )

    // Optionally disable voting form or show a “Thanks” message
  }

  if (!roomId || !username) {
    return (
      <section className="p-4">
        <p className="text-red-600">Error: Missing room or username. Go back to Lobby.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="voting-title">
      <h1 id="voting-title" className="text-2xl font-bold mb-4">Voting (Room: {roomId})</h1>
      <form onSubmit={handleVote}>
        <fieldset>
          <legend className="sr-only">Select your favorite drawing</legend>
          {drawings.map(d => (
            <figure key={d.id} className="mb-4">
              <img
                src={d.url}
                alt={`Drawing ${d.id}`}
                className="border max-w-xs"
              />
              <figcaption className="flex items-center mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="vote"
                    value={d.id}
                    checked={selectedId === d.id}
                    onChange={() => setSelectedId(d.id)}
                  />
                  <span>Vote for this</span>
                </label>
                <span className="ml-auto text-sm text-gray-600">
                  ({d.votes} votes)
                </span>
              </figcaption>
            </figure>
          ))}
        </fieldset>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          disabled={!selectedId}
        >
          Submit Vote
        </button>
      </form>
    </section>
  )
}
