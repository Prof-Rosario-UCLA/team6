import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_SERVER_URL, API_BASE_URL } from './config'
import Chat from './Chat'
import Canvas from './Canvas'

export default function App() {
  const [stage,        setStage]        = useState('lobby')    // lobby, prompts, drawing, voting, results
  const [username,     setUsername]     = useState('')
  const [roomId,       setRoomId]       = useState('')
  const [isHost,       setIsHost]       = useState(false)
  const [players,      setPlayers]      = useState([])
  const [promptText,   setPromptText]   = useState('')
  const [prompt,       setPrompt]       = useState('')
  const [duration,     setDuration]     = useState(0)
  const [timeLeft,     setTimeLeft]     = useState(0)
  const [liveDrawings, setLiveDrawings] = useState({})
  const [drawings,     setDrawings]     = useState([])
  const [selected,     setSelected]     = useState('')
  const [tally,        setTally]        = useState({})
  const socketRef      = useRef(null)
  const strokesBuf     = useRef({})

  // connect socket once
  useEffect(() => {
    const sock = io(SOCKET_SERVER_URL, { withCredentials: true })
    socketRef.current = sock

    sock.on('playerList', ({ players }) => setPlayers(players))

    sock.on('gameStarted', ({ prompt: p, duration: d }) => {
      setPrompt(p)
      setDuration(d)
      setTimeLeft(d)
      strokesBuf.current = {}
      setLiveDrawings({})
      setDrawings([])
      setStage('drawing')
    })

    sock.on('drawing', ({ username: u, stroke }) => {
      // buffer and live update
      if (!strokesBuf.current[u]) strokesBuf.current[u] = []
      strokesBuf.current[u].push(stroke)
      setLiveDrawings(ld => ({
        ...ld,
        [u]: [...(ld[u]||[]), stroke]
      }))
    })

    sock.on('drawingEnded', () => {
      setDrawings(Object.entries(strokesBuf.current).map(
        ([u, strokes]) => ({ username: u, strokes })
      ))
      setStage('voting')
    })

    sock.on('votingEnded', ({ tally }) => {
      setTally(tally)
      setStage('results')
    })

    return () => sock.disconnect()
  }, [])

  // countdown
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

  // lobby join/create
  const handleJoin = hostFlag => {
    if (!username.trim()) return alert('Enter a username')
    const code = hostFlag
      ? (roomId.trim().toUpperCase() || Math.random().toString(36).slice(2,5).toUpperCase())
      : roomId.trim().toUpperCase()
    if (!code) return alert('Enter or create a room code')

    setRoomId(code)
    setIsHost(hostFlag)
    const sock = socketRef.current
    sock.emit('joinRoom', { username, roomId: code })
    sock.once('authSuccess', ({ token }) => {
      // set Secure SameSite cookie
      document.cookie = `token=${token}; path=/; max-age=3600; Secure; SameSite=Strict`
      setStage('prompts')
      sock.emit('playerList', { roomId: code })
    })
    sock.once('authError', ({ message }) => alert(message))
  }

  // set prompts & start
  const setPromptsAndStart = async () => {
    if (!promptText.trim()) return alert('Enter at least one prompt')
    const res = await fetch(`${API_BASE_URL}/lobby/prompts`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, username, prompts: promptText })
    })
    const data = await res.json()
    if (!data.success) {
      alert(data.error || 'Failed to set prompts')
      return
    }
    socketRef.current.emit('startGame', { roomId })
  }

  // voting
  const castVote = () => {
    if (!selected) return alert('Select someone to vote for')
    socketRef.current.emit('vote', { roomId, votedFor: selected })
  }

  // reset
  const reset = () => {
    setStage('lobby')
    setRoomId(''); setIsHost(false)
    setPlayers([]); setPromptText('')
    setPrompt(''); setLiveDrawings({}); setDrawings([])
    setTally({}); setSelected(''); setTimeLeft(0)
  }

  return (
    <div className="flex" style={{ height:'100%' }}>
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
            <button onClick={()=>handleJoin(true)}>Create Room</button>
            <button onClick={()=>handleJoin(false)}>Join Room</button>
            <h2>Players:</h2>
            <ul>{players.map(u=><li key={u}>{u}</li>)}</ul>
          </>
        )}

        {/* Prompts */}
        {stage==='prompts' && (
          <>
            <h1>Enter Prompts</h1>
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
              <p>Waiting for host…</p>
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
                    border:selected===d.username?'3px solid green':'1px solid #ccc',
                    padding:'0.5rem'
                  }}>
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
              {Object.entries(tally).sort((a,b)=>b[1]-a[1]).map(([u,v])=>(
                <li key={u}>{u}: {v} votes</li>
              ))}
            </ol>
            <button onClick={reset} className="bg-gray-600 text-white py-2 px-4 rounded">
              Back to Lobby
            </button>
          </>
        )}
      </section>

      <aside className="w-1/3 p-4" role="complementary">
        <Chat socket={socketRef.current} roomId={roomId} username={username}/>
      </aside>
    </div>
  )
}
