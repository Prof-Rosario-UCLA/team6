// src/routes/Prompt.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function Prompt() {
  const navigate = useNavigate()
  const { roomId, username, isHost } = useLocation().state || {}
  const [socket, setSocket] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [text, setText] = useState('')

  // If no state, kick back to lobby
  useEffect(() => {
    if (!roomId || !username) {
      navigate('/', { replace: true })
    }
  }, [roomId, username, navigate])

  useEffect(() => {
    if (!roomId || !username) return
    const s = io(SOCKET_SERVER_URL)
    setSocket(s)

    s.emit('joinRoom', { roomId, username })
    // Fetch any existing prompts
    s.emit('getPrompts', { roomId })
    s.on('promptList', ({ prompts: list }) => setPrompts(list))

    // When host calls startGame, backend emits gameStarted
    s.on('gameStarted', ({ prompt, duration }) => {
      navigate('/drawing', {
        state: { roomId, username, prompt, duration },
      })
    })

    return () => s.disconnect()
  }, [roomId, username, navigate])

  const addPrompt = () => {
    if (!text.trim()) return
    socket.emit('addPrompt', { roomId, prompt: text.trim() })
    setPrompts(ps => [...ps, text.trim()])
    setText('')
  }
  const startGame = () => socket.emit('startGame', { roomId })

  return (
    <div className="flex">
      <section className="w-2/3 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Enter Prompts</h1>

        <ul className="list-disc pl-5 mb-4">
          {prompts.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>

        {isHost ? (
          <>
            <div className="flex mb-4">
              <input
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
            <button
              onClick={startGame}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              Start Game
            </button>
          </>
        ) : (
          <p className="text-gray-600 italic">Waiting for host to start…</p>
        )}
      </section>

      <ChatSidebar socket={socket} roomId={roomId} username={username} />
    </div>
  )
}
