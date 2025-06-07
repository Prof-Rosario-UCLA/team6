import React, { useRef, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_SERVER_URL } from '../index.jsx'

export default function CanvasTool({ roomId, username }) {
  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const [ctx, setCtx] = useState(null)
  const drawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // 1) init canvas
    const canvas = canvasRef.current
    canvas.width = 800
    canvas.height = 600
    const context = canvas.getContext('2d')
    context.lineCap = 'round'
    context.strokeStyle = '#000'
    context.lineWidth = 2
    setCtx(context)

    // 2) socket connect & join
    socketRef.current = io(SOCKET_SERVER_URL)
    socketRef.current.emit('joinRoom', { roomId, username })

    // 3) incoming strokes
    socketRef.current.on('drawing', ({ username: from, stroke }) => {
      // optionally color by user...
      context.beginPath()
      context.moveTo(stroke.x0, stroke.y0)
      context.lineTo(stroke.x1, stroke.y1)
      context.stroke()
      context.closePath()
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [roomId, username])

  const drawSegment = (x0, y0, x1, y1) => {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
    ctx.closePath()

    socketRef.current.emit('drawing', {
      roomId,
      stroke: { x0, y0, x1, y1 }
    })
  }

  const handleDown = e => {
    drawingRef.current = true
    const rect = canvasRef.current.getBoundingClientRect()
    lastPosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMove = e => {
    if (!drawingRef.current || !ctx) return
    const rect = canvasRef.current.getBoundingClientRect()
    const curr = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    drawSegment(
      lastPosRef.current.x,
      lastPosRef.current.y,
      curr.x,
      curr.y
    )
    lastPosRef.current = curr
  }

  const handleUp = () => {
    drawingRef.current = false
  }

  return (
    <canvas
      ref={canvasRef}
      className="border bg-white w-full h-auto touch-none"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      role="application"
      aria-label="Drawing canvas"
    />
  )
}
