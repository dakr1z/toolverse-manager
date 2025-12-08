import React from 'react';
import { ExternalLink, CreditCard, Tag } from 'lucide-react';
import { Tool, ToolStatus } from '../types';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  const getStatusColor = (status: ToolStatus) => {
    switch (status) {
      case ToolStatus.ACTIVE: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case ToolStatus.TESTING: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case ToolStatus.PAUSED: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case ToolStatus.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      onClick={onClick}
      className="group relative flex flex-col bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary transition-all cursor-pointer overflow-hidden"
    >
      <div className="h-32 bg-gray-100 dark:bg-gray-800 w-full relative overflow-hidden">
        {tool.imageUrl ? (
          <img src={tool.imageUrl} alt={tool.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Kein Bild
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-semibold ${getStatusColor(tool.status)}`}>
          {tool.status}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-2">{tool.name}</h3>
          {tool.primaryLink && (
            <a 
              href={tool.primaryLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={(e) => e.stopPropagation()} 
              className="text-gray-400 hover:text-primary"
            >
              <ExternalLink size={16} />
            </a>
          )}
        </div>
        
        <p className="text-xs text-secondary font-medium mb-2 uppercase tracking-wide">{tool.category}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 flex-grow">{tool.description}</p>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <CreditCard size={14} className="mr-2" />
            {tool.hasSubscription ? (
              <span>{tool.price} {tool.currency} / {tool.billingCycle}</span>
            ) : (
              <span>Kostenlos / Einmalig</span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {tool.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                <Tag size={10} className="mr-1" />
                {tag}
              </span>
            ))}
            {tool.tags.length > 3 && (
               <span className="text-xs text-gray-400 self-center">+{tool.tags.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;