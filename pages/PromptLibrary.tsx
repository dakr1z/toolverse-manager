import React, { useState, useMemo } from 'react';
import { Prompt, PromptCategory, PromptType, Tool } from '../types';
import PromptCard from '../components/PromptCard';
import PromptForm from '../components/PromptForm';
import { Search, Plus, Filter, LayoutGrid, List, Sparkles } from 'lucide-react';

interface PromptLibraryProps {
  prompts: Prompt[];
  categories: PromptCategory[];
  tools: Tool[];
  onAddPrompt: (prompt: Prompt) => void;
  onUpdatePrompt: (prompt: Prompt) => void;
  onDeletePrompt: (id: string) => void;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ 
  prompts, 
  categories, 
  tools,
  onAddPrompt, 
  onUpdatePrompt, 
  onDeletePrompt 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState<PromptType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesType = activeType === 'all' || p.type === activeType;
      
      return matchesSearch && matchesCategory && matchesType;
    }).sort((a, b) => b.id.localeCompare(a.id));
  }, [prompts, searchQuery, activeCategory, activeType]);

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowForm(true);
  };

  const handleTestPrompt = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content);
    alert('Prompt kopiert! Du kannst ihn jetzt in deinem KI-Tool testen.');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-primary" /> Prompt Library
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Deine besten KI-Instruktionen an einem Ort.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Suchen..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { setEditingPrompt(null); setShowForm(true); }}
            className="p-2.5 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline font-bold text-sm">Neu</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mr-2">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Filter:</span>
        </div>
        
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 dark:bg-gray-900 rounded-lg">
          {['all', 'text', 'image', 'video'].map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type as any)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                activeType === type 
                ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {type === 'all' ? 'Alle' : type}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all border ${
              activeCategory === 'all'
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            Alle Kategorien
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all border flex items-center gap-1.5 ${
                activeCategory === cat.id
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400'}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' : 'text-gray-400'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filteredPrompts.length > 0 ? (
        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {filteredPrompts.map(prompt => (
            <PromptCard 
              key={prompt.id}
              prompt={prompt}
              toolName={tools.find(t => t.id === prompt.toolId)?.name}
              onEdit={handleEditPrompt}
              onDelete={onDeletePrompt}
              onTest={handleTestPrompt}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-3xl border-dashed">
          <Sparkles size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Keine Prompts gefunden.</p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-4 text-primary font-bold hover:underline"
          >
            Ersten Prompt erstellen
          </button>
        </div>
      )}

      {showForm && (
        <PromptForm 
          prompt={editingPrompt || undefined}
          categories={categories}
          tools={tools}
          onAdd={onAddPrompt}
          onUpdate={onUpdatePrompt}
          onClose={() => { setShowForm(false); setEditingPrompt(null); }}
        />
      )}
    </div>
  );
};

export default PromptLibrary;
