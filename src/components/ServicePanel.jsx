import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaWrench, FaTools, FaCheckCircle, FaClock,
  FaSearch, FaPlusCircle, FaEdit, FaSave, FaTimes,
  FaCalendarAlt, FaUser, FaClipboardList,
  FaExclamationTriangle, FaSpinner,
  FaFilter, FaInfoCircle,
  FaBoxes
} from 'react-icons/fa';

function ServicePanel({ forms, setForms, setHistory, notify, tasks, setTasks }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Wszystkie');
  const [filterType, setFilterType] = useState('Wszystkie');
  const [modal, setModal] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newTask, setNewTask] = useState({
    formId: '',
    type: 'Naprawa',
    priority: 'Średni',
    description: '',
    assignedTo: '',
    estimatedHours: 1,
    parts: '',
    notes: '',
    status: 'Nowe'
  });

  const checkedForms = useRef(new Set());

  useEffect(() => {
    const checkForms = () => {
      const newTasks = [];
      const today = new Date().toISOString().split('T')[0];
      
      forms.forEach(form => {
        const hasAnyTask = tasks.some(t => t.formId === form.id);
        if (hasAnyTask) return;
        if (checkedForms.current.has(form.id)) return;
        
        const limit = form.cyclesLimit || 5000;
        const currentCycles = form.cycles || 0;
        
        if (currentCycles >= limit && limit > 0) {
          checkedForms.current.add(form.id);
          
          newTasks.push({
            id: Date.now() + Math.random() * 1000 + form.id,
            formId: form.id,
            formName: form.name,
            type: 'Przegląd',
            priority: 'Wysoki',
            description: `Przekroczono limit cykli (${currentCycles}/${limit}) - wymagany serwis`,
            reportedBy: 'System',
            reportedDate: today,
            assignedTo: '',
            status: 'Nowe',
            startDate: null,
            estimatedHours: 2,
            actualHours: null,
            parts: [],
            notes: 'Automatycznie wygenerowane po przekroczeniu limitu cykli',
            completionDate: null,
            cyclesTrigger: currentCycles,
            cyclesLimit: limit
          });
        }
      });
      
      if (newTasks.length > 0) {
        setTasks(prev => [...newTasks, ...prev]);
        if (notify) notify(`🔧 Dodano ${newTasks.length} nowych zadań serwisowych`, 'warning');
      }
    };
    
    checkForms();
  }, [forms]);

  useEffect(() => {
    tasks.forEach(task => {
      if (task.status === 'Zakończone') {
        checkedForms.current.delete(task.formId);
      }
    });
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const open = tasks.filter(t => t.status === 'Nowe' || t.status === 'Oczekuje').length;
    const inProgress = tasks.filter(t => t.status === 'W trakcie').length;
    const done = tasks.filter(t => t.status === 'Zakończone').length;
    const urgent = tasks.filter(t => t.priority === 'Wysoki' && t.status !== 'Zakończone').length;
    return { total, open, inProgress, done, urgent };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchSearch = task.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.assignedTo || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'Wszystkie' || task.status === filterStatus;
      const matchType = filterType === 'Wszystkie' || task.type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [tasks, searchTerm, filterStatus, filterType]);

  const statusConfig = {
    'Nowe': { label: '🆕 Nowe', color: 'bg-blue-500/20 text-blue-400 border-blue-400/20' },
    'Oczekuje': { label: '⏳ Oczekuje', color: 'bg-amber-500/20 text-amber-400 border-amber-400/20' },
    'W trakcie': { label: '🔧 W trakcie', color: 'bg-purple-500/20 text-purple-400 border-purple-400/20' },
    'Zakończone': { label: '✅ Zakończone', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/20' },
  };

  const priorityConfig = {
    'Wysoki': { label: '🔴 Wysoki', color: 'text-rose-400 bg-rose-400/10' },
    'Średni': { label: '🟡 Średni', color: 'text-amber-400 bg-amber-400/10' },
    'Niski': { label: '🟢 Niski', color: 'text-emerald-400 bg-emerald-400/10' },
  };

  const openNewTask = () => {
    setEditingTask(null);
    setNewTask({
      formId: '',
      type: 'Naprawa',
      priority: 'Średni',
      description: '',
      assignedTo: '',
      estimatedHours: 1,
      parts: '',
      notes: '',
      status: 'Nowe'
    });
    setModal('form');
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      formId: task.formId,
      type: task.type,
      priority: task.priority,
      description: task.description,
      assignedTo: task.assignedTo || '',
      estimatedHours: task.estimatedHours || 1,
      parts: (task.parts || []).join(', '),
      notes: task.notes || '',
      status: task.status
    });
    setModal('form');
  };

  const saveTask = (e) => {
    e.preventDefault();
    if (!newTask.formId) {
      if (notify) notify('❌ Wybierz formę', 'error');
      return;
    }
    if (!newTask.description.trim()) {
      if (notify) notify('❌ Opis zadania jest wymagany', 'error');
      return;
    }

    const hasTask = tasks.some(t => t.formId === Number(newTask.formId) && t.status !== 'Zakończone');
    if (hasTask) {
      if (notify) notify('❌ Ta forma ma już aktywne zadanie', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const form = forms.find(f => f.id === Number(newTask.formId));
      if (editingTask) {
        setTasks(prev => prev.map(t =>
          t.id === editingTask.id
            ? {
                ...t,
                formId: Number(newTask.formId),
                formName: form ? form.name : 'Nieznana',
                type: newTask.type,
                priority: newTask.priority,
                description: newTask.description,
                assignedTo: newTask.assignedTo || '',
                estimatedHours: Number(newTask.estimatedHours) || 1,
                parts: newTask.parts ? newTask.parts.split(',').map(s => s.trim()).filter(Boolean) : [],
                notes: newTask.notes || '',
                status: newTask.status
              }
            : t
        ));
        if (notify) notify('✅ Zaktualizowano zadanie', 'success');
      } else {
        const newTaskObj = {
          id: Date.now(),
          formId: Number(newTask.formId),
          formName: form ? form.name : 'Nieznana',
          type: newTask.type,
          priority: newTask.priority,
          description: newTask.description,
          reportedBy: localStorage.getItem('userName') || 'Administrator',
          reportedDate: new Date().toISOString().split('T')[0],
          assignedTo: newTask.assignedTo || '',
          status: 'Nowe',
          startDate: null,
          estimatedHours: Number(newTask.estimatedHours) || 1,
          actualHours: null,
          parts: newTask.parts ? newTask.parts.split(',').map(s => s.trim()).filter(Boolean) : [],
          notes: newTask.notes || '',
          completionDate: null,
          cyclesTrigger: form ? form.cycles : 0,
          cyclesLimit: form ? form.cyclesLimit || 5000 : 5000
        };
        setTasks(prev => [newTaskObj, ...prev]);
        if (notify) notify(`✅ Dodano zadanie dla ${form ? form.name : 'formy'}`, 'success');
      }
      setModal(null);
      setLoading(false);
    }, 400);
  };

  const zakończSerwis = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const form = forms.find(f => f.id === task.formId);
    if (!form) return;
    
    if (!window.confirm(`⚠️ Zakończyć serwis dla ${form.name}? Licznik zostanie wyzerowany do 0!`)) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    setForms(prev => prev.map(f => {
      if (f.id === form.id) {
        return {
          ...f,
          status: 'Dostępna',
          cycles: 0,
          lastMaintenance: today,
          lastServiceDate: today,
          notes: `Serwis wykonany ${today} - licznik wyzerowany`
        };
      }
      return f;
    }));
    
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Zakończone',
          completionDate: today
        };
      }
      return t;
    }));
    
    checkedForms.current.delete(form.id);
    
    if (setHistory) {
      setHistory(prev => [{
        id: Date.now(),
        formId: form.id,
        shift: 'Serwis',
        operator: localStorage.getItem('userName') || 'Serwisant',
        date: today,
        produced: 0,
        problems: `Serwis wykonany - licznik wyzerowany z ${task.cyclesTrigger || '?'} cykli`,
        status: 'Dostępna',
        notes: `Zadanie #${task.id} zakończone. Nowy limit: ${task.cyclesLimit || 5000} cykli`
      }, ...prev]);
    }
    
    if (notify) notify(`✅ Forma ${form.name} - licznik wyzerowany do 0!`, 'success');
  };

  return (
    <div>
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <div className="eyebrow">Zarządzanie serwisem</div>
          <h2 className="page-title" style={{ fontSize: '22px' }}>
            <FaWrench className="text-amber-400" /> Serwis i naprawy
          </h2>
          <div className="page-desc">
            {stats.open} zadań otwartych · {stats.inProgress} w trakcie · {stats.done} zakończonych
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="primary" onClick={openNewTask} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <FaPlusCircle /> Nowe zadanie
          </button>
        </div>
      </div>

      {/* KARTY STATYSTYK */}
      <div className="kpi-grid" style={{ marginBottom: '16px' }}>
        {[
          ['Do wykonania', stats.open, FaClock, '#fbbf24', 'rgba(251,191,36,.12)'],
          ['W trakcie', stats.inProgress, FaSpinner, '#8b5cf6', 'rgba(139,92,246,.12)'],
          ['Zakończone', stats.done, FaCheckCircle, '#34d399', 'rgba(52,211,153,.12)'],
          ['Pilne', stats.urgent, FaExclamationTriangle, '#fb7185', 'rgba(251,113,133,.12)'],
        ].map(([label, value, Icon, color, bg], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -3 }}
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

      {/* FILTRY */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="search-wrap">
          <FaSearch />
          <input
            className="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Szukaj..."
          />
        </div>
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option>Wszystkie</option>
          <option>Nowe</option>
          <option>Oczekuje</option>
          <option>W trakcie</option>
          <option>Zakończone</option>
        </select>
        <select className="select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option>Wszystkie</option>
          <option>Naprawa</option>
          <option>Przegląd</option>
        </select>
        <button className="secondary" onClick={() => {
          setSearchTerm('');
          setFilterStatus('Wszystkie');
          setFilterType('Wszystkie');
        }} style={{ padding: '6px 14px', fontSize: '12px' }}>
          <FaFilter /> Reset
        </button>
      </div>

      {/* LISTA ZADAŃ */}
      <div className="card table-panel" style={{ padding: '18px 20px' }}>
        <div className="table-wrap" style={{ maxHeight: '450px' }}>
          <table>
            <thead>
              <tr>
                <th>Forma</th>
                <th>Typ</th>
                <th>Priorytet</th>
                <th>Status</th>
                <th>Opis</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#475569' }}>
                    Brak zadań serwisowych
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <motion.tr key={task.id} layout className="data-row">
                    <td>
                      <div className="form-name">{task.formName}</div>
                      <div className="form-id">ID {String(task.id).padStart(4, '0')}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${task.type === 'Naprawa' ? 'status-repair' : 'status-ok'}`}>
                        {task.type === 'Naprawa' ? '🔧 Naprawa' : '🔍 Przegląd'}
                      </span>
                    </td>
                    <td>
                      <span className={`${priorityConfig[task.priority]?.color || ''} px-2 py-1 rounded-full text-xs font-medium`}>
                        {priorityConfig[task.priority]?.label || task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${statusConfig[task.status]?.color || ''}`}>
                        {statusConfig[task.status]?.label || task.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description}
                    </td>
                    <td>
                      <div className="action-row" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {task.status === 'Nowe' && (
                          <button 
                            className="action" 
                            onClick={() => {
                              setTasks(prev => prev.map(t => 
                                t.id === task.id ? { ...t, status: 'Oczekuje' } : t
                              ));
                              if (notify) notify('⏳ Zadanie przyjęte', 'info');
                            }}
                            style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(251,191,36,0.2)' }}
                          >
                            ⏳ Przyjmij
                          </button>
                        )}
                        {task.status === 'Oczekuje' && (
                          <button 
                            className="action" 
                            onClick={() => {
                              setTasks(prev => prev.map(t => 
                                t.id === task.id ? { ...t, status: 'W trakcie', startDate: new Date().toISOString().split('T')[0] } : t
                              ));
                              if (notify) notify('🔧 Rozpoczęto naprawę', 'info');
                            }}
                            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(139,92,246,0.2)' }}
                          >
                            🔧 Rozpocznij
                          </button>
                        )}
                        {task.status === 'W trakcie' && (
                          <button 
                            className="action" 
                            onClick={() => zakończSerwis(task.id)}
                            style={{ color: '#34d399', background: 'rgba(52,211,153,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(52,211,153,0.2)' }}
                          >
                            ✅ Zakończ
                          </button>
                        )}
                        {task.status === 'Zakończone' && (
                          <span style={{ fontSize: '11px', color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                            ✅ Wyzerowano
                          </span>
                        )}
                        <button className="action edit" onClick={() => openEditTask(task)}><FaEdit /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL - NOWE ZADANIE */}
      <AnimatePresence>
        {modal === 'form' && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={e => e.target === e.currentTarget && setModal(null)}
          >
            <motion.div
              className="modal"
              style={{ maxWidth: '600px' }}
              initial={{ opacity: 0, y: 25, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: .98 }}
            >
              <div className="modal-head">
                <div>
                  <div className="eyebrow">{editingTask ? 'Edycja' : 'Nowe zadanie'}</div>
                  <div className="modal-title">
                    {editingTask ? 'Edytuj zadanie' : 'Dodaj nowe zadanie'}
                  </div>
                </div>
                <button className="close" onClick={() => setModal(null)}><FaTimes /></button>
              </div>

              <form onSubmit={saveTask}>
                <div className="form-grid">
                  <div className="field">
                    <label><FaBoxes /> Forma *</label>
                    <select
                      value={newTask.formId}
                      onChange={e => setNewTask({ ...newTask, formId: e.target.value })}
                      required
                    >
                      <option value="">— wybierz —</option>
                      {forms.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.cycles} cykli / limit: {f.cyclesLimit || 5000})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label><FaTools /> Typ</label>
                    <select
                      value={newTask.type}
                      onChange={e => setNewTask({ ...newTask, type: e.target.value })}
                    >
                      <option value="Naprawa">🔧 Naprawa</option>
                      <option value="Przegląd">🔍 Przegląd</option>
                    </select>
                  </div>
                  <div className="field">
                    <label><FaExclamationTriangle /> Priorytet</label>
                    <select
                      value={newTask.priority}
                      onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="Wysoki">🔴 Wysoki</option>
                      <option value="Średni">🟡 Średni</option>
                      <option value="Niski">🟢 Niski</option>
                    </select>
                  </div>
                  <div className="field">
                    <label><FaUser /> Przypisz do</label>
                    <input
                      value={newTask.assignedTo}
                      onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                      placeholder="np. Adam Nowak"
                    />
                  </div>
                  <div className="field full">
                    <label><FaClipboardList /> Opis *</label>
                    <textarea
                      value={newTask.description}
                      onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Opis problemu..."
                      rows="2"
                      required
                    />
                  </div>
                  <div className="field full">
                    <label><FaTools /> Części</label>
                    <input
                      value={newTask.parts}
                      onChange={e => setNewTask({ ...newTask, parts: e.target.value })}
                      placeholder="np. Wkładka, Śruby"
                    />
                  </div>
                  <div className="field full">
                    <label><FaInfoCircle /> Uwagi</label>
                    <textarea
                      value={newTask.notes}
                      onChange={e => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Dodatkowe informacje..."
                      rows="2"
                    />
                  </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '12px' }}>
                  <button type="button" className="secondary" onClick={() => setModal(null)}>Anuluj</button>
                  <button className="primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    {loading ? <><FaSpinner className="fa-spin" /> Zapisywanie…</> : <><FaSave /> Dodaj</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServicePanel;