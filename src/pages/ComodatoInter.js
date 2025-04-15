import React, { useState } from "react";
import centrosDeCusto from "../data/centrosDeCusto.json"; // Importando os dados

const Comodato = () => {
  const [formData, setFormData] = useState({
    nome: "",
    matricula: "",
    centroDeCusto: "",
    setor: "",
    patrimonio: "",
    usuario: "",
  });

  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedLocations, setSelectedLocations] = useState({});
  const [comodatoType, setComodatoType] = useState("proprietario");
  const [successMessage, setSuccessMessage] = useState(""); // Novo estado para a mensagem de sucesso

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === "centroDeCusto") {
      setFormData((prev) => ({
        ...prev,
        setor: centrosDeCusto[value] || "",
      }));
    }
  };

  const handleAgreementChange = (e) => {
    setIsAgreed(e.target.checked);
  };

  const handleLocationChange = (e) => {
    const { value, checked } = e.target;
    setSelectedLocations((prev) => ({
      ...prev,
      [value]: checked,
    }));
  };

  const handleComodatoTypeChange = (e) => {
    setComodatoType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validando se o usuário aceitou os termos
    if (!isAgreed) {
      alert(
        "Você deve concordar com as cláusulas antes de enviar o documento."
      );
      return;
    }

    // Validando se pelo menos uma planta foi selecionada
    const selectedPlants = Object.keys(selectedLocations).filter(
      (key) => selectedLocations[key]
    );
    if (selectedPlants.length === 0) {
      alert("Por favor, selecione ao menos uma planta.");
      return;
    }

    // Validando campos obrigatórios para "proprietário"
    if (
      comodatoType === "proprietario" &&
      (!formData.nome ||
        !formData.matricula ||
        !formData.centroDeCusto ||
        !formData.setor)
    ) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage(""); // Limpa a mensagem de sucesso antes de tentar enviar

    try {
      // Enviar os dados para o backend
      const response = await fetch("http://PC101961:4001/comodatointer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          planta: selectedPlants.join(", "),
          comodatoInter: comodatoType, // Enviar o tipo de comodato como comodatoInter
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro HTTP! Status: ${response.status}, Mensagem: ${errorText}`
        );
      }

      const result = await response.json();
      setSuccessMessage("Comodato Enviado com Sucesso");
    } catch (error) {
      console.error("Erro ao enviar o comodato:", error);
      setErrorMessage("Erro ao enviar o comodato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comodato-container">
      <h1 className="comodato-title text-2xl font-bold text-center py-4">
        COMODATO BRITÂNIA ELETRÔNICOS S.A
      </h1>
      <div className="comodato-content p-6">
        {/* Cláusulas */}
        <h2 className="text-xl font-semibold mb-2">CLÁUSULA 1° - Objeto:</h2>
        <p>
          1.1. Comodato do Direito de uso dos equipamentos mencionados no
          documento.
        </p>
        <h2 className="text-xl font-semibold mb-2">
          CLÁUSULA 2° - Prazo de Duração
        </h2>
        <p>
          2.1. O prazo de duração do presente contrato é semelhante ao do
          contrato de trabalho ou de prestação do serviço firmado entre as
          partes, com início na data da assinatura do presente.
        </p>
        <h2 className="text-xl font-semibold mb-2">
          CLÁUSULA 3° - Das Responsabilidades dos Contratantes
        </h2>
        <p>
          3.1. Firmado o presente e na posse do equipamento, o COMODATÁRIO
          assume toda e qualquer responsabilidade pela conservação e guarda do
          equipamento que lhe é confiado.
        </p>
        <p>
          3.2. As manutenções de hardware, instalação de software e atualizações
          de sistema serão realizadas pela COMODANTE, a TI (Tecnologia da
          Informação).
        </p>
        <p>
          3.3. Responde o COMODATÁRIO, pela restituição imediata do valor
          constante da nota fiscal do equipamento comodatado, em casos de:
          roubos e furtos ocorridos por sua culpa, extravios, bem como, pelas
          despesas para reparo do equipamento em virtude de acidentes ou mau
          uso. Tal restituição poderá ocorrer mediante desconto em folha ou
          abatimento em notas fiscais de prestação de serviços.
        </p>
        <p>
          3.4. O valor de restituição conforme previsto na cláusula acima, será
          o valor da nota fiscal.
        </p>

        {/* Formulário de comodato */}
        <form onSubmit={handleSubmit} className="comodato-form">
          {/* Tipo de Comodato */}
          <div className="form-group mb-4">
            <label className="block text-lg">Tipo de Comodato:</label>
            <div>
              <input
                type="radio"
                id="proprietario"
                value="proprietario"
                checked={comodatoType === "proprietario"}
                onChange={handleComodatoTypeChange}
                className="mr-2"
              />
              <label htmlFor="proprietario">Proprietário</label>
            </div>
            <div>
              <input
                type="radio"
                id="emprestado"
                value="emprestado"
                checked={comodatoType === "emprestado"}
                onChange={handleComodatoTypeChange}
                className="mr-2"
              />
              <label htmlFor="emprestado">Emprestado</label>
            </div>
          </div>

          {/* Nome */}
          <div className="form-group mb-4">
            <label htmlFor="nome" className="block text-lg">
              Nome:
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required={comodatoType === "proprietario"}
            />
          </div>

          {/* Matrícula */}
          <div className="form-group mb-4">
            <label htmlFor="matricula" className="block text-lg">
              Matrícula:
            </label>
            <input
              type="text"
              id="matricula"
              name="matricula"
              value={formData.matricula}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required={comodatoType === "proprietario"}
            />
          </div>

          {/* Planta */}
          <div className="form-group mb-4">
            <label className="block text-lg">Planta:</label>
            {["Joinville", "Manaus", "Curitiba", "Linhares"].map((location) => (
              <div key={location}>
                <input
                  type="checkbox"
                  id={location}
                  value={location}
                  checked={!!selectedLocations[location]}
                  onChange={handleLocationChange}
                  className="mr-2"
                />
                <label htmlFor={location}>{location}</label>
              </div>
            ))}
          </div>

          {/* Centro de Custo */}
          <div className="form-group mb-4">
            <label htmlFor="centroDeCusto" className="block text-lg">
              Centro de Custo:
            </label>
            <input
              type="text"
              id="centroDeCusto"
              name="centroDeCusto"
              value={formData.centroDeCusto}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required={comodatoType === "proprietario"}
            />
          </div>

          {/* Setor (ReadOnly) */}
          <div className="form-group mb-4">
            <label htmlFor="setor" className="block text-lg">
              Setor:
            </label>
            <input
              type="text"
              id="setor"
              name="setor"
              value={formData.setor}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled
            />
          </div>

          {/* Usuário */}
          <div className="form-group mb-4">
            <label htmlFor="usuario" className="block text-lg">
              Usuário:
            </label>
            <input
              type="text"
              id="usuario"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Patrimônio */}
          <div className="form-group mb-4">
            <label htmlFor="patrimonio" className="block text-lg">
              Patrimônio:
            </label>
            <input
              type="text"
              id="patrimonio"
              name="patrimonio"
              value={formData.patrimonio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Termos de acordo */}
          <div className="form-group mb-4 flex items-center">
            <input
              type="checkbox"
              id="agreement"
              checked={isAgreed}
              onChange={handleAgreementChange}
              className="mr-2"
            />
            <label htmlFor="agreement" className="text-lg">
              Eu li e concordo com os termos e condições
            </label>
          </div>

          {/* Submit */}
          <div className="form-group">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>

        {/* Mensagem de erro */}
        {errorMessage && (
          <div className="error-message text-red-500 text-center mt-4">
            {errorMessage}
          </div>
        )}

        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="success-message text-green-500 text-center mt-4">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comodato;
