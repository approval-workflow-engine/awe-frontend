import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EXPR_FONT, EXPR_FS, EXPR_LH, EXPR_PAD_V } from '../constants';
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

// Width of the FEEL badge + its horizontal margins inside the box
const FEEL_BADGE_W  = 30; // badge pill width (px)
const FEEL_BADGE_MR = 5;  // margin from right edge
const TEXTAREA_PR   = FEEL_BADGE_W + FEEL_BADGE_MR + 4; // textarea right padding

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
      {/* Label — only rendered when a label is provided */}
      {label && (
        <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 500, mb: 0.25 }}>
          {label}
        </Typography>
      )}

      <Box sx={{ position: 'relative' }}>
        {/* Input container */}
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

          {/* FEEL badge — positioned inside the box at the right edge */}
          <Tooltip title="FEEL (Friendly Enough Expression Language)" placement="top">
            <Box sx={{
              position: 'absolute',
              top: multiline ? 5 : '50%',
              transform: multiline ? 'none' : 'translateY(-50%)',
              right: FEEL_BADGE_MR,
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '6.5px',
              fontFamily: EXPR_FONT,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: focused ? '#4f6ef7' : 'rgba(79,110,247,0.55)',
              backgroundColor: focused
                ? 'rgba(79,110,247,0.12)'
                : isDark ? 'rgba(79,110,247,0.07)' : 'rgba(79,110,247,0.06)',
              border: '1px solid',
              borderColor: focused ? 'rgba(79,110,247,0.4)' : 'rgba(79,110,247,0.22)',
              borderRadius: '3px',
              px: '4px',
              py: '2px',
              lineHeight: 1,
              cursor: 'default',
              userSelect: 'none',
              transition: 'all 0.15s',
              pointerEvents: 'none', // don't intercept clicks meant for textarea
            }}>
              FEEL
            </Box>
          </Tooltip>
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
