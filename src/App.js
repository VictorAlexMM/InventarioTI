import React, { useState, useEffect } from "react";
import {
  Route,
  Routes,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import Sidenav from "./components/Sidenav"; // Barra lateral
import Home from "./pages/Home"; // Página inicial
import Login from "./pages/Login"; // Página de login
import Estoque from "./pages/Estoque";
import Inventario from "./pages/Inventario"; // Página de estoque
import Comodato from "./pages/Comodato"; // Página de comodato
import ComodatoInter from "./pages/ComodatoInter"; // Página de comodato interativo
import AdminPage from "./pages/Admin";
import SwitchMonitor from "./pages/SwitchMonitor";
import Licenças from "./pages/Licencas";

function App() {
  const [isOpen, setIsOpen] = useState(true); // Controle da barra lateral
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("loggedUser")
  ); // Estado inicial baseado no localStorage
  const navigate = useNavigate();
  const location = useLocation(); // Usado para pegar a URL atual

  const toggleSidenav = () => {
    setIsOpen((prevState) => !prevState); // Alterna visibilidade da barra lateral
  };

  useEffect(() => {
    // Redireciona para login se o usuário não estiver logado
    if (
      !isLoggedIn &&
      location.pathname !== "/" &&
      location.pathname !== "/comodato"
    ) {
      navigate("/");
    }
  }, [isLoggedIn, location.pathname, navigate]);

  // Função para realizar login
  const handleLogin = (user) => {
    localStorage.setItem("loggedUser", user); // Armazenar usuário no localStorage
    setIsLoggedIn(true);
  };

  // Função para realizar logout
  const handleLogout = () => {
    localStorage.removeItem("loggedUser"); // Remover usuário do localStorage
    setIsLoggedIn(false);
  };

  // Condicional para exibir a barra lateral
  const shouldShowSidenav =
    isLoggedIn &&
    location.pathname !== "/" &&
    location.pathname !== "/comodato";

  return (
    <div className="h-screen flex">
      {/* Renderiza a barra lateral apenas se o usuário estiver logado e não estiver na página inicial ("/") nem na página /comodato */}
      {shouldShowSidenav && (
        <div
          className={`fixed top-0 left-0 h-full ${
            isOpen ? "w-64" : "w-16"
          } transition-all duration-300`}
        >
          <Sidenav isOpen={isOpen} toggleSidenav={toggleSidenav} />
        </div>
      )}

      <div
        className={`flex-1 overflow-auto ${shouldShowSidenav ? "ml-64" : ""}`}
      >
        <Routes>
          {/* Rota de Login - Acessível sem login */}
          <Route path="/" element={<Login setIsLoggedIn={handleLogin} />} />

          {/* Rotas protegidas - Requerem login */}
          <Route
            path="/portal/home"
            element={isLoggedIn ? <Home /> : <Navigate to="/" />}
          />
          <Route
            path="/portal/switch"
            element={isLoggedIn ? <SwitchMonitor /> : <Navigate to="/" />}
          />
          <Route
            path="/portal/inventario"
            element={isLoggedIn ? <Inventario /> : <Navigate to="/" />}
          />
          <Route
            path="/portal/estoque"
            element={isLoggedIn ? <Estoque /> : <Navigate to="/" />}
          />
          <Route
            path="/portal/admin"
            element={isLoggedIn ? <AdminPage /> : <Navigate to="/" />}
          />
          <Route
            path="/portal/licencas"
            element={isLoggedIn ? <Licenças /> : <Navigate to="/" />}
          />
          {/* Rota de Comodato - Acessível sem login */}
          <Route
            path="/comodato"
            element={<Comodato />} // Acesso direto sem verificação de login
          />

          <Route
            path="/portal/comodato-inter"
            element={isLoggedIn ? <ComodatoInter /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
