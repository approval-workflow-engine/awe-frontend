import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { EXPR_FONT } from '../constants';

interface Props {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  allowEmpty?: boolean;
}

export default function NumberInput({ value, onChange, min = 1, allowEmpty = true }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [localValue, setLocalValue] = useState<string>(
    value !== undefined ? String(value) : '',
  );

  useEffect(() => {
    setLocalValue(value !== undefined ? String(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    if (raw === '') {
      if (allowEmpty) onChange(undefined);
      return;
    }
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= min) onChange(n);
  };

  const handleBlur = () => {
    if (localValue === '' || isNaN(parseInt(localValue, 10))) {
      if (!allowEmpty) {
        setLocalValue(String(min));
        onChange(min);
      }
      return;
    }
    const n = parseInt(localValue, 10);
    if (n < min) {
      setLocalValue(String(min));
      onChange(min);
    }
  };

  return (
    <Box
      component="input"
      type="number"
      min={min}
      step={1}
      value={localValue}
      placeholder={allowEmpty ? '' : String(min)}
      onChange={handleChange}
      onBlur={handleBlur}
      sx={{
        width: '100%', height: 28,
        border: '1px solid', borderColor: 'divider', borderRadius: '6px',
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        fontSize: 11, fontFamily: EXPR_FONT,
        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.87)',
        paddingLeft: '8px', paddingRight: '2px',
        boxSizing: 'border-box', outline: 'none',
        '&:focus': { borderColor: 'rgba(79,110,247,0.6)' },
        '&::-webkit-inner-spin-button': { WebkitAppearance: 'auto', opacity: 0.5, cursor: 'pointer' },
        '&::-webkit-outer-spin-button': { WebkitAppearance: 'auto', opacity: 0.5, cursor: 'pointer' },
        '&:hover::-webkit-inner-spin-button, &:focus::-webkit-inner-spin-button': { opacity: 1 },
        '&:hover::-webkit-outer-spin-button, &:focus::-webkit-outer-spin-button': { opacity: 1 },
      }}
    />
  );
}
