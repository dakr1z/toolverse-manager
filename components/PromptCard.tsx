import React, { useState } from 'react';
import { Prompt, PromptType } from '../types';
import { Copy, Check, Edit, Trash2, Zap, Image as ImageIcon, FileText, Video, ExternalLink } from 'lucide-react';

interface PromptCardProps {
  prompt: Prompt;
  onTest: (prompt: Prompt) => void;
  onEdit: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
  toolName?: string;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onTest, onEdit, onDelete, toolName }) => {
  const [copied, setCopied] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = (type: PromptType) => {
    switch (type) {
      case 'text': return <FileText size={12} />;
      case 'image': return <ImageIcon size={12} />;
      case 'video': return <Video size={12} />;
      default: return <FileText size={12} />;
    }
  };

  const getTypeStyles = (type: PromptType) => {
    switch (type) {
      case 'text': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'image': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'video': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="group flex flex-col bg-white dark:bg-card border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Media Preview Section */}
      <div className="w-full h-40 overflow-hidden relative bg-gray-100 dark:bg-gray-900">
        {prompt.exampleImageUrl ? (
          <img 
            src={prompt.exampleImageUrl} 
            alt={prompt.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-700">
            <ImageIcon size={48} strokeWidth={1} />
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex gap-2">
            <span className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-md ${getTypeStyles(prompt.type)}`}>
                {getTypeIcon(prompt.type)}
                {prompt.type}
            </span>
            {toolName && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/50 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                <ExternalLink size={10} />
                {toolName}
              </span>
            )}
        </div>

        <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
            <button 
                onClick={(e) => { e.stopPropagation(); onEdit(prompt); }}
                className="p-2 bg-white dark:bg-gray-800 hover:text-primary text-gray-600 dark:text-gray-400 rounded-full transition-colors shadow-lg border border-gray-100 dark:border-gray-700"
                title="Bearbeiten"
            >
                <Edit size={14} />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
                className="p-2 bg-white dark:bg-gray-800 hover:text-red-500 text-gray-600 dark:text-gray-400 rounded-full transition-colors shadow-lg border border-gray-100 dark:border-gray-700"
                title="Löschen"
            >
                <Trash2 size={14} />
            </button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
          {prompt.title}
        </h3>
        <p className="text-gray-500 text-xs mb-3 line-clamp-1">
          {prompt.description || 'Keine Beschreibung'}
        </p>

        {/* PROMPT CONTENT READ AREA */}
        <div className="mb-4 flex-grow">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800 relative">
            <p className={`text-[11px] text-gray-700 dark:text-gray-300 font-mono leading-relaxed break-words whitespace-pre-wrap ${showFullPrompt ? '' : 'line-clamp-3'}`}>
              {prompt.content}
            </p>
            <button 
              onClick={() => setShowFullPrompt(!showFullPrompt)}
              className="w-full text-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[9px] text-primary font-bold hover:underline uppercase tracking-widest"
            >
              {showFullPrompt ? 'Zuklappen' : 'Vollständig lesen'}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
            <button 
              onClick={handleCopy}
              className={`flex-grow flex items-center justify-center space-x-2 py-2 px-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border ${
                copied 
                ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
              }`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
            <button 
              onClick={() => onTest(prompt)}
              className="p-2 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all shadow-md"
              title="KI-Test"
            >
              <Zap size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
