import { Link, useLocation } from "react-router-dom"
import styled from "styled-components"

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 0 2rem;
`

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  height: 80px;
`

const Logo = styled.h1`
  color: #333;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0;
`

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    gap: 1rem;
  }
`

const NavLink = styled(Link)`
  color: ${(props) => (props.$active ? "#667eea" : "#666")};
  text-decoration: none;
  font-weight: ${(props) => (props.$active ? "bold" : "normal")};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
`

function Header() {
  const location = useLocation()

  return (
    <HeaderContainer>
      <Nav>
        <Logo>✈️ AirportFinder</Logo>
        <NavLinks>
          <NavLink to="/" $active={location.pathname === "/"}>
            Inicio
          </NavLink>
          <NavLink to="/search" $active={location.pathname === "/search"}>
            Buscar
          </NavLink>
          <NavLink to="/popular" $active={location.pathname === "/popular"}>
            Populares
          </NavLink>
          <NavLink to="/manage" $active={location.pathname === "/manage"}>
            Gestionar
          </NavLink>
        </NavLinks>
      </Nav>
    </HeaderContainer>
  )
}

export default Header
