import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Lobby from './routes/Lobby'
import Prompt from './routes/Prompt'
import Drawing from './routes/Drawing'
import Voting from './routes/Voting'
import Results from './routes/Results'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-4">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/prompt" element={<Prompt />} />
          <Route path="/drawing" element={<Drawing />} />
          <Route path="/voting" element={<Voting />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </main>
    </div>
  )
}
