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
  const userProfile = localStorage.getItem("userProfile") || "guest";
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
          "http://PC101961:4001/dashboard/plantas"
        );
        setPlants(response.data);
      } catch (error) {
        console.error("Erro ao buscar plantas:", error);
      }
    };
    fetchPlants();
  }, []);

  useEffect(() => {
    const loggedUser = localStorage.getItem("loggedUser");
    if (loggedUser) {
      try {
        const user = JSON.parse(loggedUser);
        setUsername(user.username);
        setNewEstoque((prevState) => ({
          ...prevState,
          criadoPor: user.username,
        }));
      } catch (error) {
        console.error("Erro ao analisar loggedUser:", error);
      }
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get("http://PC101961:4001/inventario");
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
          ),
          Observacao: item.Observacao,
          ChamadoSolicitacao: item.ChamadoSolicitacao,
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
      } else if (criteria === "Patrimonio") {
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

    setIsExporting(true);
    try {
      if (downloadOption === "completo") {
        await downloadByPeriod(selectedPlanta);
      } else if (downloadOption === "periodo") {
        if (!startDate || !endDate) {
          alert("Por favor, preencha as datas inicial e final.");
          return;
        }

        if (moment(startDate).isAfter(moment(endDate))) {
          alert("A data inicial não pode ser posterior à data final.");
          return;
        }

        await downloadByPeriod(selectedPlanta, startDate, endDate);
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
      const params = {};
      let filenamePrefix = "inventario";

      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
        filenamePrefix += `_${startDate}_ate_${endDate}`;
      } else {
        filenamePrefix += "_completo";
      }

      if (planta && planta !== "Todas as Plantas") {
        params.planta = planta;
        filenamePrefix += `_${planta}`;
      } else {
        params.planta = "Todas as Plantas";
        filenamePrefix += "_todas_plantas";
      }

      console.log("Parâmetros enviados para a API:", params);

      const response = await axios.get(
        "http://PC101961:4001/inventario/exportar",
        { params }
      );

      const estoque = response.data;

      console.log("Total de registros recebidos:", estoque.length);

      const registros2025 = estoque.filter(
        (item) => item.dataCriacao && item.dataCriacao.startsWith("2025")
      );
      console.log("Registros com Data Criação em 2025:", registros2025.length);
      console.log("Exemplo de registros de 2025:", registros2025.slice(0, 5));

      if (!estoque || estoque.length === 0) {
        alert("Não há dados disponíveis para os filtros selecionados.");
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

      const csvRows = estoque
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
            item.nf,
            item.dataNf || "",
            item.valorUnitario,
            item.dataRecebimento || "",
            item.chamadoFiscal,
            item.dataEntradaFiscal || "",
            item.chamadoNext,
            item.dataNext || "",
            item.entradaContabil,
            item.garantia,
            item.comodato ? "Sim" : "Não",
            item.dataCriacao || "",
            item.dataModificacao || "",
            item.dataNextDesmobilizado || "",
            item.Observacao || "",
            item.ChamadoSolicitacao,
          ]
            .map((value) => {
              let stringValue = (
                value !== undefined && value !== null ? value : ""
              ).toString();
              stringValue = stringValue.replace(/(\r\n|\n|\r)/g, " ");
              stringValue = stringValue.replace(/"/g, '""');
              return `"${stringValue}"`;
            })
            .join(",")
        )
        .join("\n");

      const csvContent = csvHeader + csvRows;

      const totalLines = csvContent.split("\n").length;
      console.log(
        "Total de linhas no CSV gerado (incluindo cabeçalho):",
        totalLines
      );
      console.log(
        "Total de registros no CSV (excluindo cabeçalho):",
        totalLines - 1
      );

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filenamePrefix}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar o inventário:", error);
      if (error.response && error.response.status === 404) {
        const message =
          error.response.data.message ||
          "Não há dados disponíveis para os filtros selecionados.";
        const totalRecords = error.response.data.totalRecordsInTable || 0;
        alert(`${message}\nTotal de registros na tabela: ${totalRecords}`);
      } else {
        alert(
          "Ocorreu um erro ao tentar baixar o inventário: " +
            (error.message || "Erro desconhecido")
        );
      }
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
      const response = await axios.get("http://PC101961:4001/inventario");
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
    e.preventDefault();
    if (userProfile === "aud") {
      alert("Você não tem permissão para adicionar ou editar itens.");
      return;
    }
    console.log("Dados a serem enviados:", newEstoque);
    try {
      const existeResponse = await axios.get(
        `http://PC101961:4001/inventario/existe/${newEstoque.Patrimonio}`
      );
      if (existeResponse.data.existe && editingIndex === null) {
        alert("Erro: Patrimônio já existe.");
        return;
      }

      const loggedUser = localStorage.getItem("loggedUser");
      let currentUser = "";
      if (loggedUser) {
        try {
          const user = JSON.parse(loggedUser);
          currentUser = user.username;
        } catch (error) {
          console.error("Erro ao analisar loggedUser:", error);
        }
      }

      const compartilhada = newEstoque.compartilhada === "Sim" ? "Sim" : "Não";
      const comodato = newEstoque.comodato === "Sim" ? "Sim" : "Não";
      const method = editingIndex !== null ? "put" : "post";
      const url =
        editingIndex !== null
          ? `http://PC101961:4001/inventario/${newEstoque.Patrimonio}`
          : "http://PC101961:4001/inventario";

      const data = {
        ...newEstoque,
        compartilhada: compartilhada,
        comodato: comodato,
        criadoPor: editingIndex === null ? currentUser : newEstoque.criadoPor,
        alteradoPor: editingIndex !== null ? currentUser : "",
        dataModificacao: editingIndex !== null ? new Date().toISOString() : "",
      };

      const response = await axios[method](url, data);
      alert(response.data.message);
      setNewEstoque({
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
        criadoPor: currentUser,
        alteradoPor: "",
        dataCriacao: "",
        dataModificacao: "",
        dataNextDesmobilizado: "",
        Observacao: "",
        ChamadoSolicitacao: "",
      });
      setIsAdding(false);
      setEditingIndex(null);
      getEstoque();
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Erro ao enviar os dados.";
      alert(errorMessage);
    }
  };

  const handleEdit = (patrimonio) => {
    if (userProfile === "aud") {
      alert("Você não tem permissão para editar itens.");
      return;
    }
    const itemToEdit = estoque.find((item) => item.Patrimonio === patrimonio);
    if (itemToEdit) {
      const loggedUser = localStorage.getItem("loggedUser");
      let currentUser = "";
      if (loggedUser) {
        try {
          const user = JSON.parse(loggedUser);
          currentUser = user.username;
        } catch (error) {
          console.error("Erro ao analisar loggedUser:", error);
        }
      }
      setNewEstoque({ ...itemToEdit, alteradoPor: currentUser });
      setEditingIndex(patrimonio);
      setIsAdding(true);
    }
  };

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (userProfile === "aud") {
      alert("Você não tem permissão para importar dados.");
      return;
    }

    if (!csvFile) {
      alert("Por favor, selecione um arquivo CSV.");
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const csvData = results.data;

        const loggedUser = localStorage.getItem("loggedUser");
        let currentUser = "";
        if (loggedUser) {
          try {
            const user = JSON.parse(loggedUser);
            currentUser = user.username;
          } catch (error) {
            console.error("Erro ao analisar loggedUser:", error);
          }
        }

        const formattedData = [];
        for (const [index, item] of csvData.entries()) {
          const errors = [];

          if (!item.Patrimônio) errors.push("Patrimônio");
          if (!item.Empresa) errors.push("Empresa");
          if (!item["Centro de Custo"]) errors.push("Centro de Custo");

          if (
            item["Data NF"] &&
            !moment(item["Data NF"], "DD/MM/YYYY", true).isValid()
          ) {
            errors.push("Data NF (formato inválido)");
          }

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

          if (errors.length > 0) {
            alert(
              `Erro na linha ${
                index + 1
              }: Campos inválidos ou ausentes - ${errors.join(", ")}`
            );
            return;
          }

          const setor = centroDeCusto[item["Centro de Custo"]] || "";
          const dataNfIso = item["Data NF"]
            ? moment(item["Data NF"], "DD/MM/YYYY", true).toISOString()
            : "";

          formattedData.push({
            Patrimonio: item.Patrimônio || "",
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
            criadoPor: currentUser,
            alteradoPor: "",
            dataModificacao: "",
            dataNextDesmobilizado: "",
            Observacao: item.Observacao || "",
            ChamadoSolicitacao: item.ChamadoSolicitacao || "",
          });
        }

        try {
          const response = await axios.post(
            "http://PC101961:4001/inventario/importar",
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
        `http://PC101961:4001/check-pdfs/${patrimonio}`
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
        `http://PC101961:4001/comodato/pdf/${patrimonio}`
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

  const handleComodatoSubmit = async (patrimonio) => {
    try {
      const response = await axios.post(
        "https://prod-11.brazilsouth.logic.azure.com:443/workflows/9f942c82d0ef4608873cc66bc4c2d72f/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=xLrzv-wH_Lri5pPnECHilOqHiCn22oqTJMuwYZUpwCs",
        { Patrimonio: patrimonio }
      );
      alert("Comodato enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar comodato:", error);
      alert("Erro ao enviar comodato. Tente novamente.");
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
          item.nf,
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
    const loggedUser = localStorage.getItem("loggedUser");
    let currentUser = "";
    if (loggedUser) {
      try {
        const user = JSON.parse(loggedUser);
        currentUser = user.username;
      } catch (error) {
        console.error("Erro ao analisar loggedUser:", error);
      }
    }
    setNewEstoque({
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
      criadoPor: currentUser,
      alteradoPor: "",
      dataCriacao: "",
      dataModificacao: "",
      dataNextDesmobilizado: "",
      Observacao: "",
      ChamadoSolicitacao: "",
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const now = new Date().toISOString();

  const formatDate = (date) => {
    return moment(date).format("DD-MM-YYYY");
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
        {userProfile !== "aud" && (
          <button
            type="button"
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={() => setIsImporting(true)}
          >
            <FontAwesomeIcon icon={faUpload} /> Importar CSV
          </button>
        )}
        <button
          type="button"
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={() => setIsExporting(true)}
        >
          Exportar CSV
        </button>
        {userProfile !== "aud" && (
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
        )}
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
                    {userProfile !== "aud" && (
                      <button
                        className="text-blue-500"
                        onClick={() => handleEdit(item.Patrimonio)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    )}
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
                            </span>{" "}
                            {item.comodato || "-"}
                            <button
                              onClick={() => viewPDF(item.Patrimonio)}
                              disabled={loadingPDF}
                              className="bg-gray-300 text-black px-2 py-1 rounded hover:bg-gray-400 ml-2"
                            >
                              {loadingPDF
                                ? "Carregando..."
                                : `PDF (${item.Patrimonio}.pdf)`}
                            </button>
                            <button
                              onClick={() =>
                                handleComodatoSubmit(item.Patrimonio)
                              }
                              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 ml-2"
                            >
                              Enviar Comodato
                            </button>
                          </div>
                          <div className="border p-2 rounded-lg bg-gray-800">
                            <span className="font-bold text-gray-300">
                              Criado Por:
                            </span>{" "}
                            {item.criadoPor || "-"}
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
                              whiteSpace: "pre-wrap",
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
              ×
            </span>
            <iframe src={pdfUrl} className="w-full h-96 border-none"></iframe>
          </div>
        </div>
      )}
      {isAdding && userProfile !== "aud" && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-5xl">
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Patrimônio*
                </label>
                <input
                  type="text"
                  name="Patrimonio"
                  value={newEstoque.Patrimonio}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                  disabled={editingIndex !== null}
                />
              </div>

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

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Centro de Custo*
                </label>
                <input
                  type="text"
                  name="centroDeCusto"
                  value={newEstoque.centroDeCusto}
                  onChange={handleChange}
                  required
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Tipo
                </label>
                <input
                  type="text"
                  name="tipo"
                  value={newEstoque.tipo}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Marca
                </label>
                <input
                  type="text"
                  name="marca"
                  value={newEstoque.marca}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Modelo
                </label>
                <input
                  type="text"
                  name="modelo"
                  value={newEstoque.modelo}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Office
                </label>
                <select
                  name="office"
                  value={newEstoque.office}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Selecione</option>
                  <option value="Sim">Sim</option>
                  <option value="Não">Não</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Compartilhada
                </label>
                <select
                  name="compartilhada"
                  value={newEstoque.compartilhada}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Usuários
                </label>
                <input
                  type="text"
                  name="usuarios"
                  value={newEstoque.usuarios}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Planta
                </label>
                <select
                  name="planta"
                  value={newEstoque.planta}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Selecione</option>
                  {plants.map((planta, index) => (
                    <option key={index} value={planta}>
                      {planta}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data NF
                </label>
                <input
                  type="date"
                  name="dataNf"
                  value={newEstoque.dataNf}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Valor Unitário
                </label>
                <input
                  type="number"
                  name="valorUnitario"
                  value={newEstoque.valorUnitario}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data Recebimento
                </label>
                <input
                  type="date"
                  name="dataRecebimento"
                  value={newEstoque.dataRecebimento}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

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

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data Entrada Fiscal
                </label>
                <input
                  type="date"
                  name="dataEntradaFiscal"
                  value={newEstoque.dataEntradaFiscal}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

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

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Data Next
                </label>
                <input
                  type="date"
                  name="dataNext"
                  value={newEstoque.dataNext}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

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

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Comodato
                </label>
                <select
                  name="comodato"
                  value={newEstoque.comodato}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Observação
                </label>
                <textarea
                  name="Observacao"
                  value={newEstoque.Observacao}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                ></textarea>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Chamado Solicitação
                </label>
                <input
                  type="text"
                  name="ChamadoSolicitacao"
                  value={newEstoque.ChamadoSolicitacao}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="col-span-full flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={resetNewEstoque}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all"
                >
                  {editingIndex !== null ? "Atualizar" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isImporting && userProfile !== "aud" && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Importar CSV</h2>
            <form onSubmit={handleImport}>
              <div className="flex flex-col mb-4">
                <label className="text-sm font-semibold text-gray-700 mb-2">
                  Selecione o arquivo CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="border border-gray-300 rounded-md p-2"
                />
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={downloadExampleCSV}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-all"
                >
                  Baixar Exemplo
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImporting(false)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all"
                  >
                    Importar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isExporting && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-md">
            <h2 className="text-xl font-semibold mb-4">Exportar CSV</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Planta
                </label>
                <select
                  value={selectedPlanta}
                  onChange={(e) => setSelectedPlanta(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">Selecione</option>
                  <option value="Todas as Plantas">Todas as Plantas</option>
                  {plants.map((planta, index) => (
                    <option key={index} value={planta}>
                      {planta}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700">
                  Tipo de Exportação
                </label>
                <select
                  value={downloadOption}
                  onChange={(e) => setDownloadOption(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="completo">Completo</option>
                  <option value="periodo">Por Período</option>
                </select>
              </div>
              {downloadOption === "periodo" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExporting(false)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-all"
                >
                  Exportar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Estoque;
