import { DataType } from '../builderTypes';

// Font and layout constants shared by all expression-related components
export const EXPR_FONT = "'JetBrains Mono', monospace";
export const EXPR_FS = 11;
export const EXPR_LH = 18;
export const EXPR_PAD_V = 5;
export const EXPR_PAD_L = 46;
export const EXPR_PAD_R = 8;

// HTTP method list and color mapping for ServiceTaskConfig
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export const METHOD_COLORS: Record<string, string> = {
  GET:    '#22c55e',
  POST:   '#4f6ef7',
  PUT:    '#f59e0b',
  PATCH:  '#a855f7',
  DELETE: '#ef4444',
};

// UI type options for UserTask response fields
export const UI_TYPES = ['text', 'textarea', 'number', 'dropdown', 'checkbox', 'date-picker'] as const;

// Color per data type used in DataTypeSelect
export const DATA_TYPE_COLORS: Record<string, string> = {
  [DataType.STRING]:   '#86efac',
  [DataType.NUMBER]:   '#93c5fd',
  [DataType.BOOLEAN]:  '#c084fc',
  [DataType.OBJECT]:   '#fdba74',
  [DataType.LIST]:     '#67e8f9',
  [DataType.DATE]:     '#fda4af',
  [DataType.TIME]:     '#fda4af',
  [DataType.DATETIME]: '#fda4af',
  [DataType.NULL]:     '#94a3b8',
};
