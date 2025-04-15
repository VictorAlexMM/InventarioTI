import React, { useState, useEffect } from "react";

const Itens = () => {
  const [showModal, setShowModal] = useState(false);
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [formData, setFormData] = useState({
    item: "",
    quantidade: "",
    planta: "",
  });
  const [movimentacaoFormData, setMovimentacaoFormData] = useState({
    quantidade: "",
    chamado: "",
    solicitante: "",
  });
  const [itens, setItens] = useState([]);
  const [filteredItens, setFilteredItens] = useState([]);
  const [itemCounts, setItemCounts] = useState({}); // { itemName: { emEstoque: number, emUso: number, totalEmEstoque: number } }

  // Valores esperados para userPlanta
  const plantasPermitidas = ["MANAUS", "SÃO PAULO", "CURITIBA", "JOINVILLE"];

  // Obter userProfile do localStorage
  const userProfile = localStorage.getItem("userProfile")?.toLowerCase();
  const isAdmin = userProfile === "admin";

  // Função para formatar a data de YYYY-MM-DD ou YYYY-MM-DD HH:mm:ss.SSS para DD/MM/YYYY
  const formatarData = (data) => {
    if (!data) return "";
    // Se a data incluir a hora (formato YYYY-MM-DD HH:mm:ss.SSS), pegamos apenas a parte da data
    const dataSemHora = data.split(" ")[0]; // Pega apenas YYYY-MM-DD
    const [ano, mes, dia] = dataSemHora.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Buscar dados da API e aplicar filtro baseado em userPlanta (exceto para admin)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar itens do estoque
        const estoqueResponse = await fetch(
          "http://localhost:4001/api/estoque"
        );
        if (!estoqueResponse.ok)
          throw new Error("Erro ao buscar itens do estoque");
        const estoqueData = await estoqueResponse.json();
        console.log("Dados recebidos da API (estoque):", estoqueData);
        setItens(estoqueData);

        // Filtrar itens por planta (exceto para admin) - apenas para a tabela
        let itemsToShow = estoqueData;
        if (!isAdmin) {
          const userPlanta = localStorage.getItem("userPlanta")?.toUpperCase();
          if (userPlanta && plantasPermitidas.includes(userPlanta)) {
            itemsToShow = estoqueData.filter(
              (item) => item.PLANTA.toUpperCase() === userPlanta
            );
          } else {
            itemsToShow = []; // Se userPlanta não for válido, não mostrar nada
          }
        }
        setFilteredItens(itemsToShow);

        // Buscar todas as movimentações para calcular "em uso"
        const movimentacoesResponse = await Promise.all(
          estoqueData.map((item) =>
            fetch(
              `http://PC101961:4001/api/movimentacao-estoque/${item.ID}`
            ).then((res) => res.json())
          )
        );
        const allMovimentacoes = movimentacoesResponse.flat();
        console.log("Todas as movimentações:", allMovimentacoes);

        // Calcular "em estoque", "em uso" e "total em estoque" por item
        const counts = {};
        // Usar todos os itens (estoqueData) para o contador, para incluir todas as plantas
        estoqueData.forEach((item) => {
          const itemName = item.ITEM.toLowerCase();
          if (!counts[itemName]) {
            counts[itemName] = { emEstoque: 0, emUso: 0, totalEmEstoque: 0 };
          }
          counts[itemName].emEstoque += item.QUANTIDADE;
        });

        allMovimentacoes.forEach((mov) => {
          const itemName = mov.ITEM.toLowerCase();
          if (counts[itemName]) {
            counts[itemName].emUso += mov.QUANTIDADE;
          }
        });

        // Calcular o total em estoque (emEstoque + emUso)
        Object.keys(counts).forEach((itemName) => {
          counts[itemName].totalEmEstoque =
            counts[itemName].emEstoque + counts[itemName].emUso;
        });

        setItemCounts(counts);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, [isAdmin]);

  const handleAddItem = () => {
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMovimentacaoInputChange = (e) => {
    const { name, value } = e.target;
    setMovimentacaoFormData({ ...movimentacaoFormData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação simples
    if (!formData.item || !formData.quantidade || !formData.planta) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    // Verificar se a planta do novo item corresponde à userPlanta (se não for admin)
    if (!isAdmin) {
      const userPlanta = localStorage.getItem("userPlanta")?.toUpperCase();
      if (userPlanta && plantasPermitidas.includes(userPlanta)) {
        if (formData.planta.toUpperCase() !== userPlanta) {
          alert(`Você só pode adicionar itens para a planta ${userPlanta}.`);
          return;
        }
      }
    }

    try {
      const response = await fetch("http://PC101961:4001/api/estoque", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ITEM: formData.item,
          QUANTIDADE: parseInt(formData.quantidade, 10),
          PLANTA: formData.planta,
          ULTIMA_SOLICITACAO: new Date().toISOString().split("T")[0], // Formato YYYY-MM-DD
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao adicionar item: ${errorText}`);
      }

      const result = await response.json();
      console.log("Resposta da API (adição):", result);

      // Atualizar os dados após adicionar
      const newData = await fetch("http://PC101961:4001/api/estoque").then(
        (res) => res.json()
      );
      setItens(newData);

      // Reaplicar o filtro baseado em userPlanta (exceto para admin)
      let itemsToShow = newData;
      if (!isAdmin) {
        const userPlanta = localStorage.getItem("userPlanta")?.toUpperCase();
        if (userPlanta && plantasPermitidas.includes(userPlanta)) {
          itemsToShow = newData.filter(
            (item) => item.PLANTA.toUpperCase() === userPlanta
          );
        } else {
          itemsToShow = [];
        }
      }
      setFilteredItens(itemsToShow);

      // Atualizar os contadores
      const counts = {};
      newData.forEach((item) => {
        const itemName = item.ITEM.toLowerCase();
        if (!counts[itemName]) {
          counts[itemName] = { emEstoque: 0, emUso: 0, totalEmEstoque: 0 };
        }
        counts[itemName].emEstoque += item.QUANTIDADE;
      });

      const movimentacoesResponse = await Promise.all(
        newData.map((item) =>
          fetch(
            `http://PC101961:4001/api/movimentacao-estoque/${item.ID}`
          ).then((res) => res.json())
        )
      );
      const allMovimentacoes = movimentacoesResponse.flat();
      allMovimentacoes.forEach((mov) => {
        const itemName = mov.ITEM.toLowerCase();
        if (counts[itemName]) {
          counts[itemName].emUso += mov.QUANTIDADE;
        }
      });

      // Calcular o total em estoque (emEstoque + emUso)
      Object.keys(counts).forEach((itemName) => {
        counts[itemName].totalEmEstoque =
          counts[itemName].emEstoque + counts[itemName].emUso;
      });

      setItemCounts(counts);

      // Fechar o modal e resetar o formulário
      setShowModal(false);
      setFormData({
        item: "",
        quantidade: "",
        planta: "",
      });

      alert("Item adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      alert(`Erro ao adicionar item: ${error.message}`);
    }
  };

  const handleVerMovimentacoes = async (estoqueId, item) => {
    setSelectedItem({ id: estoqueId, item });
    try {
      const response = await fetch(
        `http://PC101961:4001/api/movimentacao-estoque/${estoqueId}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar movimentações: ${errorText}`);
      }
      const data = await response.json();
      setMovimentacoes(data);
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
      alert(`Erro ao buscar movimentações: ${error.message}`);
    }
  };

  const handleAddMovimentacao = () => {
    setMovimentacaoFormData({
      quantidade: "",
      chamado: "",
      solicitante: "",
    });
    setShowMovimentacaoModal(true);
  };

  const handleSubmitMovimentacao = async (e) => {
    e.preventDefault();

    // Validação simples
    if (
      !movimentacaoFormData.quantidade ||
      !movimentacaoFormData.chamado ||
      !movimentacaoFormData.solicitante
    ) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    // Obter o valor de loggedUser do localStorage
    const loggedUser = localStorage.getItem("loggedUser");
    if (!loggedUser) {
      alert(
        "Usuário logado não encontrado. Certifique-se de que a chave 'loggedUser' está definida no localStorage."
      );
      return;
    }

    // Definir a data atual para DATA_CRIACAO
    const today = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD

    try {
      const response = await fetch(
        "http://PC101961:4001/api/movimentacao-estoque",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ESTOQUE_ID: selectedItem.id,
            ITEM: selectedItem.item,
            QUANTIDADE: parseInt(movimentacaoFormData.quantidade, 10),
            CHAMADO: movimentacaoFormData.chamado,
            SOLICITANTE: movimentacaoFormData.solicitante,
            RESPONSAVEL: loggedUser, // Preenchido automaticamente com loggedUser
            DATA_CRIACAO: today, // Data atual
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao adicionar movimentação: ${errorText}`);
      }

      const result = await response.json();
      console.log("Resposta da API (movimentação):", result);

      // Atualizar as movimentações após adicionar
      const newMovimentacoes = await fetch(
        `http://PC101961:4001/api/movimentacao-estoque/${selectedItem.id}`
      ).then((res) => res.json());
      setMovimentacoes(newMovimentacoes);

      // Atualizar os dados do estoque
      const newData = await fetch("http://PC101961:4001/api/estoque").then(
        (res) => res.json()
      );
      setItens(newData);

      // Reaplicar o filtro baseado em userPlanta (exceto para admin)
      let itemsToShow = newData;
      if (!isAdmin) {
        const userPlanta = localStorage.getItem("userPlanta")?.toUpperCase();
        if (userPlanta && plantasPermitidas.includes(userPlanta)) {
          itemsToShow = newData.filter(
            (item) => item.PLANTA.toUpperCase() === userPlanta
          );
        } else {
          itemsToShow = [];
        }
      }
      setFilteredItens(itemsToShow);

      // Atualizar os contadores
      const counts = {};
      newData.forEach((item) => {
        const itemName = item.ITEM.toLowerCase();
        if (!counts[itemName]) {
          counts[itemName] = { emEstoque: 0, emUso: 0, totalEmEstoque: 0 };
        }
        counts[itemName].emEstoque += item.QUANTIDADE;
      });

      const movimentacoesResponse = await Promise.all(
        newData.map((item) =>
          fetch(
            `http://PC101961:4001/api/movimentacao-estoque/${item.ID}`
          ).then((res) => res.json())
        )
      );
      const allMovimentacoes = movimentacoesResponse.flat();
      allMovimentacoes.forEach((mov) => {
        const itemName = mov.ITEM.toLowerCase();
        if (counts[itemName]) {
          counts[itemName].emUso += mov.QUANTIDADE;
        }
      });

      // Calcular o total em estoque (emEstoque + emUso)
      Object.keys(counts).forEach((itemName) => {
        counts[itemName].totalEmEstoque =
          counts[itemName].emEstoque + counts[itemName].emUso;
      });

      setItemCounts(counts);

      // Fechar o modal e resetar o formulário
      setShowMovimentacaoModal(false);
      setMovimentacaoFormData({
        quantidade: "",
        chamado: "",
        solicitante: "",
      });

      alert("Movimentação adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar movimentação:", error);
      alert(`Erro ao adicionar movimentação: ${error.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      item: "",
      quantidade: "",
      planta: "",
    });
  };

  const handleCloseMovimentacaoModal = () => {
    setShowMovimentacaoModal(false);
    setMovimentacaoFormData({
      quantidade: "",
      chamado: "",
      solicitante: "",
    });
  };

  // Ordenar os itens por quantidade total em estoque (descendente) e limitar a 4
  const topItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b.totalEmEstoque - a.totalEmEstoque)
    .slice(0, 4);

  return (
    <div className="container mx-auto p-4">
      {/* Contador de Itens */}
      <div className="flex justify-center gap-2 mb-6">
        {topItems.map(([itemName, counts]) => (
          <div
            key={itemName}
            className="bg-white shadow-md rounded-lg p-4 text-center w-28"
          >
            <h3 className="text-sm font-semibold text-gray-700 capitalize">
              {itemName}
            </h3>
            <p className="text-lg font-bold text-gray-900">
              {counts.emUso}/{counts.totalEmEstoque}
            </p>
            <p className="text-xs text-gray-500">(em uso/total)</p>
          </div>
        ))}
      </div>

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-black font-semibold">Itens</h1>
        {isAdmin && (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleAddItem}
          >
            + Adicionar Item
          </button>
        )}
      </div>

      {/* Tabela de Estoque */}
      <div className="overflow-x-auto bg-gray-100 rounded">
        <table className="min-w-full border-collapse table-auto text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-1 py-1">Item</th>
              <th className="border px-1 py-1">Quantidade</th>
              <th className="border px-1 py-1">Planta</th>
              <th className="border px-1 py-1">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItens.map((item) => (
              <tr key={item.ID} className="border-b hover:bg-gray-200">
                <td className="border px-1 py-1">{item.ITEM}</td>
                <td className="border px-1 py-1">{item.QUANTIDADE}</td>
                <td className="border px-1 py-1">{item.PLANTA}</td>
                <td className="border px-1 py-1">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleVerMovimentacoes(item.ID, item.ITEM)}
                  >
                    Ver Movimentações
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItens.length === 0 && (
          <p className="mt-4 text-gray-500">Nenhum item encontrado.</p>
        )}
      </div>

      {/* Tabela de Movimentações (exibida quando um item é selecionado) */}
      {selectedItem && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl text-black font-semibold">
              Movimentações de {selectedItem.item}
            </h2>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={handleAddMovimentacao}
            >
              + Adicionar Movimentação
            </button>
          </div>
          <div className="overflow-x-auto bg-gray-100 rounded">
            <table className="min-w-full border-collapse table-auto text-xs">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border px-1 py-1">Item</th>
                  <th className="border px-1 py-1">Quantidade</th>
                  <th className="border px-1 py-1">Chamado</th>
                  <th className="border px-1 py-1">Solicitante</th>
                  <th className="border px-1 py-1">Responsável</th>
                  <th className="border px-1 py-1">Data de Criação</th>
                </tr>
              </thead>
              <tbody>
                {movimentacoes.map((mov) => (
                  <tr key={mov.ID} className="border-b hover:bg-gray-200">
                    <td className="border px-1 py-1">{mov.ITEM}</td>
                    <td className="border px-1 py-1">{mov.QUANTIDADE}</td>
                    <td className="border px-1 py-1">{mov.CHAMADO}</td>
                    <td className="border px-1 py-1">{mov.SOLICITANTE}</td>
                    <td className="border px-1 py-1">{mov.RESPONSAVEL}</td>
                    <td className="border px-1 py-1">
                      {formatarData(mov.DATA_CRIACAO)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movimentacoes.length === 0 && (
              <p className="mt-4 text-gray-500">
                Nenhuma movimentação encontrada.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal para Adicionar Item */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Adicionar Item
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="item"
                placeholder="Item"
                value={formData.item}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="number"
                name="quantidade"
                placeholder="Quantidade"
                value={formData.quantidade}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
                min="0"
              />
              <input
                type="text"
                name="planta"
                placeholder="Planta"
                value={formData.planta}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Movimentação */}
      {showMovimentacaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Adicionar Movimentação para {selectedItem.item}
            </h2>
            <form onSubmit={handleSubmitMovimentacao} className="space-y-4">
              <input
                type="number"
                name="quantidade"
                placeholder="Quantidade"
                value={movimentacaoFormData.quantidade}
                onChange={handleMovimentacaoInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
                min="0"
              />
              <input
                type="text"
                name="chamado"
                placeholder="Chamado"
                value={movimentacaoFormData.chamado}
                onChange={handleMovimentacaoInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="text"
                name="solicitante"
                placeholder="Solicitante"
                value={movimentacaoFormData.solicitante}
                onChange={handleMovimentacaoInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseMovimentacaoModal}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Itens;
