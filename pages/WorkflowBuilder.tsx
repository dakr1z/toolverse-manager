import React, { useState, useRef, useMemo } from 'react';
import { Tool, Workflow, WorkflowStep, WorkflowToolConfig } from '../types';
import { Plus, Trash2, Briefcase, ChevronRight, X, ZoomIn, ZoomOut, DollarSign, Calculator } from 'lucide-react';

interface WorkflowBuilderProps {
  tools: Tool[];
  workflows: Workflow[];
  onSaveWorkflows: (workflows: Workflow[]) => void;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ tools, workflows, onSaveWorkflows }) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');

  // Canvas State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  
  // Dragging Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  
  // Connecting Nodes
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number, y: number } | null>(null);

  // Adding tools via menu
  const [activeAddToolMenu, setActiveAddToolMenu] = useState<string | null>(null); // Node ID

  const canvasRef = useRef<HTMLDivElement>(null);
  const activeWorkflow = workflows.find(w => w.id === selectedWorkflowId);

  // --- Cost Calculation ---
  const calculateTotalCost = useMemo(() => {
    if (!activeWorkflow) return 0;
    
    let total = 0;
    activeWorkflow.steps.forEach(step => {
        step.tools.forEach(config => {
            const tool = tools.find(t => t.id === config.toolId);
            if (!tool) return;

            if (config.pricingModelId && tool.pricingModels) {
                const model = tool.pricingModels.find(m => m.id === config.pricingModelId);
                if (model) {
                    total += model.pricePerUnit * config.quantity;
                }
            } else if (tool.hasSubscription && tool.price > 0) {
                 // For subscription tools without a model, we might just assume base usage is negligible cost per project,
                 // or maybe 1 unit of base price. For now, let's keep it 0 unless a model is selected, 
                 // as subscriptions are "fixed" costs usually not per project.
                 // However, user wanted to see costs. Let's add price only if pricing model selected.
            }
        });
    });
    return total;
  }, [activeWorkflow, tools]);

  const getNodeCost = (step: WorkflowStep) => {
      let nodeTotal = 0;
      step.tools.forEach(config => {
          const tool = tools.find(t => t.id === config.toolId);
          if (tool && config.pricingModelId && tool.pricingModels) {
              const model = tool.pricingModels.find(m => m.id === config.pricingModelId);
              if (model) nodeTotal += model.pricePerUnit * config.quantity;
          }
      });
      return nodeTotal;
  };

  // --- CRUD Workflow ---

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) return;
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: newWorkflowName,
      description: '',
      status: 'planning',
      steps: []
    };
    onSaveWorkflows([...workflows, newWorkflow]);
    setNewWorkflowName('');
    setIsCreating(false);
    setSelectedWorkflowId(newWorkflow.id);
    resetCanvas();
  };

  const handleDeleteWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Projekt wirklich löschen?')) {
      onSaveWorkflows(workflows.filter(w => w.id !== id));
      if (selectedWorkflowId === id) setSelectedWorkflowId(null);
    }
  };

  const updateWorkflow = (updated: Workflow) => {
    onSaveWorkflows(workflows.map(w => w.id === updated.id ? updated : w));
  };

  const resetCanvas = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // --- Node Operations ---

  const addNode = () => {
    if (!activeWorkflow) return;
    // Add to center of current view
    const canvasCenter = {
      x: (-pan.x + (canvasRef.current?.clientWidth || 800) / 2) / scale,
      y: (-pan.y + (canvasRef.current?.clientHeight || 600) / 2) / scale,
    };

    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      title: 'Neue Phase',
      tools: [],
      position: { x: canvasCenter.x - 150, y: canvasCenter.y - 100 },
      connections: []
    };
    updateWorkflow({ ...activeWorkflow, steps: [...activeWorkflow.steps, newStep] });
  };

  const updateNodePosition = (id: string, x: number, y: number) => {
    if (!activeWorkflow) return;
    const updatedSteps = activeWorkflow.steps.map(s => s.id === id ? { ...s, position: { x, y } } : s);
    updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
  };

  const deleteNode = (id: string) => {
    if (!activeWorkflow) return;
    const updatedSteps = activeWorkflow.steps
      .filter(s => s.id !== id)
      .map(s => ({
        ...s,
        connections: s.connections?.filter(targetId => targetId !== id) || []
      }));
    updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
  };

  const updateNodeTitle = (id: string, title: string) => {
    if (!activeWorkflow) return;
    const updatedSteps = activeWorkflow.steps.map(s => s.id === id ? { ...s, title } : s);
    updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
  };

  // --- Tool & Cost Logic ---

  const addToolToNode = (stepId: string, toolId: string) => {
    if (!activeWorkflow) return;
    
    // Check if tool already exists in this node
    const step = activeWorkflow.steps.find(s => s.id === stepId);
    if(step?.tools.some(t => t.toolId === toolId)) return;

    const tool = tools.find(t => t.id === toolId);
    // Default to first pricing model if available
    const defaultModelId = tool?.pricingModels && tool.pricingModels.length > 0 ? tool.pricingModels[0].id : undefined;

    const updatedSteps = activeWorkflow.steps.map(s => {
      if (s.id === stepId) {
        return { 
            ...s, 
            tools: [...s.tools, { toolId, quantity: 1, pricingModelId: defaultModelId }] 
        };
      }
      return s;
    });
    updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
    setActiveAddToolMenu(null);
  };

  const updateToolConfig = (stepId: string, toolId: string, updates: Partial<WorkflowToolConfig>) => {
      if (!activeWorkflow) return;
      const updatedSteps = activeWorkflow.steps.map(s => {
          if (s.id === stepId) {
              return {
                  ...s,
                  tools: s.tools.map(t => t.toolId === toolId ? { ...t, ...updates } : t)
              };
          }
          return s;
      });
      updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
  };

  const removeToolFromNode = (stepId: string, toolId: string) => {
    if (!activeWorkflow) return;
    const updatedSteps = activeWorkflow.steps.map(step => {
      if (step.id === stepId) {
        return { ...step, tools: step.tools.filter(t => t.toolId !== toolId) };
      }
      return step;
    });
    updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
  };

  // --- Connection Logic ---

  const startConnection = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectingNodeId(nodeId);
    
    if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setTempConnectionEnd({
            x: (e.clientX - rect.left - pan.x) / scale,
            y: (e.clientY - rect.top - pan.y) / scale
        });
    }
  };

  const completeConnection = (targetId: string) => {
    if (!activeWorkflow || !connectingNodeId || connectingNodeId === targetId) {
        setConnectingNodeId(null);
        setTempConnectionEnd(null);
        return;
    }

    const sourceNode = activeWorkflow.steps.find(s => s.id === connectingNodeId);
    if (sourceNode && !sourceNode.connections?.includes(targetId)) {
        const updatedSteps = activeWorkflow.steps.map(s => {
            if (s.id === connectingNodeId) {
                return { ...s, connections: [...(s.connections || []), targetId] };
            }
            return s;
        });
        updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
    }
    
    setConnectingNodeId(null);
    setTempConnectionEnd(null);
  };

  const deleteConnection = (sourceId: string, targetId: string) => {
      if (!activeWorkflow) return;
      const updatedSteps = activeWorkflow.steps.map(s => {
          if (s.id === sourceId) {
              return { ...s, connections: s.connections?.filter(c => c !== targetId) || [] };
          }
          return s;
      });
      updateWorkflow({ ...activeWorkflow, steps: updatedSteps });
  };

  // --- Canvas Interaction Handlers ---

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Check if clicked on a tool menu
    if ((e.target as HTMLElement).closest('.tool-menu')) return;
    setActiveAddToolMenu(null);

    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }

    if (draggingNodeId && activeWorkflow) {
        const dx = (e.clientX - lastMousePos.x) / scale;
        const dy = (e.clientY - lastMousePos.y) / scale;
        
        const node = activeWorkflow.steps.find(s => s.id === draggingNodeId);
        if (node && node.position) {
            updateNodePosition(draggingNodeId, node.position.x + dx, node.position.y + dy);
        }
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }

    if (connectingNodeId && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setTempConnectionEnd({
            x: (e.clientX - rect.left - pan.x) / scale,
            y: (e.clientY - rect.top - pan.y) / scale
        });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    if (connectingNodeId) {
        setConnectingNodeId(null);
        setTempConnectionEnd(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.5, scale + delta), 2);
        setScale(newScale);
    }
  };

  // --- Tool Drag & Drop ---

  const handleToolDragStart = (e: React.DragEvent, toolId: string) => {
    e.dataTransfer.setData('toolId', toolId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleNodeDrop = (e: React.DragEvent, stepId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const toolId = e.dataTransfer.getData('toolId');
    if (!activeWorkflow || !toolId) return;
    addToolToNode(stepId, toolId);
  };


  const getPath = (start: {x: number, y: number}, end: {x: number, y: number}) => {
      const deltaX = Math.abs(end.x - start.x);
      const controlPointOffset = Math.max(deltaX * 0.5, 50);
      return `M ${start.x} ${start.y} C ${start.x + controlPointOffset} ${start.y}, ${end.x - controlPointOffset} ${end.y}, ${end.x} ${end.y}`;
  };

  // --- Views ---

  if (!selectedWorkflowId) {
    return (
      <div className="space-y-6 h-full p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Projekte & Workflows</h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Plus size={18} className="mr-2" /> Neues Projekt
          </button>
        </div>

        {isCreating && (
          <div className="bg-white dark:bg-card p-4 rounded-xl border border-gray-200 dark:border-gray-700 animate-fade-in flex gap-2">
            <input 
              autoFocus
              type="text" 
              placeholder="Projektname (z.B. Website Relaunch)" 
              className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkflow()}
            />
            <button onClick={handleCreateWorkflow} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Erstellen</button>
            <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded">Abbrechen</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.length === 0 && !isCreating && (
            <div className="col-span-full text-center py-20 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
              <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
              <p>Noch keine Projekte erstellt.</p>
            </div>
          )}
          
          {workflows.map(workflow => (
            <div 
              key={workflow.id} 
              onClick={() => { setSelectedWorkflowId(workflow.id); resetCanvas(); }}
              className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-primary cursor-pointer group transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                  <Briefcase size={24} />
                </div>
                <button 
                  onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{workflow.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{workflow.steps.length} Nodes</p>
              <div className="flex items-center text-primary text-sm font-medium">
                Öffnen <ChevronRight size={16} className="ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // CANVAS VIEW
  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none">
        <div className="bg-white dark:bg-card shadow-md rounded-lg p-2 pointer-events-auto flex items-center gap-4">
            <button onClick={() => setSelectedWorkflowId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
                &larr; Zurück
            </button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <h2 className="font-bold text-gray-900 dark:text-white px-2">{activeWorkflow?.name}</h2>
            
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-2 px-2">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Projektkosten</span>
                    <span className="font-bold text-lg text-green-600 dark:text-green-400">€{calculateTotalCost.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-card shadow-md rounded-lg p-2 pointer-events-auto flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><ZoomOut size={18}/></button>
            <span className="text-xs w-12 text-center text-gray-500">{(scale * 100).toFixed(0)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><ZoomIn size={18}/></button>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <button 
                onClick={addNode}
                className="flex items-center px-3 py-1.5 bg-primary text-white text-sm rounded hover:bg-indigo-600"
            >
                <Plus size={16} className="mr-1"/> Phase
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* TOOLBOX SIDEBAR (Overlay) */}
        <div className="absolute left-4 top-24 bottom-4 w-64 bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20 flex flex-col pointer-events-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-xl">
             <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center">
                 <Briefcase size={16} className="mr-2"/> Tools
             </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
             {tools.map(tool => (
              <div 
                key={tool.id}
                draggable
                onDragStart={(e) => handleToolDragStart(e, tool.id)}
                className="flex flex-col p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded cursor-grab hover:border-primary dark:hover:border-primary transition-colors shadow-sm"
              >
                <div className="flex items-center mb-1">
                    {tool.imageUrl ? (
                    <img src={tool.imageUrl} className="w-5 h-5 rounded object-cover mr-2 bg-gray-100"/>
                    ) : (
                    <div className="w-5 h-5 rounded bg-gray-200 mr-2 shrink-0"></div>
                    )}
                    <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{tool.name}</div>
                </div>
                {tool.pricingModels && tool.pricingModels.length > 0 && (
                    <div className="text-[10px] text-gray-500 pl-7">
                        ab {Math.min(...tool.pricingModels.map(m => m.pricePerUnit))}€ / {tool.pricingModels[0].unit}
                    </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 text-center rounded-b-xl border-t border-gray-200 dark:border-gray-700">
             Drag & Drop auf Nodes
          </div>
        </div>

        {/* INFINITE CANVAS */}
        <div 
            ref={canvasRef}
            className="flex-1 cursor-grab active:cursor-grabbing bg-gray-100 dark:bg-gray-900 overflow-hidden relative"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: `${20 * scale}px ${20 * scale}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
        >
            <div 
                className="absolute inset-0 origin-top-left pointer-events-none"
                style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                }}
            >
                {/* CONNECTIONS LAYER (SVG) */}
                <svg className="absolute overflow-visible top-0 left-0 w-full h-full pointer-events-none z-0">
                    {activeWorkflow?.steps.map(sourceNode => 
                        sourceNode.connections?.map(targetId => {
                            const targetNode = activeWorkflow.steps.find(s => s.id === targetId);
                            if (!sourceNode.position || !targetNode?.position) return null;
                            
                            // Anchor points
                            const start = { x: sourceNode.position.x + 300, y: sourceNode.position.y + 40 }; // Adjusted for wider node
                            const end = { x: targetNode.position.x, y: targetNode.position.y + 40 }; 

                            return (
                                <g key={`${sourceNode.id}-${targetId}`} className="pointer-events-auto cursor-pointer group" onClick={() => deleteConnection(sourceNode.id, targetId)}>
                                    <path 
                                        d={getPath(start, end)} 
                                        fill="none" 
                                        strokeWidth="6" 
                                        stroke="transparent" 
                                        className="transition-colors"
                                    />
                                    <path 
                                        d={getPath(start, end)} 
                                        fill="none" 
                                        strokeWidth="2" 
                                        className="stroke-gray-400 dark:stroke-gray-500 group-hover:stroke-red-500 transition-colors" 
                                    />
                                </g>
                            );
                        })
                    )}
                    {/* Active Drawing Line */}
                    {connectingNodeId && tempConnectionEnd && (() => {
                         const sourceNode = activeWorkflow?.steps.find(s => s.id === connectingNodeId);
                         if (sourceNode?.position) {
                            const start = { x: sourceNode.position.x + 300, y: sourceNode.position.y + 40 };
                            return <path d={getPath(start, tempConnectionEnd)} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" />;
                         }
                    })()}
                </svg>

                {/* NODES LAYER */}
                {activeWorkflow?.steps.map(step => (
                    <div
                        key={step.id}
                        className="absolute w-[300px] bg-white dark:bg-card rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 pointer-events-auto flex flex-col z-10"
                        style={{
                            left: step.position?.x || 0,
                            top: step.position?.y || 0,
                        }}
                        onDrop={(e) => handleNodeDrop(e, step.id)}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-green-400'); }}
                        onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-green-400')}
                    >
                        {/* Input Port */}
                        <div 
                            className="absolute -left-3 top-[32px] w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-600 border border-gray-400 hover:bg-green-400 transition-colors z-20 cursor-crosshair"
                            onMouseUp={() => completeConnection(step.id)}
                        ></div>

                        {/* Output Port */}
                        <div 
                            className="absolute -right-3 top-[32px] w-4 h-4 rounded-full bg-blue-500 border border-blue-600 hover:bg-blue-400 transition-colors z-20 cursor-crosshair"
                            onMouseDown={(e) => startConnection(e, step.id)}
                        ></div>

                        {/* Header (Drag Handle) */}
                        <div 
                            className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg cursor-grab active:cursor-grabbing flex justify-between items-center"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setDraggingNodeId(step.id);
                                setLastMousePos({ x: e.clientX, y: e.clientY });
                            }}
                        >
                            <input 
                                value={step.title}
                                onChange={(e) => updateNodeTitle(step.id, e.target.value)}
                                className="bg-transparent font-semibold text-sm flex-1 outline-none text-gray-800 dark:text-gray-200 mr-2"
                                onMouseDown={(e) => e.stopPropagation()} 
                            />
                            
                            <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-2 flex items-center bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                   €{getNodeCost(step).toFixed(2)}
                                </div>
                                <div className="relative">
                                    <button onClick={() => setActiveAddToolMenu(activeAddToolMenu === step.id ? null : step.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">
                                        <Plus size={14} />
                                    </button>
                                    
                                    {/* Quick Add Tool Dropdown */}
                                    {activeAddToolMenu === step.id && (
                                        <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-card border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg z-50 max-h-48 overflow-y-auto tool-menu">
                                            {tools.map(t => (
                                                <button 
                                                    key={t.id} 
                                                    onClick={() => addToolToNode(step.id, t.id)}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                                                >
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => deleteNode(step.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Content (Tools) */}
                        <div className="p-2 min-h-[60px] max-h-[300px] overflow-y-auto space-y-2">
                            {step.tools.length === 0 ? (
                                <div className="text-xs text-center text-gray-400 py-4 border border-dashed border-gray-200 dark:border-gray-700 rounded">
                                    <div className="mb-1">Keine Tools</div>
                                    <div className="text-[10px] opacity-70">Drop here or click +</div>
                                </div>
                            ) : (
                                step.tools.map((config, idx) => {
                                    const tool = tools.find(t => t.id === config.toolId);
                                    if(!tool) return null;
                                    
                                    const hasPricingModels = tool.pricingModels && tool.pricingModels.length > 0;
                                    const currentModel = tool.pricingModels?.find(m => m.id === config.pricingModelId);

                                    return (
                                        <div key={`${tool.id}-${idx}`} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-100 dark:border-indigo-900/40 text-xs">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-indigo-900 dark:text-indigo-100">{tool.name}</span>
                                                <button onClick={() => removeToolFromNode(step.id, tool.id)} className="text-gray-400 hover:text-red-500">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                            
                                            {hasPricingModels ? (
                                                <div className="grid grid-cols-2 gap-2" onMouseDown={e => e.stopPropagation()}>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 mb-0.5">Aktion</label>
                                                        <select 
                                                            className="w-full p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-[10px]"
                                                            value={config.pricingModelId || ''}
                                                            onChange={(e) => updateToolConfig(step.id, tool.id, { pricingModelId: e.target.value })}
                                                        >
                                                            {tool.pricingModels?.map(m => (
                                                                <option key={m.id} value={m.id}>{m.actionName} ({m.pricePerUnit}€)</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-gray-500 mb-0.5">Menge {currentModel?.unit ? `(${currentModel.unit})` : ''}</label>
                                                        <input 
                                                            type="number" 
                                                            className="w-full p-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-[10px]"
                                                            value={config.quantity}
                                                            onChange={(e) => updateToolConfig(step.id, tool.id, { quantity: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[10px] text-gray-400 italic">Keine variablen Kosten</div>
                                            )}
                                            
                                            {currentModel && (
                                                <div className="mt-1 text-right text-[10px] font-bold text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-1">
                                                    {(currentModel.pricePerUnit * config.quantity).toFixed(2)}€
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;