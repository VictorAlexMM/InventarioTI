import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUpload, faEdit, faTimes, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import centroDeCusto from '../data/centrosDeCusto.json';
import { getCookie } from '../utils/cookieUtils';
import moment from 'moment'; 
import axios from 'axios';

function Estoque() {
    const [estoque, setEstoque] = useState([]);;
    const [isAdding, setIsAdding] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [downloadOption, setDownloadOption] = useState('completo');
    const [newEstoque, setNewEstoque] = useState({
      Patrimonio: '',
      empresa: '',
      setor: '',
      centroDeCusto: '',
      tipo: '',
      marca: '',
      modelo: '',
      office: '',
      compartilhada: 'Não',
      usuarios: '',
      planta: '',
      tipoCompra: '',
      fornecedor: '',
      nf: '',
      dataNf: '',
      valorUnitario: '',
      dataRecebimento: '',
      chamadoFiscal: '',
      dataEntradaFiscal: '',
      chamadoNext: '',
      dataNext: '',
      entradaContabil: '',
      garantia: '',
      comodato: 'Não',
      criadoPor: '',  
      alteradoPor: '',
      dataCriacao: '',
      dataModificacao: '',
      dataNextDesmobilizado: '',
      Observacao: '',
      ChamadoSolicitacao: ''
  });
  const [csvFile, setCsvFile] = useState(null);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'Patrimonio', direction: 'asc' });
  const [sortCriteria, setSortCriteria] = useState('dataCriacao');
  const [sortOrder, setSortOrder] = useState('asc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [username, setUsername] = useState('');
  const [pdfUrl, setPdfUrl] = useState(''); 
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [plants, setPlants] = useState([]);
  const [selectedPlanta, setSelectedPlanta] = useState('');

  useEffect(() => {
      const fetchPlants = async () => {
          try {
              const response = await axios.get('http://mao-s038:3003/dashboard/plantas');
              setPlants(response.data);
          } catch (error) {
              console.error('Erro ao buscar plantas:', error);
          }
      };
      fetchPlants();
  }, []);

  useEffect(() => {
      const loggedUser  = localStorage.getItem('loggedUser ');
      if (loggedUser ) {
          try {
              const user = JSON.parse(loggedUser );
              setUsername(user.username);
              setNewEstoque((prevState) => ({ ...prevState, criadoPor: user.username }));
          } catch (error) {
              console.error('Erro ao analisar loggedUser :', error);
          }
      }
  }, []);
    const handleExport = async () => {
      setIsExporting(true);
      try {
        const response = await axios.get('http://mao-s038:3003/inventario');
        const data = response.data;
        const filteredData = data.filter(item => {
          const createdAt = moment(item.dataCriacao);
          return createdAt.isBetween(startDate, endDate, 'day', '[]');
        });
        const csvData = filteredData.map(item => {
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
            DataNF: moment(item.dataNf).format('DD/MM/YYYY'),
            ValorUnitario: item.valorUnitario,
            DataRecebimento: moment(item.dataRecebimento).format('DD/MM/YYYY'),
            ChamadoFiscal: item.chamadoFiscal,
            DataEntradaFiscal: moment(item.dataEntradaFiscal).format('DD/MM/YYYY'),
            ChamadoNext: item.chamadoNext,
            DataNext: moment(item.dataNext).format('DD/MM/YYYY'),
            EntradaContabil: item.entradaContabil,
            Garantia: item.garantia,
            Comodato: item.comodato,
            CriadoPor: item.criadoPor,
            AlteradoPor: item.alteradoPor,
            DataCriacao: moment(item.dataCriacao).format('DD/MM/YYYY'),
            DataModificacao: moment(item.dataModificacao).format('DD/MM/YYYY'),
            DataNextDesmobilizado: moment(item.dataNextDesmobilizado).format('DD/MM/YYYY'), // New field
            Observacao: item.Observacao, // New field
            ChamadoSolicitacao: item.ChamadoSolicitacao // New field
          };
        });
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'estoque.csv';
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(error);
      } finally {
        setIsExporting(false);
      }
    };
    
    const filteredEstoque = estoque.filter(item =>
        item.Patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.centroDeCusto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.planta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.usuarios.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortData = (data, criteria, order) => {
      return data.slice().sort((a, b) => {
        if (criteria === 'dataCriacao' || criteria === 'dataModificacao') {
          const dateA = new Date(a[criteria]);
          const dateB = new Date(b[criteria]);
          return order === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (criteria === 'Patrimonio') {
          const PatrimonioA = a[criteria].toUpperCase();
          const PatrimonioB = b[criteria].toUpperCase();
          return order === 'asc' ? PatrimonioA.localeCompare(PatrimonioB) : PatrimonioB.localeCompare(PatrimonioA);
        }
        return 0;
      });
    };


    const handleDownload = async () => {
      if (!selectedPlanta) {
        alert('Por favor, selecione uma planta antes de baixar.');
        return;
      }
    
      try {
        if (downloadOption === 'completo') {
          await downloadFilledCSV(selectedPlanta); // Passa a planta selecionada
        } else if (downloadOption === 'periodo') {
          if (!startDate || !endDate) {
            alert('Por favor, preencha as datas inicial e final.');
            return;
          }
    
          // Verifica se as datas estão corretas
          if (moment(startDate).isAfter(moment(endDate))) {
            alert('A data inicial não pode ser posterior à data final.');
            return;
          }
    
          await downloadByPeriod(selectedPlanta, startDate, endDate); // Passa a planta e as datas
        }
      } catch (error) {
        console.error('Erro ao realizar o download:', error);
        alert('Ocorreu um erro ao tentar realizar o download. Por favor, tente novamente.');
      } finally {
        setIsExporting(false);
      }
    };
    
    const downloadByPeriod = async (planta, startDate, endDate) => {
      try {
        const response = await axios.get('http://mao-s038:3003/inventario/exportar', {
          params: {
            planta: planta,
            startDate: startDate,
            endDate: endDate
          }
        });
    
        const data = response.data;
        console.log('Dados retornados da API:', data);
    
        // Filtra os dados baseado nas datas de criação e na planta
        const filteredData = data.filter(item => {
          const createdAt = moment(item.dataCriacao); // A data de criação do item
          const isInDateRange = createdAt.isBetween(moment(startDate), moment(endDate), 'day', '[]');
          const isInSelectedPlanta = item.planta === planta; // Verifica se a planta do item é a selecionada
    
          return isInDateRange && isInSelectedPlanta; // Retorna true se estiver dentro do intervalo e na planta selecionada
        });
    
        if (filteredData.length === 0) {
          alert('Nenhum dado encontrado para o período e planta selecionados.');
          return;
        }
    
        const csvData = filteredData.map(item => ({
          Patrimonio: item.Patrimonio,
          Empresa: item.empresa,
          Setor: item.setor,
          CentroDeCusto: item.centroDeCusto,
          Tipo: item.tipo,
          Marca: item.marca,
          Modelo: item.modelo,
          Office: item.office,
          Compartilhada: item.compartilhada ? 'Sim' : 'Não',
          Usuarios: item.usuarios,
          Planta: item.planta,
          TipoCompra: item.tipoCompra,
          Fornecedor: item.fornecedor,
          NF: item.nf,
          DataNF: moment(item.dataNf).format('YYYY/MM/DD'), 
          ValorUnitario: item.valorUnitario,
          DataRecebimento: moment(item.dataRecebimento).format('YYYY/MM/DD'), 
          ChamadoFiscal: item.chamadoFiscal,
          DataEntradaFiscal: moment(item.dataEntradaFiscal).format('YYYY/MM/DD'), 
          ChamadoNext: item.chamadoNext,
          DataNext: moment(item.dataNext).format('YYYY/MM/DD'), 
          EntradaContabil: item.entradaContabil,
          Garantia: item.garantia,
          Comodato: item.comodato,
          CriadoPor: item.criadoPor,
          AlteradoPor: item.alteradoPor,
          DataCriacao: moment(item.dataCriacao).format('YYYY/MM/DD'), 
          DataModificacao: moment(item.dataModificacao).format('YYYY/MM/DD'),
          dataNextDesmobilizado:moment(item.dataNextDesmobilizado).format('DD/MM/YYYY'),
          Observacao:item.Observacao,
          ChamadoSolicitacao:item.ChamadoSolicitacao
        }));
    
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'estoque.csv';
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erro ao baixar os dados por período:', error);
        alert('Ocorreu um erro ao tentar baixar os dados por período. Por favor, tente novamente.');
      } finally {
        setIsExporting(false);
      }
    };
    
    const sortedData = React.useMemo(() => {
      let sortableItems = [...filteredEstoque];
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sortableItems;
    }, [filteredEstoque, sortConfig]);

    useEffect(() => {
      const setor = centroDeCusto[newEstoque.centroDeCusto] || '';
      setNewEstoque(prevState => ({ ...prevState, setor }));
    }, [newEstoque.centroDeCusto]);

    const getEstoque = async () => {
      try {
          const response = await axios.get('http://mao-s038:3003/inventario');
          setEstoque(response.data);
      } catch (error) {
          console.error('Erro ao obter os dados:', error);
      }
  };

  useEffect(() => {
      getEstoque();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Verifica se o campo é 'criadoPor' e não atualiza se for
    if (name !== 'criadoPor') {
        // Atualiza o estado com base no tipo do campo
        setNewEstoque(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value // Se for checkbox, usa checked, caso contrário, usa value
        }));
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const existeResponse = await axios.get(`http://mao-s038:3003/inventario/existe/${newEstoque.Patrimonio}`); // Mantenha 'Patrimonio'
            if (existeResponse.data.existe && editingIndex === null) {
                alert('Erro: Patrimônio já existe.');
                return;
            }
    
            const compartilhada = newEstoque.compartilhada === 'Sim' ? 'Sim' : 'Não';
            const comodato = newEstoque.comodato === 'Sim' ? 'Sim' : 'Não';
            const method = editingIndex !== null ? 'put' : 'post';
            const url = editingIndex !== null ? `http://mao-s038:3003/inventario/${newEstoque.Patrimonio}` : 'http://mao-s038:3003/inventario'; // Mantenha 'Patrimonio'
    
            const data = {
                ...newEstoque,
                compartilhada: compartilhada,
                criadoPor: username,
                comodato: comodato,
                alteradoPor: username,
            };
    
        // Format dates as needed
        if (data.dataNf) data.dataNf = moment(data.dataNf).format('YYYY-MM-DD');
        if (data.dataRecebimento) data.dataRecebimento = moment(data.dataRecebimento).format('YYYY-MM-DD');
        if (data.dataEntradaFiscal) data.dataEntradaFiscal = moment(data.dataEntradaFiscal).format('YYYY-MM-DD');
        if (data.dataNext) data.dataNext = moment(data.dataNext).format('YYYY-MM-DD');
        if (data.dataNextDesmobilizado) data.dataNextDesmobilizado = moment(data.dataNextDesmobilizado).format('YYYY-MM-DD');
    
        if (data.valorUnitario === '') {
          data.valorUnitario = null;
        }
    
        const response = await axios[method](url, data);
        alert(response.data.message);
        setNewEstoque({});
        setIsAdding(false);
        getEstoque();
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Patrimônio já existe no inventário.';
        alert(errorMessage);
      }
    };

    // Função para editar um item
    const handleEdit = (patrimonio) => {
        const itemToEdit = estoque.find(item => item.Patrimonio === patrimonio);
        if (itemToEdit) {
            setNewEstoque({ ...itemToEdit });
            setEditingIndex(patrimonio); // Mantenha o patrimônio como referência
            setIsAdding(true);
        } else {
            alert('Item não encontrado para edição.');
        }
    };

    const handleFileChange = (e) => {
      setCsvFile(e.target.files[0]);
    };

    const handleImport = async (e) => {
      e.preventDefault();
    
      if (!csvFile) {
        alert('Por favor, selecione um arquivo CSV.');
        return;
      }
    
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const csvData = results.data;
      
          const formattedData = [];
          for (const item of csvData) {
            const setor = centroDeCusto[item['Centro de Custo']] || '';
            const dataNfIso = item['Data NF'] ? moment(item['Data NF'], 'DD/MM/YYYY', true).toISOString() : '';
            const dataRecebimentoIso = item['Data Recebimento'] ? moment(item['Data Recebimento'], 'DD/MM/YYYY', true).toISOString() : '';
            const dataEntradaFiscalIso = item['Data Entrada Fiscal'] ? moment(item['Data Entrada Fiscal'], 'DD/MM/YYYY', true).toISOString() : '';
            const dataNextIso = item['Data Next'] ? moment(item['Data Next'], 'DD/MM/YYYY', true).toISOString() : '';
            const dataNextDesmobilizadoIso = item['Data Next Desmobilizado'] ? moment(item['Data Next Desmobilizado'], 'DD/MM/YYYY', true).toISOString() : '';
          
            if (item.Patrimônio && item.Empresa && setor && item['Centro de Custo']) {
              formattedData.push({
                Patrimonio: item.Patrimonio || '',
                empresa: item.Empresa || '',
                setor: setor,
                centroDeCusto: item['Centro de Custo'] || '',
                tipo: item.Tipo || '',
                marca: item.Marca || '',
                modelo: item.Modelo || '',
                office: item.Office || '',
                compartilhada: item.Compartilhada === 'Sim' ? 'Sim' : 'Não',
                usuarios: item.Usuários || '',
                planta: item.Planta || '',
                tipoCompra: item['Tipo Compra'] || '',
                fornecedor: item.Fornecedor || '',
                nf: item.NF || '',
                dataNf: dataNfIso,
                valorUnitario: item['Valor Unitário'] || '',
                dataRecebimento: dataRecebimentoIso,
                chamadoFiscal: item['Chamado Fiscal'] || '',
                dataEntradaFiscal: dataEntradaFiscalIso,
                chamadoNext: item['Chamado Next'] || '',
                dataNext: dataNextIso,
                entradaContabil: item['Entrada Contábil'] || '',
                garantia: item.Garantia || '',
                comodato: item.Comodato === 'Sim' ? 'Sim' : 'Não',
                criadoPor: '',
                alteradoPor: getCookie('username') || '',
                dataModificacao: '',
                dataNextDesmobilizado: dataNextDesmobilizadoIso, // New field
                Observacao: item.Observacao || '', // New field
                ChamadoSolicitacao: item.ChamadoSolicitacao || '' // New field
              });
            } else {
              alert('Erro: Dados inválidos. Por favor, verifique os dados e tente novamente.');
              return;
            }
          }
    
          try {
            const response = await axios.post('http://mao-s038:3003/inventario/importar', formattedData);
            alert('Dados importados com sucesso!');
            getEstoque();
          } catch (error) {
            if (error.response) {
              alert(`Erro ${error.response.status}: ${error.response.data.message}`);
            } else {
              alert('Erro ao importar os dados. Por favor, tente novamente.');
            }
          }
        },
        error: (error) => {
          alert('Erro ao importar o arquivo CSV.');
        }
      });
    };
    
    const downloadExampleCSV = () => {
      const csvHeader = [
        'Patrimônio', 'Empresa', 'Setor', 'Centro de Custo', 'Tipo', 'Marca', 'Modelo',
        'Office', 'Compartilhada', 'Usuários', 'Planta', 'Tipo Compra', 'Fornecedor',
        'NF', 'Data NF', 'Valor Unitário', 'Data Recebimento', 'Chamado Fiscal',
        'Data Entrada Fiscal', 'Chamado Next', 'Data Next', 'Entrada Contábil', 'Garantia','Comodato',
        'Data Next Desmobilizado','Observação','ChamadoSolicitacao'
      ].map(header => `"${header}"`).join(',') + '\n';

      const csvContent = csvHeader;

      const encodedUri = encodeURI(`data:text/csv;charset=utf-8,\uFEFF${csvContent}`);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "exemplo_inventário.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const checkPDFExists = async (Patrimonio) => {
      try {
          const response = await fetch(`http://mao-s038:3003/check-pdfs/${Patrimonio}`);
          const text = await response.text(); // Lê a resposta como texto
          const data = JSON.parse(text); // Tente analisar como JSON
          return data.exists; 
      } catch (error) {
          console.error('Erro ao verificar PDF:', error);
          alert('Erro ao verificar PDF. Tente novamente mais tarde.');
          return false;
      }
  };
  
  const viewPDF = async (Patrimonio) => {
    
    // Verifica se o PDF existe
    const pdfExists = await checkPDFExists(Patrimonio);
    
    if (!pdfExists) {
        alert('PDF não encontrado.');
        return;
    }

    try {
        const response = await fetch(`http://mao-s038:3003/comodato/pdf/${Patrimonio}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url); // Define a URL do PDF
            setIsPdfModalOpen(true); // Abre o modal
        } else {
            throw new Error('Erro ao carregar o PDF.');
        }
    } catch (error) {
        console.error('Erro ao visualizar PDF:', error);
        alert('Erro ao visualizar PDF. Verifique se o arquivo existe.');
    }
};

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    setPdfUrl(''); // Limpa a URL do PDF
};
  const downloadFilledCSV = () => {
    if (estoque.length === 0) {
      alert('Não há dados preenchidos para exportar.');
      return;
    }

    // Filtra o estoque pela planta selecionada
    const filteredEstoque = estoque.filter(item => item.planta === selectedPlanta);
    
    if (filteredEstoque.length === 0) {
      alert('Não há dados preenchidos para a planta selecionada.');
      return;
    }

    const csvHeader = [
      'Patrimônio', 'Empresa', 'Setor', 'Centro de Custo', 'Tipo', 'Marca', 'Modelo',
      'Office', 'Compartilhada', 'Usuários', 'Planta', 'Tipo Compra', 'Fornecedor',
      'NF', 'Data NF', 'Valor Unitário', 'Data Recebimento', 'Chamado Fiscal',
      'Data Entrada Fiscal', 'Chamado Next', 'Data Next', 'Entrada Contábil', 'Garantia', 'Comodato', 'Data Criação', 'Data Modificação',
      'Data Next Desmobilizado','Observação','ChamadoSolicitacao'
    ].map(header => `"${header}"`).join(',') + '\n';

    const csvRows = filteredEstoque.map(item =>
      [
        item.Patrimonio, item.empresa, item.setor, item.centroDeCusto, item.tipo,
        item.marca, item.modelo, item.office, item.compartilhada ? 'Sim' : 'Não',
        item.usuarios, item.planta, item.tipoCompra, item.fornecedor, item.nf,
        moment(item.dataNf).format('YYYY-MM-DD'), item.valorUnitario,
        moment(item.dataRecebimento).format('YYYY-MM-DD'), item.chamadoFiscal,
        moment(item.dataEntradaFiscal).format('YYYY-MM-DD'), item.chamadoNext,
        moment(item.dataNext).format('YYYY-MM-DD'), item.entradaContabil,
        item.garantia, item.comodato ? 'Sim' : 'Não',
        moment(item.dataCriacao).format('YYYY-MM-DD'), moment(item.dataModificacao).format('YYYY-MM-DD'),
        moment(item.dataNextDesmobilizado).format('YYYY-MM-DD'),item.Observacao
      ].map(value => `"${(value !== undefined && value !== null ? value : '').toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    const encodedUri = encodeURI(`data:text/csv;charset=utf-8,\uFEFF${csvContent}`);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventário.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

    const resetNewEstoque = () => {
  setNewEstoque({
        Patrimonio: '',
        empresa: '',
        setor: '',
        centroDeCusto: '',
        tipo: '',
        marca: '',
        modelo: '',
        office: '',
        compartilhada: false,
        usuarios: '',
        planta: '',
        tipoCompra: '',
        fornecedor: '',
        nf: '',
        dataNf: '',
        valorUnitario: '',
        dataRecebimento: '',
        chamadoFiscal: '',
        dataEntradaFiscal: '',
        chamadoNext: '',
        dataNext: '',
        entradaContabil: '',
        garantia: '',
        comodato: false,
        criadoPor: username,
        alteradoPor:'',
        dataCriacao: '',
        dataModificacao: '',
        dataNextDesmobilizado:'',
        observacao:'',
        ChamadoSolicitacao:''
      });
      setIsAdding(false);
    };

    const now = new Date().toISOString();

    const formatDate = (date) => {
      return moment(date).format('DD-MM-YYYY');
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl text-black mb-4">Inventário</h1>
            <div className="flex gap-2 mb-4">
                <input
                    className='border rounded p-2 flex-grow'
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar"
                />
                <button type="button" className="bg-green-500 text-white px-4 py-2 rounded" onClick={() => setIsImporting(true)}>
                    <FontAwesomeIcon icon={faUpload} /> Importar CSV
                </button>
                <button type="button" className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={() => setIsExporting(true)}>
                    Exportar CSV
                </button>
                <button type="button" className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => {
                    resetNewEstoque();
                    setEditingIndex(null);
                    setIsAdding(true);
                }}>
                    <FontAwesomeIcon icon={faPlus} /> Adicionar Item
                </button>
            </div>
            <div className="overflow-x-auto bg-gray-100 rounded">
    <table className="min-w-full border-collapse table-fixed">
        <thead>
            <tr className="bg-gray-200">
                <th className="border px-2 py-1 cursor-pointer text-sm" style={{ width: '5%' }} onClick={() => { setSortCriteria('Patrimonio'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Patrimônio {sortCriteria === 'Patrimonio' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Empresa</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Setor</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Centro de Custo</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Tipo</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Marca</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Modelo</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Office</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Compartilhada</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Usuários</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Planta</th>
                <th className="border px-2 py-1 cursor-pointer text-sm" style={{ width: '5%' }} onClick={() => { setSortCriteria('dataCriacao'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Data Criação {sortCriteria === 'dataCriacao' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Data Modificação</th>
                <th className="border px-2 py-1 text-sm" style={{ width: '5%' }}>Ações</th>
            </tr>
        </thead>
        <tbody>
            {sortData(filteredEstoque, sortCriteria, sortOrder).map((item, index) => (
                <React.Fragment key={index}>
                    <tr className="border-b">
                        <td className="border px-2 py-1 text-sm">{item.Patrimonio}</td>
                        <td className="border px-2 py-1 text-sm">{item.empresa}</td>
                        <td className="border px-2 py-1 text-sm">{item.setor}</td>
                        <td className="border px-2 py-1 text-sm">{item.centroDeCusto}</td>
                        <td className="border px-2 py-1 text-sm">{item.tipo}</td>
                        <td className="border px-2 py-1 text-sm">{item.marca}</td>
                        <td className="border px-2 py-1 text-sm">{item.modelo}</td>
                        <td className="border px-2 py-1 text-sm">{item.office}</td>
                        <td className="border px-2 py-1 text-sm">{item.compartilhada === 'Sim' ? 'Sim' : 'Não'}</td>
                        <td className="border px-2 py-1 text-sm">{item.usuarios}</td>
                        <td className="border px-2 py-1 text-sm">{item.planta}</td>
                        <td className="border px-2 py-1 text-sm">{formatDate(item.dataCriacao)}</td>
                        <td className="border px-2 py-1 text-sm">{item.dataModificacao ? formatDate(item.dataModificacao) : '-'}</td>
                        <td className="border px-2 py-1 text-sm">
                        <button className="text-blue-500" onClick={() => handleEdit(item.Patrimonio)}>
                            <FontAwesomeIcon icon={faEdit} />
                        </button>
                            <button className="text-gray-500" onClick={() => setIsCollapsibleOpen(index === isCollapsibleOpen ? null : index)}>
                                <FontAwesomeIcon icon={isCollapsibleOpen === index ? faChevronUp : faChevronDown} />
                            </button>
                        </td>
                    </tr>
                {isCollapsibleOpen === index && (
                                    <tr>
                                        <td colSpan="14">
                                            <div className="bg-gray-700 text-white p-4 rounded">
                                                <p><strong>Detalhes Adicionais:</strong></p>
                                                <table className="w-full">
                                                    <tbody>
                                                        <tr>
                                                            <td><strong>Tipo Compra:</strong></td>
                                                            <td>{item.tipoCompra}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Fornecedor:</strong></td>
                                                            <td>{item.fornecedor}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>NF:</strong></td>
                                                            <td>{item.nf}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Data NF:</strong></td>
                                                            <td>{formatDate(item.dataNf)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Valor Unitário:</strong></td>
                                                            <td>{item.valorUnitario}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Data Recebimento:</strong></td>
                                                            <td>{formatDate(item.dataRecebimento)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Chamado Fiscal:</strong></td>
                                                            <td>{item.chamadoFiscal}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Data Entrada Fiscal:</strong></td>
                                                            <td>{formatDate(item.dataEntradaFiscal)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Chamado Next:</strong></td>
                                                            <td>{item.chamadoNext}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Chamado:</strong></td>
                                                            <td>{item.ChamadoSolicitacao}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Data Next:</strong></td>
                                                            <td>{formatDate(item.dataNext)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Data Next Desmobilização:</strong></td>
                                                            <td>{formatDate(item.dataNextDesmobilizado)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Entrada Contábil:</strong></td>
                                                            <td>{item.entradaContabil}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Garantia:</strong></td>
                                                            <td>{item.garantia}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Comodato:</strong></td>
                                                            <td>
                                                                <button 
                                                                    onClick={() => viewPDF(item.Patrimonio)} 
                                                                    disabled={loadingPDF} 
                                                                    className="bg-gray-300 text-black px-2 py-1 rounded"
                                                                >
                                                                    {loadingPDF ? 'Carregando...' : `Visualizar PDF (${item.Patrimonio}.pdf)`}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Criado Por:</strong></td>
                                                            <td>{item.criadoPor[0]}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Alterado Por:</strong></td>
                                                            <td>{item.alteradoPor}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Data de Criação:</strong></td>
                                                            <td>{formatDate(item.dataCriacao)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Data de Modificação:</strong></td>
                                                            <td>{item.dataModificacao ? formatDate(item.dataModificacao) : '-'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Observação:</strong></td>
                                                            <td>{item.Observacao}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {isPdfModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-4 rounded shadow-lg">
                        <span className="cursor-pointer float-right" onClick={closePdfModal}>&times;</span>
                        <iframe src={pdfUrl} className="w-full h-96 border-none"></iframe>
                    </div>
                </div>
            )}
{isAdding && (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
        <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-5xl">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Patrimônio */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Patrimônio*</label>
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

                {/* Empresa */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Empresa*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Setor</label>
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
                    <label className="text-sm font-semibold text-gray-700">Centro de Custo*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Tipo*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Marca*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Modelo*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Office*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Compartilhada*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Usuários*</label>
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
                    <label className="text-sm font-semibold text-gray-700">Planta</label>
                    <select
                        name="planta"
                        value={newEstoque.planta}
                        onChange={(e) => setNewEstoque({ ...newEstoque, planta: e.target.value })}
                        className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        <option value="">Selecione uma planta</option>
                        {plants.map((planta, index) => (
                            <option key={index} value={planta.planta}>{planta.planta}</option>
                        ))}
                    </select>
                </div>

                {/* Tipo Compra */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Tipo Compra</label>
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
                    <label className="text-sm font-semibold text-gray-700">Fornecedor</label>
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
                    <label className="text-sm font-semibold text-gray-700">NF</label>
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
                    <label className="text-sm font-semibold text-gray-700">Data NF</label>
                    <input
                        type="date"
                        name="dataNf"
                        value={moment(newEstoque.dataNf).format('YYYY-MM-DD')}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Valor Unitário */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Valor Unitário</label>
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
                    <label className="text-sm font-semibold text-gray-700">Data Recebimento</label>
                    <input
                        type="date"
                        name="dataRecebimento"
                        value={moment(newEstoque.dataRecebimento).format('YYYY-MM-DD')}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Chamado Fiscal */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Chamado Fiscal</label>
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
                    <label className="text-sm font-semibold text-gray-700">Data Entrada Fiscal</label>
                    <input
                        type="date"
                        name="dataEntradaFiscal"
                        value={moment(newEstoque.dataEntradaFiscal).format('YYYY-MM-DD')}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Chamado */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Chamado</label>
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
                    <label className="text-sm font-semibold text-gray-700">Chamado Next</label>
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
                    <label className="text-sm font-semibold text-gray-700">Data Next Mobilização</label>
                    <input
                        type="date"
                        name="dataNext"
                        value={moment(newEstoque.dataNext).format('YYYY-MM-DD')}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Data Next Desmobilizado */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Data Next Desmobilizado</label>
                    <input
                        type="date"
                        name="dataNextDesmobilizado"
                        value={moment(newEstoque.dataNextDesmobilizado).format('YYYY-MM-DD')}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md p-2 mt-1 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                {/* Entrada Contábil */}
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700">Entrada Contábil</label>
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
                    <label className="text-sm font-semibold text-gray-700">Garantia</label>
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
                    <label className="text-sm font-semibold text-gray-700">Observação</label>
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
                    <button type="submit" className="bg-green-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-600 focus:ring-2 focus:ring-green-400 transition-all">
                        {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
                    </button>
                    <button type="button" className="bg-red-500 text-white px-6 py-3 rounded-md shadow-md hover:bg-red-600 focus:ring-2 focus:ring-red-400 transition-all" onClick={() => setIsAdding(false)}>
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
                            <select onChange={(e) => setDownloadOption(e.target.value)} value={downloadOption} className="border rounded p-2 w-full">
                                <option value="completo">Completo</option>
                                <option value="periodo">Por Período</option>
                            </select>
                        </label>
                        <label className="block mb-2">
                            Selecionar Planta:
                            <select onChange={(e) => setSelectedPlanta(e.target.value)} value={selectedPlanta} className="border rounded p-2 w-full">
                                <option value="">Selecione uma planta</option>
                                {plants.map((planta, index) => (
                                    <option key={index} value={planta.planta}>{planta.planta}</option>
                                ))}
                            </select>
                        </label>
                        {downloadOption === 'periodo' && (
                            <div>
                                <label className="block mb-2">
                                    Data Inicial:
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded p-2 w-full" />
                                </label>
                                <label className="block mb-2">
                                    Data Final:
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded p-2 w-full" />
                                </label>
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <button onClick={handleDownload} disabled={!selectedPlanta || (downloadOption === 'periodo' && (!startDate || !endDate))} className="bg-blue-500 text-white px-4 py-2 rounded">
                                Baixar
                            </button>
                            <button onClick={() => setIsExporting(false)} className="bg-red-500 text-white px-4 py-2 rounded">Cancelar</button>
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
                                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Importar</button>
                                <button type="button" className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => setIsImporting(false)}>Cancelar</button>
                                <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded" onClick={downloadExampleCSV}>
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