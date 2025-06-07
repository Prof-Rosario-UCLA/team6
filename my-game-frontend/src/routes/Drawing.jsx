import CanvasTool from '../components/CanvasTool'
import { useNavigate, useLocation } from 'react-router-dom'
import ChatSidebar from '../components/ChatSidebar'
import { io } from 'socket.io-client'
import { useEffect, useState } from 'react'

export default function Drawing() {
  const nav = useNavigate()
  const { roomId, username } = useLocation().state
  const socket = io('http://localhost:1919')
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    socket.on('newPrompt', ({ prompt }) => setPrompt(prompt))
  }, [])

  const finish = () => {
    socket.emit('drawingDone', { roomId, username })
    nav('/voting', { state: { roomId, username } })
  }

  return (
    <div className="flex">
      <section className="w-2/3 mx-auto">
        <h2 className="text-xl italic mb-2">Prompt:</h2>
        <p className="mb-4">{prompt}</p>
        <CanvasTool roomId={roomId} username={username} />
        <button
          onClick={finish}
          className="mt-4 bg-green-600 text-white py-2 px-4 rounded"
        >
          Done Drawing
        </button>
      </section>

      <ChatSidebar
        socket={socket}
        roomId={roomId}
        username={username}
      />
    </div>
  )
}
