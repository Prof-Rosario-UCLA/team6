import { useState } from 'react'

export default function Voting() {
  const [choice, setChoice] = useState('')
  const drawings = [
    /* TODO: fetch array of drawing URLs */
  ]

  return (
    <section aria-labelledby="voting-title">
      <h1 id="voting-title" className="text-2xl font-bold mb-4">Voting</h1>
      <form>
        <fieldset>
          <legend className="sr-only">Select your favorite drawing</legend>
          {drawings.map((url, idx) => (
            <figure key={idx} className="mb-4">
              <img src={url} alt={`Drawing ${idx + 1}`} className="border" />
              <figcaption>
                <label>
                  <input
                    type="radio"
                    name="vote"
                    value={url}
                    checked={choice === url}
                    onChange={() => setChoice(url)}
                  />{' '}
                  Vote for this
                </label>
              </figcaption>
            </figure>
          ))}
        </fieldset>
        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded">
          Submit Vote
        </button>
      </form>
    </section>
  )
}

