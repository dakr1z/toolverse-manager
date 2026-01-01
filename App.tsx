import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ToolLibrary from './pages/ToolLibrary';
import PromptLibrary from './pages/PromptLibrary';
import SubscriptionManager from './pages/SubscriptionManager';
import WorkflowBuilder from './pages/WorkflowBuilder';
import ToolForm from './components/ToolForm';
import { Tool, Workflow, FirebaseConfig, Prompt, PromptCategory } from './types';
import { getTools, saveTools, importData, getWorkflows, saveWorkflows, getPrompts, savePrompts, getPromptCategories, savePromptCategories } from './services/storageService';
import { initFirebase, loginWithGoogle, logoutFirebase, getCurrentUser, saveUserDataToCloud, subscribeToUserData, isFirebaseInitialized, testFirestoreConnection } from './services/firebaseService';
import { Moon, Sun, Menu, User, Download, Upload, Image as ImageIcon, Lock, Unlock, ShieldCheck, LogOut, Cloud, RefreshCw, CheckCircle, AlertTriangle, HelpCircle, Copy, Clipboard, Link, Activity, Key, Loader2 } from 'lucide-react';

const PIN_STORAGE_KEY = 'toolverse_security_pin';
const API_KEY_STORAGE_KEY = 'toolverse_gemini_api_key';
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
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptCategories, setPromptCategories] = useState<PromptCategory[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Security & Auth State
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Cloud Sync State
  const [firebaseConfigStr, setFirebaseConfigStr] = useState('');
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [cloudUser, setCloudUser] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [authDomainError, setAuthDomainError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  
  // Settings
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // --- Effects ---

  // Realtime Subscription
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (cloudUser) {
      console.log("Subscribing to realtime updates for", cloudUser.uid);
      try {
         unsubscribe = subscribeToUserData(cloudUser.uid, (data) => {
            console.log("Received realtime update");
            if (data.tools) setTools(data.tools);
            if (data.workflows) setWorkflows(data.workflows);
            if (data.prompts) setPrompts(data.prompts);
            if (data.promptCategories) setPromptCategories(data.promptCategories);
            
            // Cache locally as well
            if (data.tools) saveTools(data.tools);
            if (data.workflows) saveWorkflows(data.workflows);
            if (data.prompts) savePrompts(data.prompts);
            if (data.promptCategories) savePromptCategories(data.promptCategories);
            
            setLastSyncTime(new Date().toLocaleTimeString());
         });
      } catch (e) {
        console.error("Subscription error", e);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [cloudUser]);

  useEffect(() => {
    // Determine URL for Firebase Helper
    setCurrentUrl(window.location.origin || window.location.href);

    // Load Local Data (Cache)
    setTools(getTools());
    setWorkflows(getWorkflows());
    setPrompts(getPrompts());
    setPromptCategories(getPromptCategories());
    
    // Load API Key
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey) setGeminiApiKey(savedKey);
    
    // Check Dark Mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }

    // Check Security (PIN)
    const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
    if (savedPin) {
      setSecurityPin(savedPin);
      setIsLocked(true); 
    }

    // Initialize Firebase
    const savedFbConfig = localStorage.getItem(FIREBASE_CONFIG_KEY);
    const configToUse = savedFbConfig ? JSON.parse(savedFbConfig) : DEFAULT_FIREBASE_CONFIG;
    
    if (savedFbConfig) setFirebaseConfigStr(savedFbConfig);
    else setFirebaseConfigStr(JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2));

    try {
        if (!isFirebaseInitialized()) {
           initFirebase(configToUse);
           setIsCloudConnected(true);
        }
    } catch (e) { console.error("Init failed", e); }
    
    // Check Auth State
    setTimeout(() => {
       const user = getCurrentUser();
       if(user) {
         setCloudUser(user);
         setIsCloudConnected(true);
       }
       setIsLoadingAuth(false);
    }, 1000);

  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Handlers ---

  const saveToCloudIfPossible = async (newTools: Tool[], newWorkflows: Workflow[], newPrompts: Prompt[], newPromptCats: PromptCategory[]) => {
    if (cloudUser) {
      setSyncStatus('uploading');
      try {
        await saveUserDataToCloud(cloudUser.uid, { 
          tools: newTools, 
          workflows: newWorkflows,
          prompts: newPrompts,
          promptCategories: newPromptCats
        });
        setSyncStatus('success');
        setTimeout(() => setSyncStatus(null), 2000);
      } catch (e) {
        console.error("Auto-save failed", e);
        setSyncStatus('error');
      }
    }
  };

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

  const handleConnectFirebase = () => {
    try {
      const config = JSON.parse(firebaseConfigStr);
      initFirebase(config);
      localStorage.setItem(FIREBASE_CONFIG_KEY, firebaseConfigStr);
      setIsCloudConnected(true);
      alert('Firebase konfiguriert! Du kannst dich jetzt einloggen.');
    } catch (e) {
      alert('Ungültiges JSON Format.');
    }
  };

  const handleTestConnection = async () => {
    setSyncStatus('uploading');
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
      if (!isFirebaseInitialized()) {
          const config = JSON.parse(firebaseConfigStr);
          initFirebase(config);
      }
      const user = await loginWithGoogle();
      setCloudUser(user);
      
      // Initial Sync
      if (tools.length > 0 || prompts.length > 0) {
         if(confirm("Sollen deine lokalen Daten in die Cloud hochgeladen werden?")) {
            await saveUserDataToCloud(user.uid, { tools, workflows, prompts, promptCategories });
         }
      }
      
    } catch (e: any) {
      console.error("Login Error:", e);
      let msg = 'Login fehlgeschlagen: ' + e.message;
      if (e.code === 'auth/unauthorized-domain') {
        setAuthDomainError(window.location.hostname || "Unbekannte Domain");
      }
      alert(msg);
    }
  };

  const handleSaveTool = (tool: Tool) => {
    let newTools;
    if (editingTool) {
      newTools = tools.map(t => t.id === tool.id ? tool : t);
    } else {
      newTools = [...tools, tool];
    }
    setTools(newTools);
    saveTools(newTools);
    saveToCloudIfPossible(newTools, workflows, prompts, promptCategories);
    setShowForm(false);
    setEditingTool(null);
  };

  const handleDeleteTool = (id: string) => {
    if (confirm('Möchtest du dieses Tool wirklich löschen?')) {
      const newTools = tools.filter(t => t.id !== id);
      setTools(newTools);
      saveTools(newTools);
      saveToCloudIfPossible(newTools, workflows, prompts, promptCategories);
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
    saveToCloudIfPossible(tools, newWorkflows, prompts, promptCategories);
  };

  const handleAddPrompt = (prompt: Prompt) => {
    const newPrompts = [...prompts, prompt];
    setPrompts(newPrompts);
    savePrompts(newPrompts);
    saveToCloudIfPossible(tools, workflows, newPrompts, promptCategories);
  };

  const handleUpdatePrompt = (prompt: Prompt) => {
    const newPrompts = prompts.map(p => p.id === prompt.id ? prompt : p);
    setPrompts(newPrompts);
    savePrompts(newPrompts);
    saveToCloudIfPossible(tools, workflows, newPrompts, promptCategories);
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm('Möchtest du diesen Prompt wirklich löschen?')) {
      const newPrompts = prompts.filter(p => p.id !== id);
      setPrompts(newPrompts);
      savePrompts(newPrompts);
      saveToCloudIfPossible(tools, workflows, newPrompts, promptCategories);
    }
  };

  const handleSaveApiKey = () => {
    const cleanedKey = geminiApiKey.trim();
    setGeminiApiKey(cleanedKey);
    localStorage.setItem(API_KEY_STORAGE_KEY, cleanedKey);
    alert('API Key gespeichert!');
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
          setPrompts(imported.prompts);
          setPromptCategories(imported.promptCategories);
          saveToCloudIfPossible(imported.tools, imported.workflows, imported.prompts, imported.promptCategories);
          alert(`${imported.tools.length} Tools, ${imported.workflows.length} Workflows und ${imported.prompts.length} Prompts erfolgreich importiert!`);
        } else {
          alert('Fehler beim Importieren der Datei.');
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

  // --- RENDER: LOADING ---
  if (isLoadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
         <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto mb-4"/>
            <p className="text-gray-500">Lade ToolVerse...</p>
         </div>
      </div>
    );
  }

  // --- RENDER: LOGIN WALL ---
  if (!cloudUser) {
     return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center p-4">
           <div className="bg-white dark:bg-card max-w-md w-full p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 text-center">
              <div className="mb-6 flex justify-center">
                 <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg rotate-3">
                    <Cloud size={32} />
                 </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Willkommen im ToolVerse</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                 Melde dich an, um auf deine synchronisierte Tool-Datenbank zuzugreifen.
              </p>

              {authDomainError && (
                 <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-left text-sm text-red-700 dark:text-red-300">
                    <p className="font-bold mb-1">Domain nicht autorisiert!</p>
                    <p className="mb-2">Bitte füge diese Domain in der Firebase Console hinzu:</p>
                    <code className="block bg-white dark:bg-black/20 p-2 rounded select-all font-mono">
                       {authDomainError}
                    </code>
                 </div>
              )}

              <button 
                 onClick={handleCloudLogin}
                 className="w-full py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg flex justify-center items-center shadow-sm font-medium transition-all transform hover:scale-105"
              >
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" />
                 Mit Google anmelden
              </button>
              
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                 ToolVerse Manager v2.0 &bull; Cloud Sync Enabled
              </div>
           </div>
        </div>
     );
  }

  // --- RENDER: LOCK SCREEN ---
  if (isLocked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
        <div className="bg-white dark:bg-card p-8 rounded-2xl shadow-2xl max-sm w-full text-center border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">App Gesperrt</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Bitte gib deinen PIN ein.</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              inputMode="numeric"
              autoFocus
              className={`w-full text-center text-2xl tracking-widest p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary ${loginError ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••"
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
            />
            <button type="submit" className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-indigo-600">
              <Unlock size={18} className="mr-2 inline" /> Entsperren
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: MAIN APP ---
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
            <button className="mr-4 md:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu />
            </button>
            <h2 className="text-lg font-semibold capitalize hidden sm:block">
              {activeTab === 'library' ? 'Tool Datenbank' : 
               activeTab === 'prompts' ? 'Prompt Library' :
               activeTab === 'settings' ? 'Einstellungen' : 'Übersicht'}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {syncStatus === 'uploading' && <RefreshCw className="animate-spin text-blue-500" size={20}/>}
            {syncStatus === 'success' && <CheckCircle className="text-green-500" size={20}/>}
            {securityPin && <button onClick={() => setIsLocked(true)}><Lock size={20} /></button>}
            <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
               {cloudUser.displayName?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
          {activeTab === 'dashboard' && <Dashboard tools={tools} />}
          
          {activeTab === 'library' && (
            <ToolLibrary tools={tools} onSelectTool={handleEditTool} />
          )}

          {activeTab === 'prompts' && (
            <PromptLibrary 
              prompts={prompts} 
              categories={promptCategories} 
              tools={tools}
              onAddPrompt={handleAddPrompt}
              onUpdatePrompt={handleUpdatePrompt}
              onDeletePrompt={handleDeletePrompt}
            />
          )}

          {activeTab === 'workflows' && (
            <WorkflowBuilder tools={tools} workflows={workflows} onSaveWorkflows={handleSaveWorkflows} />
          )}

          {activeTab === 'subscriptions' && <SubscriptionManager tools={tools} />}
          
          {activeTab === 'gallery' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {tools.filter(t => t.imageUrl).map(tool => (
                <div key={tool.id} onClick={() => handleEditTool(tool)} className="cursor-pointer">
                   <img src={tool.imageUrl} className="rounded-xl shadow-md hover:scale-105 transition-transform" />
                </div>
              ))}
            </div>
          )}

           {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-8 pb-20">
              
              {/* API Key Settings */}
              <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Key className="mr-2 text-yellow-500" size={24}/> AI Konfiguration
                 </h3>
                 <p className="text-sm text-gray-500 mb-4">Damit die KI funktioniert, benötigst du einen Google Gemini API Key.</p>
                 <div className="flex gap-2">
                    <input 
                       type="password"
                       placeholder="Gemini API Key eingeben..."
                       className="flex-1 p-2 rounded border dark:bg-gray-800 dark:border-gray-600"
                       value={geminiApiKey}
                       onChange={(e) => setGeminiApiKey(e.target.value)}
                    />
                    <button onClick={handleSaveApiKey} className="bg-primary text-white px-4 rounded hover:bg-indigo-600">Speichern</button>
                 </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <ShieldCheck className="mr-2 text-green-500" size={24}/> Sicherheit
                </h3>
                {!securityPin ? (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Neuen PIN festlegen</label>
                      <input type="password" inputMode="numeric" placeholder="Mind. 4 Ziffern" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-600" />
                    </div>
                    <button onClick={handleSetPin} disabled={newPinInput.length < 4} className="px-4 py-2 bg-primary text-white rounded">PIN setzen</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                     <p>App ist geschützt.</p>
                     <button onClick={handleRemovePin} className="text-red-500">Schutz entfernen</button>
                  </div>
                )}
              </div>

              {/* Cloud Settings */}
              <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                 <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Cloud className="mr-2 text-blue-400" size={24}/> Account & Cloud
                 </h3>
                 <div className="flex items-center gap-4 mb-6">
                    {cloudUser.photoURL && <img src={cloudUser.photoURL} className="w-12 h-12 rounded-full"/>}
                    <div>
                       <div className="font-bold">{cloudUser.displayName}</div>
                       <div className="text-sm text-gray-500">{cloudUser.email}</div>
                    </div>
                 </div>
                 
                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded mb-4 text-sm text-green-800 dark:text-green-200 flex items-center">
                    <RefreshCw size={16} className="mr-2"/> Automatische Synchronisation aktiv
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={handleTestConnection} className="p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2">
                       <Activity size={16}/> Verbindung testen
                    </button>
                    <button onClick={() => logoutFirebase().then(() => setCloudUser(null))} className="p-2 border border-red-200 text-red-500 rounded hover:bg-red-50 flex items-center justify-center gap-2">
                       <LogOut size={16}/> Abmelden
                    </button>
                 </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showForm && (
        <ToolForm 
          initialData={editingTool} 
          apiKey={geminiApiKey}
          onSave={handleSaveTool} 
          onCancel={() => { setShowForm(false); setEditingTool(null); }}
        />
      )}
    </div>
  );
};

export default App;
