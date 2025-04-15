import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import centroDeCusto from "../data/centrosDeCusto.json";

const tiposLicenca = [
  "TOTVS DESKTOP",
  "TOTVS COLETOR",
  "Office F3",
  "Office F3+P1",
  "Office E1",
  "Office E3",
  "AutoCAD",
  "Zebra",
];

const TabelaInventario = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ID: null,
    PLANTA: "",
    SETOR: "",
    CENTRO_DE_CUSTO: "",
    LICENCA: "",
    COLABORADOR: "",
    SUBSTITUICAO: "",
    OBSERVACAO: "",
    ANEXO: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [dados, setDados] = useState([]);
  const [filteredDados, setFilteredDados] = useState([]);

  // Buscar dados da API ao carregar o componente
  useEffect(() => {
    fetch("http://PC101961:4001/api/licencas")
      .then((response) => response.json())
      .then((data) => {
        console.log("Dados recebidos da API:", data); // Depuração
        setDados(data);
        setFilteredDados(data);
      })
      .catch((error) => console.error("Erro ao buscar licenças:", error));
  }, []);

  // Atualiza o SETOR com base no CENTRO_DE_CUSTO
  useEffect(() => {
    const setor = centroDeCusto[formData.CENTRO_DE_CUSTO] || "";
    setFormData((prev) => ({ ...prev, SETOR: setor }));
  }, [formData.CENTRO_DE_CUSTO]);

  // Filtra os dados com base no termo de busca
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const results = dados.filter(
      (item) =>
        item.LICENCA.toLowerCase().includes(lowerCaseSearchTerm) ||
        item.COLABORADOR.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredDados(results);
  }, [searchTerm, dados]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "ANEXO") {
      setFormData({ ...formData, ANEXO: files[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("PLANTA", formData.PLANTA);
    formDataToSend.append("SETOR", formData.SETOR);
    formDataToSend.append("CENTRO_DE_CUSTO", formData.CENTRO_DE_CUSTO);
    formDataToSend.append("LICENCA", formData.LICENCA);
    formDataToSend.append("COLABORADOR", formData.COLABORADOR);
    formDataToSend.append("SUBSTITUICAO", formData.SUBSTITUICAO);
    formDataToSend.append("OBSERVACAO", formData.OBSERVACAO);
    if (formData.ANEXO) {
      formDataToSend.append("ANEXO", formData.ANEXO);
    }

    try {
      let response;
      if (isEditing) {
        const id = Number(formData.ID); // Garantir que ID seja um número
        if (!id || isNaN(id)) {
          console.error("ID inválido encontrado:", formData.ID);
          throw new Error("ID inválido para edição");
        }
        console.log("ID sendo enviado para PUT:", id);
        response = await fetch(`http://PC101961:4001/api/licencas/${id}`, {
          method: "PUT",
          body: formDataToSend,
        });
      } else {
        response = await fetch("http://PC101961:4001/api/licencas", {
          method: "POST",
          body: formDataToSend,
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro ao ${isEditing ? "atualizar" : "enviar"} os dados: ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Resposta da API:", result);

      // Atualizar os dados após a operação
      const newData = await fetch("http://PC101961:4001/api/licencas").then(
        (res) => res.json()
      );
      setDados(newData);
      setFilteredDados(newData);

      // Mostrar mensagem de sucesso
      alert(
        isEditing
          ? "Licença atualizada com sucesso!"
          : "Licença adicionada com sucesso!"
      );

      // Fechar o modal e resetar o formulário
      setShowModal(false);
      setIsEditing(false);
      setFormData({
        ID: null,
        PLANTA: "",
        SETOR: "",
        CENTRO_DE_CUSTO: "",
        LICENCA: "",
        COLABORADOR: "",
        SUBSTITUICAO: "",
        OBSERVACAO: "",
        ANEXO: null,
      });
    } catch (error) {
      console.error(
        `Erro ao ${isEditing ? "atualizar" : "salvar"} licença:`,
        error
      );
      alert(
        `Erro ao ${isEditing ? "atualizar" : "salvar"} licença: ${
          error.message
        }`
      );
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setFormData({
      ID: null,
      PLANTA: "",
      SETOR: "",
      CENTRO_DE_CUSTO: "",
      LICENCA: "",
      COLABORADOR: "",
      SUBSTITUICAO: "",
      OBSERVACAO: "",
      ANEXO: null,
    });
  };

  const handleEdit = (item) => {
    console.log("Item selecionado para edição:", item); // Depuração
    const itemId = item.ID || item.id || item.Id; // Tentar diferentes variações de nome
    if (!itemId) {
      console.error("Nenhum ID encontrado no item:", item);
      alert("Erro: O item selecionado não possui um ID válido.");
      return;
    }
    console.log("ID capturado para edição:", itemId); // Depuração adicional
    setFormData({
      ID: itemId, // Usar o ID encontrado
      PLANTA: item.PLANTA || "",
      SETOR: item.SETOR || "",
      CENTRO_DE_CUSTO: item.CENTRO_DE_CUSTO || "",
      LICENCA: item.LICENCA || "",
      COLABORADOR: item.COLABORADOR || "",
      SUBSTITUICAO: item.SUBSTITUICAO || "",
      OBSERVACAO: item.OBSERVACAO || "",
      ANEXO: null,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl text-black font-semibold">Licenças</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            setIsEditing(false);
            setShowModal(true);
          }}
        >
          + Adicionar
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por Licença ou Colaborador"
        className="border rounded p-2 w-full mb-4"
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <div className="overflow-x-auto bg-gray-100 rounded">
        <table className="min-w-full border-collapse table-auto text-xs">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-1 py-1">Colaborador</th>
              <th className="border px-1 py-1">Setor</th>
              <th className="border px-1 py-1">Centro de Custo</th>
              <th className="border px-1 py-1">Planta</th>
              <th className="border px-1 py-1">Licença</th>
              <th className="border px-1 py-1">Substituição</th>
              <th className="border px-1 py-1">Observação</th>
              <th className="border px-1 py-1">Anexo</th>
              <th className="border px-1 py-1">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredDados.map((item) => (
              <tr
                key={item.ID || item.id || item.Id}
                className="border-b hover:bg-gray-200"
              >
                <td className="border px-1 py-1">{item.COLABORADOR}</td>
                <td className="border px-1 py-1">{item.SETOR}</td>
                <td className="border px-1 py-1">{item.CENTRO_DE_CUSTO}</td>
                <td className="border px-1 py-1">{item.PLANTA}</td>
                <td className="border px-1 py-1">{item.LICENCA}</td>
                <td className="border px-1 py-1">
                  {item.SUBSTITUICAO || "N/A"}
                </td>
                <td className="border px-1 py-1">{item.OBSERVACAO || "N/A"}</td>
                <td className="border px-1 py-1">
                  {item.ANEXO ? (
                    <a
                      href={`http://PC101961:4001/${item.ANEXO}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Ver Anexo
                    </a>
                  ) : (
                    "Nenhum anexo"
                  )}
                </td>
                <td className="border px-1 py-1">
                  <button
                    className="text-blue-500"
                    onClick={() => handleEdit(item)}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredDados.length === 0 && (
          <p className="mt-4 text-gray-500">Nenhum resultado encontrado.</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              {isEditing ? "Editar Licença" : "Adicionar Licença"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="COLABORADOR"
                placeholder="Colaborador"
                value={formData.COLABORADOR}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="text"
                name="SETOR"
                placeholder="Setor"
                value={formData.SETOR}
                readOnly
                className="w-full border border-gray-300 rounded-md p-2 bg-gray-100 cursor-not-allowed"
              />
              <input
                type="text"
                name="CENTRO_DE_CUSTO"
                placeholder="Centro de Custo"
                value={formData.CENTRO_DE_CUSTO}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                type="text"
                name="PLANTA"
                placeholder="Planta"
                value={formData.PLANTA}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <select
                name="LICENCA"
                value={formData.LICENCA}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
                required
              >
                <option value="">Selecione o Tipo</option>
                {tiposLicenca.map((tipo, i) => (
                  <option key={i} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="SUBSTITUICAO"
                placeholder="Substituição"
                value={formData.SUBSTITUICAO}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <input
                type="text"
                name="OBSERVACAO"
                placeholder="Observação"
                value={formData.OBSERVACAO}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Anexo (PDF ou .msg)
                </label>
                <input
                  type="file"
                  name="ANEXO"
                  accept=".pdf,.msg"
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md p-2 file:bg-blue-500 file:text-white file:border-none file:px-3 file:py-1 file:rounded"
                />
                {formData.ANEXO && (
                  <p className="text-sm text-gray-500 mt-1">
                    Arquivo selecionado: {formData.ANEXO.name}
                  </p>
                )}
              </div>
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
                  {isEditing ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabelaInventario;
