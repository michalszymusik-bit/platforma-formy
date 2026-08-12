// ============================================
// BAZA UŻYTKOWNIKÓW Z ROLAMI
// ============================================

export const ROLES = {
  ADMIN: 'admin',
  TECHNIK: 'technik',
  KIEROWNIK: 'kierownik',
  OBSERWATOR: 'obserwator'
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: '👑 Administrator',
  [ROLES.TECHNIK]: '🔧 Technik / Ustawiacz',
  [ROLES.KIEROWNIK]: '📋 Kierownik produkcji',
  [ROLES.OBSERWATOR]: '👀 Obserwator'
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: {
    dashboard: true,
    forms: true,
    report: true,
    production: true,
    maintenance: true,
    history: true,
    reports: true,
    settings: true,
    users: true,
    service: true
  },
  [ROLES.TECHNIK]: {
    dashboard: true,
    forms: true,
    report: true,
    production: true,
    maintenance: true,
    history: true,
    reports: false,
    settings: false,
    users: false,
    service: true
  },
  [ROLES.KIEROWNIK]: {
    dashboard: true,
    forms: true,
    report: true,
    production: true,
    maintenance: true,
    history: true,
    reports: true,
    settings: false,
    users: false,
    service: true
  },
  [ROLES.OBSERWATOR]: {
    dashboard: true,
    forms: true,
    report: false,
    production: true,
    maintenance: false,
    history: true,
    reports: false,
    settings: false,
    users: false,
    service: false
  }
};

export const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: ROLES.ADMIN,
    name: 'Administrator',
    active: true,
    created: '2024-01-01',
    customPermissions: {
      dashboard: true,
      forms: true,
      report: true,
      production: true,
      maintenance: true,
      history: true,
      reports: true,
      settings: true,
      users: true,
      service: true
    }
  },
  {
    id: 2,
    username: 'technik1',
    password: 'tech123',
    role: ROLES.TECHNIK,
    name: 'Jan Kowalski',
    active: true,
    created: '2024-01-15',
    customPermissions: {
      dashboard: true,
      forms: true,
      report: true,
      production: true,
      maintenance: true,
      history: true,
      reports: false,
      settings: false,
      users: false,
      service: true
    }
  },
  {
    id: 3,
    username: 'technik2',
    password: 'tech123',
    role: ROLES.TECHNIK,
    name: 'Piotr Nowak',
    active: true,
    created: '2024-02-01',
    customPermissions: {
      dashboard: true,
      forms: true,
      report: true,
      production: true,
      maintenance: true,
      history: true,
      reports: false,
      settings: false,
      users: false,
      service: true
    }
  },
  {
    id: 4,
    username: 'kierownik',
    password: 'kier123',
    role: ROLES.KIEROWNIK,
    name: 'Marek Wiśniewski',
    active: true,
    created: '2024-01-10',
    customPermissions: {
      dashboard: true,
      forms: true,
      report: true,
      production: true,
      maintenance: true,
      history: true,
      reports: true,
      settings: false,
      users: false,
      service: true
    }
  },
  {
    id: 5,
    username: 'obserwator',
    password: 'obs123',
    role: ROLES.OBSERWATOR,
    name: 'Anna Lewandowska',
    active: true,
    created: '2024-03-01',
    customPermissions: {
      dashboard: true,
      forms: true,
      report: false,
      production: true,
      maintenance: false,
      history: true,
      reports: false,
      settings: false,
      users: false,
      service: false
    }
  }
];

// ============================================
// FUNKCJE
// ============================================

export const getUserPermissions = (user) => {
  if (!user) return PERMISSIONS[ROLES.OBSERWATOR];
  if (user.customPermissions) {
    return user.customPermissions;
  }
  return PERMISSIONS[user.role] || PERMISSIONS[ROLES.OBSERWATOR];
};

export const isAuthorized = (user, tabId) => {
  const perms = getUserPermissions(user);
  return perms[tabId] || false;
};

export const getVisibleTabs = (user) => {
  if (!user) {
    return [{ id: 'dashboard', label: 'Dashboard', icon: 'FaHome' }];
  }
  
  const perms = getUserPermissions(user);
  
  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'FaHome' },
    { id: 'forms', label: 'Formy', icon: 'FaBoxes' },
    { id: 'report', label: 'Raport zmianowy', icon: 'FaClipboardCheck' },
    { id: 'production', label: 'Produkcja', icon: 'FaTools' },
    { id: 'service', label: 'Serwis', icon: 'FaWrench' },
    { id: 'maintenance', label: 'Utrzymanie', icon: 'FaWrench' },
    { id: 'history', label: 'Historia', icon: 'FaHistory' },
    { id: 'reports', label: 'Raporty', icon: 'FaChartBar' },
    { id: 'settings', label: 'Ustawienia', icon: 'FaCog' },
    { id: 'users', label: 'Użytkownicy', icon: 'FaUsers' }
  ];
  
  return allTabs.filter(tab => perms[tab.id] === true);
};

export const getUserByUsername = (username, users) => {
  return users.find(u => u.username === username);
};

export const getCurrentUser = (users) => {
  const username = localStorage.getItem('username');
  if (!username) return null;
  return getUserByUsername(username, users);
};

// ⭐ FUNKCJA DO AKTUALIZACJI UPRAWNIEŃ
export const ensureServicePermission = (users) => {
  return users.map(user => {
    if (user.customPermissions) {
      const updatedPerms = { ...user.customPermissions };
      // Dla wszystkich oprócz obserwatora - service: true
      if (user.role === ROLES.OBSERWATOR) {
        updatedPerms.service = false;
      } else {
        updatedPerms.service = true;
      }
      return { ...user, customPermissions: updatedPerms };
    }
    return user;
  });
};