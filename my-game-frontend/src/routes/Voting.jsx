import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

export default function Voting() {
  const nav = useNavigate()
  const { roomId, username } = useLocation().state
  const socket = io('http://localhost:1919')
  const [drawings, setDrawings] = useState([])
  const [selected, setSelected] = useState('')
  const [doneCount, setDoneCount] = useState(0)
  const [totalPlayers, setTotal] = useState(0)

  useEffect(() => {
    socket.emit('joinRoom', { roomId, username })
    socket.on('roomData', data => setTotal(data.participants.length))

    socket.on('allDrawings', list => setDrawings(list))
    socket.on('voteCount', ({ doneCount }) => setDoneCount(doneCount))
  }, [])

  const vote = id => {
    socket.emit('vote', { roomId, drawingId: id, voter: username })
    setSelected(id)
  }

  const finish = () => {
    nav('/results', { state: { roomId } })
  }

  return (
    <section className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Voting</h1>
      <p className="mb-2">Votes submitted: {doneCount}/{totalPlayers}</p>
      <div className="grid grid-cols-2 gap-4">
        {drawings.map(d => (
          <figure
            key={d.id}
            className={`border p-2 cursor-pointer ${selected===d.id?'ring-4 ring-green-400':''}`}
            onClick={() => vote(d.id)}
          >
            <img src={d.url} alt="" className="mb-2" />
            <figcaption className="text-center">By {d.username}</figcaption>
          </figure>
        ))}
      </div>
      <button
        onClick={finish}
        disabled={doneCount < totalPlayers}
        className="mt-4 bg-green-600 text-white py-2 px-4 rounded disabled:opacity-50"
      >
        See Results
      </button>
    </section>
)
}
