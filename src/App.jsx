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
  // Stan główny - wczytuje dane z localStorage przy starcie
  const [forms, setForms] = useState(() => loadFormsFromLocalStorage());
  
  // Stan dla formularza dodawania
  const [newForm, setNewForm] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  // Zapisz dane za każdym razem, gdy się zmienią
  useEffect(() => {
    saveFormsToLocalStorage(forms);
  }, [forms]);

  // Funkcja do dodawania nowej formy
  const addForm = (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    
    const formToAdd = {
      id: Date.now(),
      ...newForm,
      createdAt: new Date().toISOString()
    };
    
    setForms([...forms, formToAdd]);
    setNewForm({ name: '', description: '', status: 'active' });
  };

  // Funkcja do usuwania formy
  const deleteForm = (id) => {
    setForms(forms.filter(form => form.id !== id));
  };

  // Funkcja do zmiany statusu
  const toggleStatus = (id) => {
    setForms(forms.map(form => 
      form.id === id 
        ? { ...form, status: form.status === 'active' ? 'inactive' : 'active' }
        : form
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Platforma do zarządzania formami odlewczymi
        </h1>
        
        {/* Formularz dodawania */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Dodaj nową formę</h2>
          <form onSubmit={addForm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa formy
              </label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Wprowadź nazwę formy"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis
              </label>
              <textarea
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Krótki opis formy"
                rows="3"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={newForm.status}
                onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Aktywna</option>
                <option value="inactive">Nieaktywna</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Dodaj formę
            </button>
          </form>
        </div>

        {/* Lista form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Lista form ({forms.length})
          </h2>
          
          {forms.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Brak dodanych form. Dodaj pierwszą formę!
            </p>
          ) : (
            <div className="space-y-4">
              {forms.map((form) => (
                <div
                  key={form.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {form.name}
                      </h3>
                      {form.description && (
                        <p className="text-gray-600 mt-1">{form.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          form.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {form.status === 'active' ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Dodano: {new Date(form.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleStatus(form.id)}
                        className={`px-3 py-1 text-sm rounded ${
                          form.status === 'active'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {form.status === 'active' ? 'Dezaktywuj' : 'Aktywuj'}
                      </button>
                      <button
                        onClick={() => deleteForm(form.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
