import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function Voting() {
  const nav        = useNavigate()
  const { roomId, username } = useLocation().state
  const [sock, setSock]      = useState(null)
  const [drawings, setDrawings] = useState([])
  const [votesDone, setVotesDone] = useState(0)
  const [total, setTotal]       = useState(0)

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL)
    setSock(s)
    s.emit('joinRoom', { roomId, username })

    s.on('playerList', ({ players }) => {
      setTotal(players.length)
    })

    s.on('syncDrawings', list => {
      // list: [{ username, strokes: […] }, …]
      setDrawings(list)
    })

    s.on('votingEnded', ({ tally }) => {
      // tally: { username: voteCount, … }
      setVotesDone(total)        // allow “See Results”
      setDrawings(d => d.map(dv => ({
        ...dv,
        votes: tally[dv.username] || 0
      })))
    })

    return () => s.disconnect()
  }, [roomId, username, total])

  const castVote = targetUser => {
    sock.emit('vote', { roomId, votedFor: targetUser })
    setVotesDone(v => v + 1)
  }

  return (
    <div className="flex">
      <section className="w-2/3 mx-auto">
        <h1 className="text-2xl font-bold mb-4">Voting</h1>
        <p className="mb-2">Votes cast: {votesDone}/{total}</p>
        <div className="grid grid-cols-2 gap-4">
          {drawings.map(d => (
            <figure
              key={d.username}
              className="border p-2 cursor-pointer"
              onClick={() => castVote(d.username)}
            >
              <small className="block mb-2">By {d.username}</small>
              <canvas
                className="w-full h-32"
                ref={el => {
                  if (!el) return
                  const ctx = el.getContext('2d')
                  el.width = 200
                  el.height = 150
                  d.strokes.forEach(s => {
                    ctx.beginPath()
                    ctx.moveTo(s.x0, s.y0)
                    ctx.lineTo(s.x1, s.y1)
                    ctx.stroke()
                    ctx.closePath()
                  })
                }}
              />
              {'votes' in d && (
                <p className="mt-2 text-sm text-gray-600">{d.votes} votes</p>
              )}
            </figure>
          ))}
        </div>
        <button
          onClick={() => nav('/results', { state: { roomId } })}
          disabled={votesDone < total}
          className="mt-4 bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
        >
          See Results
        </button>
      </section>
      <ChatSidebar socket={sock} roomId={roomId} username={username} />
    </div>
)
}
