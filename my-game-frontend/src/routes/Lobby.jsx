import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function Lobby() {
  const nav = useNavigate()
  const [username,   setUsername]   = useState('')
  const [roomId,     setRoomId]     = useState('')
  const [participants, setParticipants] = useState([])
  const [host,       setHost]       = useState(null)
  const socketRef = useRef(null)

  // when roomId + username set → connect
  useEffect(() => {
    if (!roomId || !username) return

    const sock = io(SOCKET_SERVER_URL)
    socketRef.current = sock
    sock.emit('joinRoom', { roomId, username })

    sock.on('playerList', ({ players, host }) => {
      setParticipants(players)
      setHost(host)
    })
    sock.on('userJoined',   ({ username }) => setParticipants(p => [...p, username]))
    sock.on('userLeft',     ({ username }) => setParticipants(p => p.filter(x => x !== username)))
    sock.on('roomClosed',   () => nav('/'))  // kick back

    return () => sock.disconnect()
  }, [roomId, username, nav])

  const handleCreate = () => {
    const code = Math.random().toString(36).slice(2, 7)
    setRoomId(code)
  }

  const handleJoin = () => {
    if (!roomId || !username) return
    nav('/prompt', { state: { roomId, username, isHost: username === host } })
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
        />

        { !roomId ? (
          <button
            onClick={handleCreate}
            className="w-full bg-green-600 text-white py-2 mb-4 rounded"
          >
            Create Room
          </button>
        ) : (
          <>
            <p className="mb-2">Room Code: <strong>{roomId}</strong></p>
            <button
              onClick={() => setRoomId('')}
              className="underline text-sm mb-4"
            >
              Change
            </button>
            <button
              onClick={handleJoin}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              {username === host ? 'You’re Host – Add Prompts' : 'Join Room'}
            </button>
          </>
        )}

        <div className="mt-6">
          <h2 className="font-semibold mb-2">Participants:</h2>
          <ul className="list-disc pl-5">
            {participants.map(p => <li key={p}>{p}</li>)}
          </ul>
        </div>
      </section>

      <ChatSidebar
        socket={socketRef.current}
        roomId={roomId}
        username={username}
      />
    </div>
  )
}
