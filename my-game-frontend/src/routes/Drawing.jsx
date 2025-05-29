import CanvasTool from '../components/CanvasTool'

export default function Drawing() {
  return (
    <section aria-labelledby="drawing-title">
      <h1 id="drawing-title" className="text-2xl font-bold mb-4">Drawing</h1>
      <CanvasTool />
      {/* TODO: “Next” button to submit and navigate to /voting */}
    </section>
  )
}

