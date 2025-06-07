// src/routes/Lobby.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'

export default function Lobby() {
  const nav = useNavigate()
  const location = useLocation()
  const { username: incomingName, isHost: incomingHost } = location.state || {}
  const [username, setUsername] = useState(incomingName || '')
  const [room, setRoom] = useState('')
  const [isHost, setIsHost] = useState(incomingHost || false)
  const [participants, setParticipants] = useState([])
  const socketRef = useRef(null)

  useEffect(() => {
    if (!username || !room) return

    socketRef.current = io('http://localhost:1919')
    socketRef.current.emit('joinRoom', { roomId: room, username })
    socketRef.current.on('roomData', ({ participants }) => {
      setParticipants(participants)
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [username, room])

  const create = () => {
    if (!username.trim()) return
    const code = Math.random().toString(36).substr(2, 5)
    setRoom(code)
    setIsHost(true)
  }

  const join = () => {
    if (!username.trim() || !room.trim()) return
    nav('/prompt', { state: { roomId: room, username, isHost } })
  }

  return (
    <div className="flex">
      <section className="w-2/3 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Lobby</h1>

        {!username && (
          <>
            <label className="block mb-2">Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border p-2 mb-4"
            />
          </>
        )}

        {!room ? (
          <button
            onClick={create}
            className="w-full bg-green-600 text-white py-2 rounded mb-4"
          >
            Create Room
          </button>
        ) : (
          <>
            <p className="mb-2">
              Room Code: <strong>{room}</strong>
            </p>
            <button
              onClick={() => setRoom('')}
              className="underline text-sm mb-4"
            >
              Change Code
            </button>
            <button
              onClick={join}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              {isHost ? 'Enter & Add Prompts' : 'Join Room'}
            </button>
          </>
        )}

        <div className="mt-6">
          <h2 className="font-semibold mb-2">Participants:</h2>
          <ul className="list-disc pl-5">
            {participants.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </section>

      <ChatSidebar
        socket={socketRef.current}
        roomId={room}
        username={username}
      />
    </div>
  )
}
