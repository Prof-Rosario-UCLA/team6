import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function Prompt() {
  const nav = useNavigate()
  const { roomId, username, isHost } = useLocation().state
  const [text,    setText]    = useState('')
  const [prompts, setPrompts] = useState([])
  const [sock,    setSock]    = useState(null)

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL)
    setSock(s)
    s.emit('joinRoom', { roomId, username })

    // when server tells us game has begun:
    s.on('gameStarted', ({ prompt, duration }) => {
      nav('/drawing', { state: { roomId, username, prompt, duration } })
    })
    return () => s.disconnect()
  }, [roomId, username, nav])

  const addPrompt = async () => {
    if (!text.trim()) return
    await fetch(`${SOCKET_SERVER_URL}/api/lobby/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, username, prompt: text.trim() })
    })
    setPrompts(ps => [...ps, text.trim()])
    setText('')
  }

  const startGame = () => {
    sock.emit('startGame', { roomId })
    // host will also be redirected by 'gameStarted' listener
  }

  return (
    <div className="flex">
      <section className="w-2/3 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Enter Prompts</h1>

        <ul className="list-disc pl-5 mb-4">
          {prompts.map((p,i) => <li key={i}>{p}</li>)}
        </ul>

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
          >Add</button>
        </div>

        {isHost && (
          <button
            onClick={startGame}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Start Game
          </button>
        )}
      </section>

      <ChatSidebar socket={sock} roomId={roomId} username={username} />
    </div>
)
}
