import React, { useState, useRef, useEffect } from 'react';
import { Prompt, PromptType, PromptCategory, Tool } from '../types';
import { X, Upload, Image as ImageIcon, Sparkles, Hash, AlignLeft, Layout, Save } from 'lucide-react';

interface PromptFormProps {
  prompt?: Prompt;
  categories: PromptCategory[];
  tools: Tool[];
  onAdd: (prompt: Prompt) => void;
  onUpdate: (prompt: Prompt) => void;
  onClose: () => void;
}

const PromptForm: React.FC<PromptFormProps> = ({ prompt, categories, tools, onAdd, onUpdate, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'text' as PromptType,
    categoryId: categories[0]?.id || '',
    toolId: '',
    tags: '',
  });
  const [exampleImage, setExampleImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prompt) {
      setFormData({
        title: prompt.title,
        description: prompt.description,
        content: prompt.content,
        type: prompt.type,
        categoryId: prompt.categoryId,
        toolId: prompt.toolId || '',
        tags: prompt.tags ? prompt.tags.join(', ') : '',
      });
      setExampleImage(prompt.exampleImageUrl);
    } else if (categories.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [prompt, categories]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setExampleImage(compressedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const promptData: Prompt = {
      id: prompt?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      content: formData.content,
      type: formData.type,
      categoryId: formData.categoryId,
      toolId: formData.toolId || undefined,
      exampleImageUrl: exampleImage,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (prompt) {
      onUpdate(promptData);
    } else {
      onAdd(promptData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center space-x-3 text-primary">
            <Sparkles size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{prompt ? 'Prompt bearbeiten' : 'Neuer Prompt'}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Layout size={12} /> Typ & Kategorie
                </label>
                <div className="space-y-3">
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as PromptType})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                  >
                    <option value="text">📝 Text Prompt</option>
                    <option value="image">🖼️ Image Prompt</option>
                    <option value="video">🎬 Video Prompt</option>
                  </select>
                  <select 
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                  <select 
                    value={formData.toolId}
                    onChange={e => setFormData({...formData, toolId: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
                  >
                    <option value="">Zugehöriges Tool wählen (optional)</option>
                    {tools.map(tool => (
                      <option key={tool.id} value={tool.id}>{tool.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ImageIcon size={12} /> Vorschau Bild
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-pointer group hover:border-primary/50 transition-all flex items-center justify-center"
              >
                {exampleImage ? (
                  <>
                    <img src={exampleImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">Bild ändern</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload size={24} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Klicken zum Upload</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Titel</label>
            <input 
              required
              type="text" 
              placeholder="z.B. Realistisches Porträt Generator"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <AlignLeft size={12} /> Prompt (KI Instruktionen)
            </label>
            <textarea 
              required
              rows={6}
              placeholder="Schreibe hier deinen Prompt..."
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none font-mono text-xs leading-relaxed resize-none transition-all"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kurzbeschreibung</label>
                <input 
                  type="text" 
                  placeholder="Wofür ist dieser Prompt gut?"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none text-xs transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Hash size={12} /> Tags (kommagetrennt)
                </label>
                <input 
                  type="text" 
                  placeholder="ai, creative, art..."
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary outline-none text-xs transition-all"
                />
              </div>
          </div>

          <div className="pt-4 flex space-x-4">
            <button 
                type="button"
                onClick={onClose}
                className="flex-grow py-3 px-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-2xl transition-all uppercase tracking-widest text-[10px]"
            >
                Abbrechen
            </button>
            <button 
                type="submit"
                className="flex-[2] py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
            >
                <Save size={16} />
                {prompt ? 'Speichern' : 'Prompt Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptForm;
