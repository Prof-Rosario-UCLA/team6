// src/routes/Prompt.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function Prompt() {
  const navigate = useNavigate()
  const location = useLocation()
  // If location.state is undefined, bail back to Lobby
  const { roomId, username, isHost } = location.state || {}
  useEffect(() => {
    if (!roomId || !username) {
      navigate('/', { replace: true })
    }
  }, [roomId, username, navigate])

  const [text, setText] = useState('')
  const [prompts, setPrompts] = useState([])
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!roomId || !username) return

    const s = io(SOCKET_SERVER_URL)
    setSocket(s)

    // Join the room
    s.emit('joinRoom', { roomId, username })

    // Initialize prompt list if backend has one
    s.emit('getPrompts', { roomId })
    s.on('promptList', ({ prompts: list }) => {
      setPrompts(list)
    })

    // When host clicks “Start Game,” server will broadcast this
    s.on('gameStarted', ({ prompt, duration }) => {
      navigate('/drawing', {
        state: { roomId, username, prompt, duration }
      })
    })

    return () => {
      s.disconnect()
    }
  }, [roomId, username, navigate])

  const addPrompt = () => {
    if (!socket || !text.trim()) return
    socket.emit('addPrompt', { roomId, prompt: text.trim() })
    setPrompts(ps => [...ps, text.trim()])
    setText('')
  }

  const startGame = () => {
    if (!socket) return
    socket.emit('startGame', { roomId })
    // Navigation to /drawing happens in the gameStarted handler
  }

  return (
    <div className="flex">
      <section className="w-2/3 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Enter Prompts</h1>

        <ul className="list-disc pl-5 mb-4">
          {prompts.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>

        {isHost && (
          <div className="flex mb-4">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="flex-grow border p-2"
              placeholder="New prompt…"
            />
            <button
              onClick={addPrompt}
              className="ml-2 bg-blue-600 text-white px-4 rounded"
            >
              Add
            </button>
          </div>
        )}

        {isHost && (
          <button
            onClick={startGame}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Start Game
          </button>
        )}
      </section>

      <ChatSidebar
        socket={socket}
        roomId={roomId}
        username={username}
      />
    </div>
  )
}
