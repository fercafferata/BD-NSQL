import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./App.css"

import AllHeroes from "./pages/AllHeroes"
import MarvelHeroes from "./pages/MarvelHeroes"
import DCHeroes from "./pages/DCHeroes"
import HeroDetail from "./pages/HeroDetail"
import CreateHero from "./pages/CreateHero"
import EditHero from "./pages/EditHero"

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Superhéroes Marvel y DC</h1>
          <nav>
            <ul className="nav-links">
              <li>
                <Link to="/">Todos</Link>
              </li>
              <li>
                <Link to="/marvel">Marvel</Link>
              </li>
              <li>
                <Link to="/dc">DC</Link>
              </li>
              <li>
                <Link to="/create" className="create-btn">
                  Crear Superhéroe
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<AllHeroes />} />
            <Route path="/marvel" element={<MarvelHeroes />} />
            <Route path="/dc" element={<DCHeroes />} />
            <Route path="/hero/:id" element={<HeroDetail />} />
            <Route path="/create" element={<CreateHero />} />
            <Route path="/edit/:id" element={<EditHero />} />
          </Routes>
        </main>

        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  )
}

export default App
