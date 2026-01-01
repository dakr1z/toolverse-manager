export enum ToolStatus {
  ACTIVE = 'Aktiv',
  TESTING = 'Testphase',
  PAUSED = 'Pausiert',
  CANCELLED = 'Gekündigt',
}

export enum BillingCycle {
  MONTHLY = 'Monatlich',
  YEARLY = 'Jährlich',
  LIFETIME = 'Einmalig',
  FREE = 'Kostenlos',
}

export interface ToolLink {
  label: string;
  url: string;
}

export interface PricingModel {
  id: string;
  actionName: string; // e.g., "3D Print", "Video Rendering", "API Call"
  unit: string;       // e.g., "Gramm", "Minute", "Image"
  pricePerUnit: number;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  primaryLink: string;
  secondaryLinks: ToolLink[];
  loginEmail?: string;
  hasSubscription: boolean;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate?: string; // ISO Date String
  imageUrl?: string;
  tags: string[];
  status: ToolStatus;
  notes: string;
  pros?: string;
  cons?: string;
  usageFrequency?: string;
  pricingModels?: PricingModel[]; // Variable costs
}

export interface DashboardStats {
  totalCostMonthly: number;
  activeSubscriptions: number;
  totalTools: number;
  testingCount: number;
}

export interface WorkflowToolConfig {
  toolId: string;
  quantity: number;
  pricingModelId?: string; // Optional, if the tool has variable pricing
}

export interface WorkflowStep {
  id: string;
  title: string;
  tools: WorkflowToolConfig[]; // Changed from simple string[] to object with config
  position?: { x: number; y: number };
  connections?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'planning' | 'in-progress' | 'completed';
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Prompt Library Types
export type PromptType = 'text' | 'image' | 'video';

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  type: PromptType;
  categoryId: string;
  toolId?: string; // Optional link to a tool in Tool Library
  exampleImageUrl?: string;
  tags: string[];
}

export interface PromptCategory {
  id: string;
  name: string;
  icon: string;
}
