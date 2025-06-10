// src/App.jsx
import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_SERVER_URL, API_BASE_URL } from './config'
import Chat from './Chat'
import Canvas from './Canvas'

export default function App() {
  // ─── Application State ────────────────────────────────────────────────
  const [stage,         setStage]         = useState('lobby')    // lobby → prompts → drawing → voting → results
  const [username,      setUsername]      = useState('')
  const [roomId,        setRoomId]        = useState('')
  const [isHost,        setIsHost]        = useState(false)
  const [players,       setPlayers]       = useState([])
  const [promptText,    setPromptText]    = useState('')         // multi-line textarea
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [duration,      setDuration]      = useState(0)
  const [timeLeft,      setTimeLeft]      = useState(0)
  const [liveDrawings,  setLiveDrawings]  = useState({})         // { user: Stroke[] }
  const [drawings,      setDrawings]      = useState([])         // snapshot at end
  const [selected,      setSelected]      = useState('')         // voting choice
  const [tally,         setTally]         = useState({})         // final vote counts

  const socketRef   = useRef(null)
  const strokesBuf  = useRef({})   // accumulate strokes by user

  // ─── Initialize Socket.io & Handlers ───────────────────────────────────
  useEffect(() => {
    const sock = io(SOCKET_SERVER_URL)
    socketRef.current = sock

    // update player list
    sock.on('playerList', ({ players }) => setPlayers(players))

    // gameStarted: receive chosen prompt + duration
    sock.on('gameStarted', ({ prompt, duration: d }) => {
      setCurrentPrompt(prompt)
      setDuration(d)
      setTimeLeft(d)
      strokesBuf.current = {}
      setLiveDrawings({})
      setDrawings([])
      setStage('drawing')
    })

    // live drawing strokes
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

    // end drawing phase
    sock.on('drawingEnded', () => {
      const arr = Object.entries(strokesBuf.current).map(
        ([u, strokes]) => ({ username: u, strokes })
      )
      setDrawings(arr)
      setStage('voting')
    })

    // voting results
    sock.on('votingEnded', ({ tally }) => {
      setTally(tally)
      setStage('results')
    })

    return () => sock.disconnect()
  }, [])

  // ─── Countdown during Drawing ─────────────────────────────────────────
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

  // ─── Lobby Actions with JWT ───────────────────────────────────────────
  const handleJoinRoom = hostFlag => {
    if (!username.trim()) {
      alert('Enter a username')
      return
    }
    let code = roomId.trim().toUpperCase()
    if (hostFlag && !code) {
      code = Math.random().toString(36).substr(2,5).toUpperCase()
    }
    if (!code) {
      alert('Enter or create a room code')
      return
    }
    setRoomId(code)
    setIsHost(hostFlag)
    const sock = socketRef.current
    sock.emit('joinRoom', { username, roomId: code })
    sock.once('authSuccess', ({ token }) => {
      localStorage.setItem('token', token)
      setStage('prompts')
      sock.emit('playerList', { roomId: code })
    })
    sock.once('authError', ({ message }) => {
      alert(message)
    })
  }

  // ─── Prompt Stage: set all prompts & start ─────────────────────────────
  const setPromptsAndStart = async () => {
    const lines = promptText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l)
    if (!lines.length) {
      alert('Enter at least one prompt')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/lobby/prompts`, {
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

  // ─── Voting Action (include JWT) ───────────────────────────────────────
  const castVote = () => {
    if (!selected) {
      alert('Select someone to vote for')
      return
    }
    const token = localStorage.getItem('token')
    socketRef.current.emit('vote', { token, roomId, votedFor: selected })
  }

  // ─── Reset to Lobby ────────────────────────────────────────────────────
  const resetGame = () => {
    setStage('lobby')
    setRoomId('');   setIsHost(false)
    setPlayers([]);  setPromptText('')
    setCurrentPrompt(''); setDrawings([])
    setLiveDrawings({}); setTally({})
    setSelected(''); setTimeLeft(0)
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-full">
      <section className="w-2/3 border-r p-4">
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
            <button onClick={() => handleJoinRoom(true)}>
              Create Room
            </button>
            <button onClick={() => handleJoinRoom(false)}>
              Join Room
            </button>
            <h2>Players:</h2>
            <ul>
              {players.map(u => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </>
        )}

        {stage === 'prompts' && (
          <>
            <h1>Enter Prompts</h1>
            <textarea
              rows={6}
              className="w-full border p-2 mb-4"
              placeholder="One prompt per line…"
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
            />
            {isHost ? (
              <button
                onClick={setPromptsAndStart}
                disabled={!promptText.trim()}
              >
                Set Prompts
              </button>
            ) : (
              <p>Waiting for host to start…</p>
            )}
          </>
        )}

        {stage === 'drawing' && (
          <>
            <h1>Draw: {currentPrompt}</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {players.map(u => (
                <div key={u}>
                  <small>{u}</small>
                  {u === username ? (
                    <Canvas socket={socketRef.current} roomId={roomId} />
                  ) : (
                    <Canvas strokes={liveDrawings[u] || []} readOnly />
                  )}
                </div>
              ))}
            </div>
            <p>Time left: {timeLeft}s</p>
          </>
        )}

        {stage === 'voting' && (
          <>
            <h1>Voting</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {drawings.map(d => (
                <figure
                  key={d.username}
                  onClick={() => setSelected(d.username)}
                  style={{
                    cursor: 'pointer',
                    border:
                      selected === d.username
                        ? '3px solid green'
                        : '1px solid #ccc',
                    padding: '0.5rem'
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

        {stage === 'results' && (
          <>
            <h1>Results</h1>
            <ol>
              {Object.entries(tally)
                .sort((a, b) => b[1] - a[1])
                .map(([u, v]) => (
                  <li key={u}>
                    {u}: {v} votes
                  </li>
                ))}
            </ol>
            <button onClick={resetGame}>Back to Lobby</button>
          </>
        )}
      </section>

      <aside className="w-1/3 p-4">
        <Chat
          socket={socketRef.current}
          roomId={roomId}
          username={username}
        />
      </aside>
    </div>
  )
}
