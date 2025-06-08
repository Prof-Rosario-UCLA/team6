// src/Canvas.jsx
import React, { useEffect, useRef } from 'react'

export default function Canvas({ socket, roomId, strokes = [], readOnly }) {
  const canvasRef = useRef()
  const drawing   = useRef(false)
  const lastPos   = useRef({ x: 0, y: 0 })

  // Only clear & replay when readOnly is true
  useEffect(() => {
    if (!readOnly) return

    const c = canvasRef.current
    c.width = 400; c.height = 300
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.lineCap = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#000'

    strokes.forEach(s => {
      ctx.beginPath()
      ctx.moveTo(s.x0, s.y0)
      ctx.lineTo(s.x1, s.y1)
      ctx.stroke()
    })
  }, [readOnly, strokes])

  const toCanvasCoords = e => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleDown = e => {
    if (readOnly) return
    drawing.current = true
    lastPos.current = toCanvasCoords(e)
  }
  const handleMove = e => {
    if (!drawing.current) return
    const pos = toCanvasCoords(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    socket.emit('drawing', {
      roomId,
      stroke: {
        x0: lastPos.current.x,
        y0: lastPos.current.y,
        x1: pos.x,
        y1: pos.y
      }
    })

    lastPos.current = pos
  }
  const handleUp = () => {
    drawing.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      style={{ border: '1px solid #ccc' }}
    />
  )
}
