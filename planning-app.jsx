import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Filter, 
  ChevronDown, 
  Search,
  LayoutDashboard,
  Settings2,
  User,
  ClipboardList,
  MapPin,
  Clock4,
  Target,
  ArrowRight
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('planning'); // 'planning', 'meetings' ou 'audits'
  const [searchTerm, setSearchTerm] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('Todos');

  // Dados das Reuniões
  const [meetings, setMeetings] = useState([
    { id: 1, category: '1) Steering Commitee', type: 'Estratégica', responsible: 'TV', schedule: { 1: 'completed', 2: 'completed', 3: 'planned' } },
    { id: 2, category: "A) Revisão de Gestão - Ações anteriores", type: 'Revisão', responsible: 'MF', schedule: { 1: 'completed', 2: 'completed' } },
    { id: 3, category: "a1) PAC's - Monitoramento", type: 'Operacional', responsible: 'MF', schedule: {} },
    { id: 4, category: "a2) Eficácia Riscos/Oportunidades", type: 'Estratégica', responsible: 'MF', schedule: {} },
    { id: 5, category: "B) Revisão de Gestão - Mudanças", type: 'Revisão', responsible: 'MF', schedule: { 1: 'completed', 2: 'completed', 3: 'planned' } },
    { id: 6, category: "b1) Oportunidades de Melhoria", type: 'Qualidade', responsible: 'MF', schedule: {} },
    { id: 7, category: "b2) Suficiência de Recursos", type: 'Recursos', responsible: 'MF', schedule: {} },
    { id: 8, category: "2) Satisfação do Cliente", type: 'Cliente', responsible: 'MF', schedule: { 1: 'completed', 2: 'completed' } },
    { id: 9, category: "3) Objetivos da Qualidade - KPI's", type: 'Performance', responsible: 'MF', schedule: { 1: 'completed', 2: 'completed' } },
    { id: 10, category: "4) Auditoria Acompanhamento", type: 'Auditoria', responsible: 'MF', schedule: { 1: 'completed' } },
    { id: 11, category: "5) RNC's e Ações Corretivas", type: 'Qualidade', responsible: 'MF', schedule: { 1: 'completed', 2: 'planned' } },
    { id: 12, category: "6) Auditoria interna SGQA", type: 'Auditoria', responsible: 'MF', schedule: { 1: 'completed', 2: 'completed' } },
    { id: 13, category: "7) Avaliação Fornecedores (FastFer)", type: 'Suprimentos', responsible: 'MF', schedule: {} },
    { id: 14, category: "8) KOM Abertura - Histórico RNC", type: 'Qualidade', responsible: 'MF', schedule: { 1: 'planned' } },
    { id: 15, category: "9) Auditoria de Produto", type: 'Auditoria', responsible: 'MF', schedule: {} },
    { id: 16, category: "7) Auditoria externa SGQA - 1ª Fase", type: 'Auditoria', responsible: 'MF', schedule: { 1: 'completed' } },
    { id: 17, category: "9) Auditoria externa SGQA - 2ª Fase", type: 'Auditoria', responsible: 'MF', schedule: { 1: 'completed' } },
  ]);

  // Dados das Auditorias
  const audits = [
    { mes: "Abril", data: "14-abr.-26", hora: "10:30", local: "SOMENGIL", processo: "Compras", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Gabinete Compras", gestor: "Paulo Brioso", obs: "Auditoria Interna" },
    { mes: "Abril", data: "14-abr.-26", hora: "10:30", local: "SOMENGIL", processo: "Financeiro", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Gabinete Financeiro", gestor: "Lúcio Mota", obs: "Auditoria Interna" },
    { mes: "Abril", data: "14-abr.-26", hora: "11:30", local: "SOMENGIL", processo: "Logística Interna", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Armazém Logístico", gestor: "Carlos Tarenta", obs: "Auditoria Interna" },
    { mes: "Abril", data: "14-abr.-26", hora: "12:30", local: "SOMENGIL", processo: "Produção - Setor Montagem", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Chão de Fábrica", gestor: "Fábio Silva", obs: "Auditoria Interna" },
    { mes: "Abril", data: "14-abr.-26", hora: "15:00", local: "SOMENGIL", processo: "Pós Venda", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Gabinete de Pós-Venda", gestor: "Carina Robaina", obs: "Auditoria Interna" },
    { mes: "Abril", data: "15-abr.-26", hora: "10:45", local: "SOMENGIL", processo: "Comercial & Marketing", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Sala de Reuniões", gestor: "Tony Ventura", obs: "Auditoria Interna" },
    { mes: "Abril", data: "15-abr.-26", hora: "11:30", local: "SOMENGIL", processo: "Gestão de Negócio", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Sala de Reuniões", gestor: "Tony Ventura", obs: "Auditoria Interna" },
    { mes: "Abril", data: "15-abr.-26", hora: "10:00", local: "SOMENGIL", processo: "Gestão de Recursos", auditor: "Joni Regalado & Mário Fragoso", auditadoLocal: "Sala de Reuniões", gestor: "Tony Ventura", obs: "Auditoria Interna" },
    { mes: "Abril", data: "15-abr.-26", hora: "10:30", local: "SOMENGIL", processo: "SGQA", auditor: "Joni Regalado", auditadoLocal: "Gabinete Qualidade", gestor: "Mário Fragoso", obs: "Auditoria Interna" },
    { mes: "Abril", data: "15-abr.-26", hora: "11:30", local: "SOMENGIL", processo: "Engenharia", auditor: "Mário Fragoso", auditadoLocal: "Gabinete Qualidade", gestor: "Mário Fragoso", obs: "Auditoria Interna" },
    { mes: "Setembro", data: "-", hora: "14:00", local: "SOMENGIL", processo: "SGQA - Ambiental", auditor: "Ana Reis", auditadoLocal: "Sala de Reuniões", gestor: "Mário Fragoso", obs: "Auditoria Interna" },
    { mes: "Outubro", data: "-", hora: "9:00", local: "SOMENGIL", processo: "SGQA - Acompanhamento ISO 14001", auditor: "Eng.º Daniel Nunes", auditadoLocal: "Somengil", gestor: "Daniel Nunes", obs: "Auditoria Externa [APCER]" },
    { mes: "Outubro", data: "-", hora: "9:00", local: "SOMENGIL", processo: "SGQA - Renovação ISO 9001", auditor: "Eng.º Daniel Nunes", auditadoLocal: "Somengil", gestor: "Daniel Nunes", obs: "Auditoria Externa [APCER]" },
  ];

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const statusConfig = {
    completed: { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, label: 'REALIZADO', color: 'bg-green-100' },
    failed: { icon: <XCircle className="w-5 h-5 text-red-500" />, label: 'NÃO REALIZADO', color: 'bg-red-100' },
    planned: { icon: <Clock className="w-5 h-5 text-blue-500" />, label: 'PLANEADO', color: 'bg-blue-100' },
    none: { icon: <div className="w-5 h-5 border-2 border-dashed border-gray-200 rounded-full" />, label: 'VAZIO', color: 'bg-transparent' }
  };

  const responsibles = useMemo(() => {
    return ['Todos', ...new Set(meetings.map(m => m.responsible))];
  }, [meetings]);

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResp = responsibleFilter === 'Todos' || m.responsible === responsibleFilter;
    return matchesSearch && matchesResp;
  });

  const filteredAudits = audits.filter(a => 
    a.processo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.mes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (meetingId, monthIndex) => {
    setMeetings(prev => prev.map(m => {
      if (m.id === meetingId) {
        const current = m.schedule[monthIndex + 1];
        let next;
        if (!current) next = 'planned';
        else if (current === 'planned') next = 'completed';
        else if (current === 'completed') next = 'failed';
        else next = null;

        const newSchedule = { ...m.schedule };
        if (next) newSchedule[monthIndex + 1] = next;
        else delete newSchedule[monthIndex + 1];
        
        return { ...m, schedule: newSchedule };
      }
      return m;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutDashboard className="text-blue-600 w-8 h-8" />
              Portal de Gestão SGQA
            </h1>
            <p className="text-slate-500 mt-1">Plano Anual de Reuniões e Auditorias</p>
          </div>
          
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button 
              onClick={() => setActiveTab('planning')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'planning' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Target className="w-4 h-4" />
              Planeamento
            </button>
            <button 
              onClick={() => setActiveTab('meetings')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'meetings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Calendar className="w-4 h-4" />
              Reuniões
            </button>
            <button 
              onClick={() => setActiveTab('audits')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'audits' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Auditorias
            </button>
          </div>
        </header>

        {/* Global Search & Context Filters */}
        {activeTab !== 'planning' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder={activeTab === 'meetings' ? "Pesquisar reunião..." : "Pesquisar processo ou mês..."}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {activeTab === 'meetings' && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm"
                  value={responsibleFilter}
                  onChange={(e) => setResponsibleFilter(e.target.value)}
                >
                  {responsibles.map(r => <option key={r} value={r}>Responsável: {r}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              </div>
            )}

            <div className={`flex items-center ${activeTab === 'meetings' ? 'justify-end' : 'md:col-span-2 justify-end'}`}>
              <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-slate-200">
                <Settings2 className="w-4 h-4" />
                Configurações
              </button>
            </div>
          </div>
        )}

        {activeTab === 'planning' ? (
          /* PLANEAMENTO VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cartão Reuniões */}
            <button
              onClick={() => setActiveTab('meetings')}
              className="group bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-blue-600 p-4 rounded-full group-hover:bg-blue-700 transition-colors">
                  <Calendar className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-2">Reuniões</h2>
                  <p className="text-blue-700 text-sm mb-4">
                    Gestão e planeamento de reuniões estratégicas, operacionais e de revisão
                  </p>
                  <p className="text-xs text-blue-600 font-semibold">
                    {meetings.length} reuniões planeadas
                  </p>
                </div>
                <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition-all mt-4">
                  Ver Reuniões
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>

            {/* Cartão Auditorias */}
            <button
              onClick={() => setActiveTab('audits')}
              className="group bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="bg-amber-600 p-4 rounded-full group-hover:bg-amber-700 transition-colors">
                  <ClipboardList className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-amber-900 mb-2">Auditorias</h2>
                  <p className="text-amber-700 text-sm mb-4">
                    Plano de auditorias internas e externas conforme calendário anual
                  </p>
                  <p className="text-xs text-amber-600 font-semibold">
                    {audits.length} auditorias agendadas
                  </p>
                </div>
                <div className="flex items-center gap-2 text-amber-600 font-semibold group-hover:gap-3 transition-all mt-4">
                  Ver Auditorias
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          </div>
        ) : activeTab === 'meetings' ? (
          /* REUNIÕES TABLE */
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 font-semibold text-sm sticky left-0 bg-slate-900 z-10 w-64 border-r border-slate-700">Tipo de Reunião</th>
                    <th className="p-4 font-semibold text-sm text-center border-r border-slate-700 w-20"><User className="w-4 h-4 mx-auto" /></th>
                    {months.map(m => (
                      <th key={m} className="p-4 text-center text-xs font-bold uppercase tracking-wider min-w-[60px] border-r border-slate-700 last:border-0">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.map((meeting, idx) => (
                    <tr key={meeting.id} className={`group hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="p-4 border-b border-slate-100 sticky left-0 bg-inherit z-10 font-medium text-slate-700 border-r group-hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm leading-tight">{meeting.category}</span>
                          <span className="text-[10px] text-slate-400 uppercase mt-1 tracking-wider">{meeting.type}</span>
                        </div>
                      </td>
                      <td className="p-4 border-b border-slate-100 text-center font-bold text-slate-600 border-r group-hover:bg-blue-50 transition-colors">
                        {meeting.responsible}
                      </td>
                      {months.map((_, mIdx) => {
                        const status = meeting.schedule[mIdx + 1] || 'none';
                        return (
                          <td key={mIdx} className="p-2 border-b border-slate-100 border-r last:border-r-0 text-center">
                            <button 
                              onClick={() => toggleStatus(meeting.id, mIdx)}
                              className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all transform active:scale-95 ${statusConfig[status].color} hover:shadow-inner`}
                            >
                              {statusConfig[status].icon}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* AUDITORIAS TABLE */
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-4 font-semibold text-sm">Mês / Data</th>
                    <th className="p-4 font-semibold text-sm">Processo / Localização</th>
                    <th className="p-4 font-semibold text-sm">Auditores / Gestores</th>
                    <th className="p-4 font-semibold text-sm text-center">Horário</th>
                    <th className="p-4 font-semibold text-sm">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudits.map((audit, idx) => (
                    <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} border-b border-slate-100`}>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-blue-600 text-xs uppercase tracking-wider">{audit.mes}</span>
                          <span className="text-sm font-semibold text-slate-700">{audit.data !== '-' ? audit.data : 'A definir'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{audit.processo}</span>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{audit.auditadoLocal}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold">AUDITOR</span>
                            <span className="text-xs text-slate-600 font-medium">{audit.auditor}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase">Gestor</span>
                            <span className="text-xs text-slate-600">{audit.gestor}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-mono text-sm">
                          <Clock4 className="w-3 h-3 text-slate-400" />
                          {audit.hora}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${audit.obs.includes('Externa') ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                          {audit.obs}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legend / Info Footer */}
        <footer className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-slate-600">Realizado</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-slate-600">Planeado</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-slate-600">Não Realizado</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">© 2026 Somengil SGQA - V 2.0</p>
            <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">ISO 9001:2015 | ISO 14001:2015</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
