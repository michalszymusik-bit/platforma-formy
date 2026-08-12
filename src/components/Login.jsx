import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaSignInAlt, FaBuilding, FaShieldAlt } from 'react-icons/fa';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ⭐ WYCZYŚĆ WSZYSTKIE DANE SESJI PRZY KAŻDYM WEJŚCIU NA LOGIN
  useEffect(() => {
    console.log('🧹 Czyszczenie sesji...');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userRoleLabel');
    // Wyczyść też wszystkie inne dane
    sessionStorage.clear();
    console.log('✅ Sesja wyczyszczona');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Pobieramy użytkowników z localStorage
    let users = [];
    try {
      const storedUsers = localStorage.getItem('forma_odlewcze_users');
      if (storedUsers) {
        users = JSON.parse(storedUsers);
      }
    } catch (e) {
      console.error('Błąd odczytu użytkowników:', e);
    }

    // Jeśli nie ma użytkowników w localStorage, używamy domyślnych
    if (users.length === 0) {
      users = [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator', active: true },
        { id: 2, username: 'technik1', password: 'tech123', role: 'technik', name: 'Jan Kowalski', active: true },
        { id: 3, username: 'technik2', password: 'tech123', role: 'technik', name: 'Piotr Nowak', active: true },
        { id: 4, username: 'kierownik', password: 'kier123', role: 'kierownik', name: 'Marek Wiśniewski', active: true },
        { id: 5, username: 'obserwator', password: 'obs123', role: 'obserwator', name: 'Anna Lewandowska', active: true }
      ];
    }
    
    // Szukamy użytkownika
    const user = users.find(u =>
      u.username === username && 
      u.password === password && 
      u.active !== false
    );

    setTimeout(() => {
      if (user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user.username);
        localStorage.setItem('userName', user.name || user.username);
        localStorage.setItem('userRole', user.role);
        
        const roleLabels = {
          admin: '👑 Administrator',
          technik: '🔧 Technik / Ustawiacz',
          kierownik: '📋 Kierownik produkcji',
          obserwator: '👀 Obserwator'
        };
        localStorage.setItem('userRoleLabel', roleLabels[user.role] || user.role);
        
        window.location.href = '/dashboard';
      } else {
        const exists = users.find(u => u.username === username);
        if (exists && exists.active === false) {
          setError('❌ Konto jest zablokowane. Skontaktuj się z administratorem.');
        } else if (exists) {
          setError('❌ Nieprawidłowe hasło');
        } else {
          setError('❌ Nieprawidłowa nazwa użytkownika lub hasło');
        }
        setLoading(false);
      }
    }, 650);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
    }}>
      <div style={{ 
        position: 'absolute', 
        width: 420, 
        height: 420, 
        borderRadius: '50%', 
        background: 'rgba(6,182,212,.08)', 
        filter: 'blur(90px)', 
        top: -180, 
        right: -120 
      }} />
      <div style={{ 
        position: 'absolute', 
        width: 360, 
        height: 360, 
        borderRadius: '50%', 
        background: 'rgba(37,99,235,.09)', 
        filter: 'blur(90px)', 
        bottom: -180, 
        left: -100 
      }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: .5 }} 
        style={{ width: 'min(430px,92vw)', position: 'relative', zIndex: 2 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <motion.div 
            whileHover={{ scale: 1.04, rotate: 2 }} 
            style={{ 
              margin: '0 auto 13px', 
              width: 54, 
              height: 54, 
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
              color: 'white',
              fontSize: '22px'
            }}
          >
            <FaBuilding />
          </motion.div>
          <div style={{ color: '#22d3ee', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Production Management Platform
          </div>
          <h1 style={{ fontSize: 28, color: 'white', margin: '4px 0' }}>
            Formy<span style={{ color: '#22d3ee' }}>Odlewcze</span>
          </h1>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
            System zarządzania formami odlewniczymi
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: .97 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: .1 }} 
          style={{ 
            padding: 22, 
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px'
          }}
        >
          <form onSubmit={handleLogin}>
            {error && (
              <div style={{ 
                marginBottom: 14,
                background: 'rgba(251,113,133,0.15)',
                color: '#fb7185',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(251,113,133,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px'
              }}>
                <FaShieldAlt /> {error}
              </div>
            )}
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUser style={{ color: '#22d3ee' }} /> Nazwa użytkownika
              </label>
              <input 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Wprowadź nazwę użytkownika" 
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaLock style={{ color: '#22d3ee' }} /> Hasło
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Wprowadź hasło" 
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <button 
              disabled={loading} 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                marginTop: 15,
                padding: '12px',
                background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? 'Logowanie…' : <><FaSignInAlt /> Zaloguj się</>}
            </button>

            <div style={{ 
              borderTop: '1px solid rgba(255,255,255,0.06)', 
              marginTop: 16, 
              paddingTop: 13, 
              textAlign: 'center', 
              fontSize: 11, 
              color: '#475569',
              letterSpacing: '0.5px'
            }}>
              <FaShieldAlt style={{ color: '#34d399', marginRight: 5, display: 'inline' }} />
              System zarządzania formami odlewniczymi v4.0
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}