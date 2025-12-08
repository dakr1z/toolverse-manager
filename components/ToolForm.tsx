import React, { useState, useEffect } from 'react';
import { Tool, ToolStatus, BillingCycle, PricingModel } from '../types';
import { X, Sparkles, Loader2, Plus, Trash2, Wand2 } from 'lucide-react';
import { generateToolDetails } from '../services/geminiService';

interface ToolFormProps {
  initialData?: Tool | null;
  apiKey?: string;
  onSave: (tool: Tool) => void;
  onCancel: () => void;
}

const ToolForm: React.FC<ToolFormProps> = ({ initialData, apiKey, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Tool>>({
    name: '',
    category: '',
    description: '',
    primaryLink: '',
    status: ToolStatus.ACTIVE,
    hasSubscription: false,
    price: 0,
    currency: 'EUR',
    billingCycle: BillingCycle.MONTHLY,
    tags: [],
    notes: '',
    imageUrl: '',
    secondaryLinks: [],
    pros: '',
    cons: '',
    pricingModels: [],
  });

  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Local state for adding a new pricing model
  const [newPricing, setNewPricing] = useState<Partial<PricingModel>>({ actionName: '', unit: '', pricePerUnit: 0 });

  useEffect(() => {
    if (initialData) {
      setFormData({
          ...initialData,
          pricingModels: initialData.pricingModels || []
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleAiAssist = async () => {
    if (!apiKey) {
      alert("⚠️ KI nicht konfiguriert!\nBitte hinterlege zuerst deinen Google Gemini API Key in den Einstellungen.");
      return;
    }
    if (!formData.name) {
      alert("Bitte gib zuerst einen Namen für das Tool ein.");
      return;
    }
    setLoadingAi(true);
    try {
      const result = await generateToolDetails(formData.name, apiKey);
      if (result) {
        setFormData(prev => ({
          ...prev,
          description: result.description || prev.description,
          category: result.category || prev.category,
          primaryLink: result.websiteUrl || prev.primaryLink,
          tags: result.tags || prev.tags,
          hasSubscription: result.hasSubscription ?? prev.hasSubscription,
          pros: result.pros || prev.pros,
          cons: result.cons || prev.cons,
        }));
      }
    } catch (e: any) {
      alert("Fehler bei der KI-Anfrage:\n" + e.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!apiKey) {
      alert("⚠️ KI nicht konfiguriert!\nBitte hinterlege zuerst deinen Google Gemini API Key in den Einstellungen.");
      return;
    }
    if (!formData.name) return;
    
    setLoadingDesc(true);
    try {
      // Reuse the main service but only apply description
      const result = await generateToolDetails(formData.name, apiKey);
      if (result && result.description) {
        setFormData(prev => ({
          ...prev,
          description: result.description
        }));
      }
    } catch (e: any) {
      alert("Fehler bei der Beschreibung:\n" + e.message);
    } finally {
      setLoadingDesc(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTool: Tool = {
      ...formData,
      id: initialData?.id || Date.now().toString(),
      tags: formData.tags || [],
      secondaryLinks: formData.secondaryLinks || [],
      pricingModels: formData.pricingModels || [],
    } as Tool;
    onSave(newTool);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  const addPricingModel = () => {
    if (newPricing.actionName && newPricing.unit && newPricing.pricePerUnit !== undefined) {
      const model: PricingModel = {
        id: Date.now().toString(),
        actionName: newPricing.actionName,
        unit: newPricing.unit,
        pricePerUnit: Number(newPricing.pricePerUnit)
      };
      setFormData(prev => ({ ...prev, pricingModels: [...(prev.pricingModels || []), model] }));
      setNewPricing({ actionName: '', unit: '', pricePerUnit: 0 });
    }
  };

  const removePricingModel = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pricingModels: prev.pricingModels?.filter(m => m.id !== id)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-card w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Tool bearbeiten' : 'Neues Tool hinzufügen'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name des Tools</label>
              <div className="flex gap-2">
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="z.B. ChatGPT"
                />
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={!formData.name || loadingAi}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center transition-colors disabled:opacity-50 whitespace-nowrap"
                  title="Alle Daten automatisch ausfüllen"
                >
                  {loadingAi ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  <span className="ml-2 hidden sm:inline">Alles füllen (AI)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategorie</label>
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Design, AI, Finance..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                >
                  {Object.values(ToolStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beschreibung</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={!formData.name || loadingDesc}
                  className="text-xs bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loadingDesc ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  Tool Beschreibung hinzufügen
                </button>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="Kurze Beschreibung was das Tool macht..."
              />
            </div>
            
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Haupt-Link (URL)</label>
              <input
                type="url"
                name="primaryLink"
                value={formData.primaryLink}
                onChange={handleChange}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://..."
              />
            </div>
            
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bild URL (Logo/Screenshot)</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Pricing Models (Variable Costs) */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
             <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Variable Kosten / Aktionen</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Definiere Kosten für bestimmte Aktionen (z.B. Druck pro Gramm, Rendering pro Minute).</p>
             
             <div className="space-y-2 mb-3">
               {formData.pricingModels?.map(model => (
                 <div key={model.id} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                   <span className="font-medium text-gray-900 dark:text-white flex-1">{model.actionName}</span>
                   <span className="text-gray-500">{model.pricePerUnit}€ / {model.unit}</span>
                   <button type="button" onClick={() => removePricingModel(model.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                     <Trash2 size={14} />
                   </button>
                 </div>
               ))}
             </div>

             <div className="flex gap-2 items-end">
               <div className="flex-1">
                 <label className="block text-xs text-gray-500 mb-1">Aktion</label>
                 <input 
                   placeholder="z.B. 3D Druck, API Call"
                   className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                   value={newPricing.actionName}
                   onChange={e => setNewPricing(p => ({...p, actionName: e.target.value}))}
                 />
               </div>
               <div className="w-24">
                 <label className="block text-xs text-gray-500 mb-1">Einheit</label>
                 <input 
                   placeholder="g, h, stk"
                   className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                   value={newPricing.unit}
                   onChange={e => setNewPricing(p => ({...p, unit: e.target.value}))}
                 />
               </div>
               <div className="w-24">
                 <label className="block text-xs text-gray-500 mb-1">Preis</label>
                 <input 
                   type="number"
                   step="0.01"
                   placeholder="0.00"
                   className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                   value={newPricing.pricePerUnit || ''}
                   onChange={e => setNewPricing(p => ({...p, pricePerUnit: parseFloat(e.target.value)}))}
                 />
               </div>
               <button 
                  type="button" 
                  onClick={addPricingModel}
                  className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  <Plus size={18} />
               </button>
             </div>
          </div>

          {/* Subscription & Costs */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <input 
                type="checkbox" 
                name="hasSubscription"
                checked={formData.hasSubscription}
                onChange={(e) => setFormData(prev => ({ ...prev, hasSubscription: e.target.checked }))}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary rounded"
              />
              Abo / Fixkosten
            </h3>
            
            {formData.hasSubscription && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Preis</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Währung</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Intervall</label>
                  <select name="billingCycle" value={formData.billingCycle} onChange={handleChange} className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                     {Object.values(BillingCycle).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                   <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nächste Verlängerung</label>
                   <input
                    type="date"
                    name="renewalDate"
                    value={formData.renewalDate || ''}
                    onChange={handleChange}
                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Tag hinzufügen und Enter drücken"
                />
                <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag) => (
                  <span key={tag} className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm">
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => setFormData(p => ({...p, tags: p.tags?.filter(t => t !== tag)}))}
                      className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vorteile (Pros)</label>
                <textarea
                  name="pros"
                  value={formData.pros}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nachteile (Cons)</label>
                <textarea
                  name="cons"
                  value={formData.cons}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notizen / Nutzung</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Wie oft? Wofür genau?"
                />
              </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
            Abbrechen
          </button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-indigo-600 font-medium shadow-md">
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolForm;
