import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FaSearch, FaCalendarAlt, FaUser, FaBoxes, FaClock,
  FaDownload, FaFilePdf, FaFileExcel, FaPrint,
  FaEye, FaTools, FaCheckCircle, FaExclamationTriangle,
  FaFilter, FaChartBar, FaChartLine, FaChartPie, FaTimes,
  FaChevronDown, FaChevronUp, FaInfoCircle, FaArrowLeft,
  FaArrowRight, FaTrash
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function ReportsPanel({ history, forms }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [filterForm, setFilterForm] = useState('');
  const [expandedReport, setExpandedReport] = useState(null);
  const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'statystyki'

  // ============================================
  // OBLICZANIE STATYSTYK
  // ============================================

  const stats = useMemo(() => {
    const total = history.length;
    const totalProduced = history.reduce((sum, h) => sum + (h.produced || 0), 0);
    const uniqueForms = new Set(history.map(h => h.formId)).size;
    const uniqueOperators = new Set(history.map(h => h.operator)).size;
    
    // Produkcja dzienna
    const dailyProduction = {};
    history.forEach(h => {
      const date = h.date || 'Brak daty';
      dailyProduction[date] = (dailyProduction[date] || 0) + (h.produced || 0);
    });
    
    // Najczęściej używane formy
    const formUsage = {};
    history.forEach(h => {
      const form = forms.find(f => f.id === h.formId);
      const name = form ? form.name : 'Nieznana';
      formUsage[name] = (formUsage[name] || 0) + (h.produced || 0);
    });
    
    // Problemy
    const problems = {};
    history.forEach(h => {
      const prob = h.problems || 'Brak';
      problems[prob] = (problems[prob] || 0) + 1;
    });
    
    // Ostatnie 7 dni
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = history
        .filter(h => h.date === dateStr)
        .reduce((sum, h) => sum + (h.produced || 0), 0);
      last7Days.push({
        date: dateStr,
        produced: dayTotal,
        count: history.filter(h => h.date === dateStr).length
      });
    }

    return {
      total,
      totalProduced,
      uniqueForms,
      uniqueOperators,
      dailyProduction,
      formUsage,
      problems,
      last7Days,
      avgPerReport: total > 0 ? Math.round(totalProduced / total) : 0
    };
  }, [history, forms]);

  // ============================================
  // FILTROWANIE
  // ============================================

  const filteredHistory = useMemo(() => {
    return history.filter(h => {
      const form = forms.find(f => f.id === h.formId);
      const formName = form ? form.name : 'Nieznana';
      
      const matchSearch = formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.problems.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchOperator = filterOperator === '' || h.operator === filterOperator;
      const matchForm = filterForm === '' || h.formId === Number(filterForm);
      
      let matchDate = true;
      if (filterDateFrom && h.date) {
        matchDate = matchDate && h.date >= filterDateFrom;
      }
      if (filterDateTo && h.date) {
        matchDate = matchDate && h.date <= filterDateTo;
      }
      
      return matchSearch && matchOperator && matchForm && matchDate;
    });
  }, [history, searchTerm, filterOperator, filterForm, filterDateFrom, filterDateTo, forms]);

  // ============================================
  // FUNKCJE POMOCNICZE
  // ============================================

  const getStatusBadge = (status) => {
    const colors = {
      'W produkcji': 'bg-amber-500/20 text-amber-400 border-amber-400/20',
      'Dostępna': 'bg-emerald-500/20 text-emerald-400 border-emerald-400/20',
      'Uszkodzona': 'bg-rose-500/20 text-rose-400 border-rose-400/20',
      'Serwis': 'bg-blue-500/20 text-blue-400 border-blue-400/20'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-400/20';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'W produkcji': <FaTools className="text-amber-400" />,
      'Dostępna': <FaCheckCircle className="text-emerald-400" />,
      'Uszkodzona': <FaExclamationTriangle className="text-rose-400" />,
      'Serwis': <FaClock className="text-blue-400" />
    };
    return icons[status] || <FaInfoCircle className="text-gray-400" />;
  };

  const getFormName = (formId) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.name : 'Nieznana forma';
  };

  // ============================================
  // EKSPORT
  // ============================================

  const exportToCSV = () => {
    const headers = ['Data', 'Zmiana', 'Forma', 'Operator', 'Ilość', 'Problemy', 'Status', 'Uwagi'];
    const rows = filteredHistory.map(h => [
      h.date || '',
      h.shift || '',
      getFormName(h.formId),
      h.operator || '',
      h.produced || 0,
      h.problems || 'Brak',
      h.status || '',
      h.notes || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raporty_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <div className="eyebrow">Raporty i analizy</div>
          <h2 className="page-title" style={{ fontSize: '22px' }}>
            <FaChartBar className="text-cyan-400" /> Raporty zmianowe
          </h2>
          <div className="page-desc">
            {filteredHistory.length} raportów · {stats.totalProduced.toLocaleString()} szt. łącznie
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="primary" 
            onClick={() => setViewMode(viewMode === 'lista' ? 'statystyki' : 'lista')}
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            {viewMode === 'lista' ? <FaChartPie /> : <FaChartBar />}
            {viewMode === 'lista' ? ' Statystyki' : ' Lista'}
          </button>
          <button className="secondary" onClick={exportToCSV}>
            <FaDownload /> Eksport CSV
          </button>
        </div>
      </div>

      {/* ===== STATYSTYKI ===== */}
      {viewMode === 'statystyki' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Karty KPI */}
          <div className="kpi-grid" style={{ marginBottom: '16px' }}>
            {[
              ['Raportów', stats.total, FaFilePdf, '#60a5fa', 'rgba(96,165,250,.12)'],
              ['Wyprodukowano', stats.totalProduced.toLocaleString(), FaTools, '#34d399', 'rgba(52,211,153,.12)'],
              ['Średnia / raport', stats.avgPerReport, FaChartBar, '#fbbf24', 'rgba(251,191,36,.12)'],
              ['Operatorów', stats.uniqueOperators, FaUser, '#a78bfa', 'rgba(167,139,250,.12)'],
            ].map(([label, value, Icon, color, bg], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card kpi"
                style={{ '--accent': color, '--iconbg': bg }}
              >
                <div className="kpi-head">
                  <span className="kpi-label">{label}</span>
                  <span className="kpi-icon" style={{ color, background: bg }}><Icon /></span>
                </div>
                <div className="kpi-value" style={{ color }}>{value}</div>
              </motion.div>
            ))}
          </div>

          {/* Wykresy */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Produkcja w ostatnich 7 dniach */}
            <motion.div className="card panel" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="panel-head">
                <div className="panel-title"><FaChartLine /> Produkcja dzienna</div>
                <span className="panel-meta">ostatnie 7 dni</span>
              </div>
              <div className="chart" style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.last7Days}>
                    <CartesianGrid stroke="rgba(148,163,184,.07)" vertical={false} />
                    <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0d1624', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, color: '#e2e8f0', fontSize: 10 }} />
                    <Bar dataKey="produced" name="Wyprodukowano" fill="#22d3ee" radius={[5, 5, 2, 2]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Problemy */}
            <motion.div className="card panel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <div className="panel-head">
                <div className="panel-title"><FaChartPie /> Problemy</div>
                <span className="panel-meta">zgłoszone</span>
              </div>
              <div className="chart" style={{ height: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(stats.problems).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {Object.entries(stats.problems).map(([name], i) => {
                        const colors = ['#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#a78bfa'];
                        return <Cell key={i} fill={colors[i % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1624', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, color: '#e2e8f0', fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 9, color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ===== FILTRY ===== */}
      <div className="flex flex-wrap gap-3 items-center mb-4 mt-4">
        <div className="search-wrap">
          <FaSearch />
          <input
            className="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Szukaj formy, operatora..."
          />
        </div>
        
        <select className="select" value={filterForm} onChange={e => setFilterForm(e.target.value)}>
          <option value="">Wszystkie formy</option>
          {forms.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        
        <select className="select" value={filterOperator} onChange={e => setFilterOperator(e.target.value)}>
          <option value="">Wszyscy operatorzy</option>
          {[...new Set(history.map(h => h.operator))].filter(Boolean).map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
        
        <input
          type="date"
          className="select"
          value={filterDateFrom}
          onChange={e => setFilterDateFrom(e.target.value)}
          style={{ width: '140px' }}
        />
        <span className="text-gray-500 text-xs">-</span>
        <input
          type="date"
          className="select"
          value={filterDateTo}
          onChange={e => setFilterDateTo(e.target.value)}
          style={{ width: '140px' }}
        />
        
        <button className="secondary" onClick={() => {
          setSearchTerm('');
          setFilterForm('');
          setFilterOperator('');
          setFilterDateFrom('');
          setFilterDateTo('');
        }} style={{ padding: '6px 14px', fontSize: '12px' }}>
          <FaFilter /> Reset
        </button>
      </div>

      {/* ===== LISTA RAPORTÓW ===== */}
      {viewMode === 'lista' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card table-panel"
          style={{ padding: '18px 20px' }}
        >
          <div className="table-toolbar">
            <div>
              <div className="panel-title"><FaFilePdf /> Lista raportów</div>
              <div className="panel-meta" style={{ marginTop: 4 }}>
                {filteredHistory.length} raportów · {filteredHistory.reduce((sum, h) => sum + (h.produced || 0), 0).toLocaleString()} szt.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '7px' }}>
              <button className="secondary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={exportToCSV}>
                <FaDownload /> Eksport
              </button>
            </div>
          </div>
          
          <div className="table-wrap" style={{ maxHeight: '500px' }}>
            <table>
              <thead>
                <tr>
                  <th>Data / Zmiana</th>
                  <th>Forma</th>
                  <th>Operator</th>
                  <th>Ilość</th>
                  <th>Problemy</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#475569' }}>
                      Brak raportów dla wybranych kryteriów
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h, index) => {
                    const form = forms.find(f => f.id === h.formId);
                    const isExpanded = expandedReport === h.id;
                    return (
                      <React.Fragment key={h.id || index}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="data-row"
                          onClick={() => setExpandedReport(isExpanded ? null : h.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {h.date || '—'}<br />
                            <span style={{ fontSize: '10px', color: '#475569' }}>{h.shift || '—'}</span>
                          </td>
                          <td className="form-name">{form ? form.name : '—'}</td>
                          <td>{h.operator || '—'}</td>
                          <td style={{ fontWeight: 700, color: '#22d3ee' }}>
                            {h.produced || 0} szt.
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            {h.problems && h.problems !== 'Brak' ? (
                              <span style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaExclamationTriangle style={{ fontSize: '10px' }} />
                                {h.problems}
                              </span>
                            ) : (
                              <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FaCheckCircle style={{ fontSize: '10px' }} />
                                OK
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadge(h.status)}`}>
                              {getStatusIcon(h.status)}
                              {h.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="action" 
                              onClick={(e) => { e.stopPropagation(); setExpandedReport(isExpanded ? null : h.id); }}
                              style={{ color: '#60a5fa' }}
                            >
                              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                          </td>
                        </motion.tr>
                        
                        {/* Rozwinięty wiersz z dodatkowymi informacjami */}
                        {isExpanded && (
                          <tr>
                            <td colSpan="7" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 20px' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                <div>
                                  <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Uwagi</span>
                                  <p style={{ color: '#e2e8f0', marginTop: '2px' }}>{h.notes || 'Brak uwag'}</p>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Forma</span>
                                  <p style={{ color: '#e2e8f0', marginTop: '2px' }}>
                                    {form ? `${form.name} (${form.material})` : '—'}
                                  </p>
                                </div>
                                <div>
                                  <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Status formy</span>
                                  <p style={{ color: '#e2e8f0', marginTop: '2px' }}>
                                    {form ? form.status : '—'}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ReportsPanel;