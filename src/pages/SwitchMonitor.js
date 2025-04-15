import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faPlus } from "@fortawesome/free-solid-svg-icons";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function App() {
  const [switches, setSwitches] = useState({});
  const [racks, setRacks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSwitches, setFilteredSwitches] = useState({});
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [plants, setPlants] = useState([]);
  const [switchFormData, setSwitchFormData] = useState({
    IP: "",
    Marca: "",
    Modelo: "",
    Portas_ativas: "",
    Portas_desativadas: "",
    Localizacao: "",
    Planta: "",
    OBSERVACAO: "",
  });
  const [showRackModal, setShowRackModal] = useState(false);
  const [selectedRack, setSelectedRack] = useState(null);
  const [rackSwitches, setRackSwitches] = useState([]);
  const [returnToRackModal, setReturnToRackModal] = useState(false);
  const [showNewRackModal, setShowNewRackModal] = useState(false);
  const [rackFormData, setRackFormData] = useState({
    Nome: "",
    Quantos_U: "",
    Possui_Nobreak: false,
    Planta: "",
  });

  const userProfile = localStorage.getItem("userProfile") || "";
  const userPlanta = localStorage.getItem("userPlanta") || "";
  const allowedPlants = [
    "Joinville",
    "Manaus",
    "Curitiba",
    "Linhares",
    "São Paulo",
  ];

  useEffect(() => {
    const fetchSwitches = async () => {
      try {
        const response = await fetch("http://localhost:6001/api/status");
        if (!response.ok) throw new Error("Erro ao carregar switches");
        const data = await response.json();
        setSwitches(data);

        const filtered = Object.fromEntries(
          Object.entries(data).filter(([_, switchData]) => {
            if (userProfile === "admin") return true;
            if (!allowedPlants.includes(userPlanta)) return false;
            return switchData.planta === userPlanta;
          })
        );
        setFilteredSwitches(filtered);
      } catch (error) {
        alert(error.message);
      }
    };

    const fetchRacks = async () => {
      try {
        const response = await fetch(
          `http://localhost:6001/api/racks?userPlanta=${encodeURIComponent(
            userPlanta
          )}&userProfile=${encodeURIComponent(userProfile)}`
        );
        if (!response.ok) throw new Error("Erro ao carregar racks");
        const data = await response.json();
        setRacks(data);
      } catch (error) {
        alert(error.message);
      }
    };

    const fetchPlants = async () => {
      try {
        const response = await fetch("http://localhost:6001/api/plants");
        if (!response.ok) throw new Error("Erro ao carregar plantas");
        const data = await response.json();
        setPlants(data);
      } catch (error) {
        alert(error.message);
      }
    };

    fetchSwitches();
    fetchRacks();
    fetchPlants();
    const interval = setInterval(fetchSwitches, 5000);
    return () => clearInterval(interval);
  }, [userProfile, userPlanta]);

  useEffect(() => {
    if (!isEditing && userProfile !== "admin" && userPlanta) {
      setSwitchFormData((prev) => ({ ...prev, Planta: userPlanta }));
      setRackFormData((prev) => ({ ...prev, Planta: userPlanta }));
    }
  }, [userProfile, userPlanta, isEditing]);

  const rackStats = racks.map((rack) => {
    const switchesInRack = Object.values(filteredSwitches).filter(
      (switchData) =>
        (switchData.localizacao || "Rack Desconhecido") === rack.nome
    );
    const online = switchesInRack.filter((s) => s.conectado).length;
    const offline = switchesInRack.length - online;
    return {
      ...rack,
      online,
      offline,
      switches: switchesInRack,
    };
  });

  const handleSearchChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = Object.fromEntries(
      Object.entries(switches).filter(([ip, switchData]) => {
        if (userProfile === "admin") return ip.toLowerCase().includes(term);
        if (!allowedPlants.includes(userPlanta)) return false;
        return (
          switchData.planta === userPlanta && ip.toLowerCase().includes(term)
        );
      })
    );
    setFilteredSwitches(filtered);
  };

  const formatTime = (tempoMs) => {
    if (!tempoMs) return "0s";
    const segundos = Math.floor(tempoMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return minutos === 0
      ? `${segundosRestantes}s`
      : `${minutos}m ${segundosRestantes}s`;
  };

  const handleSwitchFormChange = (e) => {
    const { name, value } = e.target;
    setSwitchFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRackFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRackFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmitSwitch = async (e) => {
    e.preventDefault();
    const ip = switchFormData.IP.trim();
    if (!ip) {
      alert("Por favor, insira um endereço IP.");
      return;
    }

    try {
      if (isEditing) {
        await fetch(
          `http://localhost:6001/api/remove/${switchFormData.oldIP}`,
          {
            method: "DELETE",
          }
        );
      }

      const response = await fetch("http://localhost:6001/api/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: switchFormData.IP,
          marca: switchFormData.Marca,
          modelo: switchFormData.Modelo,
          portas_ativas: parseInt(switchFormData.Portas_ativas) || 0,
          portas_desativadas: parseInt(switchFormData.Portas_desativadas) || 0,
          localizacao: switchFormData.Localizacao,
          planta: switchFormData.Planta,
          observacao: switchFormData.OBSERVACAO,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao adicionar switch");
      }

      const updatedResponse = await fetch("http://localhost:6001/api/status");
      if (!updatedResponse.ok)
        throw new Error("Erro ao atualizar lista de switches");
      const updatedData = await updatedResponse.json();
      setSwitches(updatedData);

      const filtered = Object.fromEntries(
        Object.entries(updatedData).filter(([_, switchData]) => {
          if (userProfile === "admin") return true;
          if (!allowedPlants.includes(userPlanta)) return false;
          return switchData.planta === userPlanta;
        })
      );
      setFilteredSwitches(filtered);

      alert(
        isEditing
          ? "Switch atualizado com sucesso!"
          : "Switch adicionado com sucesso!"
      );
      handleCloseSwitchModal();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSubmitRack = async (e) => {
    e.preventDefault();
    const rackName = rackFormData.Nome.trim();
    if (!rackName) {
      alert("Por favor, insira o nome do rack.");
      return;
    }
    if (!rackFormData.Planta) {
      alert("Por favor, selecione uma planta.");
      return;
    }

    try {
      const response = await fetch("http://localhost:6001/api/addRack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: rackFormData.Nome,
          quantos_u: parseInt(rackFormData.Quantos_U) || null,
          possui_nobreak: rackFormData.Possui_Nobreak,
          planta: rackFormData.Planta,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erro ao adicionar rack");
      }

      const updatedRacksResponse = await fetch(
        `http://localhost:6001/api/racks?userPlanta=${encodeURIComponent(
          userPlanta
        )}&userProfile=${encodeURIComponent(userProfile)}`
      );
      if (!updatedRacksResponse.ok)
        throw new Error("Erro ao atualizar lista de racks");
      const updatedRacksData = await updatedRacksResponse.json();
      setRacks(updatedRacksData);

      alert("Rack criado com sucesso!");
      handleCloseNewRackModal();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemoveSwitch = async (ip) => {
    try {
      const response = await fetch(`http://localhost:6001/api/remove/${ip}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao remover switch");

      const updatedResponse = await fetch("http://localhost:6001/api/status");
      if (!updatedResponse.ok)
        throw new Error("Erro ao atualizar lista de switches");
      const updatedData = await updatedResponse.json();
      setSwitches(updatedData);

      const filtered = Object.fromEntries(
        Object.entries(updatedData).filter(([_, switchData]) => {
          if (userProfile === "admin") return true;
          if (!allowedPlants.includes(userPlanta)) return false;
          return switchData.planta === userPlanta;
        })
      );
      setFilteredSwitches(filtered);

      if (selectedRack) {
        const switchesInRack = Object.values(filtered).filter(
          (switchData) =>
            (switchData.localizacao || "Rack Desconhecido") === selectedRack
        );
        setRackSwitches(switchesInRack);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = (ip, data) => {
    setSwitchFormData({
      IP: ip,
      Marca: data.marca || "",
      Modelo: data.modelo || "",
      Portas_ativas: data.portas_ativas || "",
      Portas_desativadas: data.portas_desativadas || "",
      Localizacao: data.localizacao || "",
      Planta: data.planta || "",
      OBSERVACAO: data.observacao || "",
      oldIP: ip,
    });
    setIsEditing(true);
    handleCloseRackModal();
    setShowSwitchModal(true);
    setReturnToRackModal(!!selectedRack);
  };

  const handleCloseSwitchModal = () => {
    setShowSwitchModal(false);
    setIsEditing(false);
    setSwitchFormData({
      IP: "",
      Marca: "",
      Modelo: "",
      Portas_ativas: "",
      Portas_desativadas: "",
      Localizacao: "",
      Planta: "",
      OBSERVACAO: "",
    });

    if (returnToRackModal && selectedRack) {
      const switchesInRack = Object.values(filteredSwitches).filter(
        (switchData) =>
          (switchData.localizacao || "Rack Desconhecido") === selectedRack
      );
      setRackSwitches(switchesInRack);
      setShowRackModal(true);
      setReturnToRackModal(false);
    }
  };

  const handleCloseNewRackModal = () => {
    setShowNewRackModal(false);
    setRackFormData({
      Nome: "",
      Quantos_U: "",
      Possui_Nobreak: false,
      Planta: userProfile !== "admin" && userPlanta ? userPlanta : "",
    });
  };

  const handleOpenRackModal = (rackName) => {
    const switchesInRack = Object.values(filteredSwitches).filter(
      (switchData) =>
        (switchData.localizacao || "Rack Desconhecido") === rackName
    );
    setSelectedRack(rackName);
    setRackSwitches(switchesInRack);
    setShowRackModal(true);
  };

  const handleCloseRackModal = () => {
    setShowRackModal(false);
    setSelectedRack(null);
    setRackSwitches([]);
    setReturnToRackModal(false);
  };

  const handleAddSwitchToRack = () => {
    setSwitchFormData({
      IP: "",
      Marca: "",
      Modelo: "",
      Portas_ativas: "",
      Portas_desativadas: "",
      Localizacao: selectedRack,
      Planta: userProfile !== "admin" && userPlanta ? userPlanta : "",
      OBSERVACAO: "",
    });
    setIsEditing(false);
    setReturnToRackModal(true);
    setShowRackModal(false);
    setShowSwitchModal(true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedSwitches = Array.from(rackSwitches);
    const [movedSwitch] = reorderedSwitches.splice(result.source.index, 1);
    reorderedSwitches.splice(result.destination.index, 0, movedSwitch);

    setRackSwitches(reorderedSwitches);
  };

  return (
    <div className="mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-black font-semibold">
          Monitoramento de Racks
        </h1>
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            onClick={() => {
              setShowNewRackModal(true);
            }}
          >
            Novo Rack
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {rackStats.map((rack) => (
          <div
            key={rack.id}
            className="bg-black text-white p-4 rounded-lg shadow-md flex flex-col justify-between"
            style={{ height: "150px", width: "150px" }}
          >
            <div>
              <h3 className="text-sm font-semibold">
                {rack.nome.toUpperCase()}
              </h3>
              <div className="mt-2 text-xs">
                <p>
                  <span className="text-green-500">● Online:</span>{" "}
                  {rack.online}
                </p>
                <p>
                  <span className="text-red-500">● Offline:</span>{" "}
                  {rack.offline}
                </p>
              </div>
            </div>
            <button
              className="bg-gray-700 text-white text-xs px-2 py-1 rounded hover:bg-gray-600 transition-colors mt-2"
              onClick={() => handleOpenRackModal(rack.nome)}
            >
              Verificar Rack
            </button>
          </div>
        ))}
      </div>

      {rackStats.length === 0 && (
        <p className="mt-4 text-gray-500 text-center">
          Nenhum rack encontrado.
        </p>
      )}

      {showSwitchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {isEditing ? "Editar Switch" : "Adicionar Switch"}
            </h2>
            <form onSubmit={handleSubmitSwitch} className="space-y-4">
              <input
                type="text"
                name="IP"
                placeholder="Endereço IP"
                value={switchFormData.IP}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="text"
                name="Marca"
                placeholder="Marca"
                value={switchFormData.Marca}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <input
                type="text"
                name="Modelo"
                placeholder="Modelo"
                value={switchFormData.Modelo}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <input
                type="number"
                name="Portas_ativas"
                placeholder="Portas Ativas"
                value={switchFormData.Portas_ativas}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <input
                type="number"
                name="Portas_desativadas"
                placeholder="Portas Desativadas"
                value={switchFormData.Portas_desativadas}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <input
                type="text"
                name="Localizacao"
                placeholder="Localização"
                value={switchFormData.Localizacao}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <select
                name="Planta"
                value={switchFormData.Planta}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
                disabled={plants.length === 0}
              >
                <option value="">Selecione uma Planta</option>
                {plants.length === 0 && (
                  <option value="" disabled>
                    Nenhuma planta disponível
                  </option>
                )}
                {plants.map((plant) => (
                  <option key={plant} value={plant}>
                    {plant}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="OBSERVACAO"
                placeholder="Observação"
                value={switchFormData.OBSERVACAO}
                onChange={handleSwitchFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseSwitchModal}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewRackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Novo Rack
            </h2>
            <form onSubmit={handleSubmitRack} className="space-y-4">
              <input
                type="text"
                name="Nome"
                placeholder="Nome do Rack"
                value={rackFormData.Nome}
                onChange={handleRackFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="number"
                name="Quantos_U"
                placeholder="Quantos U"
                value={rackFormData.Quantos_U}
                onChange={handleRackFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="Possui_Nobreak"
                  checked={rackFormData.Possui_Nobreak}
                  onChange={handleRackFormChange}
                  className="mr-2"
                />
                Possui Nobreak?
              </label>
              <select
                name="Planta"
                value={rackFormData.Planta}
                onChange={handleRackFormChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
                disabled={plants.length === 0}
              >
                <option value="">Selecione uma Planta</option>
                {plants.length === 0 && (
                  <option value="" disabled>
                    Nenhuma planta disponível
                  </option>
                )}
                {plants.map((plant) => (
                  <option key={plant} value={plant}>
                    {plant}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseNewRackModal}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Detalhes do Rack: {selectedRack}
              </h2>
              <button
                className="text-purple-500 hover:text-purple-700"
                onClick={handleAddSwitchToRack}
              >
                <FontAwesomeIcon icon={faPlus} /> Adicionar Switch
              </button>
            </div>
            <div className="overflow-x-auto">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="switches">
                  {(provided) => (
                    <table
                      className="w-full border-collapse table-fixed text-sm"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border px-4 py-2 text-left w-32">
                            IP
                          </th>
                          <th className="border px-4 py-2 text-left w-24">
                            Marca
                          </th>
                          <th className="border px-4 py-2 text-left w-28">
                            Modelo
                          </th>
                          <th className="border px-4 py-2 text-left w-24">
                            Portas Ativas
                          </th>
                          <th className="border px-4 py-2 textRIS-left w-32">
                            Portas Desativadas
                          </th>
                          <th className="border px-4 py-2 text-left w-28">
                            Status
                          </th>
                          <th className="border px-4 py-2 text-left w-28">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rackSwitches.map((switchData, index) => (
                          <Draggable
                            key={switchData.ip}
                            draggableId={switchData.ip}
                            index={index}
                          >
                            {(provided) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="border-b hover:bg-gray-100"
                              >
                                <td className="border px-4 py-2 truncate">
                                  {switchData.ip || "N/A"}
                                </td>
                                <td className="border px-4 py-2 truncate">
                                  {switchData.marca || "N/A"}
                                </td>
                                <td className="border px-4 py-2 truncate">
                                  {switchData.modelo || "N/A"}
                                </td>
                                <td className="border px-4 py-2 truncate text-center">
                                  {switchData.portas_ativas || "0"}
                                </td>
                                <td className="border px-4 py-2 truncate text-center">
                                  {switchData.portas_desativadas || "0"}
                                </td>
                                <td className="border px-4 py-2 whitespace-normal">
                                  <span
                                    className={`font-semibold ${
                                      switchData.conectado
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {switchData.conectado
                                      ? "Conectado"
                                      : `Desconectado (${formatTime(
                                          switchData.tempoDesconectado
                                        )})`}
                                  </span>
                                </td>
                                <td className="border px-4 py-2">
                                  <button
                                    className="text-blue-500 mr-2 hover:text-blue-700"
                                    onClick={() =>
                                      handleEdit(switchData.ip, switchData)
                                    }
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    className="text-red-500 hover:underline"
                                    onClick={() =>
                                      handleRemoveSwitch(switchData.ip)
                                    }
                                  >
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </tbody>
                    </table>
                  )}
                </Droppable>
              </DragDropContext>
              {rackSwitches.length === 0 && (
                <p className="mt-4 text-gray-500 text-center">
                  Nenhum switch encontrado neste rack.
                </p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                onClick={handleCloseRackModal}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
