import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaPlusCircle, FaEdit, FaTrash, FaTimes, FaSave,
  FaUser, FaLock, FaUserTag, FaCheckCircle, FaTimesCircle,
  FaSpinner, FaKey, FaShieldAlt, FaHome, FaBoxes, FaClipboardCheck,
  FaTools, FaWrench, FaHistory, FaChartBar, FaCog, FaCheck, FaMinus
} from 'react-icons/fa';
import { ROLES, ROLE_LABELS, PERMISSIONS } from '../data/users';

const ALL_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: FaHome },
  { id: 'forms', label: 'Formy', icon: FaBoxes },
  { id: 'report', label: 'Raport zmianowy', icon: FaClipboardCheck },
  { id: 'production', label: 'Produkcja', icon: FaTools },
  { id: 'service', label: 'Serwis', icon: FaWrench },
  { id: 'maintenance', label: 'Utrzymanie', icon: FaWrench },
  { id: 'history', label: 'Historia', icon: FaHistory },
  { id: 'reports', label: 'Raporty', icon: FaChartBar },
  { id: 'settings', label: 'Ustawienia', icon: FaCog },
  { id: 'users', label: 'Użytkownicy', icon: FaUsers }
];

const ROLE_TEMPLATES = {
  [ROLES.ADMIN]: {
    label: '👑 Administrator',
    desc: 'Pełny dostęp do wszystkiego',
    permissions: Object.keys(PERMISSIONS[ROLES.ADMIN])
  },
  [ROLES.TECHNIK]: {
    label: '🔧 Technik / Ustawiacz',
    desc: 'Dostęp do raportów i form',
    permissions: Object.keys(PERMISSIONS[ROLES.TECHNIK]).filter(k => PERMISSIONS[ROLES.TECHNIK][k])
  },
  [ROLES.KIEROWNIK]: {
    label: '📋 Kierownik produkcji',
    desc: 'Dostęp do zarządzania i raportów',
    permissions: Object.keys(PERMISSIONS[ROLES.KIEROWNIK]).filter(k => PERMISSIONS[ROLES.KIEROWNIK][k])
  },
  [ROLES.OBSERWATOR]: {
    label: '👀 Obserwator',
    desc: 'Tylko podgląd',
    permissions: Object.keys(PERMISSIONS[ROLES.OBSERWATOR]).filter(k => PERMISSIONS[ROLES.OBSERWATOR][k])
  }
};

function UsersPanel({ users, setUsers, notify }) {
  const [modal, setModal] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(ROLES.TECHNIK);
  
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: ROLES.TECHNIK,
    active: true,
    customPermissions: {}
  });

  const [loading, setLoading] = useState(false);

  const openNew = () => {
    setEditingUser(null);
    setSelectedRole(ROLES.TECHNIK);
    setNewUser({
      username: '',
      password: '',
      name: '',
      role: ROLES.TECHNIK,
      active: true,
      customPermissions: { ...PERMISSIONS[ROLES.TECHNIK] }
    });
    setModal('form');
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setNewUser({
      username: user.username,
      password: '',
      name: user.name || '',
      role: user.role,
      active: user.active,
      customPermissions: user.customPermissions ? { ...user.customPermissions } : { ...PERMISSIONS[user.role] }
    });
    setModal('form');
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setNewUser(prev => ({
      ...prev,
      role: role,
      customPermissions: { ...PERMISSIONS[role] }
    }));
  };

  const togglePermission = (tabId) => {
    setNewUser(prev => ({
      ...prev,
      customPermissions: {
        ...prev.customPermissions,
        [tabId]: !prev.customPermissions[tabId]
      }
    }));
  };

  const saveUser = (e) => {
    e.preventDefault();
    
    if (!newUser.username.trim()) {
      notify('❌ Nazwa użytkownika jest wymagana', 'error');
      return;
    }
    if (!editingUser && !newUser.password.trim()) {
      notify('❌ Hasło jest wymagane dla nowego użytkownika', 'error');
      return;
    }
    
    const exists = users.find(u => 
      u.username === newUser.username && u.id !== (editingUser?.id || -1)
    );
    if (exists) {
      notify('❌ Użytkownik o tej nazwie już istnieje', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const currentUsername = localStorage.getItem('username');
      
      if (editingUser) {
        setUsers(prev => prev.map(u =>
          u.id === editingUser.id
            ? {
                ...u,
                username: newUser.username,
                name: newUser.name,
                role: newUser.role,
                active: newUser.active,
                password: newUser.password || u.password,
                customPermissions: newUser.customPermissions
              }
            : u
        ));
        
        if (currentUsername === editingUser.username) {
          localStorage.setItem('userRole', newUser.role);
          localStorage.setItem('userRoleLabel', ROLE_LABELS[newUser.role]);
          localStorage.setItem('userName', newUser.name || newUser.username);
          notify(`✅ Zaktualizowano Twoje uprawnienia - odświeżanie...`, 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          notify(`✅ Zaktualizowano użytkownika ${newUser.username}`, 'success');
        }
      } else {
        const newId = Math.max(...users.map(u => u.id), 0) + 1;
        setUsers(prev => [...prev, {
          id: newId,
          username: newUser.username,
          password: newUser.password,
          name: newUser.name || newUser.username,
          role: newUser.role,
          active: newUser.active,
          created: new Date().toISOString().split('T')[0],
          customPermissions: newUser.customPermissions
        }]);
        notify(`✅ Dodano użytkownika ${newUser.username}`, 'success');
      }
      
      setModal(null);
      setLoading(false);
    }, 400);
  };

  const toggleUserStatus = (user) => {
    if (user.username === 'admin') {
      notify('❌ Nie można zablokować głównego administratora', 'error');
      return;
    }
    
    const newStatus = !user.active;
    setUsers(prev => prev.map(u =>
      u.id === user.id ? { ...u, active: newStatus } : u
    ));
    
    const currentUsername = localStorage.getItem('username');
    if (currentUsername === user.username && !newStatus) {
      notify('⛔ Twoje konto zostało zablokowane - wylogowanie...', 'error');
      setTimeout(() => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoleLabel');
        window.location.href = '/login';
      }, 1500);
    } else {
      notify(`${newStatus ? '🔓 Odblokowano' : '🔒 Zablokowano'} użytkownika ${user.username}`, 'warning');
    }
  };

  const deleteUser = (user) => {
    if (user.username === 'admin') {
      notify('❌ Nie można usunąć głównego administratora', 'error');
      return;
    }
    if (!window.confirm(`⚠️ Usunąć użytkownika ${user.username}?`)) return;
    
    const currentUsername = localStorage.getItem('username');
    if (currentUsername === user.username) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      notify('🗑️ Twoje konto zostało usunięte - wylogowanie...', 'warning');
      setTimeout(() => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userRoleLabel');
        window.location.href = '/login';
      }, 1500);
    } else {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      notify(`🗑️ Usunięto ${user.username}`, 'warning');
    }
    setModal(null);
  };

  const getRoleBadge = (role) => {
    const colors = {
      [ROLES.ADMIN]: 'bg-rose-500/20 text-rose-400 border-rose-400/20',
      [ROLES.TECHNIK]: 'bg-blue-500/20 text-blue-400 border-blue-400/20',
      [ROLES.KIEROWNIK]: 'bg-amber-500/20 text-amber-400 border-amber-400/20',
      [ROLES.OBSERWATOR]: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/20'
    };
    return colors[role] || 'bg-gray-500/20 text-gray-400';
  };

  const getPermissionsCount = (user) => {
    const perms = user.customPermissions || PERMISSIONS[user.role] || {};
    return Object.values(perms).filter(v => v).length;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <div className="eyebrow">Zarządzanie dostępem</div>
          <h2 className="page-title" style={{ fontSize: '22px' }}>
            <FaUsers className="text-cyan-400" /> Użytkownicy systemu
          </h2>
          <div className="page-desc">
            {users.filter(u => u.active).length} aktywnych · {users.length} łącznie
          </div>
        </div>
        <button className="primary" onClick={openNew}>
          <FaPlusCircle /> Nowy użytkownik
        </button>
      </div>

      <div className="card table-panel" style={{ padding: '18px 20px' }}>
        <div className="table-wrap" style={{ maxHeight: '450px' }}>
          <table>
            <thead>
              <tr>
                <th>Użytkownik</th>
                <th>Rola</th>
                <th>Uprawnienia</th>
                <th>Status</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const permsCount = getPermissionsCount(user);
                const isCurrentUser = localStorage.getItem('username') === user.username;
                return (
                  <motion.tr
                    key={user.id}
                    layout
                    className="data-row"
                    style={{ opacity: user.active ? 1 : 0.5 }}
                  >
                    <td>
                      <div className="form-name">
                        <FaUser className="text-cyan-400" style={{ fontSize: '12px', marginRight: '6px' }} />
                        {user.username}
                        {isCurrentUser && (
                          <span style={{ fontSize: '9px', color: '#22d3ee', marginLeft: '6px' }}>(Ty)</span>
                        )}
                      </div>
                      <div className="form-id">{user.name || user.username}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getRoleBadge(user.role)}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {permsCount} / {Object.keys(PERMISSIONS[ROLES.ADMIN]).length} zakładek
                      </span>
                    </td>
                    <td>
                      {user.active ? (
                        <span className="status-badge status-ok">✅ Aktywny</span>
                      ) : (
                        <span className="status-badge status-repair">⛔ Zablokowany</span>
                      )}
                    </td>
                    <td>
                      <div className="action-row" style={{ display: 'flex', gap: '4px' }}>
                        <button className="action edit" onClick={() => openEdit(user)} title="Edytuj">
                          <FaEdit />
                        </button>
                        <button
                          className="action"
                          onClick={() => toggleUserStatus(user)}
                          title={user.active ? 'Zablokuj' : 'Odblokuj'}
                          style={{ color: user.active ? '#fbbf24' : '#34d399' }}
                        >
                          {user.active ? <FaTimesCircle /> : <FaCheckCircle />}
                        </button>
                        {user.username !== 'admin' && (
                          <button className="action delete" onClick={() => deleteUser(user)} title="Usuń">
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL - NOWY/EDYCJA UŻYTKOWNIKA */}
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
              style={{ maxWidth: '800px' }}
              initial={{ opacity: 0, y: 25, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 25, scale: .98 }}
            >
              <div className="modal-head">
                <div>
                  <div className="eyebrow">{editingUser ? 'Edycja' : 'Nowy użytkownik'}</div>
                  <div className="modal-title">
                    {editingUser ? 'Edytuj użytkownika' : 'Dodaj nowego użytkownika'}
                  </div>
                  <div className="modal-sub">
                    {editingUser ? 'Aktualizuj dane i uprawnienia' : 'Utwórz konto dla nowego pracownika'}
                  </div>
                </div>
                <button className="close" onClick={() => setModal(null)}><FaTimes /></button>
              </div>

              <form onSubmit={saveUser}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label><FaUser /> Nazwa użytkownika *</label>
                      <input
                        value={newUser.username}
                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="np. technik3"
                        required
                      />
                    </div>
                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label><FaLock /> {editingUser ? 'Nowe hasło (opcjonalnie)' : 'Hasło *'}</label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder={editingUser ? 'Zostaw puste aby nie zmieniać' : 'Wprowadź hasło'}
                        required={!editingUser}
                      />
                    </div>
                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label><FaUserTag /> Imię i nazwisko</label>
                      <input
                        value={newUser.name}
                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="np. Jan Kowalski"
                      />
                    </div>
                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label><FaCheckCircle /> Status</label>
                      <div style={{ display: 'flex', gap: '16px', paddingTop: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            checked={newUser.active === true}
                            onChange={() => setNewUser({ ...newUser, active: true })}
                          /> Aktywny
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            checked={newUser.active === false}
                            onChange={() => setNewUser({ ...newUser, active: false })}
                          /> Zablokowany
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="field" style={{ marginBottom: '12px' }}>
                      <label><FaShieldAlt /> Rola *</label>
                      <select
                        value={newUser.role}
                        onChange={e => handleRoleChange(e.target.value)}
                        style={{ marginBottom: '4px' }}
                      >
                        {Object.entries(ROLE_TEMPLATES).map(([role, data]) => (
                          <option key={role} value={role}>{data.label}</option>
                        ))}
                      </select>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        {ROLE_TEMPLATES[newUser.role]?.desc}
                      </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <FaKey /> Uprawnienia do zakładek
                        <span style={{ fontSize: '10px', color: '#475569' }}>
                          (zaznacz co ma widzieć)
                        </span>
                      </label>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '4px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '10px',
                        padding: '8px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {ALL_TABS.map(tab => {
                          const Icon = tab.icon;
                          const isChecked = newUser.customPermissions?.[tab.id] || false;
                          return (
                            <label
                              key={tab.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: isChecked ? '#e2e8f0' : '#475569',
                                background: isChecked ? 'rgba(34,211,238,0.08)' : 'transparent',
                                transition: 'all 0.2s'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(tab.id)}
                                style={{ accentColor: '#22d3ee' }}
                              />
                              <Icon style={{ fontSize: '12px' }} />
                              {tab.label}
                            </label>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '6px' }}>
                        Wybrano: {Object.values(newUser.customPermissions || {}).filter(v => v).length} z {ALL_TABS.length} zakładek
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#64748b', marginRight: '6px' }}>📋 Wynikowe uprawnienia:</span>
                  {ALL_TABS.map(tab => {
                    const hasAccess = newUser.customPermissions?.[tab.id] || false;
                    return (
                      <span
                        key={tab.id}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: hasAccess ? 'rgba(34,211,238,0.12)' : 'rgba(71,85,105,0.2)',
                          color: hasAccess ? '#22d3ee' : '#475569',
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        {hasAccess ? <FaCheck style={{ fontSize: '8px' }} /> : <FaMinus style={{ fontSize: '8px' }} />}
                        {tab.label}
                      </span>
                    );
                  })}
                </div>

                <div className="modal-actions" style={{ marginTop: '12px' }}>
                  <button type="button" className="secondary" onClick={() => setModal(null)}>Anuluj</button>
                  <button className="primary" type="submit" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                    {loading ? (
                      <><FaSpinner className="fa-spin" /> Zapisywanie…</>
                    ) : (
                      <><FaSave /> {editingUser ? 'Zapisz zmiany' : 'Dodaj użytkownika'}</>
                    )}
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

export default UsersPanel;