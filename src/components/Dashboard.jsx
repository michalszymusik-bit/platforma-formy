import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome, FaTools, FaCheckCircle, FaQrcode, FaSearch, FaPlusCircle, FaUserCircle,
  FaArrowUp, FaArrowDown, FaTimes, FaSave, FaTrash, FaEye, FaCalendarAlt, FaIndustry,
  FaMapMarkerAlt, FaBarcode, FaExclamationCircle, FaInfoCircle, FaSpinner, FaSignOutAlt,
  FaChartBar, FaBoxes, FaWrench, FaChartPie, FaCog, FaBell, FaFileAlt, FaPrint, FaBuilding,
  FaHistory, FaEdit, FaClipboardList, FaFilter, FaClock, FaUser, FaClipboardCheck,
  FaExclamationTriangle, FaCheckDouble, FaPen, FaHourglassHalf, FaUsers,
  FaShieldAlt
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { defaultUsers, getVisibleTabs, ROLES, PERMISSIONS, ensureServicePermission } from '../data/users';
import UsersPanel from './UsersPanel';
import ServicePanel from './ServicePanel';
import ReportsPanel from './ReportsPanel';

// ============================================
// NAZWY TABEL - ZMIEŃ NA SWOJE!
// ============================================
const TABLES = {
  FORMS: 'forms',      // ← PODAJ NAZWĘ TABELI Z FORMANI
  HISTORY: 'history'   // ← PODAJ NAZWĘ TABELI Z HISTORIĄ
};

// ============================================
// BAZA DANYCH - DANE POCZĄTKOWE (TYLKO GDY PUSTO)
// ============================================

const defaultForms = [
  { id: 1, name: 'FORMA #A-2210', status: 'Dostępna', material: 'Stal nierdzewna 1.4301', location: 'Regał B3 / Slot 12', machine: 'CNC-3', cycles: 1250, cyclesLimit: 5000, lastMaintenance: '2026-07-15', nextMaintenance: '2026-10-15', temperature: '120°C', pressure: '45 bar', created: '2024-03-10', notes: 'Wymiana po 5000 cykli', lastServiceDate: null },
  { id: 2, name: 'FORMA #B-4512', status: 'W produkcji', material: 'Aluminium EN AW-6082', location: 'Maszyna CNC-3', machine: 'CNC-3', cycles: 3420, cyclesLimit: 5000, lastMaintenance: '2026-08-01', nextMaintenance: '2026-11-01', temperature: '180°C', pressure: '60 bar', created: '2024-01-15', notes: 'Produkcja seryjna', lastServiceDate: null },
  { id: 3, name: 'FORMA #C-0987', status: 'Uszkodzona', material: 'Żeliwo szare EN-GJL-250', location: 'Dział Utrzymania', machine: 'CNC-1', cycles: 890, cyclesLimit: 5000, lastMaintenance: '2026-06-20', nextMaintenance: '2026-09-20', temperature: '0°C', pressure: '0 bar', created: '2024-05-20', notes: 'Uszkodzenie powierzchni - szlifowanie', lastServiceDate: null },
  { id: 4, name: 'FORMA #D-3321', status: 'Dostępna', material: 'Miedź Cu-ETP', location: 'Magazyn A1 / Półka 5', machine: 'CNC-2', cycles: 2100, cyclesLimit: 5000, lastMaintenance: '2026-07-28', nextMaintenance: '2026-10-28', temperature: '0°C', pressure: '0 bar', created: '2023-11-10', notes: 'Gotowa do użycia', lastServiceDate: null },
  { id: 5, name: 'FORMA #E-1123', status: 'W produkcji', material: 'Stal narzędziowa 1.2343', location: 'Maszyna CNC-1', machine: 'CNC-1', cycles: 5600, cyclesLimit: 5000, lastMaintenance: '2026-07-10', nextMaintenance: '2026-10-10', temperature: '200°C', pressure: '70 bar', created: '2023-08-05', notes: 'Wymagany przegląd - przekroczono limit', lastServiceDate: null },
  { id: 6, name: 'FORMA #F-4456', status: 'Serwis', material: 'Tytan Grade 5', location: 'Regał A2 / Slot 8', machine: 'CNC-4', cycles: 340, cyclesLimit: 500, lastMaintenance: '2026-08-05', nextMaintenance: '2026-11-05', temperature: '0°C', pressure: '0 bar', created: '2024-06-15', notes: 'Planowany przegląd', lastServiceDate: null },
  { id: 7, name: 'FORMA #G-7890', status: 'W produkcji', material: 'Stal stopowa 42CrMo4', location: 'Maszyna CNC-2', machine: 'CNC-2', cycles: 2800, cyclesLimit: 5000, lastMaintenance: '2026-07-20', nextMaintenance: '2026-10-20', temperature: '160°C', pressure: '55 bar', created: '2024-02-20', notes: 'Produkcja elementów precyzyjnych', lastServiceDate: null },
  { id: 8, name: 'FORMA #H-2345', status: 'Serwis', material: 'Żeliwo sferoidalne EN-GJS-500', location: 'Dział Utrzymania', machine: 'CNC-5', cycles: 4300, cyclesLimit: 5000, lastMaintenance: '2026-06-10', nextMaintenance: '2026-09-10', temperature: '0°C', pressure: '0 bar', created: '2023-09-01', notes: 'Awaria układu chłodzenia', lastServiceDate: null },
];

const defaultHistory = [
  { id: 1, formId: 2, shift: 'I (06:00-14:00)', operator: 'Jan Kowalski', date: '2026-08-11', produced: 145, problems: 'Brak', status: 'W produkcji', notes: 'Praca stabilna' },
  { id: 2, formId: 5, shift: 'II (14:00-22:00)', operator: 'Piotr Nowak', date: '2026-08-11', produced: 220, problems: 'Zużycie narzędzi', status: 'W produkcji', notes: 'Kontrola wymagana' },
  { id: 3, formId: 3, shift: 'I (06:00-14:00)', operator: 'Marek Wiśniewski', date: '2026-08-10', produced: 0, problems: 'Uszkodzenie powierzchni', status: 'Uszkodzona', notes: 'Oddano do serwisu' },
];

const shifts = ['I (06:00-14:00)', 'II (14:00-22:00)', 'III (22:00-06:00)'];
const weeklyData = [
  { day: 'Pon', produkcja: 620, czas: 85 },
  { day: 'Wt', produkcja: 780, czas: 92 },
  { day: 'Śr', produkcja: 540, czas: 78 },
  { day: 'Czw', produkcja: 890, czas: 95 },
  { day: 'Pt', produkcja: 750, czas: 88 },
  { day: 'Sob', produkcja: 320, czas: 45 },
  { day: 'Nd', produkcja: 120, czas: 15 },
];

const emptyForm = () => ({
  name: '', material: '', location: '', status: 'Dostępna', machine: '',
  cycles: 0, cyclesLimit: 5000, lastMaintenance: new Date().toISOString().split('T')[0],
  temperature: '', pressure: '', notes: '', lastServiceDate: null
});

const emptyReport = () => ({
  formId: '', shift: 'I (06:00-14:00)', operator: '', date: new Date().toISOString().split('T')[0],
  produced: 0, problems: 'Brak', status: 'W produkcji', notes: ''
});

// ============================================
// FUNKCJE ZAPISU I ODCZYTU Z localStorage (TYLKO DLA UŻYTKOWNIKÓW I ZADAŃ)
// ============================================

const STORAGE_KEYS = {
  USERS: 'forma_odlewcze_users',
  TASKS: 'forma_odlewcze_tasks'
};

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Błąd zapisu do localStorage:', error);
  }
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Błąd odczytu z localStorage:', error);
  }
  return defaultValue;
};

// ============================================
// GŁÓWNY KOMPONENT
// ============================================

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [forms, setForms] = useState([]);
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState(() => loadFromStorage(STORAGE_KEYS.TASKS, []));
  
  // ⭐ ŁADUJEMY UŻYTKOWNIKÓW
  const [users, setUsers] = useState(() => {
    const loadedUsers = loadFromStorage(STORAGE_KEYS.USERS, defaultUsers);
    return ensureServicePermission(loadedUsers);
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Wszystkie');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedForm, setSelectedForm] = useState(null);
  const [modal, setModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newForm, setNewForm] = useState(emptyForm());
  const [report, setReport] = useState(emptyReport());
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // ⭐ Pobieramy dane użytkownika z localStorage
  const username = localStorage.getItem('username') || 'Administrator';
  const userName = localStorage.getItem('userName') || 'Administrator';
  const userRole = localStorage.getItem('userRole') || ROLES.ADMIN;
  const userRoleLabel = localStorage.getItem('userRoleLabel') || 'Administrator';

  // ⭐ Pobierz aktualnego użytkownika z listy users
  const currentUser = users.find(u => u.username === username);
  
  // ⭐ Użyj funkcji getVisibleTabs z uwzględnieniem customPermissions
  const visibleTabs = getVisibleTabs(currentUser || { role: userRole, customPermissions: PERMISSIONS[userRole] });
  
  // ⭐ SPRAWDŹ CZY ADMIN
  const isAdmin = userRole === ROLES.ADMIN || currentUser?.role === ROLES.ADMIN;

  // ============================================
  // FUNKCJE SUPABASE - FORMY
  // ============================================

  const loadFormsFromSupabase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(TABLES.FORMS)
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Błąd pobierania form:', error);
        notify(`❌ Błąd bazy danych: ${error.message}`, 'error');
        return;
      }

      if (data && data.length > 0) {
        const normalizedForms = data.map(form => ({
          ...form,
          cycles: Number(form.cycles) || 0,
          cyclesLimit: Number(form.cyclesLimit) || 5000
        }));
        setForms(normalizedForms);
      } else {
        // Jeśli brak danych - wgraj domyślne
        await seedDefaultForms();
      }
    } catch (error) {
      console.error(error);
      notify('❌ Nie udało się połączyć z bazą danych', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultForms = async () => {
    try {
      const formsToInsert = defaultForms.map(f => ({
        name: f.name,
        status: f.status,
        material: f.material,
        location: f.location,
        machine: f.machine,
        cycles: f.cycles,
        cyclesLimit: f.cyclesLimit,
        lastMaintenance: f.lastMaintenance,
        nextMaintenance: f.nextMaintenance,
        temperature: f.temperature,
        pressure: f.pressure,
        notes: f.notes,
        created: f.created
      }));

      const { data, error } = await supabase
        .from(TABLES.FORMS)
        .insert(formsToInsert)
        .select();

      if (error) {
        console.error('Błąd seedowania:', error);
        return;
      }

      if (data) {
        const normalized = data.map(form => ({
          ...form,
          cycles: Number(form.cycles) || 0,
          cyclesLimit: Number(form.cyclesLimit) || 5000
        }));
        setForms(normalized);
        notify('✅ Załadowano domyślne dane form', 'success');
      }
    } catch (error) {
      console.error('Błąd seedowania:', error);
    }
  };

  // ============================================
  // FUNKCJE SUPABASE - HISTORIA
  // ============================================

  const loadHistoryFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.HISTORY)
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Błąd pobierania historii:', error);
        return;
      }

      if (data && data.length > 0) {
        const normalizedHistory = data.map(h => ({
          ...h,
          formId: h.form_id || h.formId
        }));
        setHistory(normalizedHistory);
      } else {
        // Jeśli brak historii - wgraj domyślne
        await seedDefaultHistory();
      }
    } catch (error) {
      console.error('Błąd:', error);
    }
  };

  const seedDefaultHistory = async () => {
    try {
      const historyToInsert = defaultHistory.map(h => ({
        form_id: h.formId,
        shift: h.shift,
        operator: h.operator,
        date: h.date,
        produced: h.produced,
        problems: h.problems,
        status: h.status,
        notes: h.notes
      }));

      const { data, error } = await supabase
        .from(TABLES.HISTORY)
        .insert(historyToInsert)
        .select();

      if (error) {
        console.error('Błąd seedowania historii:', error);
        return;
      }

      if (data) {
        const normalized = data.map(h => ({
          ...h,
          formId: h.form_id
        }));
        setHistory(normalized);
      }
    } catch (error) {
      console.error('Błąd seedowania historii:', error);
    }
  };

  // ============================================
  // ŁADOWANIE DANYCH PRZY STARCIE
  // ============================================

  useEffect(() => {
    loadFormsFromSupabase();
    loadHistoryFromSupabase();
  }, []);

  // ============================================
  // ZAPISYWANIE DANYCH DO localStorage (TYLKO UŻYTKOWNICY I ZADANIA)
  // ============================================

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  // ============================================
  // STATYSTYKI
  // ============================================

  const stats = useMemo(() => {
    const total = forms.length;
    const available = forms.filter(f => f.status === 'Dostępna').length;
    const production = forms.filter(f => f.status === 'W produkcji').length;
    const repair = forms.filter(f => f.status === 'Uszkodzona').length;
    const service = forms.filter(f => f.status === 'Serwis').length;
    const totalCycles = forms.reduce((s, f) => s + Number(f.cycles || 0), 0);
    const todayHistory = history.filter(h => h.date === new Date().toISOString().split('T')[0]);
    const totalProduced = todayHistory.reduce((s, h) => s + Number(h.produced || 0), 0);
    return { total, available, production, repair, service, totalCycles, totalProduced, avgCycles: total ? Math.round(totalCycles / total) : 0 };
  }, [forms, history]);

  // ============================================
  // FILTROWANIE
  // ============================================

  const filteredForms = useMemo(() => forms.filter(f => {
    const q = searchTerm.toLowerCase();
    const match = (f.name + ' ' + f.material + ' ' + f.location + ' ' + f.machine).toLowerCase().includes(q);
    const statusMatch = filterStatus === 'Wszystkie' || f.status === filterStatus;
    return match && statusMatch;
  }), [forms, searchTerm, filterStatus]);

  const pieData = [
    { name: 'Dostępne', value: stats.available, color: '#34d399' },
    { name: 'W produkcji', value: stats.production, color: '#fbbf24' },
    { name: 'Uszkodzone', value: stats.repair, color: '#fb7185' },
    { name: 'Serwis', value: stats.service, color: '#94a3b8' },
  ];

  // ============================================
  // TOAST I NAVIGACJA
  // ============================================

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const logout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoleLabel');
    navigate('/login');
  };

  // ============================================
  // CRUD - FORMY (Z SUPABASE)
  // ============================================

  const openNew = () => { setEditingId(null); setNewForm(emptyForm()); setModal('form'); };
  const openEdit = (form) => { setEditingId(form.id); setNewForm({ ...form }); setModal('form'); };

  const saveForm = async (e) => {
    e.preventDefault();

    if (!newForm.name.trim()) {
      notify('Nazwa formy jest wymagana', 'error');
      return;
    }

    setLoading(true);

    try {
      const last = newForm.lastMaintenance || new Date().toISOString().split('T')[0];
      const next = new Date(last);
      next.setMonth(next.getMonth() + 3);

      const formData = {
        name: newForm.name.trim().toUpperCase(),
        status: newForm.status || 'Dostępna',
        material: newForm.material || '',
        location: newForm.location || '',
        cycles: Number(newForm.cycles) || 0,
        cyclesLimit: Number(newForm.cyclesLimit) || 5000,
        lastMaintenance: last,
        nextMaintenance: next.toISOString().split('T')[0],
        machine: newForm.machine || '',
        temperature: newForm.temperature || '',
        pressure: newForm.pressure || '',
        notes: newForm.notes || ''
      };

      if (editingId) {
        const { data, error } = await supabase
          .from(TABLES.FORMS)
          .update(formData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) {
          console.error('Błąd aktualizacji:', error);
          notify(`❌ ${error.message}`, 'error');
          return;
        }

        setForms(prev =>
          prev.map(form =>
            form.id === editingId
              ? {
                  ...data,
                  cycles: Number(data.cycles) || 0,
                  cyclesLimit: Number(data.cyclesLimit) || 5000
                }
              : form
          )
        );

        notify('✅ Forma zaktualizowana');
      } else {
        const { data, error } = await supabase
          .from(TABLES.FORMS)
          .insert([formData])
          .select()
          .single();

        if (error) {
          console.error('Błąd dodawania:', error);
          notify(`❌ ${error.message}`, 'error');
          return;
        }

        const newItem = {
          ...data,
          cycles: Number(data.cycles) || 0,
          cyclesLimit: Number(data.cyclesLimit) || 5000
        };

        setForms(prev => [newItem, ...prev]);
        notify(`✅ Dodano ${newItem.name}`);
      }

      setModal(null);
      setEditingId(null);
      setNewForm(emptyForm());
    } catch (error) {
      console.error(error);
      notify('❌ Wystąpił błąd podczas zapisu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeForm = async (id) => {
    const f = forms.find(x => x.id === id);
    if (!f) return;

    if (!window.confirm(`⚠️ Usunąć ${f.name}?`)) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from(TABLES.FORMS)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Błąd usuwania:', error);
        notify(`❌ ${error.message}`, 'error');
        return;
      }

      setForms(prev => prev.filter(x => x.id !== id));
      setModal(null);
      notify(`🗑️ Usunięto ${f.name}`, 'warning');
    } catch (error) {
      console.error(error);
      notify('❌ Nie udało się usunąć formy', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RAPORT ZMIANOWY (Z SUPABASE)
  // ============================================

  const saveReport = async (e) => {
    e.preventDefault();
    
    if (!report.formId) { 
      notify('❌ Wybierz formę', 'error'); 
      return; 
    }
    if (!report.operator.trim()) { 
      notify('❌ Wpisz nazwisko operatora', 'error'); 
      return; 
    }
    if (report.produced < 0) { 
      notify('❌ Produkcja nie może być ujemna', 'error'); 
      return; 
    }

    setLoading(true);

    try {
      const form = forms.find(f => f.id === Number(report.formId));
      
      // 1. ZAPISZ RAPORT DO SUPABASE
      const newHistory = {
        form_id: Number(report.formId),
        shift: report.shift,
        operator: report.operator.trim(),
        date: report.date || new Date().toISOString().split('T')[0],
        produced: Number(report.produced) || 0,
        problems: report.problems || 'Brak',
        status: report.status,
        notes: report.notes || ''
      };

      const { data: historyData, error: historyError } = await supabase
        .from(TABLES.HISTORY)
        .insert([newHistory])
        .select();

      if (historyError) {
        console.error('Błąd zapisu historii:', historyError);
        notify(`❌ Nie udało się zapisać raportu: ${historyError.message}`, 'error');
        return;
      }

      // 2. AKTUALIZUJ FORMĘ
      if (form) {
        const newCycles = (form.cycles || 0) + (Number(report.produced) || 0);
        
        const updatedValues = {
          status: report.status,
          cycles: newCycles,
          notes: report.notes || form.notes
        };

        const { data: updatedForm, error: formError } = await supabase
          .from(TABLES.FORMS)
          .update(updatedValues)
          .eq('id', form.id)
          .select()
          .single();

        if (formError) {
          console.error('Błąd aktualizacji formy:', formError);
          notify(`⚠️ Raport zapisany, ale błąd aktualizacji formy: ${formError.message}`, 'error');
          return;
        }

        setForms(prev =>
          prev.map(f =>
            f.id === form.id
              ? {
                  ...updatedForm,
                  cycles: Number(updatedForm.cycles) || 0,
                  cyclesLimit: Number(updatedForm.cyclesLimit) || 5000
                }
              : f
          )
        );
      }

      // 3. AKTUALIZUJ HISTORIĘ W STANIE
      if (historyData && historyData[0]) {
        setHistory(prev => [{
          ...historyData[0],
          formId: historyData[0].form_id
        }, ...prev]);
      }

      notify('✅ Raport zapisany pomyślnie!');
      setReport(emptyReport());
      setActiveTab('dashboard');

    } catch (error) {
      console.error('Błąd:', error);
      notify('❌ Wystąpił błąd podczas zapisu raportu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // POMOCNICZE
  // ============================================

  const statusClass = (s) => {
    if (s === 'Dostępna') return 'status-ok';
    if (s === 'W produkcji') return 'status-work';
    if (s === 'Uszkodzona') return 'status-repair';
    if (s === 'Serwis') return 'status-service';
    return 'status-ok';
  };

  const getStatusIcon = (s) => {
    if (s === 'Dostępna') return <FaCheckCircle className="text-emerald-400" />;
    if (s === 'W produkcji') return <FaTools className="text-amber-400" />;
    if (s === 'Uszkodzona') return <FaExclamationTriangle className="text-rose-400" />;
    if (s === 'Serwis') return <FaWrench className="text-gray-400" />;
    return <FaInfoCircle />;
  };

  const navItems = [
    { id: 'dashboard', icon: FaHome, label: 'Dashboard' },
    { id: 'forms', icon: FaBoxes, label: 'Formy' },
    { id: 'report', icon: FaClipboardCheck, label: 'Raport zmianowy' },
    { id: 'production', icon: FaTools, label: 'Produkcja' },
    { id: 'service', icon: FaWrench, label: 'Serwis' },
    { id: 'history', icon: FaHistory, label: 'Historia' },
    { id: 'reports', icon: FaChartBar, label: 'Raporty' },
    { id: 'users', icon: FaUsers, label: 'Użytkownicy' },
    { id: 'settings', icon: FaCog, label: 'Ustawienia' }
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="app-shell">
      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`toast ${toast.type}`}
          >
            {toast.type === 'success' ? <FaCheckCircle /> :
              toast.type === 'error' ? <FaExclamationCircle /> :
                <FaExclamationTriangle />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR ===== */}
      <motion.aside initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="sidebar">
        <div className="brand">
          <div className="brand-row">
            <div className="brand-mark"><FaBuilding /></div>
            <div>
              <div className="brand-title">FormyOdlewcze</div>
              <div className="brand-sub">Production OS</div>
            </div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-label">Nawigacja</div>
          {navItems.map(({ id, icon: Icon, label }) => {
            const hasAccess = visibleTabs.some(t => t.id === id);
            if (!hasAccess) return null;
            return (
              <button
                key={id}
                className={`nav-item ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="nav-icon" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="user-panel">
          <div className="user-card">
            <div className="avatar"><FaUserCircle /></div>
            <div>
              <div className="user-name">{userName}</div>
              <div className="user-role">{userRoleLabel}</div>
            </div>
          </div>
          <button className="logout" onClick={logout}><FaSignOutAlt /> Wyloguj się</button>
        </div>
      </motion.aside>

      {/* ===== MAIN ===== */}
      <main className="main">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="topbar">
          <div>
            <div className="eyebrow">System zarządzania produkcją</div>
            <h1 className="page-title">
              {activeTab === 'dashboard' ? '📊 Dashboard' :
                activeTab === 'report' ? '📋 Raport zmianowy' :
                  activeTab === 'forms' ? '📦 Formy odlewcze' :
                    activeTab === 'production' ? '⚙️ Produkcja' :
                      activeTab === 'service' ? '🔧 Serwis' :
                        activeTab === 'history' ? '📜 Historia' :
                          activeTab === 'reports' ? '📈 Raporty' :
                            activeTab === 'users' ? '👥 Użytkownicy' :
                              'Dashboard'}
            </h1>
            <div className="page-desc">
              {activeTab === 'dashboard' ? `Dziś wyprodukowano ${stats.totalProduced} szt. na ${forms.filter(f => f.status === 'W produkcji').length} formach` :
                activeTab === 'report' ? 'Zgłoś stan po zakończeniu zmiany' :
                  activeTab === 'forms' ? `Aktywne formy: ${stats.total}` :
                    activeTab === 'service' ? `Zadania serwisowe: ${forms.filter(f => f.status === 'Serwis' || f.status === 'Uszkodzona').length}` :
                      activeTab === 'users' ? `Zarządzaj użytkownikami i ich uprawnieniami` :
                        `Monitoruj i zarządzaj procesem`}
            </div>
          </div>
          <div className="top-actions">
            <div className="search-wrap">
              <FaSearch />
              <input
                className="search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Szukaj formy..."
              />
            </div>
            <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option>Wszystkie</option>
              <option>Dostępna</option>
              <option>W produkcji</option>
              <option>Uszkodzona</option>
              <option>Serwis</option>
            </select>
            {isAdmin && (
              <button className="primary" onClick={() => setActiveTab('users')} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                <FaUsers /> Użytkownicy
              </button>
            )}
            {isAdmin && (
              <button className="primary" onClick={openNew}><FaPlusCircle /> Nowa forma</button>
            )}
          </div>
        </motion.div>

        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <>
            <div className="kpi-grid">
              {[
                ['Formy ogółem', stats.total, FaBoxes, '#60a5fa', 'rgba(96,165,250,.12)', '+12%', true],
                ['W produkcji', stats.production, FaTools, '#fbbf24', 'rgba(251,191,36,.12)', '+8%', true],
                ['Dostępne', stats.available, FaCheckCircle, '#34d399', 'rgba(52,211,153,.12)', '+5%', true],
                ['Serwis / Uszkodzone', stats.repair + stats.service, FaWrench, '#fb7185', 'rgba(251,113,133,.12)', '-3%', false]
              ].map(([label, value, Icon, accent, bg, change, up], i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -3 }}
                  className="card kpi"
                  style={{ '--accent': accent, '--iconbg': bg }}
                >
                  <div className="kpi-head">
                    <span className="kpi-label">{label}</span>
                    <span className="kpi-icon"><Icon /></span>
                  </div>
                  <div className="kpi-value">{value}</div>
                  <div className="kpi-foot">
                    <span className={up ? 'up' : 'down'}>
                      {up ? <FaArrowUp /> : <FaArrowDown />} {change}
                    </span>
                    <span>vs. poprzedni</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <motion.section initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="card panel">
                <div className="panel-head">
                  <div className="panel-title"><FaChartPie /> Status form</div>
                  <span className="panel-meta">{stats.total} aktywów</span>
                </div>
                <div className="donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} innerRadius={55} outerRadius={78} paddingAngle={5} dataKey="value" stroke="none">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0d1624', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, color: '#e2e8f0', fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <div className="donut-value">{stats.total}</div>
                    <div className="donut-label">FORM</div>
                  </div>
                </div>
                <div className="status-list">
                  {pieData.map(x => (
                    <div className="status-row" key={x.name}>
                      <div className="status-left">
                        <span className="legend-dot" style={{ background: x.color }} />
                        {x.name}
                      </div>
                      <div className="status-count">{x.value}</div>
                    </div>
                  ))}
                  <div className="status-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
                    <div className="status-left">📦 Dziś wyprodukowano</div>
                    <div className="status-count" style={{ color: '#22d3ee' }}>{stats.totalProduced} szt.</div>
                  </div>
                </div>
              </motion.section>

              <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="card panel">
                <div className="panel-head">
                  <div className="panel-title"><FaHistory className="text-cyan-400" /> Ostatnie raporty</div>
                  <span className="panel-meta">ostatnie 5</span>
                </div>
                <div style={{ maxHeight: '230px', overflowY: 'auto' }}>
                  {history.slice(0, 5).map(h => {
                    const form = forms.find(f => f.id === h.formId);
                    return (
                      <div key={h.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, color: 'white', fontSize: '12px' }}>{form ? form.name : '—'}</div>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>{h.operator} · {h.date} · <span style={{ color: '#fbbf24' }}>{h.shift || '—'}</span></div>
                        </div>
                        <div style={{ color: '#22d3ee', fontWeight: 700, fontSize: '13px' }}>{h.produced} szt.</div>
                      </div>
                    );
                  })}
                  {history.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#475569' }}>
                      Brak raportów
                    </div>
                  )}
                </div>
              </motion.section>
            </div>

            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card table-panel">
              <div className="table-toolbar">
                <div>
                  <div className="panel-title"><FaHistory /> Ostatnie raporty</div>
                  <div className="panel-meta" style={{ marginTop: 4 }}>Raporty z ostatnich zmian</div>
                </div>
                <button className="primary" onClick={() => setActiveTab('report')} style={{ padding: '6px 14px', fontSize: '12px' }}>
                  <FaClipboardCheck /> Nowy raport
                </button>
              </div>
              <div className="table-wrap" style={{ maxHeight: '200px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data / Zmiana</th>
                      <th>Forma</th>
                      <th>Operator</th>
                      <th>Ilość</th>
                      <th>Problem</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map(h => {
                      const form = forms.find(f => f.id === h.formId);
                      return (
                        <tr key={h.id} className="data-row">
                          <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {h.date}<br /><span style={{ fontSize: '10px', color: '#475569' }}>{h.shift}</span>
                          </td>
                          <td className="form-name">{form ? form.name : '—'}</td>
                          <td>{h.operator}</td>
                          <td style={{ fontWeight: 700, color: '#22d3ee' }}>{h.produced} szt.</td>
                          <td style={{ fontSize: '12px' }}>
                            {h.problems && h.problems !== 'Brak' ?
                              <span style={{ color: '#fb7185' }}>{h.problems}</span> :
                              <span style={{ color: '#34d399' }}>✓ OK</span>}
                          </td>
                          <td>
                            <span className={`status-badge ${statusClass(h.status)}`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {history.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#475569' }}>
                        Brak raportów. Dodaj pierwszy raport zmianowy!
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>
          </>
        )}

        {/* ===== FORMY ===== */}
        {activeTab === 'forms' && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card table-panel">
            <div className="table-toolbar">
              <div>
                <div className="panel-title"><FaBoxes className="text-cyan-400" /> Rejestr form odlewniczych</div>
                <div className="panel-meta" style={{ marginTop: 4 }}>
                  {filteredForms.length} form · {stats.totalCycles.toLocaleString()} cykli łącznie
                </div>
              </div>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <button className="primary" onClick={openNew} style={{ padding: '6px 14px', fontSize: '12px' }}>
                    <FaPlusCircle /> Dodaj
                  </button>
                )}
                <button className="secondary" style={{ padding: '6px 14px', fontSize: '12px' }}><FaFileAlt /> Eksport</button>
              </div>
            </div>
            <div className="table-wrap" style={{ maxHeight: '450px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Forma</th>
                    <th>Status</th>
                    <th>Materiał</th>
                    <th>Lokalizacja</th>
                    <th>Cykle / Limit</th>
                    <th>Maszyna</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map(form => (
                    <motion.tr layout key={form.id} className="data-row" onClick={() => { setSelectedForm(form); setModal('detail'); }}>
                      <td>
                        <div className="form-name">{form.name}</div>
                        <div className="form-id">ID {String(form.id).padStart(4, '0')}</div>
                      </td>
                      <td><span className={`status-badge ${statusClass(form.status)}`}>{form.status}</span></td>
                      <td>{form.material}</td>
                      <td>{form.location}</td>
                      <td style={{ fontWeight: 700 }}>
                        {Number(form.cycles).toLocaleString()} / {Number(form.cyclesLimit || 5000).toLocaleString()}
                        {form.cycles >= (form.cyclesLimit || 5000) && (
                          <span style={{ color: '#fb7185', fontSize: '10px', marginLeft: '4px' }}>⚠️</span>
                        )}
                      </td>
                      <td>{form.machine || '—'}</td>
                      <td>
                        <div className="action-row" onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '4px' }}>
                          {isAdmin && (
                            <>
                              <button className="action edit" onClick={() => openEdit(form)}><FaEdit /></button>
                              <button className="action delete" onClick={() => removeForm(form.id)}><FaTrash /></button>
                            </>
                          )}
                          <button className="action" onClick={() => { setSelectedForm(form); setModal('detail'); }}><FaEye /></button>
                          <button className="action" onClick={() => { setActiveTab('report'); setReport({ ...emptyReport(), formId: form.id }); }} style={{ color: '#fbbf24' }}><FaClipboardCheck /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {!filteredForms.length && (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
                      Nie znaleziono form
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {/* ===== RAPORT ZMIANOWY ===== */}
        {activeTab === 'report' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '24px' }}>
              <div className="panel-title" style={{ marginBottom: '4px', fontSize: '18px' }}>
                <FaClipboardCheck className="text-amber-400" /> Raport zmianowy
              </div>
              <div className="eyebrow" style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                Raport technika · Wprowadź dane po zakończeniu zmiany
              </div>
              
              <form onSubmit={saveReport}>
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaBoxes className="text-cyan-400" /> Wybierz formę *
                    </label>
                    <select
                      value={report.formId}
                      onChange={e => setReport({ ...report, formId: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    >
                      <option value="">— wybierz —</option>
                      {forms.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaClock className="text-cyan-400" /> Zmiana *
                    </label>
                    <select
                      value={report.shift}
                      onChange={e => setReport({ ...report, shift: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    >
                      <option value="I (06:00-14:00)">I (06:00-14:00)</option>
                      <option value="II (14:00-22:00)">II (14:00-22:00)</option>
                      <option value="III (22:00-06:00)">III (22:00-06:00)</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaUser className="text-cyan-400" /> Operator *
                    </label>
                    <input
                      value={report.operator}
                      onChange={e => setReport({ ...report, operator: e.target.value })}
                      placeholder="Imię i nazwisko"
                      required
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    />
                  </div>
                  <div className="field">
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaCalendarAlt className="text-cyan-400" /> Data
                    </label>
                    <input
                      type="date"
                      value={report.date}
                      onChange={e => setReport({ ...report, date: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    />
                  </div>
                  <div className="field">
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaTools className="text-cyan-400" /> Wyprodukowano (szt.) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={report.produced}
                      onChange={e => setReport({ ...report, produced: e.target.value })}
                      placeholder="0"
                      required
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    />
                  </div>
                  <div className="field">
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaExclamationTriangle className="text-cyan-400" /> Problemy
                    </label>
                    <select
                      value={report.problems}
                      onChange={e => setReport({ ...report, problems: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    >
                      <option value="Brak">Brak</option>
                      <option value="Zużycie narzędzi">Zużycie narzędzi</option>
                      <option value="Uszkodzenie mechaniczne">Uszkodzenie mechaniczne</option>
                      <option value="Problem z chłodzeniem">Problem z chłodzeniem</option>
                      <option value="Problem z mocowaniem">Problem z mocowaniem</option>
                      <option value="Inne">Inne</option>
                    </select>
                  </div>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaCheckCircle className="text-cyan-400" /> Nowy status formy *
                    </label>
                    <select
                      value={report.status}
                      onChange={e => setReport({ ...report, status: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none' }}
                    >
                      <option value="W produkcji">⚙️ W produkcji</option>
                      <option value="Dostępna">✅ Dostępna</option>
                      <option value="Uszkodzona">❌ Uszkodzona</option>
                      <option value="Serwis">🔧 Serwis</option>
                    </select>
                  </div>
                  <div className="field" style={{ gridColumn: '1 / -1' }}>
                    <label className="text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                      <FaPen className="text-cyan-400" /> Uwagi
                    </label>
                    <textarea
                      value={report.notes}
                      onChange={e => setReport({ ...report, notes: e.target.value })}
                      placeholder="Dodatkowe informacje o stanie formy..."
                      rows="2"
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: 'white', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>
                
                <div className="modal-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => { setActiveTab('dashboard'); setReport(emptyReport()); }}
                    style={{ flex: 1, padding: '10px 18px' }}
                  >
                    Anuluj
                  </button>
                  <button
                    className="primary"
                    type="submit"
                    disabled={loading}
                    style={{ flex: 2, justifyContent: 'center', background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '10px 18px' }}
                  >
                    {loading ? <><FaSpinner className="fa-spin" /> Zapisywanie…</> : <><FaSave /> Zapisz raport</>}
                  </button>
                </div>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '24px' }}>
              <div className="panel-title" style={{ marginBottom: '16px' }}>
                <FaHistory className="text-cyan-400" /> Ostatnie raporty
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {history.slice(0, 20).map(h => {
                  const form = forms.find(f => f.id === h.formId);
                  return (
                    <div key={h.id} style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'white' }}>
                          {form ? form.name : '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {h.operator} · {h.date} · {h.shift}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#22d3ee' }}>{h.produced} szt.</div>
                        <span className={`status-badge ${statusClass(h.status)}`} style={{ fontSize: '9px', padding: '1px 8px' }}>
                          {h.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {history.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#475569' }}>
                    Brak raportów
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ===== PRODUKCJA ===== */}
        {activeTab === 'production' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
              <div className="card" style={{ padding: '20px' }}>
                <div className="panel-title" style={{ marginBottom: '12px' }}>
                  <FaTools className="text-amber-400" /> Aktywne formy w produkcji
                </div>
                {forms.filter(f => f.status === 'W produkcji').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#475569' }}>
                    Brak form w produkcji
                  </div>
                ) : (
                  forms.filter(f => f.status === 'W produkcji').map(f => (
                    <div key={f.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white' }}>{f.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{f.material} · {f.machine}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#fbbf24', fontWeight: 700 }}>{f.cycles} cykli</div>
                        <div style={{ fontSize: '10px', color: '#475569' }}>limit: {f.cyclesLimit || 5000}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <div className="panel-title" style={{ marginBottom: '12px' }}>
                  <FaClock className="text-cyan-400" /> Ostatnie raporty
                </div>
                {history.slice(0, 5).map(h => {
                  const form = forms.find(f => f.id === h.formId);
                  return (
                    <div key={h.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 500, color: 'white', fontSize: '13px' }}>{form ? form.name : '—'}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          {h.operator} · {h.date} · <span style={{ color: '#fbbf24' }}>{h.shift || '—'}</span>
                        </div>
                      </div>
                      <div style={{ color: '#22d3ee', fontWeight: 700 }}>{h.produced} szt.</div>
                    </div>
                  );
                })}
                {history.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#475569' }}>
                    Brak raportów
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== SERWIS ===== */}
        {activeTab === 'service' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ServicePanel 
              forms={forms} 
              setForms={setForms} 
              setHistory={setHistory} 
              notify={notify} 
              tasks={tasks}
              setTasks={setTasks}
            />
          </motion.div>
        )}

        {/* ===== HISTORIA ===== */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card" style={{ padding: '20px' }}>
              <div className="panel-title" style={{ marginBottom: '12px' }}>
                <FaHistory className="text-cyan-400" /> Pełna historia raportów
              </div>
              <div className="table-wrap" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Forma</th>
                      <th>Operator</th>
                      <th>Ilość</th>
                      <th>Zmiana</th>
                      <th>Status</th>
                      <th>Problemy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#475569' }}>
                        Brak historii
                      </td></tr>
                    ) : (
                      history.map(h => {
                        const form = forms.find(f => f.id === h.formId);
                        return (
                          <tr key={h.id} className="data-row">
                            <td style={{ fontSize: '12px', color: '#94a3b8' }}>{h.date}</td>
                            <td className="form-name">{form ? form.name : '—'}</td>
                            <td>{h.operator}</td>
                            <td style={{ fontWeight: 700, color: '#22d3ee' }}>{h.produced} szt.</td>
                            <td style={{ fontSize: '12px', color: '#fbbf24' }}>{h.shift || '—'}</td>
                            <td><span className={`status-badge ${statusClass(h.status)}`}>{h.status}</span></td>
                            <td style={{ fontSize: '12px' }}>
                              {h.problems && h.problems !== 'Brak' ? (
                                <span style={{ color: '#fb7185' }}>{h.problems}</span>
                              ) : (
                                <span style={{ color: '#34d399' }}>✓ OK</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== RAPORTY ===== */}
        {activeTab === 'reports' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <ReportsPanel history={history} forms={forms} />
          </motion.div>
        )}

        {/* ===== UŻYTKOWNICY ===== */}
        {activeTab === 'users' && isAdmin && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <UsersPanel users={users} setUsers={setUsers} notify={notify} />
          </motion.div>
        )}

        {activeTab === 'users' && !isAdmin && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '34px', textAlign: 'center', minHeight: '360px', display: 'grid', placeItems: 'center' }}>
            <div>
              <div className="brand-mark" style={{ margin: '0 auto 14px', background: 'rgba(251,113,133,0.2)', color: '#fb7185' }}>
                <FaTimesCircle />
              </div>
              <div className="modal-title" style={{ color: '#fb7185' }}>Brak uprawnień</div>
              <div className="page-desc" style={{ marginTop: '7px' }}>
                Nie masz uprawnień do zarządzania użytkownikami.
                Skontaktuj się z administratorem.
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== USTAWIENIA ===== */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="card" style={{ padding: '20px' }}>
                <div className="panel-title" style={{ marginBottom: '12px' }}>
                  <FaCog className="text-cyan-400" /> Ustawienia systemu
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Wersja systemu</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>v4.0 Premium</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Liczba form</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{forms.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Liczba raportów</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{history.length}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#94a3b8' }}>Łącznie cykli</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{stats.totalCycles.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                    <span style={{ color: '#94a3b8' }}>Aktywni użytkownicy</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>{users.filter(u => u.active).length}</span>
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: '20px' }}>
                <div className="panel-title" style={{ marginBottom: '12px' }}>
                  <FaShieldAlt className="text-emerald-400" /> Informacje
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Zalogowany jako</div>
                    <div style={{ color: 'white', fontWeight: 600 }}>{userName}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{userRoleLabel}</div>
                  </div>
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Status systemu</div>
                    <div style={{ color: '#34d399', fontWeight: 600 }}>✅ Online</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== FOOTER ===== */}
        <div className="footer">
          <div className="online">
            System produkcyjny ONLINE · {stats.total} form · {stats.totalCycles.toLocaleString()} cykli
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: '#475569' }}>
              <FaShieldAlt style={{ display: 'inline', marginRight: '4px' }} />
              {userRoleLabel}
            </span>
            <span>FormyOdlewcze · v4.0 Premium</span>
          </div>
        </div>
      </main>

      {/* ===== MODAL - FORMA ===== */}
      <AnimatePresence>
        {modal === 'form' && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && setModal(null)}>
            <motion.div className="modal" initial={{ opacity: 0, y: 25, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 25, scale: .98 }}>
              {!isAdmin ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <div className="brand-mark" style={{ margin: '0 auto 14px', background: 'rgba(251,113,133,0.2)', color: '#fb7185' }}>
                    <FaTimesCircle />
                  </div>
                  <div className="modal-title" style={{ color: '#fb7185' }}>Brak uprawnień</div>
                  <div className="page-desc" style={{ marginTop: '7px' }}>
                    Nie masz uprawnień do dodawania lub edytowania form.
                  </div>
                  <button className="secondary" onClick={() => setModal(null)} style={{ marginTop: '16px' }}>Zamknij</button>
                </div>
              ) : (
                <>
                  <div className="modal-head">
                    <div>
                      <div className="eyebrow">{editingId ? 'Edycja rekordu' : 'Nowy rekord'}</div>
                      <div className="modal-title">{editingId ? 'Edytuj formę' : 'Dodaj nową formę'}</div>
                      <div className="modal-sub">{editingId ? 'Aktualizujesz dane istniejącej formy' : 'Wprowadź podstawowe dane technologiczne'}</div>
                    </div>
                    <button className="close" onClick={() => setModal(null)}><FaTimes /></button>
                  </div>
                  <form onSubmit={saveForm}>
                    <div className="form-grid">
                      {[
                        ['name', 'Nazwa formy', FaBarcode, 'np. FORMA #XYZ-123'],
                        ['material', 'Materiał', FaIndustry, 'np. Aluminium EN AW-6082'],
                        ['location', 'Lokalizacja', FaMapMarkerAlt, 'np. Regał B3 / Slot 12'],
                        ['machine', 'Maszyna', FaIndustry, 'np. CNC-3'],
                        ['cycles', 'Liczba cykli', FaTools, '0'],
                        ['cyclesLimit', 'Limit cykli', FaExclamationTriangle, '5000'],
                        ['lastMaintenance', 'Ostatni przegląd', FaCalendarAlt, ''],
                        ['temperature', 'Temperatura', FaInfoCircle, 'np. 180°C'],
                        ['pressure', 'Ciśnienie', FaInfoCircle, 'np. 60 bar']
                      ].map(([key, label, Icon, placeholder]) => (
                        <div className="field" key={key}>
                          <label><Icon /> {label}</label>
                          <input
                            type={key === 'cycles' || key === 'cyclesLimit' ? 'number' : key === 'lastMaintenance' ? 'date' : 'text'}
                            value={newForm[key] || ''}
                            placeholder={placeholder}
                            onChange={e => setNewForm({ ...newForm, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                      <div className="field">
                        <label><FaCheckCircle /> Status</label>
                        <select value={newForm.status} onChange={e => setNewForm({ ...newForm, status: e.target.value })}>
                          <option>Dostępna</option>
                          <option>W produkcji</option>
                          <option>Uszkodzona</option>
                          <option>Serwis</option>
                        </select>
                      </div>
                      <div className="field full">
                        <label><FaPen /> Uwagi</label>
                        <textarea
                          value={newForm.notes || ''}
                          onChange={e => setNewForm({ ...newForm, notes: e.target.value })}
                          placeholder="Dodatkowe informacje…"
                          rows="2"
                        />
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="secondary" onClick={() => setModal(null)}>Anuluj</button>
                      <button className="primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                        {loading ? <><FaSpinner className="fa-spin" /> Zapisywanie…</> : <><FaSave /> {editingId ? 'Zapisz zmiany' : 'Dodaj formę'}</>}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL - SZCZEGÓŁY ===== */}
      <AnimatePresence>
        {modal === 'detail' && selectedForm && (
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && setModal(null)}>
            <motion.div className="modal small" initial={{ opacity: 0, y: 25, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 25, scale: .98 }}>
              <div className="modal-head">
                <div>
                  <div className="eyebrow">Karta techniczna</div>
                  <div className="modal-title">{selectedForm.name}</div>
                  <div className="modal-sub">
                    <span className={`status-badge ${statusClass(selectedForm.status)}`}>
                      {selectedForm.status}
                    </span>
                  </div>
                </div>
                <button className="close" onClick={() => setModal(null)}><FaTimes /></button>
              </div>
              <div className="detail-grid">
                {[
                  ['Status', selectedForm.status],
                  ['Materiał', selectedForm.material],
                  ['Lokalizacja', selectedForm.location],
                  ['Cykle / Limit', `${Number(selectedForm.cycles).toLocaleString()} / ${Number(selectedForm.cyclesLimit || 5000).toLocaleString()}`],
                  ['Maszyna', selectedForm.machine || '—'],
                  ['Temperatura', selectedForm.temperature || '—'],
                  ['Ciśnienie', selectedForm.pressure || '—'],
                  ['Ostatni przegląd', selectedForm.lastMaintenance || '—'],
                  ['Następny przegląd', selectedForm.nextMaintenance || '—'],
                  ['Utworzono', selectedForm.created || '—'],
                  ['Uwagi', selectedForm.notes || 'Brak uwag']
                ].map(([a, b], i) => (
                  <div key={a} className={`detail ${i === 10 ? 'full' : ''}`}>
                    <div className="detail-label">{a}</div>
                    <div className="detail-value">{b}</div>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="secondary" onClick={() => setModal(null)}>Zamknij</button>
                {isAdmin && (
                  <>
                    <button className="secondary" onClick={() => openEdit(selectedForm)}><FaEdit /> Edytuj</button>
                    <button className="danger" onClick={() => removeForm(selectedForm.id)}><FaTrash /> Usuń</button>
                  </>
                )}
                <button className="secondary" onClick={() => { setActiveTab('report'); setReport({ ...emptyReport(), formId: selectedForm.id }); setModal(null); }} style={{ borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                  <FaClipboardCheck /> Raport
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
