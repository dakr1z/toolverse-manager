import { Tool, Workflow, WorkflowStep, WorkflowToolConfig, Prompt, PromptCategory } from '../types';

const STORAGE_KEY_TOOLS = 'toolverse_data_v1';
const STORAGE_KEY_WORKFLOWS = 'toolverse_workflows_v1';
const STORAGE_KEY_PROMPTS = 'toolverse_prompts_v1';
const STORAGE_KEY_PROMPT_CATEGORIES = 'toolverse_prompt_categories_v1';

// Empty initial state
const INITIAL_TOOLS: Tool[] = [];
const INITIAL_WORKFLOWS: Workflow[] = [];

export const INITIAL_PROMPT_CATEGORIES: PromptCategory[] = [
  { id: 'coding', name: 'Coding', icon: '💻' },
  { id: 'marketing', name: 'Marketing', icon: '📈' },
  { id: 'creative', name: 'Creative', icon: '🎨' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'image-gen', name: 'Image Gen', icon: '🖼️' },
];

export const getTools = (): Tool[] => {
  const data = localStorage.getItem(STORAGE_KEY_TOOLS);
  if (!data) {
    return INITIAL_TOOLS;
  }
  const tools = JSON.parse(data) as Tool[];
  // Ensure pricingModels array exists for old data
  return tools.map(t => ({
    ...t,
    pricingModels: t.pricingModels || []
  }));
};

export const saveTools = (tools: Tool[]) => {
  localStorage.setItem(STORAGE_KEY_TOOLS, JSON.stringify(tools));
};

export const getWorkflows = (): Workflow[] => {
  const data = localStorage.getItem(STORAGE_KEY_WORKFLOWS);
  if (!data) {
    return INITIAL_WORKFLOWS;
  }
  
  const workflows = JSON.parse(data) as any[];
  
  // Migration logic
  return workflows.map(wf => ({
    ...wf,
    steps: wf.steps.map((step: any, index: number) => {
      // Migrate toolIds (string[]) to tools (WorkflowToolConfig[])
      let migratedTools: WorkflowToolConfig[] = [];
      if (step.toolIds && Array.isArray(step.toolIds)) {
        migratedTools = step.toolIds.map((id: string) => ({
          toolId: id,
          quantity: 1
        }));
      } else if (step.tools) {
        migratedTools = step.tools;
      }

      return {
        ...step,
        tools: migratedTools,
        // Default layout if missing
        position: step.position || { x: 100 + (index * 250), y: 100 + (index * 100) },
        connections: step.connections || []
      } as WorkflowStep;
    })
  }));
};

export const saveWorkflows = (workflows: Workflow[]) => {
  localStorage.setItem(STORAGE_KEY_WORKFLOWS, JSON.stringify(workflows));
};

export const getPrompts = (): Prompt[] => {
  const data = localStorage.getItem(STORAGE_KEY_PROMPTS);
  return data ? JSON.parse(data) : [];
};

export const savePrompts = (prompts: Prompt[]) => {
  localStorage.setItem(STORAGE_KEY_PROMPTS, JSON.stringify(prompts));
};

export const getPromptCategories = (): PromptCategory[] => {
  const data = localStorage.getItem(STORAGE_KEY_PROMPT_CATEGORIES);
  return data ? JSON.parse(data) : INITIAL_PROMPT_CATEGORIES;
};

export const savePromptCategories = (categories: PromptCategory[]) => {
  localStorage.setItem(STORAGE_KEY_PROMPT_CATEGORIES, JSON.stringify(categories));
};

export const exportData = (): string => {
  const tools = getTools();
  const workflows = getWorkflows();
  const prompts = getPrompts();
  const promptCategories = getPromptCategories();
  return JSON.stringify({ tools, workflows, prompts, promptCategories }, null, 2);
};

export const importData = (jsonString: string): { tools: Tool[], workflows: Workflow[], prompts: Prompt[], promptCategories: PromptCategory[] } | null => {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data)) {
      saveTools(data);
      return { tools: data, workflows: [], prompts: [], promptCategories: [] };
    } else if (data.tools) {
      saveTools(data.tools);
      if (data.workflows) {
        saveWorkflows(data.workflows);
      }
      if (data.prompts) {
        savePrompts(data.prompts);
      }
      if (data.promptCategories) {
        savePromptCategories(data.promptCategories);
      }
      return { 
        tools: data.tools, 
        workflows: data.workflows || [], 
        prompts: data.prompts || [], 
        promptCategories: data.promptCategories || [] 
      };
    }
  } catch (e) {
    console.error('Import fehlgeschlagen', e);
  }
  return null;
};
