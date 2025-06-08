import React, { useState, useEffect } from 'react'

export default function Chat({ socket, roomId, username }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    if (!socket) return
    // incoming chat
    socket.on('chatMessage', ({ username: from, message }) => {
      setMsgs(m => [...m, { from, message }])
    })
    // join/leave announcements
    socket.on('userJoined', ({ username: u }) => {
      setMsgs(m=>[...m, { from:'System', message:`${u} joined` }])
    })
    socket.on('userLeft', ({ username: u }) => {
      setMsgs(m=>[...m, { from:'System', message:`${u} left` }])
    })
    return () => {
      socket.off('chatMessage')
      socket.off('userJoined')
      socket.off('userLeft')
    }
  }, [socket])

  const send = () => {
    if (!input.trim()) return
    socket.emit('chatMessage', { roomId, username, message: input.trim() })
    setInput('')
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <h2>Chat</h2>
      <div style={{flex:1, overflowY:'auto', marginBottom:'1rem'}}>
        {msgs.map((m,i)=>
          <div key={i}><strong>{m.from}:</strong> {m.message}</div>
        )}
      </div>
      <div>
        <input
          style={{width:'70%', padding:'0.5rem'}}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&send()}
        />
        <button style={{padding:'0.5rem', marginLeft:'0.5rem'}} onClick={send}>
          Send
        </button>
      </div>
    </div>
  )
}

