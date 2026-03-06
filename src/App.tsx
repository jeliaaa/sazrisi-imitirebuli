import { Route, Routes } from "react-router-dom"
import { privateRoutes } from "./routes/privateRoutes"
import { publicRoutes } from "./routes/publicRoutes"
import SafeRoute from "./components/SafeRouter"
import CustomOutlet from "./components/CustomOutlet"

function App() {

  return (
    <>
      <Routes>
        <Route element={<SafeRoute><CustomOutlet /></SafeRoute>}>
          {privateRoutes.map(({ path, component: Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        </Route>
        {publicRoutes.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </>
  )
}

export default App
