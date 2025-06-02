// src/components/CanvasTool.jsx
import React, { useRef, useEffect, useState } from 'react'
import { io } from 'socket.io-client'

export default function CanvasTool({ roomId, username }) {
  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const [ctx, setCtx] = useState(null)
  const drawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // 1) Initialize the canvas
    const canvas = canvasRef.current
    canvas.width = 800
    canvas.height = 600
    const context = canvas.getContext('2d')
    context.lineCap = 'round'
    context.strokeStyle = '#000'
    context.lineWidth = 2
    setCtx(context)

    // 2) Connect to Socket.io server
    socketRef.current = io('http://localhost:1919', {
      transports: ['websocket'], // optional: force WebSocket
    })

    // 3) Join the room with username
    socketRef.current.emit('joinRoom', { roomId, username })

    // 4) Listen for others’ drawing events
    socketRef.current.on('drawing', (stroke) => {
      // When another client emits ▸ socket.to(roomId).emit('drawing', stroke)
      // we receive stroke here and draw it
      drawStroke(context, stroke, false)
    })

    // Cleanup on unmount
    return () => {
      socketRef.current.disconnect()
    }
  }, [roomId, username])

  // Helper to actually draw a line segment
  const drawStroke = (context, { x0, y0, x1, y1 }, emit) => {
    context.beginPath()
    context.moveTo(x0, y0)
    context.lineTo(x1, y1)
    context.stroke()
    context.closePath()

    if (!emit) return
    // Emit to server so others see it:
    socketRef.current.emit('drawing', { roomId, stroke: { x0, y0, x1, y1 } })
  }

  // When user presses pointer down
  const handlePointerDown = e => {
    drawingRef.current = true
    const rect = canvasRef.current.getBoundingClientRect()
    lastPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // As user moves pointer, draw line segments
  const handlePointerMove = e => {
    if (!drawingRef.current || !ctx) return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }

    // Draw locally and emit to others
    drawStroke(ctx, {
      x0: lastPosRef.current.x,
      y0: lastPosRef.current.y,
      x1: currentPos.x,
      y1: currentPos.y,
    }, true)

    // Update last position
    lastPosRef.current = currentPos
  }

  // Stop drawing when pointer is lifted or leaves canvas
  const handlePointerUp = () => {
    drawingRef.current = false
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border bg-white w-full max-w-2xl h-auto touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="application"
        aria-label="Drawing canvas"
      />
      {/* You can add a toolbar here (flood-fill, undo/redo) if needed */}
    </div>
  )
}
