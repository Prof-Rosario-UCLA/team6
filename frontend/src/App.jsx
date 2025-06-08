// src/App.jsx
import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_SERVER_URL, API_BASE_URL } from './config'
import Chat from './Chat'
import Canvas from './Canvas'

export default function App() {
  const [stage,         setStage]         = useState('lobby')
  const [username,      setUsername]      = useState('')
  const [roomId,        setRoomId]        = useState('')
  const [isHost,        setIsHost]        = useState(false)
  const [players,       setPlayers]       = useState([])
  const [promptText,    setPromptText]    = useState('')   // all prompts, one per line
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [duration,      setDuration]      = useState(0)
  const [timeLeft,      setTimeLeft]      = useState(0)
  const [liveDrawings,  setLiveDrawings]  = useState({})
  const [drawings,      setDrawings]      = useState([])
  const [selected,      setSelected]      = useState('')
  const [tally,         setTally]         = useState({})
  const socketRef       = useRef(null)
  const strokesBuf      = useRef({})

  // ─── Socket.io setup ────────────────────────────────────────────────────
  useEffect(() => {
    const sock = io(SOCKET_SERVER_URL)
    socketRef.current = sock

    sock.on('playerList', ({ players }) => setPlayers(players))

    sock.on('gameStarted', ({ prompt, duration: d }) => {
      setCurrentPrompt(prompt)
      setDuration(d)
      setTimeLeft(d)
      strokesBuf.current = {}
      setLiveDrawings({})
      setDrawings([])
      setStage('drawing')
    })

    sock.on('drawing', ({ username: u, stroke }) => {
      const buf = strokesBuf.current
      if (!buf[u]) buf[u] = []
      buf[u].push(stroke)
      setLiveDrawings(ld => {
        const copy = { ...ld }
        copy[u] = [...(copy[u]||[]), stroke]
        return copy
      })
    })

    sock.on('drawingEnded', () => {
      const arr = Object.entries(strokesBuf.current).map(
        ([u, strokes]) => ({ username: u, strokes })
      )
      setDrawings(arr)
      setStage('voting')
    })

    sock.on('votingEnded', ({ tally }) => {
      setTally(tally)
      setStage('results')
    })

    return () => sock.disconnect()
  }, [])

  // ─── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'drawing') return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          socketRef.current.emit('finishDrawing', { roomId, username })
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [stage])

  // ─── Lobby actions ───────────────────────────────────────────────────────
  const createRoom = () => {
    if (!username.trim()) return alert('Enter a username')
    const code = roomId.trim().toUpperCase() ||
      Math.random().toString(36).substr(2,5).toUpperCase()
    setRoomId(code)
    setIsHost(true)
    socketRef.current.emit('joinRoom', { roomId: code, username })
    setStage('prompts')
  }
  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) return alert('Fill both fields')
    socketRef.current.emit('joinRoom', { roomId, username })
    setIsHost(false)
    setStage('prompts')
  }

  // ─── Set Prompts & Start ─────────────────────────────────────────────────
const setPromptsAndStart = async () => {
  const lines = promptText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l)
  if (!lines.length) return alert('Enter at least one prompt')

  try {
    // <-- FIXED fetch URL here:
    const res  = await fetch(`${API_BASE_URL}/lobby/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, username, prompts: promptText })
    })
    const data = await res.json()
    if (!data.success) {
      alert(data.error || 'Failed to set prompts')
      return
    }
    socketRef.current.emit('startGame', { roomId })
  } catch (err) {
    alert('Network error: ' + err.message)
  }
}

  // ─── Voting action ───────────────────────────────────────────────────────
  const castVote = () => {
    if (!selected) return
    socketRef.current.emit('vote', { roomId, votedFor: selected })
  }

  // ─── Reset to lobby ──────────────────────────────────────────────────────
  const resetGame = () => {
    setStage('lobby'); setRoomId(''); setIsHost(false)
    setPlayers([]); setPromptText('')
    setCurrentPrompt(''); setDrawings([]); setLiveDrawings({})
    setTally({}); setSelected(''); setTimeLeft(0)
  }

  return (
    <div className="flex" style={{ height: '100%' }}>
      <section className="w-2/3 border-r p-4">

        {/* Lobby */}
        {stage==='lobby' && (
          <>
            <h1>Lobby</h1>
            <input
              placeholder="Username"
              value={username}
              onChange={e=>setUsername(e.target.value)}
            /><br/><br/>
            <input
              placeholder="Room code (or blank to create)"
              value={roomId}
              onChange={e=>setRoomId(e.target.value.toUpperCase())}
            /><br/><br/>
            <button onClick={createRoom}>Create Room</button>
            <button onClick={joinRoom}>Join Room</button>
            <h2>Players:</h2>
            <ul>{players.map(u=><li key={u}>{u}</li>)}</ul>
          </>
        )}

        {/* Prompts */}
        {stage==='prompts' && (
          <>
            <h1 className="text-2xl font-bold mb-4">Enter Prompts</h1>
            <textarea
              rows={6}
              className="w-full border p-2 mb-4"
              placeholder="One prompt per line…"
              value={promptText}
              onChange={e=>setPromptText(e.target.value)}
            />
            {isHost ? (
              <button
                onClick={setPromptsAndStart}
                disabled={!promptText.trim()}
                className="bg-green-600 text-white py-2 px-4 rounded"
              >
                Set Prompts
              </button>
            ) : (
              <p className="italic text-gray-600">Waiting for host…</p>
            )}
          </>
        )}

        {/* Drawing */}
        {stage==='drawing' && (
          <>
            <h1>Draw: {currentPrompt}</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {players.map(u=>(
                <div key={u}>
                  <small>{u}</small>
                  {u===username
                    ? <Canvas socket={socketRef.current} roomId={roomId}/>
                    : <Canvas strokes={liveDrawings[u]||[]} readOnly/>
                  }
                </div>
              ))}
            </div>
            <p>Time left: {timeLeft}s</p>
          </>
        )}

        {/* Voting */}
        {stage==='voting' && (
          <>
            <h1>Voting</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {drawings.map(d=>(
                <figure key={d.username}
                  onClick={()=>setSelected(d.username)}
                  style={{
                    cursor:'pointer',
                    border: selected===d.username ? '3px solid green' : '1px solid #ccc',
                    padding:'0.5rem'
                  }}
                >
                  <small>By {d.username}</small>
                  <Canvas strokes={d.strokes} readOnly/>
                </figure>
              ))}
            </div>
            <button
              onClick={castVote}
              disabled={!selected}
              className="bg-blue-600 text-white py-2 px-4 rounded"
            >
              Vote for {selected||'...'}
            </button>
          </>
        )}

        {/* Results */}
        {stage==='results' && (
          <>
            <h1>Results</h1>
            <ol>
              {Object.entries(tally)
                .sort((a,b)=>b[1]-a[1])
                .map(([u,v])=> <li key={u}>{u}: {v} votes</li>)}
            </ol>
            <button
              onClick={resetGame}
              className="bg-gray-600 text-white py-2 px-4 rounded"
            >
              Back to Lobby
            </button>
          </>
        )}
      </section>

      <aside className="w-1/3 p-4">
        <Chat socket={socketRef.current} roomId={roomId} username={username}/>
      </aside>
    </div>
  )
}
