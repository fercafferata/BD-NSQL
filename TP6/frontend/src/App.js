import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import styled from "styled-components"
import Header from "./components/Header"
import Home from "./pages/Home"
import Search from "./pages/Search"
import Popular from "./pages/Popular"
import Manage from "./pages/Manage"
import "./App.css"

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`

const MainContent = styled.main`
  padding-top: 80px;
  min-height: calc(100vh - 80px);
`

function App() {
  return (
    <AppContainer>
      <Router>
        <Header />
        <MainContent>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/popular" element={<Popular />} />
            <Route path="/manage" element={<Manage />} />
          </Routes>
        </MainContent>
      </Router>
    </AppContainer>
  )
}

export default App
