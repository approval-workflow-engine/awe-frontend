import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EXPR_FONT, EXPR_FS, EXPR_LH, EXPR_PAD_V } from '../constants';
import type { AvailableCtxVar } from '../context';
import { validateFeelExpressionClient, getExpressionKind } from './feelValidation';

interface ExpressionInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  availableContext?: AvailableCtxVar[];
  label?: string;
  hint?: string;
}

const FEEL_BADGE_W  = 46;
const FEEL_BADGE_MR = 5;
const TEXTAREA_PR   = FEEL_BADGE_W + FEEL_BADGE_MR + 4;

export default function ExpressionInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  availableContext = [],
  label,
  hint,
}: ExpressionInputProps) {
  const theme = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const [acOpen, setAcOpen] = useState(false);
  const [acFilter, setAcFilter] = useState('');
  const [validationError, setValidationError] = useState<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setValidationError(undefined);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const result = validateFeelExpressionClient(value);
      setValidationError(result.valid ? undefined : result.error);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const kind = getExpressionKind(value);

  const rows = multiline ? 3 : 1;
  const containerHeight = rows * EXPR_LH + EXPR_PAD_V * 2;

  const insertVar = useCallback((name: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? 0;
    const textBefore = value.slice(0, pos);
    const ctxIdx = textBefore.lastIndexOf('context.');
    const before = ctxIdx >= 0 ? value.slice(0, ctxIdx) : value.slice(0, pos);
    const after = value.slice(pos);
    onChange(before + `context.${name}` + after);
    setAcOpen(false);
    setTimeout(() => {
      el.focus();
      const newPos = before.length + `context.${name}`.length;
      el.setSelectionRange(newPos, newPos);
    }, 0);
  }, [value, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    const pos = e.target.selectionStart ?? 0;
    const before = e.target.value.slice(0, pos);
    const m = before.match(/context\.(\w*)$/);
    if (m) { setAcOpen(true); setAcFilter(m[1]); }
    else setAcOpen(false);
  };

  const filtered = useMemo(
    () => availableContext.filter(v => v.name.toLowerCase().startsWith(acFilter.toLowerCase())),
    [availableContext, acFilter],
  );

  const isDark = theme.palette.mode === 'dark';
  const hasError = !!validationError && value.trim().length > 0;
  const borderColor = hasError
    ? 'rgba(239,68,68,0.6)'
    : focused
    ? 'rgba(79,110,247,0.7)'
    : isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.18)';
  const bgColor = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)';

  const badgeColor = kind === 'string-literal' ? '#22c55e' : '#4f6ef7';
  const badgeLabel = kind === 'string-literal' ? 'STR' : 'FEEL';
  const badgeBg = kind === 'string-literal'
    ? (focused ? 'rgba(34,197,94,0.12)' : isDark ? 'rgba(34,197,94,0.07)' : 'rgba(34,197,94,0.06)')
    : (focused ? 'rgba(79,110,247,0.12)' : isDark ? 'rgba(79,110,247,0.07)' : 'rgba(79,110,247,0.06)');

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={0.25} minHeight={15}>
        <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 500 }}>
          {label || ''}
        </Typography>
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: '7px',
          fontFamily: EXPR_FONT,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: focused ? badgeColor : `${badgeColor}aa`,
          backgroundColor: badgeBg,
          border: '1px solid',
          borderColor: focused ? `${badgeColor}66` : `${badgeColor}33`,
          borderRadius: '3px',
          px: '4px',
          py: '2px',
          lineHeight: 1,
          cursor: 'default',
          userSelect: 'none',
          transition: 'all 0.15s',
        }}>
          {badgeLabel}
        </Box>
      </Box>

      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          position: 'relative',
          border: '1px solid',
          borderColor,
          borderRadius: '6px',
          backgroundColor: bgColor,
          height: containerHeight,
          transition: 'border-color 0.15s',
          overflow: 'hidden',
        }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setTimeout(() => setAcOpen(false), 120); }}
            placeholder={placeholder}
            rows={rows}
            spellCheck={false}
            autoComplete="off"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              width: '100%', height: '100%',
              paddingTop: EXPR_PAD_V,
              paddingLeft: 8,
              paddingRight: TEXTAREA_PR,
              paddingBottom: EXPR_PAD_V,
              boxSizing: 'border-box',
              fontSize: EXPR_FS,
              fontFamily: EXPR_FONT,
              lineHeight: `${EXPR_LH}px`,
              background: 'transparent',
              color: theme.palette.text.primary,
              caretColor: theme.palette.text.primary,
              border: 'none', outline: 'none',
              resize: 'none',
              overflow: multiline ? 'hidden' : 'auto',
              whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
              wordBreak: multiline ? 'break-all' : 'normal',
            }}
          />

        </Box>

        {acOpen && filtered.length > 0 && (
          <Paper elevation={4} sx={{
            position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 100,
            mt: 0.25, maxHeight: 150, overflowY: 'auto',
            border: '1px solid', borderColor: 'divider', borderRadius: '6px',
          }}>
            {filtered.map(v => (
              <Box key={v.name} onMouseDown={() => insertVar(v.name)} sx={{
                px: 1, py: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                '&:hover': { backgroundColor: 'action.hover' },
              }}>
                <Typography sx={{ fontSize: 11, fontFamily: EXPR_FONT, color: 'primary.main', flex: 1 }}>
                  context.<b>{v.name}</b>
                </Typography>
                <Typography sx={{ fontSize: 9, color: 'text.secondary', fontFamily: EXPR_FONT }}>
                  {v.type}
                </Typography>
                <Typography sx={{ fontSize: 9, color: 'text.secondary' }}>
                  · {v.sourceNode}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      {hasError && (
        <Typography sx={{ fontSize: 9, color: '#ef4444', mt: 0.25, lineHeight: 1.4 }}>
          {validationError}
        </Typography>
      )}

      {hint && !hasError && (
        <Typography sx={{ fontSize: 9, color: 'text.secondary', opacity: 0.75, mt: 0.25, lineHeight: 1.4 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}
