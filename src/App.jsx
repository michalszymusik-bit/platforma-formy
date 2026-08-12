import { useState, useEffect } from 'react';
import './App.css';

// Funkcje do obsługi localStorage
const saveFormsToLocalStorage = (forms) => {
  try {
    localStorage.setItem('platformaFormy', JSON.stringify(forms));
  } catch (error) {
    console.error('Błąd zapisu do localStorage:', error);
  }
};

const loadFormsFromLocalStorage = () => {
  try {
    const saved = localStorage.getItem('platformaFormy');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Błąd odczytu z localStorage:', error);
  }
  return [];
};

function App() {
  const [forms, setForms] = useState(() => loadFormsFromLocalStorage());
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    status: 'active'
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    saveFormsToLocalStorage(forms);
  }, [forms]);

  const addForm = (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    
    if (editingId) {
      // Edycja
      setForms(forms.map(form => 
        form.id === editingId 
          ? { ...form, ...newForm }
          : form
      ));
      setEditingId(null);
    } else {
      // Dodawanie
      const formToAdd = {
        id: Date.now(),
        ...newForm,
        createdAt: new Date().toISOString()
      };
      setForms([...forms, formToAdd]);
    }
    
    setNewForm({ name: '', description: '', status: 'active' });
  };

  const deleteForm = (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę formę?')) {
      setForms(forms.filter(form => form.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setForms(forms.map(form => 
      form.id === id 
        ? { ...form, status: form.status === 'active' ? 'inactive' : 'active' }
        : form
    ));
  };

  const startEdit = (form) => {
    setEditingId(form.id);
    setNewForm({
      name: form.name,
      description: form.description || '',
      status: form.status
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewForm({ name: '', description: '', status: 'active' });
  };

  const clearAllData = () => {
    if (window.confirm('Czy na pewno chcesz usunąć WSZYSTKIE dane?')) {
      setForms([]);
      localStorage.removeItem('platformaFormy');
    }
  };

  // Filtrowanie form
  const filteredForms = forms.filter(form => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>📋 Platforma Form</h1>
        <p className="header-subtitle">Zarządzaj swoimi formami odlewczymi</p>
      </header>

      <main className="app-main">
        {/* Formularz dodawania/edycji */}
        <div className="form-card">
          <h2>{editingId ? '✏️ Edytuj formę' : '➕ Dodaj nową formę'}</h2>
          <form onSubmit={addForm} className="form-group">
            <div className="input-group">
              <label>Nazwa formy *</label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                placeholder="Wprowadź nazwę formy"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Opis</label>
              <textarea
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                placeholder="Krótki opis formy"
                rows="3"
              />
            </div>
            
            <div className="input-group">
              <label>Status</label>
              <select
                value={newForm.status}
                onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
              >
                <option value="active">✅ Aktywna</option>
                <option value="inactive">⛔ Nieaktywna</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? '💾 Zapisz zmiany' : '➕ Dodaj formę'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  ❌ Anuluj
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Wyszukiwarka i licznik */}
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj form..."
              className="search-input"
            />
          </div>
          <div className="toolbar-stats">
            <span className="badge">{filteredForms.length} / {forms.length} form</span>
            {forms.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={clearAllData}>
                🗑️ Wyczyść wszystko
              </button>
            )}
          </div>
        </div>

        {/* Lista form */}
        <div className="forms-list">
          {filteredForms.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>{searchTerm ? 'Nie znaleziono form' : 'Brak dodanych form'}</p>
              <p className="empty-subtext">
                {searchTerm ? 'Spróbuj zmienić kryteria wyszukiwania' : 'Dodaj pierwszą formę!'}
              </p>
            </div>
          ) : (
            filteredForms.map((form) => (
              <div key={form.id} className="form-item">
                <div className="form-item-header">
                  <h3 className="form-item-title">{form.name}</h3>
                  <span className={`status-badge ${form.status}`}>
                    {form.status === 'active' ? '✅ Aktywna' : '⛔ Nieaktywna'}
                  </span>
                </div>
                
                {form.description && (
                  <p className="form-item-description">{form.description}</p>
                )}
                
                <div className="form-item-footer">
                  <span className="form-item-date">
                    📅 {new Date(form.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                  <div className="form-item-actions">
                    <button className="btn btn-edit" onClick={() => startEdit(form)}>
                      ✏️
                    </button>
                    <button className="btn btn-status" onClick={() => toggleStatus(form.id)}>
                      {form.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button className="btn btn-delete" onClick={() => deleteForm(form.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>© 2026 Platforma Form | Dane zapisywane w localStorage</p>
      </footer>
    </div>
  );
}

export default App;
