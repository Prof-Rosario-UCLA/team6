import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import CanvasTool from '../components/CanvasTool'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'
import { io } from 'socket.io-client'

export default function Drawing() {
  const nav       = useNavigate()
  const { roomId, username, prompt, duration } = useLocation().state
  const [sock, setSock]   = useState(null)
  const timerRef = useRef(null)
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL)
    setSock(s)
    s.emit('joinRoom', { roomId, username })

    // countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(t => t - 1)
    }, 1000)

    // server ends drawing
    s.on('drawingEnded', () => {
      clearInterval(timerRef.current)
      nav('/voting', { state: { roomId, username } })
    })

    return () => {
      clearInterval(timerRef.current)
      s.disconnect()
    }
  }, [roomId, username, nav])

  return (
    <div className="flex">
      <section className="w-2/3 mx-auto">
        <h2 className="text-xl italic mb-2">Prompt: {prompt}</h2>
        <p className="mb-4">Time left: {timeLeft}s</p>
        <CanvasTool roomId={roomId} username={username} />
      </section>

      <ChatSidebar socket={sock} roomId={roomId} username={username} />
    </div>
  )
}
