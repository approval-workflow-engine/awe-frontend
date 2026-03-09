import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EXPR_FONT, EXPR_FS, EXPR_LH, EXPR_PAD_V, EXPR_PAD_L, EXPR_PAD_R } from '../constants';
import type { AvailableCtxVar } from '../context';

interface ExpressionInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  availableContext?: AvailableCtxVar[];
  label?: string;
  hint?: string;
}

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
  const borderColor = focused
    ? 'rgba(79,110,247,0.7)'
    : isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.18)';
  const bgColor = isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.04)';

  return (
    <Box>
      {label && (
        <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.25, fontWeight: 500 }}>
          {label}
        </Typography>
      )}
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
          {/* FEEL badge */}
          <Tooltip
            title="FEEL (Friendly Enough Expression Language)."
            placement="top-start"
          >
            <Box sx={{
              position: 'absolute',
              left: 5,
              top: multiline ? EXPR_PAD_V + 1 : '50%',
              transform: multiline ? 'none' : 'translateY(-50%)',
              zIndex: 4,
              cursor: 'default',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 7,
              fontFamily: EXPR_FONT,
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#4f6ef7',
              backgroundColor: 'rgba(79,110,247,0.1)',
              border: '1px solid rgba(79,110,247,0.3)',
              borderRadius: '3px',
              px: '3px',
              py: '1px',
              lineHeight: 1,
            }}>FEEL</Box>
          </Tooltip>

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
              paddingTop: EXPR_PAD_V, paddingLeft: EXPR_PAD_L,
              paddingRight: EXPR_PAD_R, paddingBottom: EXPR_PAD_V,
              boxSizing: 'border-box',
              fontSize: EXPR_FS,
              fontFamily: EXPR_FONT,
              lineHeight: `${EXPR_LH}px`,
              background: 'transparent',
              color: theme.palette.text.primary,
              caretColor: theme.palette.text.primary,
              border: 'none', outline: 'none',
              resize: 'none',
              overflow: 'hidden',
              whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
              wordBreak: multiline ? 'break-all' : 'normal',
            }}
          />
        </Box>

        {/* Autocomplete dropdown */}
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
      {hint && (
        <Typography sx={{ fontSize: 9, color: 'text.secondary', opacity: 0.75, mt: 0.25, lineHeight: 1.4 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}
