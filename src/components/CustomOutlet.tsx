import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import { useStartAttemptStore } from "../stores/attemptStore"


const CustomOutlet = () => {
  const [time, setTime] = useState("03:00:00")
  const { startAttempt, attempt } = useStartAttemptStore()
  
  useEffect(() => {
    startAttempt(localStorage.getItem("attemptId") || "")
  }, [startAttempt])
  
  setTimeout(() => {
    const [h, m, s] = time.split(":").map(Number)
    let totalSeconds = h * 3600 + m * 60 + s - 1
    if (totalSeconds < 0) totalSeconds = 0
    const newH = Math.floor(totalSeconds / 3600)
    const newM = Math.floor((totalSeconds % 3600) / 60)
    const newS = totalSeconds % 60
    setTime(`${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}:${String(newS).padStart(2, "0")}`)
  }, 1000)


  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <h1 className="text-xl font-bold">{time}</h1>
        <h1 className="text-xl font-bold">{attempt?.user.firstname + " " + attempt?.user.lastname || "Test Name"}</h1>
        <h2 className="text-sm">{attempt?.code || "Test Code"}</h2>
      </header>
      <Outlet />
    </div>
  )
}

export default CustomOutlet