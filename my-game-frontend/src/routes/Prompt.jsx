import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'

export default function Prompt() {
  const navigate = useNavigate()
  const { roomId, username, isHost } = useLocation().state || {}
  const [socket, setSocket] = useState(null)
  const [prompts, setPrompts] = useState([])
  const [text, setText] = useState('')

  // Redirect back to lobby if someone lands here without state
  useEffect(() => {
    if (!roomId || !username) navigate('/', { replace: true })
  }, [roomId, username, navigate])

  // On mount, connect socket and join the room
  useEffect(() => {
    if (!roomId || !username) return
    const s = io('http://localhost:1919')
    setSocket(s)
    s.emit('joinRoom', { roomId, username })

    // When the host actually starts, server emits 'gameStarted'
    s.on('gameStarted', ({ prompt, duration }) => {
      navigate('/drawing', { state: { roomId, username, prompt, duration } })
    })

    // If you want to see errors (e.g. trying to start with no prompts)
    s.on('error', ({ message }) => alert(message))

    return () => s.disconnect()
  }, [roomId, username, navigate])

  // New: POST to backend instead of socket.emit('addPrompt')
  const addPrompt = async () => {
    if (!text.trim()) return
    try {
      const res = await fetch('/api/lobby/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          username,
          prompts: text.trim()
        })
      })
      if (!res.ok) {
        const { error } = await res.json()
        return alert(error)
      }
      setPrompts(ps => [...ps, text.trim()])
      setText('')
    } catch (err) {
      console.error(err)
      alert('Could not add prompt')
    }
  }

  // Emit the real "startGame" (server will pick a random prompt)
  const startGame = () => {
    socket.emit('startGame', { roomId })
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
