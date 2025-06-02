// src/routes/Lobby.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Lobby() {
  const [room, setRoom] = useState('')
  const [username, setUsername] = useState('')
  const nav = useNavigate()

  const join = () => {
    if (!room.trim() || !username.trim()) return
    // Navigate to Drawing, passing roomId & username in state
    nav('/drawing', { state: { roomId: room.trim(), username: username.trim() } })
  }

  return (
    <section aria-labelledby="lobby-title" className="max-w-md mx-auto">
      <h1 id="lobby-title" className="text-2xl font-bold mb-4">Lobby</h1>

      <label htmlFor="username-input" className="block mb-2">Username</label>
      <input
        id="username-input"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full border p-2 mb-4"
        placeholder="e.g. Alice"
      />

      <label htmlFor="room-input" className="block mb-2">Room Code</label>
      <input
        id="room-input"
        type="text"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="w-full border p-2 mb-4"
        placeholder="e.g. abc123"
      />

      <button
        onClick={join}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
        disabled={!room.trim() || !username.trim()}
      >
        Join
      </button>
    </section>
  )
}
