import { useEffect, useRef, useState } from 'react'
import { Type, PenLine, Trash2 } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  signatureType: 'typed' | 'drawn' | null
  signatureData: string | null
  signatureName: string | null
  onChange: (payload: { signature_type: 'typed' | 'drawn' | null; signature_data: string | null; signature_name: string | null }) => void
}

export function SignaturePad({ signatureType, signatureData, signatureName, onChange }: Props) {
  const [mode, setMode] = useState<'typed' | 'drawn'>(signatureType ?? 'typed')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const hasDrawn = useRef(false)

  useEffect(() => {
    if (mode === 'drawn' && signatureData && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      const img = new Image()
      img.onload = () => ctx?.drawImage(img, 0, 0)
      img.src = signatureData
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const point = 'touches' in e ? e.touches[0] : e
    return { x: point.clientX - rect.left, y: point.clientY - rect.top }
  }

  function start(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true
    hasDrawn.current = true
    const ctx = canvasRef.current?.getContext('2d')
    const { x, y } = getPos(e)
    ctx?.beginPath()
    ctx?.moveTo(x, y)
  }

  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#101828'
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function end() {
    drawing.current = false
    if (canvasRef.current && hasDrawn.current) {
      onChange({
        signature_type: 'drawn',
        signature_data: canvasRef.current.toDataURL('image/png'),
        signature_name: signatureName,
      })
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    hasDrawn.current = false
    onChange({ signature_type: 'drawn', signature_data: null, signature_name: signatureName })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setMode('typed')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            mode === 'typed' ? 'bg-brand-500 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
          )}
        >
          <Type size={13} /> Type Name
        </button>
        <button
          onClick={() => setMode('drawn')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            mode === 'drawn' ? 'bg-brand-500 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
          )}
        >
          <PenLine size={13} /> Draw Signature
        </button>
      </div>

      {mode === 'typed' && (
        <div>
          <input
            className="input mb-2"
            placeholder="Type your full name"
            value={signatureName ?? ''}
            onChange={(e) =>
              onChange({ signature_type: 'typed', signature_data: null, signature_name: e.target.value })
            }
          />
          {signatureName && (
            <div className="border border-ink-200 rounded-md px-5 py-4 bg-ink-50/50">
              <p className="font-script text-3xl text-ink-900">{signatureName}</p>
            </div>
          )}
        </div>
      )}

      {mode === 'drawn' && (
        <div>
          <canvas
            ref={canvasRef}
            width={400}
            height={140}
            className="border border-ink-200 rounded-md bg-white w-full touch-none cursor-crosshair"
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchStart={start}
            onTouchMove={move}
            onTouchEnd={end}
          />
          <button onClick={clearCanvas} className="btn-ghost text-xs mt-2">
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
