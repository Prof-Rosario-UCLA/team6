// src/App.jsx
import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_SERVER_URL, API_BASE_URL } from './config'
import Chat from './Chat'
import Canvas from './Canvas'

export default function App() {
  const [stage,         setStage]         = useState('lobby')     // lobby → prompts → drawing → voting → results
  const [username,      setUsername]      = useState('')
  const [roomId,        setRoomId]        = useState('')
  const [isHost,        setIsHost]        = useState(false)
  const [players,       setPlayers]       = useState([])
  const [prompts,       setPrompts]       = useState([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [duration,      setDuration]      = useState(0)
  const [timeLeft,      setTimeLeft]      = useState(0)
  const [drawings,      setDrawings]      = useState([])         // [{ username, strokes }]
  const [selected,      setSelected]      = useState('')
  const [tally,         setTally]         = useState({})
  const socketRef      = useRef(null)
  const strokesBuf     = useRef({})

  // ─── Socket.io setup ─────────────────────────────────────────────
  useEffect(() => {
    const sock = io(SOCKET_SERVER_URL)
    socketRef.current = sock

    sock.on('playerList', ({ players }) => setPlayers(players))
    sock.on('promptList', ({ prompts }) => setPrompts(prompts))

    sock.on('gameStarted', ({ prompt, duration: d }) => {
      setCurrentPrompt(prompt)
      setDuration(d)
      setTimeLeft(d)
      strokesBuf.current = {}
      setDrawings([])
      setStage('drawing')
    })

    sock.on('drawing', ({ username: u, stroke }) => {
      const buf = strokesBuf.current
      if (!buf[u]) buf[u] = []
      buf[u].push(stroke)
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

  // ─── Countdown for drawing ───────────────────────────────────────
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

  // ─── Lobby actions ───────────────────────────────────────────────
  const createRoom = () => {
    if (!username.trim()) return alert('Enter a username')
    const code = roomId.trim().toUpperCase() || Math.random().toString(36).substr(2,5).toUpperCase()
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

  // ─── Prompt actions ──────────────────────────────────────────────
  const addPrompt = async txt => {
    if (!txt.trim()) return
    const res = await fetch(`${API_BASE_URL}/lobby/prompts`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ roomId, username, prompts: txt.trim() })
    })
    if (res.ok) {
      setPrompts(ps => [...ps, txt.trim()])
    } else {
      alert((await res.json()).error)
    }
  }
  const startGame = () => {
    if (!prompts.length) return alert('Add at least one prompt')
    socketRef.current.emit('startGame', { roomId })
  }

  // ─── Voting action ───────────────────────────────────────────────
  const castVote = () => {
    if (!selected) return
    socketRef.current.emit('vote', { roomId, votedFor: selected })
  }

  // ─── Reset back to lobby ──────────────────────────────────────────
  const resetGame = () => {
    setStage('lobby')
    setRoomId('');   setIsHost(false)
    setPlayers([]);  setPrompts([])
    setCurrentPrompt(''); setDrawings([])
    setTally({});    setSelected(''); setTimeLeft(0)
  }

  return (
    <div className="flex" style={{ height: '100%' }}>
      <section className="w-2/3 border-r p-4">
        {/* Lobby */}
        {stage === 'lobby' && (
          <>
            <h1>Lobby</h1>
            <input
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            /><br/><br/>
            <input
              placeholder="Room code (or blank to create)"
              value={roomId}
              onChange={e => setRoomId(e.target.value.toUpperCase())}
            /><br/><br/>
            <button onClick={createRoom}>Create Room</button>
            <button onClick={joinRoom}>Join Room</button>
            <h2>Players:</h2>
            <ul>{players.map(u => <li key={u}>{u}</li>)}</ul>
          </>
        )}

        {/* Prompts */}
        {stage === 'prompts' && (
          <>
            <h1>Enter Prompts</h1>
            {/* Show existing prompts */}
            {prompts.length > 0 && (
              <ul className="mb-4 list-disc pl-5">
                {prompts.map((p,i) => <li key={i}>{p}</li>)}
              </ul>
            )}
            <PromptInput onAdd={addPrompt} />
            {isHost ? (
              <button onClick={startGame} disabled={!prompts.length}>
                Start Game
              </button>
            ) : (
              <p>Waiting for host to start…</p>
            )}
          </>
        )}

        {/* Drawing */}
        {stage === 'drawing' && (
          <>
            <h1>Draw: {currentPrompt}</h1>
            <Canvas socket={socketRef.current} roomId={roomId} />
            <p>Time left: {timeLeft}s</p>
          </>
        )}

        {/* Voting */}
        {stage === 'voting' && (
          <>
            <h1>Voting</h1>
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr 1fr',
              gap:'1rem',
              marginBottom:'1rem'
            }}>
              {drawings.map(d => (
                <figure
                  key={d.username}
                  onClick={() => setSelected(d.username)}
                  style={{
                    cursor:'pointer',
                    border: selected===d.username ? '3px solid green' : '1px solid #ccc',
                    padding:'0.5rem'
                  }}
                >
                  <small>By {d.username}</small>
                  <Canvas strokes={d.strokes} readOnly />
                </figure>
              ))}
            </div>
            <button onClick={castVote} disabled={!selected}>
              Vote for {selected || '...'}
            </button>
          </>
        )}

        {/* Results */}
        {stage === 'results' && (
          <>
            <h1>Results</h1>
            <ol>
              {Object.entries(tally)
                .sort((a,b) => b[1] - a[1])
                .map(([u,v]) => <li key={u}>{u}: {v} votes</li>)}
            </ol>
            <button onClick={resetGame}>Back to Lobby</button>
          </>
        )}
      </section>

      <aside className="w-1/3 p-4">
        <Chat socket={socketRef.current} roomId={roomId} username={username} />
      </aside>
    </div>
  )
}

// Helper for adding prompts
function PromptInput({ onAdd }) {
  const ref = useRef()
  return (
    <div className="mb-4">
      <input ref={ref} placeholder="New prompt…" />
      <button onClick={() => { onAdd(ref.current.value); ref.current.value = '' }}>
        Add
      </button>
    </div>
  )
}
