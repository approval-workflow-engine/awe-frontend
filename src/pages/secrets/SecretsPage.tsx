import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stack,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LockIcon from "@mui/icons-material/Lock";
import KeyIcon from "@mui/icons-material/Key";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import { secretProviderService } from "../../api/services/secretProviders";
import { secretService } from "../../api/services/secrets";
import { useApiCall } from "../../hooks/useApiCall";
import { ENVIRONMENT_OPTIONS } from "../../constants/environment";
import type { SecretProvider, SecretItem } from "../../api/schemas";
import {
  ForbiddenState,
  ErrorState,
  LoadingState,
} from "../../components/common/states";

const PROVIDER_PRESETS = [
  {
    id: "infisical",
    label: "Infisical",
    host: "https://app.infisical.com",
    description: "Open-source secret management platform",
  },
];

function ProviderCard({
  provider,
  onAddSecret,
  onDeleteSecret,
}: {
  provider: SecretProvider;
  onAddSecret: (p: SecretProvider) => void;
  onDeleteSecret: (id: string | undefined) => Promise<void>;
}) {
  const { call } = useApiCall();
  const [open, setOpen] = useState(false);
  const [secrets, setSecrets] = useState<SecretItem[]>([]);
  const [loadingSecrets, setLoadingSecrets] = useState(false);

  const providerConfig =
    provider.configuration && typeof provider.configuration === "object"
      ? (provider.configuration as Record<string, unknown>)
      : null;
  const providerHost =
    typeof providerConfig?.host === "string" ? providerConfig.host : "-";
  const providerProjectId =
    typeof providerConfig?.projectId === "string"
      ? providerConfig.projectId
      : "-";

  const fetchSecrets = useCallback(async () => {
    if (!provider.id) return;
    setLoadingSecrets(true);
    const data = await call(() => secretService.listByProvider(provider.id!), {
      showError: true,
    });
    if (data?.secrets) setSecrets(data.secrets);
    setLoadingSecrets(false);
  }, [call, provider.id]);

  const handleToggle = () => {
    if (!open) fetchSecrets();
    setOpen((v) => !v);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 2px 16px 0 rgba(0,0,0,0.08)" },
      }}
    >
      {/* Provider header */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2.5}
        py={1.75}
        sx={{ cursor: "pointer" }}
        onClick={handleToggle}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              backgroundColor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockIcon sx={{ fontSize: 18, color: "#fff" }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>
              {provider.label ?? provider.type}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {providerHost} · {providerProjectId}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={provider.type}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", height: 22 }}
          />
          <Tooltip title="Add Secret">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAddSecret(provider);
              }}
              sx={{
                color: "primary.main",
                backgroundColor: "primary.main",
                bgcolor: "rgba(79,110,247,0.08)",
                borderRadius: "8px",
                "&:hover": { bgcolor: "primary.main", color: "#fff" },
                transition: "all 0.2s",
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {open ? (
            <ExpandLessIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          ) : (
            <ExpandMoreIcon sx={{ color: "text.secondary", fontSize: 20 }} />
          )}
        </Box>
      </Box>

      {/* Secrets list */}
      <Collapse in={open}>
        <Divider />
        <Box px={2.5} py={2}>
          {loadingSecrets ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={24} />
            </Box>
          ) : secrets.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              py={3}
              gap={1}
            >
              <KeyIcon sx={{ fontSize: 36, color: "text.disabled" }} />
              <Typography variant="body2" color="text.secondary">
                No secrets mapped for this provider yet.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => onAddSecret(provider)}
                sx={{ mt: 0.5, borderRadius: "8px", fontWeight: 600 }}
              >
                Map Secret
              </Button>
            </Box>
          ) : (
            <Stack spacing={1}>
              {secrets.map((s) => (
                <Box
                  key={s.id}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  px={1.5}
                  py={1}
                  sx={{
                    borderRadius: "10px",
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "action.hover",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "primary.main", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.25}>
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 16, color: "success.main" }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {s.label || s.key}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace" }}
                      >
                        key: {s.key}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        Created: {s.createdAt ? format(new Date(s.createdAt), "MMM d, yyyy") : "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    {s.environment && (
                      <Chip
                        label={s.environment || "unknown"}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 9, height: 18, fontWeight: 700 }}
                      />
                    )}
                    <Chip
                      label="Secure"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontSize: 9, height: 18, fontWeight: 700 }}
                    />
                    <Tooltip title="Delete Secret">
                      <IconButton
                        size="small"
                        onClick={() => onDeleteSecret(s.id)}
                        sx={{
                          color: "error.main",
                          "&:hover": { backgroundColor: "error.light", color: "#fff" },
                          transition: "all 0.2s",
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SecretsPage() {
  const { call, error, forbidden } = useApiCall();
  const [providers, setProviders] = useState<SecretProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Provider form
  const [providerOpen, setProviderOpen] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>(PROVIDER_PRESETS[0].id);
  const [providerForm, setProviderForm] = useState({
    label: "",
    host: PROVIDER_PRESETS[0].host,
    projectId: "",
    environment: "",
    machineIdentityId: "",
  });

  // Secret form
  const [secretOpen, setSecretOpen] = useState(false);
  const [secretSaving, setSecretSaving] = useState(false);
  const [loadingAvailableSecrets, setLoadingAvailableSecrets] = useState(false);
  const [availableProviderSecrets, setAvailableProviderSecrets] = useState<string[]>([]);
  const [activeProvider, setActiveProvider] = useState<SecretProvider | null>(
    null,
  );
  const [secretForm, setSecretForm] = useState<{
    providerId: string;
    environment: string;
    key: string;
  }>({
    providerId: "",
    environment: ENVIRONMENT_OPTIONS[0] || "production",
    key: "",
  });
  // Ref to refresh the specific provider card
  const [secretRefreshKey, setSecretRefreshKey] = useState(0);

  const loadAvailableProviderSecrets = async (
    providerId: string,
    environment: string,
  ) => {
    setLoadingAvailableSecrets(true);
    const data = await call(
      () => secretService.listAvailableByProvider(providerId, environment),
      { showError: true },
    );
    const availableKeys = data?.secrets ?? [];
    setAvailableProviderSecrets(availableKeys);
    setSecretForm((current) =>
      availableKeys.includes(current.key) ? current : { ...current, key: "" },
    );
    setLoadingAvailableSecrets(false);
  };

  const loadProviders = useCallback(async () => {
    setLoading(true);
    const data = await call(() => secretProviderService.list(), {
      showError: true,
    });
    if (data?.secretProviders) setProviders(data.secretProviders);
    setLoading(false);
  }, [call]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadProviders();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadProviders]);

  // When preset changes, update host
  const handlePresetChange = (presetId: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setProviderForm((f) => ({ ...f, host: preset.host }));
    }
  };

  const handleProviderSave = async () => {
    setProviderSaving(true);
    const payload: SecretProvider = {
      type: "infisical",
      label: providerForm.label,
      configuration: {
        host: providerForm.host,
        projectId: providerForm.projectId,
        environment: providerForm.environment,
        machineIdentityId: providerForm.machineIdentityId,
      },
    };

    const success = await call(() => secretProviderService.create(payload), {
      successMsg: "Secret provider configured successfully.",
    });

    setProviderSaving(false);
    if (success) {
      setProviderOpen(false);
      setProviderForm({
        label: "",
        host: PROVIDER_PRESETS[0].host,
        projectId: "",
        environment: "",
        machineIdentityId: "",
      });
      setSelectedPreset(PROVIDER_PRESETS[0].id);
      loadProviders();
    }
  };

  const openAddSecret = (provider: SecretProvider) => {
    const defaultEnvironment = ENVIRONMENT_OPTIONS[0] || "production";

    setActiveProvider(provider);
    setAvailableProviderSecrets([]);
    setSecretForm({
      providerId: provider.id ?? "",
      environment: defaultEnvironment,
      key: "",
    });
    setSecretOpen(true);

    if (provider.id) {
      void loadAvailableProviderSecrets(provider.id, defaultEnvironment);
    }
  };

  const handleSecretSave = async () => {
    setSecretSaving(true);
    const success = await call(
      () =>
        secretService.create({
          providerId: secretForm.providerId,
          environment: secretForm.environment,
          key: secretForm.key,
        }),
      { successMsg: "Secret mapped successfully." },
    );

    setSecretSaving(false);
    if (success) {
      setSecretOpen(false);
      setActiveProvider(null);
      setAvailableProviderSecrets([]);
      // Trigger refresh of provider cards
      setSecretRefreshKey((k) => k + 1);
    }
  };

  const closeSecretDialog = () => {
    setSecretOpen(false);
    setActiveProvider(null);
    setAvailableProviderSecrets([]);
  };

    const handleDeleteSecret = async (secretId: string | undefined) => {
      if (!secretId) return;
    
      const confirmed = window.confirm(
        "Are you sure you want to delete this secret? This action cannot be undone."
      );
      if (!confirmed) return;

      const success = await call(
        () => secretService.delete(secretId),
        { successMsg: "Secret deleted successfully." },
      );

      if (success) {
        // Trigger refresh of provider cards
        setSecretRefreshKey((k) => k + 1);
      }
    };

  return (
    <Box>
      {/* Page header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Secret Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Connect external secret providers and map secrets for use in
            workflows.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setProviderOpen(true)}
          sx={{ fontWeight: 600, borderRadius: "10px", px: 2.5 }}
        >
          Add Provider
        </Button>
      </Box>

      {/* Info banner */}
      {/* <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
        Reference secrets in workflow nodes using{" "}
        <strong>secret.YOUR_LABEL</strong> notation in expression inputs.
      </Alert> */}

      {/* Body */}
      {forbidden ? (
        <ForbiddenState message={error || "You do not have access to secrets"} />
      ) : error && !providers.length ? (
        <ErrorState message={error} onRetry={loadProviders} />
      ) : loading ? (
        <LoadingState text="Loading secret providers..." />
      ) : providers.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 7,
            textAlign: "center",
            borderRadius: "16px",
            border: "1.5px dashed",
            borderColor: "divider",
            backgroundColor: "background.default",
          }}
        >
          <LockIcon sx={{ fontSize: 52, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No Secret Providers Configured
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
          >
            Connect to an external secret management service like Infisical to
            securely inject secrets into your workflow executions.
          </Typography>
          <Button
            variant="contained"
            startIcon={<LockIcon />}
            onClick={() => setProviderOpen(true)}
            sx={{ borderRadius: "10px", fontWeight: 600, px: 3 }}
          >
            Connect Provider
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2} key={secretRefreshKey}>
          {providers.map((p) => (
            <ProviderCard
              key={p.id}
              provider={p}
              onAddSecret={openAddSecret}
              onDeleteSecret={handleDeleteSecret}
            />
          ))}
        </Stack>
      )}

      {/* ── Add Provider Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={providerOpen}
        onClose={() => !providerSaving && setProviderOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Connect Secret Provider
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Preset selector */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, mb: 0.75, display: "block" }}
              >
                SELECT PROVIDER TYPE
              </Typography>
              <Stack direction="row" spacing={1.5}>
                {PROVIDER_PRESETS.map((preset) => (
                  <Paper
                    key={preset.id}
                    elevation={0}
                    onClick={() => handlePresetChange(preset.id)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: "12px",
                      border: "2px solid",
                      borderColor:
                        selectedPreset === preset.id
                          ? "primary.main"
                          : "divider",
                      cursor: "pointer",
                      flex: 1,
                      transition: "border-color 0.15s",
                      backgroundColor:
                        selectedPreset === preset.id
                          ? "rgba(79,110,247,0.05)"
                          : "transparent",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                      {preset.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {preset.description}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Divider />

            <TextField
              label="Provider Label"
              placeholder="e.g., Production Vault"
              fullWidth
              size="small"
              value={providerForm.label}
              onChange={(e) =>
                setProviderForm({ ...providerForm, label: e.target.value })
              }
            />
            <TextField
              label="Host URL"
              fullWidth
              size="small"
              value={providerForm.host}
              onChange={(e) =>
                setProviderForm({ ...providerForm, host: e.target.value })
              }
            />
            <TextField
              label="Project ID"
              placeholder="Your Infisical project ID"
              fullWidth
              size="small"
              value={providerForm.projectId}
              onChange={(e) =>
                setProviderForm({ ...providerForm, projectId: e.target.value })
              }
            />
            <TextField
              label="Environment"
              placeholder="e.g., dev, staging, prod"
              fullWidth
              size="small"
              value={providerForm.environment}
              onChange={(e) =>
                setProviderForm({
                  ...providerForm,
                  environment: e.target.value,
                })
              }
            />
            <TextField
              label="Machine Identity ID"
              placeholder="Your machine identity for authentication"
              fullWidth
              size="small"
              value={providerForm.machineIdentityId}
              onChange={(e) =>
                setProviderForm({
                  ...providerForm,
                  machineIdentityId: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setProviderOpen(false)}
            color="inherit"
            disabled={providerSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProviderSave}
            disabled={
              providerSaving ||
              !providerForm.label ||
              !providerForm.host ||
              !providerForm.projectId ||
              !providerForm.machineIdentityId
            }
            startIcon={
              providerSaving ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
            sx={{ fontWeight: 600, borderRadius: "8px", minWidth: 140 }}
          >
            {providerSaving ? "Connecting…" : "Connect Provider"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Map Secret Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={secretOpen}
        onClose={() => !secretSaving && closeSecretDialog()}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Map Secret
          {activeProvider && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Adding to provider: <strong>{activeProvider.label}</strong>
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              select
              label="AWE Environment"
              fullWidth
              size="small"
              value={secretForm.environment}
              onChange={(e) => {
                const nextEnvironment = e.target.value;
                const providerId = secretForm.providerId;

                setSecretForm((current) => ({
                  ...current,
                  environment: nextEnvironment,
                  key: "",
                }));

                if (providerId) {
                  void loadAvailableProviderSecrets(providerId, nextEnvironment);
                }
              }}
            >
              {ENVIRONMENT_OPTIONS.map((env) => (
                <MenuItem key={env} value={env}>
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Secret Key (in Provider)"
              fullWidth
              size="small"
              value={secretForm.key}
              onChange={(e) =>
                setSecretForm({ ...secretForm, key: e.target.value })
              }
              disabled={loadingAvailableSecrets || availableProviderSecrets.length === 0}
              helperText={
                loadingAvailableSecrets
                  ? "Loading available keys from provider..."
                  : availableProviderSecrets.length === 0
                    ? "No keys found for this provider/environment"
                    : "Select a key from your provider"
              }
            >
              <MenuItem value="" disabled>
                {loadingAvailableSecrets
                  ? "Loading keys..."
                  : availableProviderSecrets.length === 0
                    ? "No keys available"
                    : "Select a key"}
              </MenuItem>
              {availableProviderSecrets.map((secretKey) => (
                <MenuItem key={secretKey} value={secretKey}>
                  {secretKey}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={closeSecretDialog}
            color="inherit"
            disabled={secretSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSecretSave}
            disabled={
              secretSaving || !secretForm.key
            }
            startIcon={
              secretSaving ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
            sx={{ fontWeight: 600, borderRadius: "8px", minWidth: 120 }}
          >
            {secretSaving ? "Mapping…" : "Map Secret"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
