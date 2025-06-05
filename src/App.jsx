import { Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import './App.css'

import Home from './pages/Home.jsx'
import About from './pages/About.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <header>
        <h1>Welcome to the By Flora project</h1>
        <nav>
          <Link to="/" style={{ marginRight: '10px'}}>Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path = "/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
