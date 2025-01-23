import React, { useState, useEffect } from "react";
import centrosDeCusto from "../data/centrosDeCusto.json";

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

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch("http://mao-s038:3001/api/system-info");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const info = await response.json();

        setFormData((prevData) => ({
          ...prevData,
          patrimonio: info.hostname,
          usuario: info.accountName,
        }));
      } catch (error) {
        console.error("Failed to fetch system info:", error);
      }
    };

    fetchSystemInfo();
  }, []);

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

    if (!isAgreed) {
      alert(
        "Você deve concordar com as cláusulas antes de enviar o documento."
      );
      return;
    }

    const selectedPlants = Object.keys(selectedLocations).filter(
      (key) => selectedLocations[key]
    );
    if (selectedPlants.length === 0) {
      alert("Por favor, selecione ao menos uma planta.");
      return;
    }

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

    try {
      if (comodatoType === "emprestado") {
        alert("Comodato enviado com sucesso!");
        setLoading(false);
        return;
      }

      const response = await fetch("http://mao-s038:3003/comodato", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          planta: selectedPlants.join(", "),
          tipoComodato: comodatoType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}, Message: ${errorText}`
        );
      }

      const result = await response.json();
      alert("Comodato enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar o comodato:", error);
      setErrorMessage("Erro ao enviar o comodato. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-[120%] w-full p-6 bg-white border border-gray-300 rounded-lg shadow-lg">
        <h1 className="text-center text-2xl font-bold mb-6">
          COMODATO BRITÂNIA ELETRÔNICOS S.A
        </h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mt-4">CLÁUSULA 1° - Objeto:</h2>
          <p>
            1.1. Comodato do Direito de uso dos equipamentos mencionados no
            documento
          </p>
          <h2 className="text-lg font-semibold mt-4">
            CLÁUSULA 2° - Prazo de Duração
          </h2>
          <p>
            2.1. O prazo de duração do presente contrato é semelhante ao do
            contrato de trabalho ou de prestação do serviço firmado entre as
            partes, com início na data da assinatura do presente.
          </p>
          <h2 className="text-lg font-semibold mt-4">
            CLÁUSULA 3° - Das Responsabilidades dos Contratantes
          </h2>
          <p>
            3.1. Firmado o presente e na posse do equipamento, o COMODATÁRIO
            assume toda e qualquer responsabilidade pela conservação e guarda do
            equipamento que lhe é confiado.
          </p>
          <p>
            3.2. As manutenções de hardware, instalação de software e
            atualizações de sistema serão realizadas pela COMODANTE, a TI
            (Tecnologia da Informação).
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
            3.4. O valor de restituição conforme previsto na cláusula acima,
            será o valor da nota fiscal
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Tipo de Comodato:</label>
              <div className="flex items-center mb-2">
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
              <div className="flex items-center mb-2">
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

            {/* Campos do Formulário */}
            <div className="space-y-4">
              <div>
                <label htmlFor="nome" className="block mb-2">
                  Nome:
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required={comodatoType === "proprietario"}
                  className="border border-gray-300 rounded p-2 w-full"
                />
              </div>
              <div>
                <label htmlFor="matricula" className="block mb-2">
                  Matrícula:
                </label>
                <input
                  type="text"
                  id="matricula"
                  name="matricula"
                  value={formData.matricula}
                  onChange={handleChange}
                  required={comodatoType === "proprietario"}
                  className="border border-gray-300 rounded p-2 w-full"
                />
              </div>
              <div>
                <label className="block mb-2">Planta:</label>
                {["Joinville", "Manaus", "Curitiba", "Linhares"].map(
                  (location) => (
                    <div key={location} className="flex items-center mb-2">
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
                  )
                )}
              </div>
              <div>
                <label htmlFor="centroDeCusto" className="block mb-2">
                  Centro de Custo:
                </label>
                <input
                  type="text"
                  id="centroDeCusto"
                  name="centroDeCusto"
                  value={formData.centroDeCusto}
                  onChange={handleChange}
                  required={comodatoType === "proprietario"}
                  className="border border-gray-300 rounded p-2 w-full"
                />
              </div>
              <div>
                <label htmlFor="setor" className="block mb-2">
                  Setor:
                </label>
                <input
                  type="text"
                  id="setor"
                  name="setor"
                  value={formData.setor}
                  readOnly
                  className="border border-gray-300 rounded p-2 w-full"
                />
              </div>
              <div>
                <label htmlFor="patrimonio" className="block mb-2">
                  Patrimônio:
                </label>
                <input
                  type="text"
                  id="patrimonio"
                  name="patrimonio"
                  value={formData.patrimonio}
                  readOnly
                  className="border border-gray-300 rounded p-2 w-full"
                />
              </div>
              <div>
                <label htmlFor="usuario" className="block mb-2">
                  Usuário:
                </label>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  value={formData.usuario}
                  readOnly
                  className="border border-gray-300 rounded p-2 w-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="agreement"
                  checked={isAgreed}
                  onChange={handleAgreementChange}
                  required
                  className="mr-2"
                />
                <label htmlFor="agreement">
                  Ao enviar esse documento você concorda com as Cláusulas
                  citadas
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600 transition duration-300 w-full mt-4"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Comodato;
