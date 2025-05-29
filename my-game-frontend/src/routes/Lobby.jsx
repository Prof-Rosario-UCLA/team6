import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Lobby() {
  const [room, setRoom] = useState('')
  const nav = useNavigate()

  const join = () => {
    // TODO: API call to join/create room
    nav('/drawing')
  }

  return (
    <section aria-labelledby="lobby-title" className="max-w-md mx-auto">
      <h1 id="lobby-title" className="text-2xl font-bold mb-4">Lobby</h1>
      <label htmlFor="room-input" className="block mb-2">Room Code</label>
      <input
        id="room-input"
        type="text"
        value={room}
        onChange={e => setRoom(e.target.value)}
        className="w-full border p-2 mb-4"
      />
      <button
        onClick={join}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        Join
      </button>
    </section>
  )
}

