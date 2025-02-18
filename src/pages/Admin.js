import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faSearch } from "@fortawesome/free-solid-svg-icons";
import Container from "../components/Container";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({
    patrimonio: "", // Patrimônio atual (antigo)
    novoValor: "", // Novo valor do patrimônio
  });

  // Estados para o popup de adicionar usuário
  const [showAddUserPopup, setShowAddUserPopup] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    perfil: "",
    nome_completo: "",
    planta: "",
  });

  // Estado para controlar a exibição do campo de busca
  const [showSearchField, setShowSearchField] = useState(false);

  // Estado para controlar a exibição do popup de resultados da busca
  const [showSearchResultsPopup, setShowSearchResultsPopup] = useState(false);

  // Verifica se o usuário tem permissão para acessar a página
  useEffect(() => {
    const userProfile = localStorage.getItem("userProfile");

    // Se o perfil não for 'admin', redireciona para a página inicial
    if (userProfile !== "admin") {
      navigate("/portal/home");
    }
  }, [navigate]);

  // Função para buscar patrimônio
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const response = await fetch(
        `http://localhost:4001/buscar-patrimonio?search=${searchTerm}`
      );
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchResults([]);
        alert("Nenhum patrimônio encontrado!");
      } else {
        setSearchResults(data);
        setShowSearchResultsPopup(true); // Exibe o popup com os resultados
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      setSearchResults([]);
      alert("Erro ao buscar patrimônio.");
    }
  };

  // Função para lidar com a tecla "Enter" no campo de busca
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Função para editar patrimônio
  const handleEdit = (item) => {
    setEditingItem(item);
    setEditValues({
      patrimonio: item.patrimonio, // Define o patrimônio atual (antigo)
      novoValor: item.patrimonio, // Inicializa o novo valor com o mesmo valor do patrimônio atual
    });
  };

  // Função para atualizar patrimônio
  const handleUpdate = async () => {
    if (!editValues.patrimonio || !editValues.novoValor) {
      alert("Os campos 'Patrimônio' e 'Novo Valor' são obrigatórios.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:4001/api/atualizar-patrimonio",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patrimonio: editValues.patrimonio, // Patrimônio atual (antigo)
            novoValor: editValues.novoValor, // Novo valor do patrimônio
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(data.message); // Mensagem de sucesso
        setEditingItem(null); // Fechar o modal de edição
        setSearchResults([]); // Limpar resultados da busca
        setSearchTerm(""); // Limpar campo de busca
      } else {
        alert(data.error); // Mensagem de erro
      }
    } catch (error) {
      console.error("Erro ao atualizar patrimônio:", error);
      alert("Erro ao atualizar patrimônio.");
    }
  };

  // Função para adicionar um novo usuário
  const handleAddUser = async () => {
    const { username, perfil, nome_completo, planta } = newUser;

    if (!username || !perfil || !nome_completo || !planta) {
      alert("Todos os campos são obrigatórios.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/add-usuario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message); // Mensagem de sucesso
        setShowAddUserPopup(false); // Fechar o popup
        setNewUser({ username: "", perfil: "", nome_completo: "", planta: "" }); // Limpar o formulário
      } else {
        alert(data.error); // Mensagem de erro
      }
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      alert("Erro ao adicionar usuário.");
    }
  };

  return (
    <Container>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Administração</h1>

        {/* Botões de ação */}
        <div className="flex space-x-2 mb-4">
          {/* Botão para abrir o popup de adicionar usuário */}
          <button
            onClick={() => setShowAddUserPopup(true)}
            className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <FontAwesomeIcon icon={faPlus} /> Adicionar Usuário
          </button>

          {/* Botão para exibir o campo de busca */}
          <button
            onClick={() => setShowSearchField(!showSearchField)}
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FontAwesomeIcon icon={faSearch} /> Buscar Patrimônio
          </button>
        </div>

        {/* Campo de busca dentro da seção "Buscar Patrimônio" */}
        {showSearchField && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Buscar Patrimônio</h2>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="Digite o patrimônio e pressione Enter"
                className="w-full p-2 border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown} // Adiciona suporte para pressionar Enter
              />
            </div>
          </div>
        )}

        {/* Popup de resultados da busca */}
        {showSearchResultsPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-semibold mb-4">
                Resultados da Busca
              </h2>
              <ul className="max-h-40 overflow-auto border rounded p-2">
                {searchResults.map((item, index) => (
                  <li
                    key={index}
                    className="p-2 border-b last:border-b-0 flex justify-between items-center"
                  >
                    <span>
                      {item.patrimonio} / {item.planta}
                    </span>
                    <button
                      onClick={() => handleEdit(item)}
                      className="ml-4 p-1 bg-yellow-500 text-white rounded"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowSearchResultsPopup(false)}
                  className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup de edição de patrimônio */}
        {editingItem && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-semibold mb-4">Editar Patrimônio</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Patrimônio Atual"
                  className="w-full p-2 border rounded"
                  value={editValues.patrimonio}
                  disabled
                />
                <input
                  type="text"
                  placeholder="Novo Patrimônio"
                  className="w-full p-2 border rounded"
                  value={editValues.novoValor}
                  onChange={(e) =>
                    setEditValues({ ...editValues, novoValor: e.target.value })
                  }
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setEditingItem(null)}
                    className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Popup de adicionar usuário */}
        {showAddUserPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-lg font-semibold mb-4">Adicionar Usuário</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Username"
                  className="w-full p-2 border rounded"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Perfil"
                  className="w-full p-2 border rounded"
                  value={newUser.perfil}
                  onChange={(e) =>
                    setNewUser({ ...newUser, perfil: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Nome Completo"
                  className="w-full p-2 border rounded"
                  value={newUser.nome_completo}
                  onChange={(e) =>
                    setNewUser({ ...newUser, nome_completo: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Planta"
                  className="w-full p-2 border rounded"
                  value={newUser.planta}
                  onChange={(e) =>
                    setNewUser({ ...newUser, planta: e.target.value })
                  }
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddUserPopup(false)}
                    className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default AdminPage;
