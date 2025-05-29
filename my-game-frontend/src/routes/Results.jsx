const leaderboard = [
  /* TODO: fetch leaderboard data, e.g. { name, score } */
]

export default function Results() {
  return (
    <section aria-labelledby="results-title">
      <h1 id="results-title" className="text-2xl font-bold mb-4">Results</h1>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Player</th>
            <th className="border p-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((p, i) => (
            <tr key={i}>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">{p.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

