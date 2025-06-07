import { useState, useEffect } from 'react'

export default function ChatSidebar({ socket, roomId, username }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!socket) return
    socket.on('chat', msg => setMsgs(m => [...m, msg]))
  }, [socket])

  const send = () => {
    if (!input.trim()) return
    const msg = { roomId, from: username, text: input.trim() }
    socket.emit('chat', msg)
    setInput('')
  }

  return (
    <aside className="w-1/3 border-l p-4 flex flex-col">
      <h3 className="font-semibold mb-2">Chat</h3>
      <div className="flex-grow overflow-y-auto mb-2">
        {msgs.map((m,i) => (
          <div key={i} className="mb-1">
            <strong>{m.from}:</strong> {m.text}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-grow border p-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && send()}
        />
        <button onClick={send} className="ml-2 bg-blue-600 text-white px-4 rounded">
          Send
        </button>
      </div>
    </aside>
  )
}

