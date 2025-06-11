// src/Chat.jsx
import React, { useState, useEffect } from 'react'

export default function Chat({ socket, roomId, username }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!socket) return

    // Incoming chat messages from anyone
    const handleChat = ({ username: from, message }) => {
      setMsgs(m => [...m, { from, message }])
    }
    const handleJoin = ({ username: u }) => {
      setMsgs(m => [...m, { from: 'System', message: `${u} joined the room` }])
    }
    const handleLeave = ({ username: u }) => {
      setMsgs(m => [...m, { from: 'System', message: `${u} left the room` }])
    }

    socket.on('chatMessage', handleChat)
    socket.on('userJoined',  handleJoin)
    socket.on('userLeft',    handleLeave)

    return () => {
      socket.off('chatMessage', handleChat)
      socket.off('userJoined',  handleJoin)
      socket.off('userLeft',    handleLeave)
    }
  }, [socket])

  const send = () => {
    const text = input.trim()
    if (!text) return

    // 1) echo locally
    setMsgs(m => [...m, { from: username, message: text }])

    // 2) broadcast
    socket.emit('chatMessage', { roomId, username, message: text })

    setInput('')
  }

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3>Chat</h3>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
        {msgs.map((m, i) => (
          <div key={i}>
            <strong>{m.from}:</strong> {m.message}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <input
          style={{ flex: 1, padding: '0.5rem' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message…"
        />
        <button
          style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
          onClick={send}
        >
          Send
        </button>
      </div>
    </aside>
  )
}