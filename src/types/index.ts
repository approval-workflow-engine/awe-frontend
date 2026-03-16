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

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  latestVersion?: number | null;
  versions?: WorkflowVersion[];
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

export interface ValidationError {
  code: number;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  versionId?: string;
  version?: number;
  status?: string;
}

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

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  width?: string | number;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  status?: string;
  action?: string;
  entityType?: string;
}

export type ThemeMode = 'dark' | 'light';

export type BackendInstanceStatus =
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'terminated';

export interface BackendInstance {
  id: string;
  workflow_version_id: string;
  workflow_name?: string;
  version_number?: number | null;
  status: BackendInstanceStatus;
  auto_advance: boolean;
  current_variables: Record<string, unknown> | null;
  input_variables: Record<string, unknown> | null;
  output_variables: Record<string, unknown> | null;
  started_on: string | null;
  ended_on: string | null;
  created_by: string;
  created_on: string;
}

export interface UserTaskDisplayField {
  label: string;
  value: unknown;
}

export interface UserTaskResponseField {
  fieldId: string;
  label: string;
  type: string;
  uiType?: 'text' | 'textarea' | 'number' | 'dropdown' | 'checkbox' | 'date-picker';
  required?: boolean;
  default?: unknown;
  options?: Array<{ label?: string; valueExpression: string }>;
  contextVariable?: { name: string; scope: "global" };
  validationExpression?: string;
}

export interface UserTaskNodeConfiguration {
  title?: string;
  description?: string;
  assignee?: string;
  requestMap: UserTaskDisplayField[];
  responseMap: UserTaskResponseField[];
}

export interface BackendTask {
  id: string;
  instance_id: string;
  node_id: string;
  status: string;
  created_on: string;
  workflow_name: string;
  node_configuration: UserTaskNodeConfiguration;
}

export interface BackendTaskDetail extends BackendTask {}
