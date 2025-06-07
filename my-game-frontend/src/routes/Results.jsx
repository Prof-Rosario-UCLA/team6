import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ChatSidebar from '../components/ChatSidebar'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function Results() {
  const nav = useNavigate()
  const { roomId } = useLocation().state
  const [results, setResults] = useState([])
  const [sock, setSock] = useState(null)

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL)
    setSock(s)
    s.emit('joinRoom', { roomId })

    // either listen for final tally:
    s.on('votingEnded', ({ tally }) => {
      const arr = Object.entries(tally).sort((a,b) => b[1]-a[1])
      setResults(arr.map(([user,v]) => ({ user, votes: v })))
    })

    // …or fetch via REST:
    fetch(`${SOCKET_SERVER_URL}/api/results/${roomId}`)
      .then(r => r.json())
      .then(data => {
        if (data.winners) setResults(data.winners)
      })
  }, [roomId])

  return (
    <div className="flex">
      <section className="w-2/3 mx-auto">
        <h1 className="text-2xl font-bold mb-4">Results</h1>
        <ol className="list-decimal pl-5 mb-4">
          {results.map(r => (
            <li key={r.user} className="mb-1">
              {r.user}: {r.votes}
            </li>
          ))}
        </ol>
        <button
          onClick={() => nav('/')}
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          Back to Lobby
        </button>
      </section>

      <ChatSidebar socket={sock} roomId={roomId} username={null} />
    </div>
)
}
