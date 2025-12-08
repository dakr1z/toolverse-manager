import React, { useState, useMemo } from 'react';
import { Tool, ToolStatus } from '../types';
import ToolCard from '../components/ToolCard';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';

interface ToolLibraryProps {
  tools: Tool[];
  onSelectTool: (tool: Tool) => void;
}

const ToolLibrary: React.FC<ToolLibraryProps> = ({ tools, onSelectTool }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = useMemo(() => {
    const cats = new Set(tools.map(t => t.category));
    return ['All', ...Array.from(cats)];
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || tool.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || tool.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [tools, searchTerm, filterCategory, filterStatus]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Suchen nach Name oder Tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none appearance-none cursor-pointer dark:text-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none cursor-pointer dark:text-white"
            >
              <option value="All">Alle Status</option>
              {Object.values(ToolStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

           <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
             <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white dark:bg-card text-gray-500 hover:bg-gray-100'}`}
             >
               <LayoutGrid size={18} />
             </button>
             <button 
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white dark:bg-card text-gray-500 hover:bg-gray-100'}`}
             >
               <List size={18} />
             </button>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onClick={() => onSelectTool(tool)} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
             <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">Name</th>
                        <th scope="col" className="px-6 py-3">Kategorie</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Kosten</th>
                        <th scope="col" className="px-6 py-3">Link</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTools.map(tool => (
                        <tr 
                          key={tool.id} 
                          onClick={() => onSelectTool(tool)}
                          className="bg-white border-b dark:bg-card dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                {tool.name}
                            </td>
                            <td className="px-6 py-4">{tool.category}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded text-xs ${
                                 tool.status === ToolStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                                 tool.status === ToolStatus.TESTING ? 'bg-blue-100 text-blue-800' :
                                 tool.status === ToolStatus.PAUSED ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                               }`}>
                                 {tool.status}
                               </span>
                            </td>
                            <td className="px-6 py-4">{tool.hasSubscription ? `${tool.price} ${tool.currency}` : '-'}</td>
                            <td className="px-6 py-4 text-blue-500 hover:underline">
                              <a href={tool.primaryLink} target="_blank" onClick={(e)=>e.stopPropagation()}>Link</a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}
        
        {filteredTools.length === 0 && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            Keine Tools gefunden.
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolLibrary;