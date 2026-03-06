import { useState, useEffect, useRef } from "react"
import Input from "../components/reusables/Input"
import logo from "../assets/sazrisi.png"
import toast from "react-hot-toast"
import { useNavigate } from "react-router"
import { useStartAttemptStore } from "../stores/attemptStore"
const EnterCode = () => {
  const [code, setCode] = useState("")
  const [isHovered, setIsHovered] = useState(false)
  const isHoveredRef = useRef(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const borderCanvasRef = useRef<HTMLCanvasElement>(null)
  const navigate = useNavigate()
  const { startAttempt, error } = useStartAttemptStore()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const fireflies = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.01,
      opacity: Math.random() * 0.5 + 0.3,
    }))

    let animId: number
    let frozenAt: number | null = null

    const draw = (timestamp: number) => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
      bg.addColorStop(0, "#141b26")
      bg.addColorStop(0.5, "#0f1520")
      bg.addColorStop(1, "#080d13")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      const glow = ctx.createRadialGradient(w / 2, h + 100, 0, w / 2, h + 100, 700)
      glow.addColorStop(0, "rgba(255,153,0,0.1)")
      glow.addColorStop(1, "transparent")
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      const paused = isHoveredRef.current

      if (paused) {
        if (!frozenAt) frozenAt = timestamp
        const elapsed = timestamp - frozenAt
        const fadeProgress = Math.min(elapsed / 600, 1)
        ctx.fillStyle = `rgba(8, 13, 19, ${fadeProgress * 0.6})`
        ctx.fillRect(0, 0, w, h)
      } else {
        frozenAt = null
      }

      for (const f of fireflies) {
        if (!paused) {
          f.x += f.vx
          f.y += f.vy
          f.phase += f.speed
          if (f.x < 0) f.x = w
          if (f.x > w) f.x = 0
          if (f.y < 0) f.y = h
          if (f.y > h) f.y = 0
        }

        const glowVal = Math.abs(Math.sin(f.phase)) * f.opacity
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 12)
        g.addColorStop(0, `rgba(255,180,50,${glowVal})`)
        g.addColorStop(0.3, `rgba(255,153,0,${glowVal * 0.5})`)
        g.addColorStop(1, "transparent")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r * 12, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255,220,100,${glowVal * 1.2})`
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (let i = 0; i < fireflies.length; i++) {
        for (let j = i + 1; j < fireflies.length; j++) {
          const dx = fireflies[i].x - fireflies[j].x
          const dy = fireflies[i].y - fireflies[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.strokeStyle = `rgba(255,153,0,${(1 - dist / 120) * 0.06})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(fireflies[i].x, fireflies[i].y)
            ctx.lineTo(fireflies[j].x, fireflies[j].y)
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  // Border tracing animation
  useEffect(() => {
    const canvas = borderCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const perimeter = 2 * (W + H)
    const tailLength = perimeter * 0.25

    let progress = 0
    let animId: number
    let opacity = 0

    const getPoint = (dist: number): [number, number] => {
      const d = ((dist % perimeter) + perimeter) % perimeter
      if (d < W) return [d, 0]
      if (d < W + H) return [W, d - W]
      if (d < 2 * W + H) return [W - (d - W - H), H]
      return [0, H - (d - 2 * W - H)]
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      if (isHoveredRef.current) {
        opacity = Math.min(opacity + 0.05, 1)
        progress = (progress + 4) % perimeter
      } else {
        opacity = Math.max(opacity - 0.05, 0)
      }

      if (opacity > 0) {
        const steps = 80
        for (let i = 0; i < steps; i++) {
          const t = i / steps
          const dist = progress - t * tailLength
          const [x, y] = getPoint(dist)
          const alpha = t * opacity
          ctx.strokeStyle = `rgba(255, 153, 0, ${alpha})`
          ctx.lineWidth = 2
          ctx.lineCap = "round"

          if (i > 0) {
            const [px, py] = getPoint(progress - ((i - 1) / steps) * tailLength)
            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(x, y)
            ctx.stroke()
          }
        }

        // bright head dot
        const [hx, hy] = getPoint(progress)
        ctx.shadowColor = "#FF9900"
        ctx.shadowBlur = 10
        ctx.fillStyle = `rgba(255, 200, 80, ${opacity})`
        ctx.beginPath()
        ctx.arc(hx, hy, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  const handleMouseEnter = () => {
    isHoveredRef.current = true
    setIsHovered(true)
  }
  const handleMouseLeave = () => {
    isHoveredRef.current = false
    setIsHovered(false)
  }

  const handleCodeEnter = async () => {
    const result = await startAttempt(code);

    if (result) {
      toast.success("შეიქმნა ახალი მცდელობა! გადაგიყვანთ მთავარ გვერდზე...");
      localStorage.setItem("attemptId", code);
      navigate("/quiz");
    } else {
      toast.error(error || "დაფიქსირდა შეცდომა");
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen w-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {[
        "top-8 left-8 border-t-2 border-l-2",
        "top-8 right-8 border-t-2 border-r-2",
        "bottom-8 left-8 border-b-2 border-l-2",
        "bottom-8 right-8 border-b-2 border-r-2",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-16 h-16 border-[rgba(255,153,0,0.2)] ${cls}`} />
      ))}

      <div className="relative w-full z-10 flex flex-col h-screen justify-center items-center gap-y-20">
        <img src={logo} className="w-48 h-48 opacity-70" />
        <Input
          label="შეიყვანეთ კოდი"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <div
          className="relative mt-4"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Tracing border canvas — sized to the button */}
          <canvas
            ref={borderCanvasRef}
            width={160}
            height={52}
            className="absolute inset-0 pointer-events-none z-10"
          />

          <button
            className="relative px-8 py-3 text-sm tracking-widest uppercase cursor-pointer transition-all duration-300"
            style={{
              color: "#FF9900",
              border: `2px solid rgba(255,153,0,${isHovered ? 0.15 : 0.5})`,
              background: isHovered ? "rgba(255,153,0,0.04)" : "transparent",
              letterSpacing: "0.2em",
              transition: "border-color 0.3s, background 0.3s",
            }}
            onClick={() => handleCodeEnter()}
          >
            დამოწმება
          </button>
        </div>
      </div>
    </div>
  )
}

export default EnterCode