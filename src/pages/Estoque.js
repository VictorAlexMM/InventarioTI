import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUpload,
  faEdit,
  faTimes,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import Papa from "papaparse";
import centroDeCusto from "../data/centrosDeCusto.json";
import { getCookie } from "../utils/cookieUtils";
import moment from "moment";
import axios from "axios";

function Estoque() {
  const [estoque, setEstoque] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [downloadOption, setDownloadOption] = useState("completo");
  const [newEstoque, setNewEstoque] = useState({
    Patrimonio: "",
    empresa: "",
    setor: "",
    centroDeCusto: "",
    tipo: "",
    marca: "",
    modelo: "",
    office: "",
    compartilhada: "Não",
    usuarios: "",
    planta: "",
    tipoCompra: "",
    fornecedor: "",
    nf: "",
    dataNf: "",
    valorUnitario: "",
    dataRecebimento: "",
    chamadoFiscal: "",
    dataEntradaFiscal: "",
    chamadoNext: "",
    dataNext: "",
    entradaContabil: "",
    garantia: "",
    comodato: "Não",
    criadoPor: "",
    alteradoPor: "",
    dataCriacao: "",
    dataModificacao: "",
    dataNextDesmobilizado: "",
    Observacao: "",
    ChamadoSolicitacao: "",
  });
  const [csvFile, setCsvFile] = useState(null);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "patrimonio",
    direction: "asc",
  });
  const [sortCriteria, setSortCriteria] = useState("dataCriacao");
  const [sortOrder, setSortOrder] = useState("asc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [username, setUsername] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [plants, setPlants] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState("");

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await axios.get(
          "http://mao-s038:4001/dashboard/plantas"
        );
        setPlants(response.data);
      } catch (error) {
        console.error("Erro ao buscar plantas:", error);
      }
    };
    fetchPlants();
  }, []);

  useEffect(() => {
    const loggedUser = localStorage.getItem("loggedUser  ");
    if (loggedUser) {
      try {
        const user = JSON.parse(loggedUser);
        setUsername(user.username);
        setNewEstoque((prevState) => ({
          ...prevState,
          criadoPor: user.username,
        }));
      } catch (error) {
        console.error("Erro ao analisar loggedUser  :", error);
      }
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get("http://mao-s038:4001/inventario");
      const data = response.data;
      const filteredData = data.filter((item) => {
        const createdAt = moment(item.dataCriacao);
        return createdAt.isBetween(startDate, endDate, "day", "[]");
      });
      const csvData = filteredData.map((item) => {
        return {
          Patrimonio: item.Patrimonio,
          Empresa: item.empresa,
          Setor: item.setor,
          CentroDeCusto: item.centroDeCusto,
          Tipo: item.tipo,
          Marca: item.marca,
          Modelo: item.modelo,
          Office: item.office,
          Compartilhada: item.compartilhada,
          Usuarios: item.usuarios,
          Planta: item.planta,
          TipoCompra: item.tipoCompra,
          Fornecedor: item.fornecedor,
          NF: item.nf,
          DataNF: moment(item.dataNf).format("DD/MM/YYYY"),
          ValorUnitario: item.valorUnitario,
          DataRecebimento: moment(item.dataRecebimento).format("DD/MM/YYYY"),
          ChamadoFiscal: item.chamadoFiscal,
          DataEntradaFiscal: moment(item.dataEntradaFiscal).format(
            "DD/MM/YYYY"
          ),
          ChamadoNext: item.chamadoNext,
          DataNext: moment(item.dataNext).format("DD/MM/YYYY"),
          EntradaContabil: item.entradaContabil,
          Garantia: item.garantia,
          Comodato: item.comodato,
          CriadoPor: item.criadoPor,
          AlteradoPor: item.alteradoPor,
          DataCriacao: moment(item.dataCriacao).format("DD/MM/YYYY"),
          DataModificacao: moment(item.dataModificacao).format("DD/MM/YYYY"),
          DataNextDesmobilizado: moment(item.dataNextDesmobilizado).format(
            "DD/MM/YYYY"
          ), // New field
          Observacao: item.Observacao, // New field
          ChamadoSolicitacao: item.ChamadoSolicitacao, // New field
        };
      });
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "estoque.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredEstoque = estoque.filter(
    (item) =>
      item.Patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.centroDeCusto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.planta.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.usuarios.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortData = (data, criteria, order) => {
    return data.slice().sort((a, b) => {
      if (criteria === "dataCriacao" || criteria === "dataModificacao") {
        const dateA = new Date(a[criteria]);
        const dateB = new Date(b[criteria]);
        return order === "asc" ? dateA - dateB : dateB - dateA;
      } else if (criteria === "patrimonio") {
        const patrimonioA = a[criteria].toUpperCase();
        const patrimonioB = b[criteria].toUpperCase();
        return order === "asc"
          ? patrimonioA.localeCompare(patrimonioB)
          : patrimonioB.localeCompare(patrimonioA);
      }
      return 0;
    });
  };

  const handleDownload = async () => {
    if (!selectedPlanta) {
      alert("Por favor, selecione uma planta antes de baixar.");
      return;
    }

    try {
      if (downloadOption === "completo") {
        await downloadFilledCSV(selectedPlanta); // Passa a planta selecionada
      } else if (downloadOption === "periodo") {
        if (!startDate || !endDate) {
          alert("Por favor, preencha as datas inicial e final.");
          return;
        }

        // Verifica se as datas estão corretas
        if (moment(startDate).isAfter(moment(endDate))) {
          alert("A data inicial não pode ser posterior à data final.");
          return;
        }

        await downloadByPeriod(selectedPlanta, startDate, endDate); // Passa a planta e as datas
      }
    } catch (error) {
      console.error("Erro ao realizar o download:", error);
      alert(
        "Ocorreu um erro ao tentar realizar o download. Por favor, tente novamente."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const downloadByPeriod = async (planta, startDate, endDate) => {
    try {
      // Cria os parâmetros para a requisição. Se a opção for "Todas as Plantas",
      // não enviamos o parâmetro 'planta' para a API.
      const params = { startDate, endDate };
      if (planta !== "Todas as Plantas") {
        params.planta = planta;
      }

      const response = await axios.get(
        "http://mao-s038:4001/inventario/exportar",
        { params }
      );

      const data = response.data;
      console.log("Dados retornados da API:", data);

      // Filtra os dados pela data e, caso não seja "Todas as Plantas", também filtra pela planta.
      const filteredData = data.filter((item) => {
        const createdAt = moment(item.dataCriacao);
        const isInDateRange = createdAt.isBetween(
          moment(startDate),
          moment(endDate),
          "day",
          "[]"
        );
        const isInSelectedPlanta =
          planta === "Todas as Plantas" || item.planta === planta;

        return isInDateRange && isInSelectedPlanta;
      });

      if (filteredData.length === 0) {
        alert("Nenhum dado encontrado para o período e planta selecionados.");
        return;
      }

      const csvData = filteredData.map((item) => ({
        Patrimonio: item.Patrimonio,
        Empresa: item.empresa,
        Setor: item.setor,
        CentroDeCusto: item.centroDeCusto,
        Tipo: item.tipo,
        Marca: item.marca,
        Modelo: item.modelo,
        Office: item.office,
        Compartilhada: item.compartilhada ? "Sim" : "Não",
        Usuarios: item.usuarios,
        Planta: item.planta,
        TipoCompra: item.tipoCompra,
        Fornecedor: item.fornecedor,
        NF: item.nf,
        DataNF: moment(item.dataNf).format("YYYY/MM/DD"),
        ValorUnitario: item.valorUnitario,
        DataRecebimento: moment(item.dataRecebimento).format("YYYY/MM/DD"),
        ChamadoFiscal: item.chamadoFiscal,
        DataEntradaFiscal: moment(item.dataEntradaFiscal).format("YYYY/MM/DD"),
        ChamadoNext: item.chamadoNext,
        DataNext: moment(item.dataNext).format("YYYY/MM/DD"),
        EntradaContabil: item.entradaContabil,
        Garantia: item.garantia,
        Comodato: item.comodato,
        CriadoPor: item.criadoPor,
        AlteradoPor: item.alteradoPor,
        DataCriacao: moment(item.dataCriacao).format("YYYY/MM/DD"),
        DataModificacao: moment(item.dataModificacao).format("YYYY/MM/DD"),
        DataNextDesmobilizado: moment(item.dataNextDesmobilizado).format(
          "DD/MM/YYYY"
        ),
        Observacao: item.Observacao,
        ChamadoSolicitacao: item.ChamadoSolicitacao,
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "estoque.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar os dados por período:", error);
      alert(
        "Ocorreu um erro ao tentar baixar os dados por período. Por favor, tente novamente."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredEstoque];
    sortableItems.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
    return sortableItems;
  }, [filteredEstoque, sortConfig]);

  useEffect(() => {
    const setor = centroDeCusto[newEstoque.centroDeCusto] || "";
    setNewEstoque((prevState) => ({ ...prevState, setor }));
  }, [newEstoque.centroDeCusto]);

  const getEstoque = async () => {
    try {
      const response = await axios.get("http://mao-s038:4001/inventario");
      setEstoque(response.data);
    } catch (error) {
      console.error("Erro ao obter os dados:", error);
    }
  };

  useEffect(() => {
    getEstoque();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name !== "criadoPor") {
      if (name === "compartilhada" || name === "comodato") {
        setNewEstoque((prev) => ({ ...prev, [name]: value }));
      } else {
        setNewEstoque((prev) => ({
          ...prev,
          [name]: type === "checkbox" ? checked : value,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Corrigido aqui
    console.log("Dados a serem enviados:", newEstoque);
    try {
      const existeResponse = await axios.get(
        `http://mao-s038:4001/inventario/existe/${newEstoque.Patrimonio}`
      );
      if (existeResponse.data.existe && editingIndex === null) {
        alert("Erro: Patrimônio já existe.");
        return;
      }

      const compartilhada = newEstoque.compartilhada === "Sim" ? "Sim" : "Não";
      const comodato = newEstoque.comodato === "Sim" ? "Sim" : "Não";
      const method = editingIndex !== null ? "put" : "post";
      const url =
        editingIndex !== null
          ? `http://mao-s038:4001/inventario/${newEstoque.Patrimonio}`
          : "http://mao-s038:4001/inventario";

      const data = {
        ...newEstoque,
        compartilhada: compartilhada,
        comodato: comodato,
      };

      const response = await axios[method](url, data);
      alert(response.data.message);
      setNewEstoque({});
      setIsAdding(false);
      getEstoque();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Erro ao enviar os dados.";
      alert(errorMessage);
    }
  };
  const handleEdit = (patrimonio) => {
    const itemToEdit = estoque.find((item) => item.Patrimonio === patrimonio);
    if (itemToEdit) {
      setNewEstoque(itemToEdit);
      setEditingIndex(patrimonio); // Você pode armazenar o patrimônio ou um índice, dependendo de como você deseja gerenciar isso
      setIsAdding(true);
      setNewEstoque((prevState) => ({ ...prevState, alteradoPor: username }));
    }
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleImport = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      alert("Por favor, selecione um arquivo CSV.");
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const csvData = results.data;

        const formattedData = [];
        for (const [index, item] of csvData.entries()) {
          const errors = [];

          // Validação dos campos obrigatórios
          if (!item.Patrimônio) errors.push("Patrimônio");
          if (!item.Empresa) errors.push("Empresa");
          if (!item["Centro de Custo"]) errors.push("Centro de Custo");

          // Validação de datas (opcional, mas precisa estar no formato correto se preenchida)
          if (
            item["Data NF"] &&
            !moment(item["Data NF"], "DD/MM/YYYY", true).isValid()
          ) {
            errors.push("Data NF (formato inválido)");
          }

          // Validação de campos específicos (Compartilhada, Office, Usuários)
          const validValues = ["sim", "não", "na"];
          const isValidValue = (value) =>
            validValues.includes(value?.toLowerCase());

          if (item.Compartilhada && !isValidValue(item.Compartilhada)) {
            errors.push("Compartilhada (valores permitidos: Sim, Não ou NA)");
          }

          if (item.Office && !isValidValue(item.Office)) {
            errors.push("Office (valores permitidos: Sim, Não ou NA)");
          }

          if (item.Usuários && !isValidValue(item.Usuários)) {
            errors.push("Usuários (valores permitidos: Sim, Não ou NA)");
          }

          // Se houver erros, exibe o alerta e indica qual linha foi afetada
          if (errors.length > 0) {
            alert(
              `Erro na linha ${
                index + 1
              }: Campos inválidos ou ausentes - ${errors.join(", ")}`
            );
            return;
          }

          // Transformação dos dados para o formato esperado
          const setor = centroDeCusto[item["Centro de Custo"]] || "";
          const dataNfIso = item["Data NF"]
            ? moment(item["Data NF"], "DD/MM/YYYY", true).toISOString()
            : "";

          formattedData.push({
            patrimonio: item.Patrimônio || "",
            empresa: item.Empresa || "",
            setor: setor,
            centroDeCusto: item["Centro de Custo"] || "",
            tipo: item.Tipo || "",
            marca: item.Marca || "",
            modelo: item.Modelo || "",
            office: item.Office?.toLowerCase() === "sim" ? "Sim" : "Não",
            compartilhada:
              item.Compartilhada?.toLowerCase() === "sim" ? "Sim" : "Não",
            usuarios: item.Usuários?.toLowerCase() === "sim" ? "Sim" : "Não",
            planta: item.Planta || "",
            tipoCompra: item["Tipo Compra"] || "",
            fornecedor: item.Fornecedor || "",
            nf: item.NF || "",
            dataNf: dataNfIso,
            valorUnitario: item["Valor Unitário"]
              ? parseFloat(item["Valor Unitário"].replace(",", "."))
              : "",
            dataRecebimento: "",
            chamadoFiscal: item["Chamado Fiscal"] || "",
            dataEntradaFiscal: "",
            chamadoNext: item["Chamado Next"] || "",
            dataNext: "",
            entradaContabil: item["Entrada Contábil"] || "",
            garantia: item.Garantia || "",
            comodato: item.Comodato?.toLowerCase() === "sim" ? "Sim" : "Não",
            criadoPor: getCookie("username") || "",
            alteradoPor: getCookie("username") || "",
            dataModificacao: "",
            dataNextDesmobilizado: "",
            Observacao: item.Observacao || "",
            ChamadoSolicitacao: item.ChamadoSolicitacao || "",
          });
        }

        try {
          const response = await axios.post(
            "http://mao-s038:4001/inventario/importar",
            formattedData
          );
          alert("Dados importados com sucesso!");
          setIsImporting(false);
          getEstoque();
        } catch (error) {
          if (error.response) {
            alert(
              `Erro ${error.response.status}: ${error.response.data.message}`
            );
          } else {
            alert("Erro ao importar os dados. Por favor, tente novamente.");
          }
        }
      },
      error: (error) => {
        alert("Erro ao importar o arquivo CSV.");
      },
    });
  };

  const downloadExampleCSV = () => {
    const csvHeader =
      [
        "Patrimônio",
        "Empresa",
        "Setor",
        "Centro de Custo",
        "Tipo",
        "Marca",
        "Modelo",
        "Office",
        "Compartilhada",
        "Usuários",
        "Planta",
        "Tipo Compra",
        "Fornecedor",
        "NF",
        "Data NF",
        "Valor Unitário",
        "Data Recebimento",
        "Chamado Fiscal",
        "Data Entrada Fiscal",
        "Chamado Next",
        "Data Next",
        "Entrada Contábil",
        "Garantia",
        "Comodato",
        "Data Next Desmobilizado",
        "Observação",
        "ChamadoSolicitacao",
      ]
        .map((header) => `"${header}"`)
        .join(",") + "\n";

    const csvContent = csvHeader;

    const encodedUri = encodeURI(
      `data:text/csv;charset=utf-8,\uFEFF${csvContent}`
    );
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "exemplo_inventário.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checkPDFExists = async (patrimonio) => {
    try {
      const response = await fetch(
        `http://mao-s038:4001/check-pdfs/${patrimonio}`
      );
      const text = await response.text();
      const data = JSON.parse(text);
      return data.exists;
    } catch (error) {
      console.error("Erro ao verificar PDF:", error);
      alert("Erro ao verificar PDF. Tente novamente mais tarde.");
      return false;
    }
  };

  const viewPDF = async (patrimonio) => {
    const pdfExists = await checkPDFExists(patrimonio);

    if (!pdfExists) {
      alert("PDF não encontrado.");
      return;
    }

    try {
      const response = await fetch(
        `http://mao-s038:4001/comodato/pdf/${patrimonio}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        setIsPdfModalOpen(true);
      } else {
        throw new Error("Erro ao carregar o PDF.");
      }
    } catch (error) {
      console.error("Erro ao visualizar PDF:", error);
      alert("Erro ao visualizar PDF. Verifique se o arquivo existe.");
    }
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    setPdfUrl("");
  };

  const downloadFilledCSV = () => {
    if (estoque.length === 0) {
      alert("Não há dados preenchidos para exportar.");
      return;
    }

    const filteredEstoque = estoque.filter(
      (item) =>
        selectedPlanta === "Todas as Plantas" || item.planta === selectedPlanta
    );

    if (filteredEstoque.length === 0) {
      alert("Não há dados preenchidos para a planta selecionada.");
      return;
    }

    const csvHeader =
      [
        "Patrimônio",
        "Empresa",
        "Setor",
        "Centro de Custo",
        "Tipo",
        "Marca",
        "Modelo",
        "Office",
        "Compartilhada",
        "Usuários",
        "Planta",
        "Tipo Compra",
        "Fornecedor",
        "NF",
        "Data NF",
        "Valor Unitário",
        "Data Recebimento",
        "Chamado Fiscal",
        "Data Entrada Fiscal",
        "Chamado Next",
        "Data Next",
        "Entrada Contábil",
        "Garantia",
        "Comodato",
        "Data Criação",
        "Data Modificação",
        "Data Next Desmobilizado",
        "Observação",
        "ChamadoSolicitacao",
      ]
        .map((header) => `"${header}"`)
        .join(",") + "\n";

    const csvRows = filteredEstoque
      .map((item) =>
        [
          item.Patrimonio,
          item.empresa,
          item.setor,
          item.centroDeCusto,
          item.tipo,
          item.marca,
          item.modelo,
          item.office,
          item.compartilhada ? "Sim" : "Não",
          item.usuarios,
          item.planta,
          item.tipoCompra,
          item.fornecedor,
          item.nF,
          moment(item.dataNf).format("YYYY-MM-DD"),
          item.valorUnitario,
          moment(item.dataRecebimento).format("YYYY-MM-DD"),
          item.chamadoFiscal,
          moment(item.dataEntradaFiscal).format("YYYY-MM-DD"),
          item.chamadoNext,
          moment(item.dataNext).format("YYYY-MM-DD"),
          item.entradaContabil,
          item.garantia,
          item.comodato ? "Sim" : "Não",
          moment(item.dataCriacao).format("YYYY-MM-DD"),
          moment(item.dataModificacao).format("YYYY-MM-DD"),
          moment(item.dataNextDesmobilizado).format("YYYY-MM-DD"),
          item.Observacao,
        ]
          .map(
            (value) =>
              `"${(value !== undefined && value !== null ? value : "")
                .toString()
                .replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const csvContent = csvHeader + csvRows;

    const encodedUri = encodeURI(
      `data:text/csv;charset=utf-8,\uFEFF${csvContent}`
    );
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventário.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetNewEstoque = () => {
    setNewEstoque({
      patrimonio: "",
      empresa: "",
      setor: "",
      centroDeCusto: "",
      tipo: "",
      marca: "",
      modelo: "",
      office: "",
      compartilhada: false,
      usuarios: "",
      planta: "",
      tipoCompra: "",
      fornecedor: "",
      nf: "",
      dataNf: "",
      valorUnitario: "",
      dataRecebimento: "",
      chamadoFiscal: "",
      dataEntradaFiscal: "",
      chamadoNext: "",
      dataNext: "",
      entradaContabil: "",
      garantia: "",
      comodato: false,
      criadoPor: username,
      alteradoPor: "",
      dataCriacao: "",
      dataModificacao: "",
      dataNextDesmobilizado: "",
      observacao: "",
      ChamadoSolicitacao: "",
    });
    setIsAdding(false);
  };

  const now = new Date().toISOString();

  const formatDate = (date) => {
    return moment(date).format("DD-MM-YYYY");
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Defina quantos itens por página

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortData(filteredEstoque, sortCriteria, sortOrder).slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl text-black mb-4">Inventário</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded p-2 flex-grow"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar"
        />
        <button
          type="button"
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => setIsImporting(true)}
        >
          <FontAwesomeIcon icon={faUpload} /> Importar CSV
        </button>
        <button
          type="button"
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={() => setIsExporting(true)}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => {
            resetNewEstoque();
            setEditingIndex(null);
            setIsAdding(true);
          }}
        >
          <FontAwesomeIcon icon={faPlus} /> Adicionar Item
        </button>
      </div>
      <div className="overflow-x-auto bg-gray-100 rounded">
        <table className="min-w-full border-collapse table-auto text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th
                className="border px-1 py-1 cursor-pointer"
                onClick={() => {
                  setSortCriteria("Patrimonio");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                Patrimônio{" "}
                {sortCriteria === "Patrimonio" &&
                  (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th className="border px-1 py-1 hidden sm:table-cell">Empresa</th>
              <th className="border px-1 py-1 hidden md:table-cell">Setor</th>
              <th className="border px-1 py-1 hidden lg:table-cell">
                Centro de Custo
              </th>
              <th className="border px-1 py-1">Tipo</th>
              <th className="border px-1 py-1 hidden lg:table-cell">Marca</th>
              <th className="border px-1 py-1 hidden lg:table-cell">Modelo</th>
              <th className="border px-1 py-1 hidden xl:table-cell">Office</th>
              <th className="border px-1 py-1 hidden xl:table-cell">
                Compartilhada
              </th>
              <th className="border px-1 py-1 hidden sm:table-cell">
                Usuários
              </th>
              <th className="border px-1 py-1 hidden md:table-cell">Planta</th>
              <th
                className="border px-1 py-1 cursor-pointer"
                onClick={() => {
                  setSortCriteria("dataCriacao");
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                }}
              >
                Data Criação{" "}
                {sortCriteria === "dataCriacao" &&
                  (sortOrder === "asc" ? "▲" : "▼")}
              </th>
              <th className="border px-1 py-1 hidden lg:table-cell">
                Data Modificação
              </th>
              <th className="border px-1 py-1">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <React.Fragment key={index}>
                <tr className="border-b hover:bg-gray-100">
                  <td className="border px-1 py-1 break-words">
                    {item.Patrimonio}
                  </td>
                  <td className="border px-1 py-1 break-words hidden sm:table-cell">
                    {item.empresa}
                  </td>
                  <td className="border px-1 py-1 break-words hidden md:table-cell">
                    {item.setor}
                  </td>
                  <td className="border px-1 py-1 break-words hidden lg:table-cell">
                    {item.centroDeCusto}
                  </td>
                  <td className="border px-1 py-1 break-words">{item.tipo}</td>
                  <td className="border px-1 py-1 break-words hidden lg:table-cell">
                    {item.marca}
                  </td>
                  <td className="border px-1 py-1 break-words hidden lg:table-cell">
                    {item.modelo}
                  </td>
                  <td className="border px-1 py-1 break-words hidden xl:table-cell">
                    {item.office}
                  </td>
                  <td className="border px-1 py-1 break-words hidden xl:table-cell">
                    {item.compartilhada === "Sim" ? "Sim" : "Não"}
                  </td>
                  <td className="border px-1 py-1 break-words hidden sm:table-cell">
                    {item.usuarios}
                  </td>
                  <td className="border px-1 py-1 break-words hidden md:table-cell">
                    {item.planta}
                  </td>
                  <td className="border px-1 py-1 break-words">
                    {formatDate(item.dataCriacao)}
                  </td>
                  <td className="border px-1 py-1 break-words hidden lg:table-cell">
                    {item.dataModificacao
                      ? formatDate(item.dataModificacao)
                      : "-"}
                  </td>
                  <td className="border px-1 py-1 flex items-center justify-between space-x-2">
                    <button
                      className="text-blue-500"
                      onClick={() => handleEdit(item.Patrimonio)}
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="text-gray-500"
                      onClick={() =>
                        setIsCollapsibleOpen(
                          index === isCollapsibleOpen ? null : index
                        )
                      }
                    >
                      <FontAwesomeIcon
                        icon={
                          isCollapsibleOpen === index
                            ? faChevronUp
                            : faChevronDown
                        }
                      />
                    </button>
                  </td>
                </tr>
                {isCollapsibleOpen === index && (
                  <tr>
                    <td colSpan="14">
                      <div className="bg-gray-700 text-white p-4 rounded-md shadow-sm">
                        <p className="text-lg font-semibold mb-3">
                          Detalhes Adicionais
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Tipo Compra:
                            </span>{" "}
                            {item.tipoCompra || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Fornecedor:
                            </span>{" "}
                            {item.fornecedor || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">NF:</span>{" "}
                            {item.nf || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Data NF:
                            </span>{" "}
                            {item.dataNf ? formatDate(item.dataNf) : "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Valor Unitário:
                            </span>{" "}
                            {item.valorUnitario || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Data Recebimento:
                            </span>{" "}
                            {item.dataRecebimento
                              ? formatDate(item.dataRecebimento)
                              : "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Chamado Fiscal:
                            </span>{" "}
                            {item.chamadoFiscal || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Data Entrada Fiscal:
                            </span>{" "}
                            {item.dataEntradaFiscal
                              ? formatDate(item.dataEntradaFiscal)
                              : "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Chamado Next:
                            </span>{" "}
                            {item.chamadoNext || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Chamado:
                            </span>{" "}
                            {item.ChamadoSolicitacao || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Data Next:
                            </span>{" "}
                            {item.dataNext ? formatDate(item.dataNext) : "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Data Next Desmobilização:
                            </span>{" "}
                            {item.dataNextDesmobilizado
                              ? formatDate(item.dataNextDesmobilizado)
                              : "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Entrada Contábil:
                            </span>{" "}
                            {item.entradaContabil || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Garantia:
                            </span>{" "}
                            {item.garantia || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Comodato:
                            </span>
                            <button
                              onClick={() => viewPDF(item.Patrimonio)}
                              disabled={loadingPDF}
                              className="bg-gray-300 text-black px-2 py-1 rounded hover:bg-gray-400 ml-2"
                            >
                              {loadingPDF
                                ? "Carregando..."
                                : `PDF (${item.Patrimonio}.pdf)`}
                            </button>
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Criado Por:
                            </span>{" "}
                            {item.criadoPor[0] || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Alterado Por:
                            </span>{" "}
                            {item.alteradoPor || "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Data de Criação:
                            </span>{" "}
                            {item.dataCriacao
                              ? formatDate(item.dataCriacao)
                              : "-"}
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Data de Modificação:
                            </span>{" "}
                            {item.dataModificacao
                              ? formatDate(item.dataModificacao)
                              : "-"}
                          </div>
                          <div
                            className="border p-2 rounded-lg bg-gray-800 max-w-full"
                            style={{
                              wordWrap: "break-word",
                              whiteSpace: "pre-wrap", // para preservar quebras de linha
                            }}
                          >
                            <span className="font-bold text-gray-300">
                              Observação:
                            </span>{" "}
                            {item.Observacao || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 gap-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Anterior
        </button>
        <div className="flex items-center">
          {currentPage > 3 && (
            <>
              <button
                className="px-3 py-1 mx-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              <span className="mx-1">...</span>
            </>
          )}
          {Array.from(
            {
              length: Math.min(
                5,
                Math.ceil(filteredEstoque.length / itemsPerPage)
              ),
            },
            (_, i) => {
              const page = currentPage - 2 + i;
              if (
                page > 0 &&
                page <= Math.ceil(filteredEstoque.length / itemsPerPage)
              ) {
                return (
                  <button
                    key={page}
                    className={`px-3 py-1 mx-1 ${
                      currentPage === page
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 hover:bg-gray-400"
                    } rounded`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              }
              return null;
            }
          )}
          {currentPage <
            Math.ceil(filteredEstoque.length / itemsPerPage) - 2 && (
            <>
              <span className="mx-1">...</span>
              <button
                className="px-3 py-1 mx-1 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() =>
                  handlePageChange(
                    Math.ceil(filteredEstoque.length / itemsPerPage)
                  )
                }
              >
                {Math.ceil(filteredEstoque.length / itemsPerPage)}
              </button>
            </>
          )}
        </div>
        <button
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50 hover:bg-gray-400"
          disabled={
            currentPage === Math.ceil(filteredEstoque.length / itemsPerPage)
          }
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Próximo
        </button>
      </div>

      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <span
              className="cursor-pointer float-right"
              onClick={closePdfModal}
            >
              &times;
            </span>
            <iframe src={pdfUrl} className="w-full h-96 border-none"></iframe>
          </div>
        </div>
      )}
      {isAdding && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-5xl">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {/* Patrimônio */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Patrimônio*
                </label>
                <input
                  type="text"
                  name="patrimonio"
                  value={newEstoque.Patrimonio}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={editingIndex !== null}
                />
              </div>

              {/* Empresa */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Empresa*
                </label>
                <input
                  type="text"
                  name="empresa"
                  value={newEstoque.empresa}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Setor */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Setor
                </label>
                <input
                  type="text"
                  name="setor"
                  value={newEstoque.setor}
                  readOnly
                  className="border border-gray-300 rounded-md p-2 mt-1 bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Centro de Custo */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Centro de Custo*
                </label>
                <input
                  type="text"
                  name="centroDeCusto"
                  value={newEstoque.centroDeCusto}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Tipo */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Tipo*
                </label>
                <input
                  type="text"
                  name="tipo"
                  value={newEstoque.tipo}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Marca */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Marca*
                </label>
                <input
                  type="text"
                  name="marca"
                  value={newEstoque.marca}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Modelo */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Modelo*
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={newEstoque.modelo}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Office */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Office*
                </label>
                <input
                  type="text"
                  name="office"
                  value={newEstoque.office}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Compartilhada */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Compartilhada*
                </label>
                <select
                  name="compartilhada"
                  value={newEstoque.compartilhada}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              {/* Usuários */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Usuários*
                </label>
                <input
                  type="text"
                  name="usuarios"
                  value={newEstoque.usuarios}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Planta */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Planta
                </label>
                <select
                  name="planta"
                  value={newEstoque.planta}
                  onChange={(e) =>
                    setNewEstoque({ ...newEstoque, planta: e.target.value })
                  }
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Selecione uma planta</option>
                  <option value="Linhares">Linhares</option>
                  <option value="São Paulo">São Paulo</option>
                  <option value="Curitiba Matriz">Curitiba Matriz</option>
                  <option value="Curitiba Marechal">Curitiba Marechal</option>
                  <option value="Joinville Fabrica A1">
                    Joinville Fabrica A1
                  </option>
                  <option value="Joinville Fabrica A2">
                    Joinville Fabrica A2
                  </option>
                  <option value="Joinville Fabrica A3">
                    Joinville Fabrica A3
                  </option>
                  <option value="Joinville CD B1">Joinville CD B1</option>
                  <option value="Joinville CD B2">Joinville CD B2</option>
                  <option value="Joinville AG C1">Joinville AG C1</option>
                  <option value="MANAUS A1">MANAUS A1</option>
                  <option value="MANAUS A2">MANAUS A2</option>
                  <option value="MANAUS A3">MANAUS A3</option>
                  <option value="MANAUS B1">MANAUS B1</option>
                  <option value="MANAUS B2">MANAUS B2</option>
                  <option value="MANAUS B3">MANAUS B3</option>
                  <option value="MANAUS IMC">MANAUS IMC</option>
                  <option value="MANAUS IAC">MANAUS IAC</option>
                  <option value="Maringá">Maringá</option>
                </select>
              </div>

              {/* Tipo Compra */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Tipo Compra
                </label>
                <input
                  type="text"
                  name="tipoCompra"
                  value={newEstoque.tipoCompra}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Fornecedor */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Fornecedor
                </label>
                <input
                  type="text"
                  name="fornecedor"
                  value={newEstoque.fornecedor}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* NF */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  NF
                </label>
                <input
                  type="text"
                  name="nf"
                  value={newEstoque.nf}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Data NF */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data NF
                </label>
                <input
                  type="date"
                  name="dataNf"
                  value={moment(newEstoque.dataNf).format("YYYY-MM-DD")}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Valor Unitário */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Valor Unitário
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="valorUnitario"
                  value={newEstoque.valorUnitario}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Data Recebimento */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data Recebimento
                </label>
                <input
                  type="date"
                  name="dataRecebimento"
                  value={moment(newEstoque.dataRecebimento).format(
                    "YYYY-MM-DD"
                  )}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Chamado Fiscal */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Chamado Fiscal
                </label>
                <input
                  type="text"
                  name="chamadoFiscal"
                  value={newEstoque.chamadoFiscal}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Data Entrada Fiscal */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data Entrada Fiscal
                </label>
                <input
                  type="date"
                  name="dataEntradaFiscal"
                  value={moment(newEstoque.dataEntradaFiscal).format(
                    "YYYY-MM-DD"
                  )}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Chamado */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Chamado
                </label>
                <input
                  type="text"
                  name="ChamadoSolicitacao"
                  value={newEstoque.ChamadoSolicitacao}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Chamado Next */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Chamado Next
                </label>
                <input
                  type="text"
                  name="chamadoNext"
                  value={newEstoque.chamadoNext}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Data Next Mobilização */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data Next Mobilização
                </label>
                <input
                  type="date"
                  name="dataNext"
                  value={moment(newEstoque.dataNext).format("YYYY-MM-DD")}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Data Next Desmobilizado */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data Next Desmobilizado
                </label>
                <input
                  type="date"
                  name="dataNextDesmobilizado"
                  value={moment(newEstoque.dataNextDesmobilizado).format(
                    "YYYY-MM-DD"
                  )}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Entrada Contábil */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Entrada Contábil
                </label>
                <input
                  type="text"
                  name="entradaContabil"
                  value={newEstoque.entradaContabil}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Garantia */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Garantia
                </label>
                <input
                  type="text"
                  name="garantia"
                  value={newEstoque.garantia}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Observação */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Observação
                </label>
                <textarea
                  name="Observacao"
                  value={newEstoque.Observacao}
                  onChange={handleChange}
                  rows="2"
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4 mt-6 col-span-4">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-600 focus:ring-2 focus:ring-green-400 transition-all"
                >
                  {editingIndex !== null ? "Atualizar" : "Adicionar"}
                </button>
                <button
                  type="button"
                  className="bg-red-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-red-600 focus:ring-2 focus:ring-red-400 transition-all"
                  onClick={() => setIsAdding(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-md">
            <h2 className="text-lg font-bold mb-4">Exportar CSV</h2>
            <label className="block mb-2">
              Selecionar Opção de Download:
              <select
                onChange={(e) => setDownloadOption(e.target.value)}
                value={downloadOption}
                className="border rounded p-2 w-full"
              >
                <option value="completo">Completo</option>
                <option value="periodo">Por Período</option>
              </select>
            </label>
            <label className="block mb-2">
              Selecionar Planta:
              <select
                onChange={(e) => setSelectedPlanta(e.target.value)}
                value={selectedPlanta}
                className="border rounded p-2 w-full"
              >
                <option value="">Selecione uma planta</option>
                <option value="Todas as Plantas">Todas as Plantas</option>
                {plants.map((planta, index) => (
                  <option key={index} value={planta.planta}>
                    {planta.planta}
                  </option>
                ))}
              </select>
            </label>
            {downloadOption === "periodo" && (
              <div>
                <label className="block mb-2">
                  Data Inicial:
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border rounded p-2 w-full"
                  />
                </label>
                <label className="block mb-2">
                  Data Final:
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border rounded p-2 w-full"
                  />
                </label>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDownload}
                disabled={
                  !selectedPlanta ||
                  (downloadOption === "periodo" && (!startDate || !endDate))
                }
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Baixar
              </button>
              <button
                onClick={() => setIsExporting(false)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {isImporting && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 max-w-md">
            <form onSubmit={handleImport}>
              <h5 className="mb-4">
                Selecione o arquivo CSV:
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  required
                  className="border rounded p-2 w-full"
                />
              </h5>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Importar
                </button>
                <button
                  type="button"
                  className="bg-red-500 text-white px-4 py-2 rounded"
                  onClick={() => setIsImporting(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={downloadExampleCSV}
                >
                  Baixar Exemplo CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Estoque;
