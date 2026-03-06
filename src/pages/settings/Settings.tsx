import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  Box, Typography, Paper, IconButton, Tooltip, Button,
  Dialog, DialogContent, DialogTitle, DialogActions,
  TextField, Chip, CircularProgress, Skeleton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import KeyIcon from '@mui/icons-material/Key';
import { createApiKey, getApiKeys } from '../../api/authApi';
import { useApiCall } from '../../hooks/useApiCall';
import { useApp } from '../../context/useApp';
import type { ApiKey } from '../../types';

//  Sub-components

function EnvChip({ type }: { type: string }) {
  const lower = type?.toLowerCase() || '';
  const color = lower.includes('prod') ? '#22c55e'
    : lower.includes('stag') ? '#f59e0b'
    : '#06b6d4';
  return (
    <Chip
      label={type}
      size="small"
      sx={{
        fontSize: 11, height: 20, borderRadius: '99px',
        backgroundColor: `${color}20`, color,
        border: `1px solid ${color}40`,
        fontWeight: 600, textTransform: 'capitalize',
      }}
    />
  );
}

function KeyStatusChip({ isRevoked }: { isRevoked: boolean }) {
  return (
    <Chip
      label={isRevoked ? 'revoked' : 'active'}
      size="small"
      sx={{
        fontSize: 11, height: 20, borderRadius: '99px', fontWeight: 600,
        textTransform: 'capitalize',
        backgroundColor: isRevoked ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
        color: isRevoked ? '#ef4444' : '#22c55e',
        border: `1px solid ${isRevoked ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
      }}
    />
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      display="flex" alignItems="center" py={1.5}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}
    >
      <Typography sx={{ fontSize: 12, color: 'text.secondary', width: 180, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

//  Main Settings Page

export default function Settings() {
  const { call } = useApiCall();
  const { user, updateUser } = useApp();

  const [idCopied, setIdCopied] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);

  const [regenOpen, setRegenOpen] = useState(false);
  const [regenLabel, setRegenLabel] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  //  Fetch all keys on mount
  const fetchApiKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const res = await call(() => getApiKeys(), { showError: false });
      if (res) {
        const body = res as { apiKeys?: ApiKey[]; data?: { apiKeys?: ApiKey[] } };
        const keys = body.apiKeys ?? body.data?.apiKeys ?? [];
        setApiKeys(keys);
      }
    } finally {
      setKeysLoading(false);
    }
  }, [call]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  //  Actions
  const handleRegenConfirm = async () => {
    setRegenLoading(true);
    try {
      const res = await call(
        () => createApiKey({ label: regenLabel.trim() || undefined }),
        { showError: true }
      );
      if (res) {
        const body = res as { apiKey?: string; data?: { apiKey?: string; key?: string } };
        const keyValue = body.apiKey ?? body.data?.apiKey ?? body.data?.key ?? null;
        setRegenOpen(false);
        setRegenLabel('');
        if (keyValue) setNewKey(keyValue);
        // Refresh the full key list to reflect new key + revoked old ones
        fetchApiKeys();
        if (user) updateUser({ ...user, apiKeys: undefined });
      }
    } finally {
      setRegenLoading(false);
    }
  };

  const copyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    });
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  };

  //  Render
  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: 'text.primary' }}>
          Settings
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          System configuration and API access
        </Typography>
      </Box>

      {/*  Card 1: System Information  */}
      <Paper sx={{ mb: 2.5, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: 'text.primary' }}>
            System Information
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
            Read-only profile fetched from the API
          </Typography>
        </Box>

        <Box sx={{ px: 2.5 }}>
          {user ? (
            <>
              <InfoRow label="System Name">
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
                  {user.name}
                </Typography>
              </InfoRow>

              <InfoRow label="Organisation">
                <Typography sx={{ fontSize: 13, color: 'text.primary' }}>
                  {user.orgName}
                </Typography>
              </InfoRow>

              <InfoRow label="Contact Email">
                <Typography sx={{ fontSize: 13, color: 'text.primary' }}>
                  {user.contactEmail}
                </Typography>
              </InfoRow>

              {user.environmentType && (
                <InfoRow label="Environment">
                  <EnvChip type={user.environmentType} />
                </InfoRow>
              )}

              {user.status && (
                <InfoRow label="Status">
                  <Typography sx={{
                    fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                    color: user.status === 'active' ? '#22c55e' : 'text.secondary',
                  }}>
                    {user.status}
                  </Typography>
                </InfoRow>
              )}

              <InfoRow label="System ID">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, color: 'text.primary',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {user.id}
                  </Typography>
                  <Tooltip title={idCopied ? 'Copied!' : 'Copy'}>
                    <IconButton
                      size="small" onClick={copyId}
                      sx={{ flexShrink: 0, color: idCopied ? '#22c55e' : 'text.disabled', '&:hover': { color: 'text.primary' } }}
                    >
                      <ContentCopyIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </InfoRow>

              <InfoRow label="Created">
                <Typography sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'text.disabled' }}>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—'}
                </Typography>
              </InfoRow>
            </>
          ) : (
            <Box py={5} textAlign="center">
              <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
                No system information available.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/*  Card 2: API Key Management  */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{
          px: 2.5, py: 2,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box>
            <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: 'text.primary' }}>
              API Key Management
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
              Manage your system API keys
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<KeyIcon sx={{ fontSize: 14 }} />}
            onClick={() => { setRegenLabel(''); setRegenOpen(true); }}
            sx={{
              borderRadius: '8px', fontWeight: 600, fontSize: 12, height: 32,
              backgroundColor: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.3)',
              '&:hover': { backgroundColor: 'rgba(245,158,11,0.2)' },
            }}
          >
            Generate API Key
          </Button>
        </Box>

        <Box sx={{ px: 2.5, py: 2 }}>
          {/* Blue info notice */}
          <Box sx={{
            p: 1.5, borderRadius: '8px', mb: 2,
            backgroundColor: 'rgba(79,110,247,0.08)',
            border: '1px solid rgba(79,110,247,0.2)',
            display: 'flex', alignItems: 'flex-start', gap: 1,
          }}>
            <InfoOutlinedIcon sx={{ color: '#4f6ef7', fontSize: 16, mt: 0.1, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#4f6ef7', lineHeight: 1.5 }}>
              API key values can only be viewed <strong>once</strong> — at the moment of creation.
              Store them securely. Generating a new key immediately invalidates all existing keys.
            </Typography>
          </Box>

          {/* Key list */}
          {keysLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[0, 1].map(i => (
                <Box key={i} sx={{ p: 1.5, borderRadius: '8px', border: '1px solid', borderColor: 'divider', backgroundColor: 'action.hover' }}>
                  <Skeleton variant="text" width={160} height={16} />
                  <Skeleton variant="text" width={100} height={13} sx={{ mt: 0.5 }} />
                </Box>
              ))}
            </Box>
          ) : apiKeys.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {apiKeys.map(key => (
                <Box
                  key={key.id}
                  sx={{
                    p: 1.5, borderRadius: '8px',
                    border: '1px solid', borderColor: 'divider',
                    backgroundColor: 'action.hover',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, color: 'text.primary' }}>
                      {key.label || 'Unnamed Key'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.25 }}>
                      Modified{' '}
                      {key.modifiedAt
                        ? new Date(key.modifiedAt).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </Typography>
                  </Box>
                  <KeyStatusChip isRevoked={key.isRevoked} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
                No API keys found. Generate one using the button above.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/*  Generate Dialog  */}
      <Dialog
        open={regenOpen}
        onClose={() => { if (!regenLoading) setRegenOpen(false); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Generate API Key
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            fullWidth
            label="Key Label (optional)"
            size="small"
            value={regenLabel}
            onChange={e => setRegenLabel(e.target.value)}
            placeholder="e.g. Production, CI/CD"
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            autoFocus
          />
          <Box sx={{
            p: 1.5, borderRadius: '8px',
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'flex', alignItems: 'flex-start', gap: 1,
          }}>
            <WarningAmberIcon sx={{ color: '#ef4444', fontSize: 16, mt: 0.1, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#ef4444', lineHeight: 1.5 }}>
              All existing API keys will be <strong>immediately invalidated</strong> upon confirmation.
              Any integrations using old keys will stop working.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setRegenOpen(false)}
            disabled={regenLoading}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={regenLoading}
            onClick={handleRegenConfirm}
            sx={{
              borderRadius: '8px', fontWeight: 600,
              backgroundColor: '#f59e0b', color: '#0a0b0f',
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            {regenLoading ? <CircularProgress size={14} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/*  One-time Key Display Modal  */}
      <Dialog
        open={!!newKey}
        disableEscapeKeyDown
        onClose={() => {}}
        slotProps={{ backdrop: { onClick: e => e.stopPropagation() } }}
        PaperProps={{
          sx: {
            width: '100%', maxWidth: 480, p: 0,
            border: '1px solid', borderColor: 'divider',
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              backgroundColor: 'rgba(245,158,11,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: 'text.primary' }}>
                New API Key Generated
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                Copy it now — it won't be shown again
              </Typography>
            </Box>
          </Box>

          {/* Warning */}
          <Box sx={{
            p: 1.5, borderRadius: '8px', mb: 2,
            backgroundColor: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            display: 'flex', alignItems: 'flex-start', gap: 1,
          }}>
            <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 16, mt: 0.1, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
              This API key will <strong>never be shown again</strong>. Copy it now and store it
              securely before closing this dialog.
            </Typography>
          </Box>

          {/* Key value */}
          <Box sx={{
            p: 2, borderRadius: '8px', mb: 2,
            backgroundColor: 'action.hover',
            border: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Typography sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13, color: '#f59e0b',
              wordBreak: 'break-all', flex: 1,
            }}>
              {newKey}
            </Typography>
            <Tooltip title={keyCopied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton
                onClick={copyKey}
                size="small"
                sx={{
                  flexShrink: 0,
                  color: keyCopied ? '#22c55e' : 'text.disabled',
                  '&:hover': { color: '#f59e0b' },
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Non-bypassable close button */}
          <Button
            fullWidth
            variant="contained"
            onClick={() => { setNewKey(null); setKeyCopied(false); }}
            sx={{
              height: 40, fontWeight: 600, fontSize: 14, borderRadius: '8px',
              backgroundColor: '#f59e0b', color: '#0a0b0f',
              '&:hover': { backgroundColor: '#d97706' },
            }}
          >
            I've stored my key — Close
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
