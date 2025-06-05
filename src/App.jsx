import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'

function App() {

  return (
    <>
      <header>
        <h1>Welcome to the By Flora project</h1>
        <img src="/By-Flora.png" alt="By Flora Logo" className="logo" />
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

      <p className="read-the-docs">
        Click on the Flora logo to learn more
      </p>
    </>
  )
}

export default App
