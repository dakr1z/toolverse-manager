import React from 'react';
import { LayoutDashboard, Database, CreditCard, Image as ImageIcon, Settings, PlusCircle, Workflow, Sparkles } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  toggleMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, toggleMobile }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Übersicht', icon: LayoutDashboard },
    { id: 'workflows', label: 'Projekte & Workflows', icon: Workflow },
    { id: 'library', label: 'Tool-Datenbank', icon: Database },
    { id: 'subscriptions', label: 'Abos & Kosten', icon: CreditCard },
    { id: 'gallery', label: 'Referenzen', icon: ImageIcon },
    { id: 'settings', label: 'Einstellungen', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={toggleMobile}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-card border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ToolVerse
          </span>
        </div>
        
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) toggleMobile();
                }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button 
             onClick={() => setActiveTab('add-tool')}
             className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-lg mb-4"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Neues Tool
          </button>
          
          <div className="flex items-center justify-center text-xs text-gray-400 gap-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
            <Sparkles size={12} className="text-secondary" />
            <span>Powered by Gemini 2.5 Flash</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;