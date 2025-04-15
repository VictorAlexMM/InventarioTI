import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [data, setData] = useState({
    total_comodatos: 0,
    total_desktops: 0,
    total_notebooks: 0,
    total_servidor: 0,
    total_impressora: 0,
    total_coletor: 0,
    total_monitor: 0,
    total_switch: 0,
  });

  const [changes, setChanges] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState("");

  const fetchData = async () => {
    try {
      const response = await axios.get(
        "http://PC101961:4001/dashboard/contagem",
        {
          params: { planta: selectedPlanta },
        }
      );
      setData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    }
  };

  const fetchRecentChanges = async () => {
    try {
      const response = await axios.get(
        "http://PC101961:4001/dashboard/recent-changes",
        {
          params: { planta: selectedPlanta },
        }
      );
      setChanges(response.data);
    } catch (error) {
      console.error("Erro ao buscar mudanças recentes:", error);
    }
  };

  const fetchPlantas = async () => {
    try {
      const response = await axios.get(
        "http://PC101961:4001/dashboard/plantas"
      );
      setPlantas(response.data);
    } catch (error) {
      console.error("Erro ao buscar plantas:", error);
    }
  };

  useEffect(() => {
    fetchPlantas();
  }, []);

  useEffect(() => {
    fetchData();
    fetchRecentChanges();

    const interval = setInterval(() => {
      fetchData();
      fetchRecentChanges();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedPlanta]);

  const handlePlantaChange = (event) => {
    setSelectedPlanta(event.target.value);
  };

  const formatKey = (key) => {
    switch (key) {
      case "total_servidor":
        return "Servidores";
      case "total_comodatos":
        return "Comodatos";
      case "total_desktops":
        return "Desktops";
      case "total_notebooks":
        return "Notebooks";
      case "total_impressora":
        return "Impressoras";
      case "total_coletor":
        return "Coletores";
      case "total_monitor":
        return "Monitores";
      case "total_switch":
        return "Switches";
      default:
        return key.replace("total_", "").charAt(0).toUpperCase() + key.slice(1);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6">Dashboard de Equipamentos</h1>

      {/* Dropdown para selecionar a planta */}
      <div className="relative mb-6">
        <select
          value={selectedPlanta}
          onChange={handlePlantaChange}
          className="block w-48 p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="GERAL">GERAL</option>{" "}
          {/* Opção fixa mantida no topo */}
          {plantas
            .sort((a, b) => a.planta.localeCompare(b.planta)) // Ordena alfabeticamente
            .map((planta) => (
              <option key={planta.planta} value={planta.planta}>
                {planta.planta}
              </option>
            ))}
        </select>
      </div>

      {/* Card de contagem de equipamentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="bg-white p-4 shadow-md rounded-lg text-center"
          >
            <h3 className="text-xl font-semibold">{formatKey(key)}</h3>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent changes */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Alterações Recentes</h2>
        <ul>
          {changes.map((change, index) => (
            <li
              key={index}
              className="flex justify-between bg-gray-50 p-3 mb-2 rounded-lg shadow-sm"
            >
              <span>{change.description}</span>
              <span className="text-sm text-gray-500">{change.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
