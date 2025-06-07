import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'

export default function Prompt() {
  const nav = useNavigate()
  const { roomId, username, isHost } = useLocation().state
  const [text, setText] = useState('')
  const [prompts, setPrompts] = useState([])
  const socket = io('http://localhost:1919')

  const add = () => {
    if (!text.trim()) return
    socket.emit('addPrompt', { roomId, prompt: text.trim() })
    setPrompts([...prompts, text.trim()])
    setText('')
  }

  const start = () => {
    socket.emit('startGame', { roomId })
    nav('/drawing', { state: { roomId, username } })
  }

  return (
    <div className="flex">
      <section className="w-2/3 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Prompts</h1>
        <ul className="list-disc pl-5 mb-4">
          {prompts.map((p,i) => <li key={i}>{p}</li>)}
        </ul>
        <div className="flex mb-4">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-grow border p-2"
            placeholder="New prompt"
          />
          <button
            onClick={add}
            className="ml-2 bg-blue-600 text-white px-4 rounded"
          >Add</button>
        </div>
        {isHost && (
          <button
            onClick={start}
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

