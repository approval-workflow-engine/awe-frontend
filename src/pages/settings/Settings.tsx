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
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { createApiKey, getApiKeys, revokeApiKey } from '../../api/authApi';
import { useApiCall } from '../../hooks/useApiCall';
import { useApp } from '../../context/useApp';
import PageHeader from '../../components/common/PageHeader';
import type { ApiKey } from '../../types';


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
        backgroundColor: isRevoked ? 'rgba(239,68,68,0.10)' : 'rgba(34,197,94,0.10)',
        color: isRevoked ? '#ef4444' : '#22c55e',
        border: `1px solid ${isRevoked ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}


export default function Settings() {
  const { call } = useApiCall();
  const { user, updateUser } = useApp();

  const [idCopied, setIdCopied] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [infoDismissed, setInfoDismissed] = useState(false);
  const [showRevoked, setShowRevoked] = useState(false);

  const [regenOpen, setRegenOpen] = useState(false);
  const [regenLabel, setRegenLabel] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);

  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const res = await call(() => getApiKeys(), { showError: false });
      if (res) {
        const body = res as { apiKeys?: ApiKey[] };
        const keys = body.apiKeys ?? [];
        setApiKeys(keys);
      }
    } finally {
      setKeysLoading(false);
    }
  }, [call]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleRevoke = (key: ApiKey) => {
    setRevokeTarget(key);
  };

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    const keyId = revokeTarget.id;
    setRevokingId(keyId);
    setRevokeTarget(null);
    try {
      await call(() => revokeApiKey(keyId), { showError: true });
      setApiKeys(prev => prev.map(k =>
        k.id === keyId
          ? { ...k, isRevoked: true, revokedAt: new Date().toISOString() }
          : k
      ));
    } finally {
      setRevokingId(null);
    }
  };

  const handleRegenConfirm = async () => {
    setRegenLoading(true);
    try {
      const res = await call(
        () => createApiKey({ label: regenLabel.trim() || undefined }),
        { showError: true }
      );
      if (res) {
        const body = res as { apiKey?: string };
        const keyValue = body.apiKey ?? null;
        setRegenOpen(false);
        setRegenLabel('');
        if (keyValue) setNewKey(keyValue);
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

  return (
    <Box>
      <PageHeader title="Settings" subtitle="System configuration and API access" />

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
                    : '-'}
                </Typography>
              </InfoRow>
            </>
          ) : (
            <Box py={5} textAlign="center">
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                No system information available.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

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
              backgroundColor: 'rgba(79,110,247,0.1)',
              color: '#4f6ef7',
              border: '1px solid rgba(79,110,247,0.3)',
              '&:hover': { backgroundColor: 'rgba(79,110,247,0.2)' },
            }}
          >
            Generate API Key
          </Button>
        </Box>

        <Box sx={{ px: 2.5, py: 2 }}>
          {!infoDismissed && (
          <Box sx={{
            p: 1.5, borderRadius: '8px', mb: 2,
            backgroundColor: 'rgba(79,110,247,0.08)',
            border: '1px solid rgba(79,110,247,0.2)',
            display: 'flex', alignItems: 'flex-start', gap: 1,
          }}>
            <InfoOutlinedIcon sx={{ color: '#4f6ef7', fontSize: 16, mt: 0.1, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#4f6ef7', lineHeight: 1.5, flex: 1 }}>
              API key values can only be viewed <strong>once</strong> - at the moment of creation.
              Store them securely. Generating a new key immediately invalidates all existing keys.
            </Typography>
            <IconButton
              size="small"
              onClick={() => setInfoDismissed(true)}
              sx={{ color: '#4f6ef7', opacity: 0.6, '&:hover': { opacity: 1 }, flexShrink: 0, mt: -0.25, mr: -0.5 }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
          )}

          {keysLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {[0, 1].map(i => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2, px: 1.5, py: 1.5,
                    borderBottom: i === 0 ? '1px solid' : 'none', borderColor: 'divider',
                  }}
                >
                  <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '8px', flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width={140} height={15} />
                    <Skeleton variant="text" width={100} height={12} sx={{ mt: 0.5 }} />
                  </Box>
                  <Skeleton variant="rounded" width={52} height={20} sx={{ borderRadius: '99px' }} />
                </Box>
              ))}
            </Box>
          ) : apiKeys.length > 0 ? (() => {
            const activeKeys = apiKeys.filter(k => !k.isRevoked);
            const revokedKeys = apiKeys.filter(k => k.isRevoked);

            const renderRow = (key: ApiKey, idx: number, total: number) => (
              <Box
                key={key.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  px: 1.5, py: 1.5,
                  borderBottom: idx < total - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  transition: 'background-color 0.15s',
                  '&:hover': { backgroundColor: 'action.hover' },
                  '&:hover .revoke-btn': { opacity: 1 },
                }}
              >
                <Box sx={{
                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: key.isRevoked ? 'rgba(239,68,68,0.08)' : 'rgba(79,110,247,0.10)',
                }}>
                  <VpnKeyOutlinedIcon sx={{ fontSize: 15, color: key.isRevoked ? '#ef4444' : '#4f6ef7' }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 13, fontWeight: 600, lineHeight: 1.3,
                    color: key.isRevoked ? 'text.secondary' : 'text.primary',
                  }}>
                    {key.label || 'Unnamed Key'}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1.5} mt={0.25} flexWrap="wrap">
                    <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                      Created {fmtDate(key.createdAt)}
                    </Typography>
                    {key.isRevoked && key.revokedAt && (
                      <>
                        <Box sx={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'text.disabled', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: 11, color: '#ef4444' }}>
                          Revoked {fmtDate(key.revokedAt)}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                  <KeyStatusChip isRevoked={key.isRevoked} />
                  {!key.isRevoked && (
                    <Tooltip title="Revoke key" placement="left">
                      <span>
                        <IconButton
                          className="revoke-btn"
                          size="small"
                          disabled={revokingId === key.id}
                          onClick={() => handleRevoke(key)}
                          sx={{
                            opacity: 0,
                            color: 'text.disabled',
                            transition: 'opacity 0.15s, color 0.15s',
                            '&:hover': { color: '#ef4444' },
                            '&.Mui-disabled': { opacity: 0.4 },
                          }}
                        >
                          {revokingId === key.id
                            ? <CircularProgress size={14} />
                            : <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          }
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );

            return (
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {activeKeys.length > 0
                    ? activeKeys.map((key, idx) => renderRow(key, idx, activeKeys.length))
                    : (
                      <Box sx={{ px: 1.5, py: 2 }}>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>No active keys.</Typography>
                      </Box>
                    )
                  }
                </Box>

                {revokedKeys.length > 0 && (
                  <>
                    <Box
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5,
                        borderTop: '1px solid', borderColor: 'divider', pt: 1.5,
                      }}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Revoked
                      </Typography>
                      <Chip
                        label={revokedKeys.length}
                        size="small"
                        sx={{ height: 16, fontSize: 10, fontWeight: 700, backgroundColor: 'rgba(239,68,68,0.10)', color: '#ef4444', border: 'none' }}
                      />
                      <Box sx={{ flex: 1 }} />
                      <Button
                        size="small"
                        onClick={() => setShowRevoked(v => !v)}
                        sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', minWidth: 0, px: 1, height: 24, '&:hover': { color: 'text.primary' } }}
                      >
                        {showRevoked ? 'Hide' : 'See all'}
                      </Button>
                    </Box>
                    {showRevoked && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                        {revokedKeys.map((key, idx) => renderRow(key, idx, revokedKeys.length))}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            );
          })() : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                No API keys found. Generate one using the button above.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#ef4444' }}>
          Revoke API Key?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Are you sure you want to revoke{' '}
            <strong style={{ color: 'inherit' }}>{revokeTarget?.label || 'Unnamed Key'}</strong>?
            This action cannot be undone and any integrations using this key will stop working immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setRevokeTarget(null)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleRevokeConfirm}
            sx={{
              borderRadius: '8px', fontWeight: 600,
              backgroundColor: '#ef4444', color: '#fff',
              '&:hover': { backgroundColor: '#dc2626' },
            }}
          >
            Revoke Key
          </Button>
        </DialogActions>
      </Dialog>

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
            label="Key Label"
            size="small"
            value={regenLabel}
            onChange={e => setRegenLabel(e.target.value)}
            placeholder="e.g. Production, CI/CD"
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            autoFocus
          />
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
              backgroundColor: 'rgba(79,110,247,0.9)', color: '#fff',
              '&:hover': { backgroundColor: '#4f6ef7' },
            }}
          >
            {regenLoading ? <CircularProgress size={14} /> : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>

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
                Copy it now - it won't be shown again
              </Typography>
            </Box>
          </Box>

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
            I've stored my key - Close
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
