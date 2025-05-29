import React, { useRef, useEffect, useState } from 'react'

export default function CanvasTool() {
  const canvasRef = useRef(null)
  const [ctx, setCtx] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = 800
    canvas.height = 600
    setCtx(canvas.getContext('2d'))

    // TODO: load WASM module for flood-fill & undo/redo
  }, [])

  const handleDraw = e => {
    if (!ctx) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.fillStyle = '#000'
    ctx.fillRect(x, y, 2, 2)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border bg-white w-full max-w-2xl h-auto touch-none"
        onPointerDown={handleDraw}
        onPointerMove={e => e.buttons === 1 && handleDraw(e)}
        role="application"
        aria-label="Drawing canvas"
      />
      {/* TODO: toolbar for flood-fill & undo/redo */}
    </div>
  )
}

