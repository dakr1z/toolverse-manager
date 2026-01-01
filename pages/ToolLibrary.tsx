import React, { useState, useMemo } from 'react';
import { Tool } from '../types';
import ToolCard from '../components/ToolCard';
import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';

interface ToolLibraryProps {
  tools: Tool[];
  onSelectTool: (tool: Tool) => void;
}

const ToolLibrary: React.FC<ToolLibraryProps> = ({ tools, onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => {
    const cats = new Set(tools.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, activeCategory]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tool Datenbank</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Verwalte deine gesamte Software-Landschaft.</p>
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mr-2">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Kategorien:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                activeCategory === cat 
                ? 'bg-primary text-white shadow-md' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat === 'all' ? 'Alle' : cat}
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

      {/* Grid */}
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        {filteredTools.map(tool => (
          <ToolCard 
            key={tool.id} 
            tool={tool} 
            onClick={() => onSelectTool(tool)}
          />
        ))}
      </div>
      
      {filteredTools.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">Keine Tools gefunden.</p>
        </div>
      )}
    </div>
  );
};

export default ToolLibrary;
