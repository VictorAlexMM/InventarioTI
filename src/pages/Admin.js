import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faSearch } from '@fortawesome/free-solid-svg-icons';
import Container from '../components/Container';

const AdminPage = () => {
  const [showAddCentroCusto, setShowAddCentroCusto] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({ patrimonio: '', usuario: '', planta: '' });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const response = await fetch(`http://localhost:4001/buscar-patrimonio?search=${searchTerm}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchResults([]);
        alert("Nenhum patrimônio encontrado!");
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setSearchResults([]);
      alert("Erro ao buscar patrimônio.");
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditValues({ patrimonio: item.patrimonio, usuario: item.usuario, planta: item.planta });
  };

  const handleUpdate = async () => {
    try {
      console.log('Enviando requisição para atualizar patrimônio:', editValues.patrimonioAntigo, 'para', editValues.patrimonioNovo);
  
      const response = await fetch('http://localhost:4001/atualizar-patrimonio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patrimonioAntigo: editValues.patrimonioAntigo,
          patrimonioNovo: editValues.patrimonioNovo,  // Novo valor de patrimônio
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message); // Mensagem de sucesso
        setEditingItem(null); // Fechar o modal de edição
      } else {
        alert(data.error); // Mensagem de erro
      }
    } catch (error) {
      console.error('Erro ao atualizar patrimônio:', error);
      alert('Erro ao atualizar patrimônio.');
    }
  };
  
  
  return (
    <Container>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Administração</h1>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Buscar Patrimônio</h2>
          <div className="flex items-center space-x-2 mb-2">
            <input 
              type="text" 
              placeholder="Buscar Patrimônio" 
              className="w-full p-2 border rounded" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={handleSearch} 
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
          <ul className="max-h-40 overflow-auto border rounded p-2">
            {searchResults.map((item, index) => (
              <li key={index} className="p-2 border-b last:border-b-0 flex justify-between items-center">
                <span>{item.patrimonio}/ {item.planta}</span>
                <button 
                  onClick={() => handleEdit(item)} 
                  className="ml-4 p-1 bg-yellow-500 text-white rounded">
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {editingItem && (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-lg font-semibold mb-4">Editar Patrimônio</h2>
      <input 
        type="text" 
        placeholder="Patrimônio" 
        className="w-full p-2 border rounded mb-2"
        value={editValues.patrimonio}
        onChange={(e) => setEditValues({ ...editValues, patrimonio: e.target.value })}
      />
      <div className="flex justify-end space-x-2">
        <button onClick={() => setEditingItem(null)} className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancelar</button>
        <button onClick={handleUpdate} className="p-2 bg-green-500 text-white rounded hover:bg-green-600">Salvar</button>
      </div>
    </div>
  </div>
)}
      </div>
    </Container>
  );
};

export default AdminPage;
