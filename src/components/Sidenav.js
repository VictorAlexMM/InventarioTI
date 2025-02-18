import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faBoxes,
  faClipboardList,
  faUserShield,
  faSignOutAlt,
  faNetworkWired,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";

const Sidenav = () => {
  const navigate = useNavigate();

  // Obtém o nome do usuário e o perfil do localStorage
  const loggedUser = localStorage.getItem("loggedUser");
  const userProfile = localStorage.getItem("userProfile");

  // Define os itens do menu
  const menuItems = [
    { name: "Dashboard", icon: faTachometerAlt, link: "/portal/home" },
    { name: "Inventário", icon: faBoxes, link: "/portal/estoque" },
    { name: "Comodato", icon: faClipboardList, link: "/portal/comodato-inter" },
    // Adiciona a opção "Admin" apenas se o perfil for 'admin'
    ...(userProfile === "admin"
      ? [{ name: "Admin", icon: faUserShield, link: "/portal/admin" }]
      : []),
    { name: "Switch", icon: faNetworkWired, link: "/portal/switch" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("loggedUser"); // Remove o nome do usuário
    localStorage.removeItem("userProfile"); // Remove o perfil
    navigate("/");
  };

  return (
    <div
      className="bg-gray-800 text-white h-full w-64 flex flex-col transition-all duration-300 ease-in-out"
      aria-label="Navegação lateral"
    >
      <div className="flex justify-between items-center p-4">
        <h2 className="text-xl font-semibold">Controle TI</h2>
      </div>

      <ul className="mt-6 space-y-2 flex-grow">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className="p-4 flex items-center hover:bg-gray-700 rounded-lg transition-all duration-300"
          >
            <FontAwesomeIcon icon={item.icon} className="mr-3 text-xl" />
            <Link
              to={item.link}
              className="transition-opacity opacity-100 ml-2"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-auto p-4">
        <div className="mb-4 text-sm">
          <p>Usuário: {loggedUser}</p> {/* Exibe o nome do usuário */}
          <p>Perfil: {userProfile}</p> {/* Exibe o perfil do usuário */}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full p-2 text-sm text-white font-semibold rounded-lg bg-red-500 hover:bg-red-600 focus:outline-none transition-colors duration-300"
        >
          <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 text-lg" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidenav;
