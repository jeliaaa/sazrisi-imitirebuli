import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { useStartAttemptStore } from "../stores/attemptStore"

const TOTAL_SECONDS = 3 * 60 * 60 // 3 hours

const timerKey = (id: string) => `attempt_timer_${id}`

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

const CustomOutlet = () => {
  const { startAttempt, attempt } = useStartAttemptStore()
  const [time, setTime] = useState("00:00:00")

  const attemptId = localStorage.getItem("attemptId") || ""

  useEffect(() => {
    if (!attemptId) return

    startAttempt(attemptId)

    let start = localStorage.getItem(timerKey(attemptId))

    // create timer only once
    if (!start) {
      start = String(Date.now())
      localStorage.setItem(timerKey(attemptId), start)
    }

    const startTime = Number(start)

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(TOTAL_SECONDS - elapsed, 0)

      setTime(formatTime(remaining))

      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [attemptId, startAttempt])

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="flex items-center h-[10dvh] justify-between p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold">{time}</h1>

        <h1 className="text-xl font-bold">
          {attempt?.user
            ? `${attempt.user.firstname} ${attempt.user.lastname}`
            : "Test Name"}
        </h1>

        <h2 className="text-sm">{attempt?.code || "Test Code"}</h2>
      </header>

      <Outlet />
    </div>
  )
}

export default CustomOutlet