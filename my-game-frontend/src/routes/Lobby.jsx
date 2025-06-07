// src/routes/Lobby.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { SOCKET_SERVER_URL } from '../index.jsx'
import ChatSidebar from '../components/ChatSidebar'

export default function Lobby() {
  const nav = useNavigate()

  const [username, setUsername] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [participants, setParticipants] = useState([])
  const socketRef = useRef(null)

  // Whenever we have both username + roomCode, connect to socket
  useEffect(() => {
    if (!username || !roomCode) return

    const socket = io(SOCKET_SERVER_URL)
    socketRef.current = socket

    socket.emit('joinRoom', { roomId: roomCode, username })

    socket.on('playerList', ({ players }) => {
      setParticipants(players)
    })

    return () => socket.disconnect()
  }, [username, roomCode])

  // Generate a new room code
  const handleCreate = () => {
    if (!username.trim()) return
    const code = Math.random().toString(36).substr(2, 5).toUpperCase()
    setRoomCode(code)
  }

  // Navigate into the flow as a joining player
  const handleJoin = () => {
    if (!username.trim() || !roomCode.trim()) return
    nav('/prompt', { state: { roomId: roomCode, username, isHost: false } })
  }

  return (
    <div className="flex">
      <section className="w-2/3 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Lobby</h1>

        {/* Username always required */}
        <label className="block mb-2">Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border p-2 mb-4"
          placeholder="Your name"
        />

        {/* Room code input */}
        <label className="block mb-2">Room Code</label>
        <input
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          className="w-full border p-2 mb-4"
          placeholder="ABCDE (or leave blank to create)"
        />

        {/* Action buttons */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={handleCreate}
            className="flex-1 bg-green-600 text-white py-2 rounded"
          >
            Create Room
          </button>
          <button
            onClick={handleJoin}
            className="flex-1 bg-blue-600 text-white py-2 rounded"
          >
            Join Room
          </button>
        </div>

        {/* Show participants once joined */}
        {participants.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2">Participants:</h2>
            <ul className="list-disc pl-5">
              {participants.map(p => <li key={p}>{p}</li>)}
            </ul>
          </div>
        )}
      </section>

      <ChatSidebar
        socket={socketRef.current}
        roomId={roomCode}
        username={username}
      />
    </div>
  )
}
