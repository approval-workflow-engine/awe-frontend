//  API Response Wrapper 
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

//  User / System 
export interface User {
  id: string;
  name: string;
  orgName: string;
  contactEmail: string;
  environmentType?: string;
  status?: string;
  createdAt?: string;
  apiKeys?: ApiKey[];
}

export interface ApiKey {
  id: string;
  label?: string;
  isRevoked: boolean;
  createdAt: string;
  revokedAt: string | null;
}

//  Auth 
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  system: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  name: string;
  description?: string;
  orgName: string;
  contactEmail: string;
  password: string;
}

export interface RegisterResponse {
  apiKey?: string;
}

//  Workflow 
export type WorkflowStatus = 'active' | 'inactive' | 'deprecated';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status?: WorkflowStatus;
  versionCount?: number;
  versions?: WorkflowVersion[];
  /** Returned by GET /workflows list endpoint (singular, not an array) */
  latestVersion?: {
    id: string;
    version: number;
    status: string;
    updatedAt?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export type VersionStatus = 'draft' | 'published' | 'active' | 'valid';

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  status: VersionStatus;
  definition?: WorkflowDefinition;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  inputs?: WorkflowInput[];
  publishedAt?: string;
  createdAt: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  inputs?: WorkflowInput[];
}

export interface WorkflowNode {
  id?: string;
  nodeId?: string;
  type: string;
  label?: string;
  config?: NodeConfig;
  position?: { x: number; y: number };
  x?: number;
  y?: number;
}

export interface WorkflowEdge {
  id?: string;
  edgeId?: string;
  source?: string;
  target?: string;
  sourceNodeId?: string;
  targetNodeId?: string;
  condition?: string;
  conditionExpression?: string;
  isDefault?: boolean;
}

export interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
}

export interface NodeConfig {
  label?: string;
  title?: string;
  assignee?: string;
  description?: string;
  dueInHours?: number;
  requestMap?: Record<string, unknown>;
  responseMap?: Record<string, unknown>;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  mainFunction?: string;
  sourceCode?: string;
  parameterMap?: Record<string, unknown>;
  failure?: boolean;
  [key: string]: unknown;
}

//  Canvas Node (builder state) 
export interface CanvasNode {
  id: string;
  type: string;
  label: string;
  config: NodeConfig;
  x: number;
  y: number;
  position: { x: number; y: number };
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  condition: string;
  isDefault: boolean;
}

export interface SelectedItem {
  id: string;
  type: 'node' | 'edge';
}

export interface DraggingState {
  id: string;
  offsetX: number;
  offsetY: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

//  Instance 
export type InstanceStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'TERMINATED';

export interface Instance {
  id: string;
  workflowId: string;
  workflowName?: string;
  workflow?: { name: string };
  status: InstanceStatus;
  currentNodeId?: string;
  currentNode?: string;
  externalId?: string;
  context?: Record<string, unknown>;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
}

export interface ExecutionLog {
  nodeId?: string;
  node_id?: string;
  nodeType?: string;
  type?: string;
  status: string;
  duration?: number;
  executedAt?: string;
  createdAt?: string;
}

export type TaskStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface Task {
  id: string;
  title?: string;
  description?: string;
  assignee?: string;
  assigneeEmail?: string;
  nodeId?: string;
  instanceId?: string;
  status: TaskStatus;
  requestMap?: Record<string, unknown>;
  responseMap?: Record<string, SchemaField>;
  contextSnapshot?: Record<string, unknown>;
  context?: Record<string, unknown>;
  createdAt: string;
}

export interface SchemaField {
  type?: string;
  required?: boolean;
}

export interface CompleteTaskPayload {
  decision: 'approve' | 'reject';
  comment?: string;
  completedBy?: string;
  responseData?: Record<string, string>;
}

//  Audit 
export interface AuditLog {
  id?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actor?: string;
  actorId?: string;
  ipAddress?: string;
  ip?: string;
  timestamp?: string;
  createdAt?: string;
  changes?: AuditChanges;
  metadata?: AuditChanges;
}

export interface AuditChanges {
  before?: unknown;
  after?: unknown;
}

//  Status Helpers 
export interface StatusStyle {
  color: string;
  bg: string;
  pulse?: boolean;
}

//  Node Config Utility 
export interface NodeTypeConfig {
  type: string;
  label: string;
  color: string;
  icon: string;
  configFields: string[];
}

//  DataTable 
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  width?: string | number;
  render?: (value: unknown, row: T) => React.ReactNode;
}

//  Query Params 
export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  action?: string;
  entityType?: string;
}

//  Theme 
export type ThemeMode = 'dark' | 'light';
