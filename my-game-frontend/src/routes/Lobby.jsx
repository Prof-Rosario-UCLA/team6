// src/routes/Lobby.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function Lobby() {
  const nav = useNavigate()

  // Per-tab storage so tabs don’t share values
  const [username, setUsername] = useState(
    () => sessionStorage.getItem('username') || ''
  )
  const [roomCode, setRoomCode] = useState(
    () => sessionStorage.getItem('roomCode') || ''
  )
  const [participants, setParticipants] = useState([])
  const [isHost, setIsHost] = useState(false)
  const socketRef = useRef(null)

  // Persist per-tab
  useEffect(() => {
    sessionStorage.setItem('username', username)
  }, [username])
  useEffect(() => {
    sessionStorage.setItem('roomCode', roomCode)
  }, [roomCode])

  // Connect socket once both are set
  const connectSocket = (code, user) => {
    if (socketRef.current) socketRef.current.disconnect()
    const sock = io(SOCKET_SERVER_URL)
    socketRef.current = sock

    sock.emit('joinRoom', { roomId: code, username: user })
    sock.on('playerList', ({ players }) => setParticipants(players))
    sock.on('roomClosed', () => {
      // If host leaves, backend broadcasts roomClosed → go home
      setParticipants([])
      setRoomCode('')
      setIsHost(false)
    })
  }

  // Host flow
  const handleCreate = () => {
    if (!username.trim()) return
    const code = Math.random().toString(36).substr(2, 5).toUpperCase()
    setIsHost(true)
    setRoomCode(code)
    connectSocket(code, username)
    nav('/prompt', { state: { roomId: code, username, isHost: true } })
  }

  // Player flow
  const handleJoin = () => {
    if (!username.trim() || !roomCode.trim()) return
    setIsHost(false)
    connectSocket(roomCode, username)
    nav('/prompt', { state: { roomId: roomCode, username, isHost: false } })
  }

  return (
    <div className="flex">
      <section className="w-2/3 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Lobby</h1>

        <label className="block mb-2">Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border p-2 mb-4"
          placeholder="Your name"
        />

        <label className="block mb-2">Room Code</label>
        <input
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          className="w-full border p-2 mb-4"
          placeholder="ABCDE (or leave blank to create)"
        />

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

        {participants.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2">Participants:</h2>
            <ul className="list-disc pl-5">
              {participants.map(p => (
                <li key={p}>{p}</li>
              ))}
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
