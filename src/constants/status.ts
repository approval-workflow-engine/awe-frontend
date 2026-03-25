// Task status constants
export const TASK_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;

// Instance status constants
export const INSTANCE_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  TERMINATED: 'terminated',
} as const;

// Common UI text constants
export const UI_TEXT = {
  TASK_REVIEW: 'Task Review',
  UNKNOWN: 'Unknown',
  DISPLAY_DATA: 'Display Data',
  WORKFLOW: 'Workflow',
  TASK_ID: 'Task ID',
  TASK_STATUS: 'Task Status',
  STARTED: 'Started',
  ASSIGNEE: 'Assignee',
} as const;

// Date format constants
export const DATE_FORMAT_OPTIONS = {
  MEDIUM_SHORT: {
    dateStyle: 'medium' as const,
    timeStyle: 'short' as const,
  },
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];
export type InstanceStatus = typeof INSTANCE_STATUS[keyof typeof INSTANCE_STATUS];