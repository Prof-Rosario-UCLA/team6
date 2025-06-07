// src/routes/Lobby.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { SOCKET_SERVER_URL } from '../index.jsx'
import ChatSidebar from '../components/ChatSidebar'

export default function Lobby() {
  const nav = useNavigate()

  // 1) Load from localStorage so refresh doesn’t clear you out
  const [username, setUsername] = useState(
    () => localStorage.getItem('username') || ''
  )
  const [roomCode, setRoomCode] = useState(
    () => localStorage.getItem('roomCode') || ''
  )
  const [participants, setParticipants] = useState([])

  // 2) Persist back any time they change
  useEffect(() => {
    localStorage.setItem('username', username)
  }, [username])
  useEffect(() => {
    localStorage.setItem('roomCode', roomCode)
  }, [roomCode])

  // 3) Once we have both, spin up Socket.io & fetch the live list
  const socketRef = useRef(null)
  useEffect(() => {
    if (!username || !roomCode) return

    const sock = io(SOCKET_SERVER_URL)
    socketRef.current = sock

    sock.emit('joinRoom', { roomId: roomCode, username })

    // server will reply with the full list here
    sock.on('playerList', ({ players }) => {
      setParticipants(players)
    })

    // Cleanup on unmount
    return () => sock.disconnect()
  }, [username, roomCode])

  // Generate a brand-new code
  const handleCreate = () => {
    if (!username.trim()) return
    setRoomCode(Math.random().toString(36).substr(2, 5).toUpperCase())
  }
  // Navigate forward into the prompt step
  const handleJoin = () => {
    if (!username.trim() || !roomCode.trim()) return
    nav('/prompt', {
      state: { roomId: roomCode, username, isHost: false }
    })
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
