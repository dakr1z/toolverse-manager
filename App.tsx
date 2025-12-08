import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ToolLibrary from './pages/ToolLibrary';
import SubscriptionManager from './pages/SubscriptionManager';
import WorkflowBuilder from './pages/WorkflowBuilder';
import ToolForm from './components/ToolForm';
import { Tool, Workflow, FirebaseConfig } from './types';
import { getTools, saveTools, importData, getWorkflows, saveWorkflows } from './services/storageService';
import { initFirebase, loginWithGoogle, logoutFirebase, getCurrentUser, saveUserDataToCloud, loadUserDataFromCloud, isFirebaseInitialized, testFirestoreConnection } from './services/firebaseService';
import { Moon, Sun, Menu, User, Download, Upload, Image as ImageIcon, Lock, Unlock, ShieldCheck, LogOut, Cloud, RefreshCw, CheckCircle, AlertTriangle, HelpCircle, Copy, Clipboard, Link, Activity } from 'lucide-react';

const PIN_STORAGE_KEY = 'toolverse_security_pin';
const FIREBASE_CONFIG_KEY = 'toolverse_firebase_config';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAxsyJ-aVsPdmVylSIon2yJmS1bseoiDgo",
  authDomain: "toolbox-6e1c6.firebaseapp.com",
  projectId: "toolbox-6e1c6",
  storageBucket: "toolbox-6e1c6.firebasestorage.app",
  messagingSenderId: "959858983920",
  appId: "1:959858983920:web:da1bda4ad17a1447289335"
};

const App: React.FC = () => {
  // App Content State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tools, setTools] = useState<Tool[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Security State
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Cloud Sync State
  const [firebaseConfigStr, setFirebaseConfigStr] = useState('');
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudUser, setCloudUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [authDomainError, setAuthDomainError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    // Determine URL for Firebase Helper
    setCurrentUrl(window.location.origin || window.location.href);

    // Load data
    setTools(getTools());
    setWorkflows(getWorkflows());
    
    // Check Dark Mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // Check Security
    const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (savedPin) {
      setSecurityPin(savedPin);
      setIsLocked(true); // Lock on startup if PIN exists
    }

    // Check Firebase
    const savedFbConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (savedFbConfig) {
      try {
        setFirebaseConfigStr(savedFbConfig);
        const config = JSON.parse(savedFbConfig);
        initFirebase(config);
        setIsCloudConnected(true);
      } catch (e) {
        console.error("Invalid saved firebase config", e);
        // Fallback to default if saved is invalid
        setFirebaseConfigStr(JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
      }
    } else {
      // Set default config string for display
      setFirebaseConfigStr(JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));
      // Auto-init default for convenience
      try {
         if (!isFirebaseInitialized()) {
            initFirebase(DEFAULT_FIREBASE_CONFIG);
            setIsCloudConnected(true);
         }
      } catch (e) { console.error("Auto init default failed", e); }
    }
    
    // Check auth state (persistence)
    setTimeout(() => {
       const user = getCurrentUser();
       if(user) {
         setCloudUser(user);
         setIsCloudConnected(true);
       }
    }, 1000);

  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Security Handlers ---

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockInput === securityPin) {
      setIsLocked(false);
      setUnlockInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
      setUnlockInput('');
    }
  };

  const handleSetPin = () => {
    if (newPinInput.length < 4) {
      alert('Der PIN muss mindestens 4 Zeichen lang sein.');
      return;
    }
    localStorage.setItem(PIN_STORAGE_KEY, newPinInput);
    setSecurityPin(newPinInput);
    setNewPinInput('');
    alert('PIN erfolgreich gesetzt! Die App ist nun geschützt.');
  };

  const handleRemovePin = () => {
    if (confirm('Möchtest du den Schutz wirklich entfernen?')) {
      localStorage.removeItem(PIN_STORAGE_KEY);
      setSecurityPin(null);
    }
  };

  const lockApp = () => {
    setIsLocked(true);
    setIsMobileMenuOpen(false);
  };

  // --- Cloud Sync Handlers ---

  const handleConnectFirebase = () => {
    try {
      const config = JSON.parse(firebaseConfigStr);
      initFirebase(config);
      localStorage.setItem(FIREBASE_CONFIG_KEY, firebaseConfigStr);
      setIsCloudConnected(true);
      alert('Firebase konfiguriert! Du kannst dich jetzt einloggen.');
    } catch (e) {
      alert('Ungültiges JSON Format. Bitte kopiere die Config direkt von der Firebase Console.');
    }
  };

  const handleTestConnection = async () => {
    setSyncStatus('uploading'); // Show spinner
    try {
      if (!isFirebaseInitialized()) {
         const config = JSON.parse(firebaseConfigStr);
         initFirebase(config);
      }
      const result = await testFirestoreConnection();
      if (result.success) {
        alert("✅ " + result.message);
      } else {
        alert("❌ Verbindung fehlgeschlagen:\n" + result.message);
      }
    } catch (e: any) {
      alert("❌ Fehler: " + e.message);
    } finally {
      setSyncStatus(null);
    }
  };

  const handleCloudLogin = async () => {
    setAuthDomainError(null);
    try {
      // Ensure firebase is init before login attempt if not already
      if (!isFirebaseInitialized()) {
          const config = JSON.parse(firebaseConfigStr);
          initFirebase(config);
      }
      const user = await loginWithGoogle();
      setCloudUser(user);
    } catch (e: any) {
      console.error("Login Error:", e);
      let msg = 'Login fehlgeschlagen: ' + e.message;
      
      if (e.code === 'auth/unauthorized-domain') {
        setAuthDomainError(window.location.hostname || "Unbekannte Domain");
        setActiveTab('settings'); // Force user to settings to see the error helper
        return; // Don't alert, show the UI helper
      } else if (e.code === 'auth/popup-closed-by-user') {
        msg = 'Login abgebrochen (Popup geschlossen).';
      }
      
      alert(msg);
    }
  };

  const handleCloudLogout = async () => {
    await logoutFirebase();
    setCloudUser(null);
  };

  const handleCloudUpload = async () => {
    if (!cloudUser) return;
    setSyncStatus('uploading');
    try {
      await saveUserDataToCloud(cloudUser.uid, { tools, workflows });
      setSyncStatus('success');
      setLastSyncTime(new Date().toLocaleTimeString());
      alert('✅ Upload erfolgreich!\nDeine Daten sind jetzt in der Cloud gesichert.');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      alert('Upload Fehler: ' + e);
      setSyncStatus('error');
    }
  };

  const handleCloudDownload = async () => {
    if (!cloudUser) return;
    setSyncStatus('downloading');
    try {
      const data = await loadUserDataFromCloud(cloudUser.uid);
      if (data) {
        if (confirm('⚠️ ACHTUNG: Lokale Daten werden überschrieben!\n\nWillst du die Daten aus der Cloud wirklich laden?')) {
          setTools(data.tools);
          setWorkflows(data.workflows);
          saveTools(data.tools);
          saveWorkflows(data.workflows);
          setSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString());
          alert('✅ Download erfolgreich!\nDaten wurden aktualisiert.');
        }
      } else {
        alert('Keine Daten für diesen Benutzer in der Cloud gefunden.');
      }
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      alert('Download Fehler: ' + e);
      setSyncStatus('error');
    }
  };

  // --- Data Handlers ---

  const handleSaveTool = (tool: Tool) => {
    let newTools;
    if (editingTool) {
      newTools = tools.map(t => t.id === tool.id ? tool : t);
    } else {
      newTools = [...tools, tool];
    }
    setTools(newTools);
    saveTools(newTools);
    setShowForm(false);
    setEditingTool(null);
  };

  const handleDeleteTool = (id: string) => {
    if (confirm('Möchtest du dieses Tool wirklich löschen?')) {
      const newTools = tools.filter(t => t.id !== id);
      setTools(newTools);
      saveTools(newTools);
      setShowForm(false);
      setEditingTool(null);
    }
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setShowForm(true);
  };

  const handleSaveWorkflows = (newWorkflows: Workflow[]) => {
    setWorkflows(newWorkflows);
    saveWorkflows(newWorkflows);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const imported = importData(content);
        if (imported) {
          setTools(imported.tools);
          setWorkflows(imported.workflows);
          alert(`${imported.tools.length} Tools und ${imported.workflows.length} Workflows erfolgreich importiert!`);
        } else {
          alert('Fehler beim Importieren der Datei. Bitte prüfen Sie das Format.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  // Special handling for "add-tool" from sidebar
  useEffect(() => {
    if (activeTab === 'add-tool') {
      setEditingTool(null);
      setShowForm(true);
      setActiveTab('library');
    }
  }, [activeTab]);

  // --- RENDER: LOCK SCREEN ---
  if (isLocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-card p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">App Gesperrt</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Bitte gib deinen PIN ein, um fortzufahren.</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              inputMode="numeric"
              autoFocus
              className={`w-full text-center text-2xl tracking-widest p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all ${loginError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
              placeholder="••••"
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
            />
            {loginError && <p className="text-red-500 text-xs">Falscher PIN. Bitte erneut versuchen.</p>}
            
            <button 
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-indigo-600 transition-colors shadow-md flex justify-center items-center"
            >
              <Unlock size={18} className="mr-2" /> Entsperren
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: APP ---
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans text-gray-900 dark:text-gray-100">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileMenuOpen}
        toggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex justify-between items-center h-16 px-6 bg-white dark:bg-card border-b border-gray-200 dark:border-gray-700 shadow-sm z-10 shrink-0">
          <div className="flex items-center">
            <button 
              className="mr-4 md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu />
            </button>
            <h2 className="text-lg font-semibold capitalize hidden sm:block">
              {activeTab === 'library' ? 'Tool Datenbank' : 
               activeTab === 'subscriptions' ? 'Finanzen' : 
               activeTab === 'gallery' ? 'Galerie' : 
               activeTab === 'workflows' ? 'Projekte' :
               activeTab === 'settings' ? 'Einstellungen' : 'Übersicht'}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {syncStatus === 'uploading' && <RefreshCw className="animate-spin text-blue-500" size={20}/>}
            {syncStatus === 'success' && <CheckCircle className="text-green-500" size={20}/>}

            {securityPin && (
              <button 
                onClick={lockApp}
                title="App sperren"
                className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
              >
                <Lock size={20} />
              </button>
            )}

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ${cloudUser ? 'bg-green-500' : 'bg-gradient-to-tr from-primary to-secondary'}`}>
              {cloudUser ? cloudUser.displayName?.charAt(0) || 'U' : <User size={16} />}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          {activeTab === 'dashboard' && <Dashboard tools={tools} />}
          
          {activeTab === 'library' && (
            <ToolLibrary 
              tools={tools} 
              onSelectTool={handleEditTool}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowBuilder 
              tools={tools}
              workflows={workflows}
              onSaveWorkflows={handleSaveWorkflows}
            />
          )}

          {activeTab === 'subscriptions' && <SubscriptionManager tools={tools} />}
          
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                  <ImageIcon className="mr-3 text-primary" />
                  Tool Galerie
                </h2>
                <span className="text-sm text-gray-500">{tools.filter(t => t.imageUrl).length} Bilder</span>
              </div>
              
              {tools.filter(t => t.imageUrl).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {tools.filter(t => t.imageUrl).map(tool => (
                    <div 
                      key={tool.id} 
                      className="group relative aspect-square bg-white dark:bg-card rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300" 
                      onClick={() => handleEditTool(tool)}
                    >
                      <img 
                        src={tool.imageUrl} 
                        alt={tool.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <span className="text-white font-bold truncate text-lg">{tool.name}</span>
                        <span className="text-gray-300 text-xs truncate">{tool.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-card rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Keine Bilder vorhanden.</p>
                </div>
              )}
            </div>
          )}

           {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
              
              {/* Security Settings */}
              <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                  <ShieldCheck className="mr-2 text-green-500" size={24}/> 
                  Sicherheit & Schutz
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-200">App-Sperre (PIN)</span>
                    <span className={`text-xs px-2 py-1 rounded font-bold ${securityPin ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {securityPin ? 'AKTIV' : 'INAKTIV'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Schütze deine Daten vor unbefugtem Zugriff. Wenn aktiviert, muss beim Start der PIN eingegeben werden.
                  </p>
                </div>

                {!securityPin ? (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Neuen PIN festlegen</label>
                      <input 
                        type="password" 
                        inputMode="numeric"
                        placeholder="Mind. 4 Ziffern"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <button 
                      onClick={handleSetPin}
                      disabled={newPinInput.length < 4}
                      className="px-4 py-2 bg-primary text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                    >
                      PIN setzen
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                     <p className="text-sm text-gray-600 dark:text-gray-300">
                       Dein Dashboard ist geschützt.
                     </p>
                     <button 
                       onClick={handleRemovePin}
                       className="flex items-center px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors"
                     >
                       <LogOut size={16} className="mr-2" /> Schutz entfernen
                     </button>
                  </div>
                )}
              </div>

              {/* Cloud Sync Settings */}
              <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                    <Cloud className="mr-2 text-blue-400" size={24}/>
                    Cloud Sync (Firebase)
                 </h3>
                 <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                   Verbinde deine eigene Firebase-Datenbank, um Daten zwischen Geräten zu synchronisieren.
                 </p>

                 {/* ALWAYS VISIBLE DOMAIN HELPER */}
                 <div className="p-4 rounded-lg mb-4 border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Link className="text-blue-600 shrink-0 mt-1" size={24}/>
                      <div className="flex-1 w-full overflow-hidden">
                         <h4 className="text-sm font-bold mb-1 text-blue-800 dark:text-blue-200">
                           Deine aktuelle App-Adresse
                         </h4>
                         <p className="text-xs mb-3 text-blue-700 dark:text-blue-300">
                           Kopiere diese URL und füge sie in der Firebase Console unter <strong>Authentication &rarr; Settings &rarr; Authorized Domains</strong> hinzu.
                         </p>
                         
                         <div className="flex items-center gap-2 w-full">
                           <div className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded p-3 font-mono text-sm select-all truncate">
                             {currentUrl || "URL konnte nicht ermittelt werden..."}
                           </div>
                           <button 
                              onClick={() => {
                                navigator.clipboard.writeText(currentUrl);
                                alert('Adresse kopiert! Füge sie jetzt in der Firebase Console hinzu.');
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded text-sm font-bold flex items-center shadow-md shrink-0"
                           >
                             <Clipboard size={16} className="mr-2"/> Kopieren
                           </button>
                         </div>
                      </div>
                    </div>
                 </div>

                 {!isCloudConnected ? (
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Firebase Config (JSON)</label>
                       <textarea 
                         rows={5}
                         placeholder='{"apiKey": "...", "authDomain": "...", ...}'
                         className="w-full p-2 text-xs rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white font-mono"
                         value={firebaseConfigStr}
                         onChange={(e) => setFirebaseConfigStr(e.target.value)}
                       />
                     </div>
                     <div className="flex gap-2">
                       <button 
                         onClick={handleConnectFirebase}
                         className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                       >
                         Speichern & Verbinden
                       </button>
                       <button 
                         onClick={handleTestConnection}
                         className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                         title="Verbindung testen"
                       >
                         <Activity size={18} />
                       </button>
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-4">
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                        <span className="text-green-700 dark:text-green-300 text-sm font-bold flex items-center"><CheckCircle size={16} className="mr-2"/> Verbunden</span>
                        <div className="flex items-center gap-3">
                           <button onClick={handleTestConnection} className="text-xs text-blue-600 hover:underline flex items-center"><Activity size={12} className="mr-1"/> Test</button>
                           <button onClick={() => { localStorage.removeItem(FIREBASE_CONFIG_KEY); setIsCloudConnected(false); }} className="text-xs text-red-500 underline">Trennen</button>
                        </div>
                      </div>

                      {!cloudUser ? (
                        <button onClick={handleCloudLogin} className="w-full py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded flex justify-center items-center shadow-sm">
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-2" />
                          Mit Google anmelden
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                               {cloudUser.photoURL && <img src={cloudUser.photoURL} alt="Avatar" />}
                             </div>
                             <div className="flex-1">
                               <div className="text-sm font-bold dark:text-white">{cloudUser.displayName}</div>
                               <div className="text-xs text-gray-500">{cloudUser.email}</div>
                             </div>
                             <button onClick={handleCloudLogout} className="text-xs text-gray-500 hover:text-red-500">Log out</button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleCloudUpload} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded border border-blue-100 dark:border-blue-800 hover:bg-blue-100 flex flex-col items-center justify-center transition-colors">
                               <Upload size={20} className="mb-1" />
                               <span className="text-xs font-bold">Lokal hochladen</span>
                               <span className="text-[10px] opacity-70">Überschreibt Cloud</span>
                            </button>
                             <button onClick={handleCloudDownload} className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded border border-purple-100 dark:border-purple-800 hover:bg-purple-100 flex flex-col items-center justify-center transition-colors">
                               <Download size={20} className="mb-1" />
                               <span className="text-xs font-bold">Cloud herunterladen</span>
                               <span className="text-[10px] opacity-70">Überschreibt Lokal</span>
                            </button>
                          </div>
                          
                          {lastSyncTime && (
                             <p className="text-center text-xs text-gray-400">
                               Zuletzt synchronisiert: {lastSyncTime}
                             </p>
                          )}
                        </div>
                      )}
                   </div>
                 )}
              </div>

              {/* Data Export (Local) */}
              <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                  <Download className="mr-2 text-gray-500" size={24}/> 
                  Lokales Backup
                </h3>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
                  Lade deine komplette Datenbank als JSON-Datei herunter (für manuelle Sicherung).
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ tools, workflows }, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href",     dataStr);
                      downloadAnchorNode.setAttribute("download", `toolverse_backup_${new Date().toISOString().slice(0,10)}.json`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                  >
                    <Download className="mr-2" size={16} /> JSON Export
                  </button>
                  
                  <label className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="text-sm">JSON Import</span>
                      <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                  </label>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400 mt-8">
                ToolVerse Manager v1.3 &bull; Secured & Cloud Ready
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Form */}
      {showForm && (
        <ToolForm 
          initialData={editingTool} 
          onSave={handleSaveTool} 
          onCancel={() => {
            setShowForm(false);
            setEditingTool(null);
          }}
        />
      )}
    </div>
  );
};

export default App;
