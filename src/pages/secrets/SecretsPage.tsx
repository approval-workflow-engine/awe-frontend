import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyIcon from "@mui/icons-material/Key";
import LockIcon from "@mui/icons-material/Lock";
import { secretProviderService } from "../../api/services/secretProviders";
import { secretService } from "../../api/services/secrets";
import { ENVIRONMENT_CHANGE_EVENT } from "../../constants/environment";
import { useApiCall } from "../../hooks/useApiCall";
import PageHeader from "../../components/common/PageHeader";
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "../../components/common/states";
import type { SecretItem, SecretProvider } from "../../api/schemas";

const PROVIDER_PRESETS = [
  {
    id: "infisical",
    label: "Infisical",
    host: "https://app.infisical.com",
    description: "Open-source secret management platform",
  },
];

const AWS_IAM_ROLE_ARN = "arn:aws:iam::125869386640:role/awe-engine-role";

function getProviderConfig(provider: SecretProvider) {
  return provider.configuration && typeof provider.configuration === "object"
    ? (provider.configuration as Record<string, unknown>)
    : {};
}

function getConfigText(config: Record<string, unknown>, key: string) {
  const value = config[key];
  return typeof value === "string" && value.trim() ? value : "-";
}

function formatSecretDate(value: SecretItem["createdAt"]) {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : format(date, "MMM d, yyyy");
}

function ProviderCard({
  provider,
  selected,
  onSelect,
  onSetup,
}: {
  provider: SecretProvider;
  selected: boolean;
  onSelect: (provider: SecretProvider) => void;
  onSetup: (provider: SecretProvider) => void;
}) {
  const config = getProviderConfig(provider);
  const providerName = provider.label ?? provider.type ?? "Secret Provider";

  return (
    <Paper
      role="button"
      tabIndex={0}
      elevation={0}
      onClick={() => onSelect(provider)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(provider);
        }
      }}
      sx={{
        p: 2,
        borderRadius: "12px",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        // backgroundColor: selected ? "action.selected" : "background.paper",
        cursor: "pointer",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box display="flex" alignItems="center" gap={1.25} minWidth={0}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              backgroundColor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LockIcon sx={{ fontSize: 18, color: "primary.main" }} />
          </Box>
          <Box minWidth={0}>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }} noWrap>
              {providerName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {provider.type}
            </Typography>
          </Box>
        </Box>
        <Tooltip title="How to Setup">
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onSetup(provider);
            }}
            sx={{ color: "text.secondary", flexShrink: 0 }}
          >
            <HelpOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
        <Box display="grid" gap={0.5} sx={{ gridTemplateColumns: { sm: "1fr 1fr" } }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Host
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
              {getConfigText(config, "host")}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Project ID
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
              {getConfigText(config, "projectId")}
            </Typography>
          </Box>
        </Box>
        <Box display="grid" gap={0.5} sx={{ gridTemplateColumns: { sm: "1fr 1fr" } }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Environment
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
              {getConfigText(config, "environment")}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Machine Identity
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>
              {getConfigText(config, "machineIdentityId")}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="body2" color="text.secondary">
          Click to manage mapped secrets
        </Typography>
      </Box>
    </Paper>
  );
}

function SetupPanel({
  provider,
  copied,
  onCopy,
}: {
  provider: SecretProvider;
  copied: boolean;
  onCopy: () => void;
}) {
  const providerName = provider.label ?? provider.type ?? "this provider";

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px" }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>How to Setup</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            AWS IAM role-based access for {providerName}
          </Typography>
        </Box>
        <Tooltip title={copied ? "Copied" : "Copy ARN"}>
          <IconButton onClick={onCopy} size="small">
            <ContentCopyIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Alert severity="info" sx={{ mt: 2, borderRadius: "10px" }}>
        This configuration allows your application running on AWS to securely access secrets from the provider using IAM role-based authentication. No static credentials are required.
      </Alert>

      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            1. Navigate to Machine Identities ? AWS Authentication
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Open the AWS authentication section and use the machine identity that will be used by AWE.
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            2. Add this AWS IAM Role ARN
          </Typography>
          <Paper variant="outlined" sx={{ mt: 0.75, p: 1.25, borderRadius: "10px" }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
              <Typography
                sx={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  overflowWrap: "anywhere",
                }}
              >
                {AWS_IAM_ROLE_ARN}
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                onClick={onCopy}
                sx={{ borderRadius: "8px", fontWeight: 700, flexShrink: 0 }}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </Box>
          </Paper>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            3. Assign permissions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Allow the role to read the project secrets needed by your application.
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function SecretRow({
  secret,
  onDelete,
}: {
  secret: SecretItem;
  onDelete: (id: string | undefined) => void;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: "10px" }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
        <Box display="flex" alignItems="flex-start" gap={1.25} minWidth={0}>
          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "success.main", mt: 0.25 }} />
          <Box minWidth={0}>
            <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
              {secret.key}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontFamily: "'JetBrains Mono', monospace" }} noWrap>
              key: {secret.key}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Created: {formatSecretDate(secret.createdAt)}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
          {secret.environment ? (
            <Chip
              label={secret.environment}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}
            />
          ) : null}
          <Tooltip title="Delete Secret">
            <IconButton size="small" onClick={() => onDelete(secret.id)}>
              <DeleteIcon sx={{ fontSize: 18, color: "error.main" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

export default function SecretsPage() {
  const { call, error, forbidden } = useApiCall();
  const [providers, setProviders] = useState<SecretProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerOpen, setProviderOpen] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(PROVIDER_PRESETS[0].id);
  const [providerForm, setProviderForm] = useState({
    label: "",
    host: PROVIDER_PRESETS[0].host,
    projectId: "",
    environment: "",
    machineIdentityId: "",
  });
  const [selectedProvider, setSelectedProvider] = useState<SecretProvider | null>(null);
  const [selectedProviderSecrets, setSelectedProviderSecrets] = useState<SecretItem[]>([]);
  const [selectedProviderSecretsLoading, setSelectedProviderSecretsLoading] = useState(false);
  const selectedProviderIdRef = useRef<string | null>(null);
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [arnCopied, setArnCopied] = useState(false);
  const [secretOpen, setSecretOpen] = useState(false);
  const [secretSaving, setSecretSaving] = useState(false);
  const [activeProvider, setActiveProvider] = useState<SecretProvider | null>(null);
  const [secretForm, setSecretForm] = useState<{ providerId: string; key: string }>({
    providerId: "",
    key: "",
  });

  const loadSelectedProviderSecrets = useCallback(
    async (providerId: string) => {
      setSelectedProviderSecretsLoading(true);
      const data = await call(() => secretService.list({ providerId }), {
        showError: true,
      });
      setSelectedProviderSecrets(data?.secrets ?? []);
      setSelectedProviderSecretsLoading(false);
    },
    [call],
  );

  const loadProviders = useCallback(async () => {
    setLoading(true);
    const data = await call(() => secretProviderService.list(), { showError: true });
    const nextProviders = data?.secretProviders ?? [];
    setProviders(nextProviders);
    setLoading(false);

    if (!selectedProviderIdRef.current && nextProviders.length > 0) {
      setSelectedProvider(nextProviders[0]);
      if (nextProviders[0].id) {
        void loadSelectedProviderSecrets(nextProviders[0].id);
      }
    }
  }, [call, loadSelectedProviderSecrets]);



  useEffect(() => {
    selectedProviderIdRef.current = selectedProvider?.id ?? null;
  }, [selectedProvider]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProviders();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProviders]);

  useEffect(() => {
    const handleEnvironmentChange = () => {
      // refresh providers and selected-provider secrets (table data)
      void loadProviders();
      if (selectedProviderIdRef.current) {
        void loadSelectedProviderSecrets(selectedProviderIdRef.current);
      }
    };

    window.addEventListener(ENVIRONMENT_CHANGE_EVENT, handleEnvironmentChange);
    return () => window.removeEventListener(ENVIRONMENT_CHANGE_EVENT, handleEnvironmentChange);
  }, [loadProviders, loadSelectedProviderSecrets]);

  const handlePresetChange = (presetId: string) => {
    const preset = PROVIDER_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setSelectedPreset(presetId);
    setProviderForm((current) => ({ ...current, host: preset.host }));
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
      void loadProviders();
    }
  };

  const openProvider = (provider: SecretProvider, showSetup = false) => {
    setSelectedProvider(provider);
    setSelectedProviderSecrets([]);
    setSetupExpanded(showSetup);
    setArnCopied(false);
    if (provider.id) {
      void loadSelectedProviderSecrets(provider.id);
    }
  };

  const handleSetupCopy = () => {
    navigator.clipboard.writeText(AWS_IAM_ROLE_ARN).then(() => {
      setArnCopied(true);
      window.setTimeout(() => setArnCopied(false), 1800);
    });
  };

  const openAddSecret = (provider: SecretProvider) => {
    setActiveProvider(provider);
    setSecretForm({
      providerId: provider.id ?? "",
      key: "",
    });
    setSecretOpen(true);
  };

  const handleSecretSave = async () => {
    setSecretSaving(true);
    const success = await call(
      () =>
        secretService.create({
          providerId: secretForm.providerId,
          key: secretForm.key,
        }),
      { successMsg: "Secret mapped successfully." },
    );

    setSecretSaving(false);
    if (success) {
      setSecretOpen(false);
      setActiveProvider(null);
      if (selectedProvider?.id) {
        void loadSelectedProviderSecrets(selectedProvider.id);
      }
    }
  };

  const closeSecretDialog = () => {
    setSecretOpen(false);
    setActiveProvider(null);
  };

  const handleDeleteSecret = async (secretId: string | undefined) => {
    if (!secretId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this secret? This action cannot be undone.",
    );
    if (!confirmed) return;

    const success = await call(() => secretService.delete(secretId), {
      successMsg: "Secret deleted successfully.",
    });

    if (success && selectedProvider?.id) {
      void loadSelectedProviderSecrets(selectedProvider.id);
    }
  };

  const selectedProviderName = selectedProvider?.label ?? selectedProvider?.type ?? "Secret Provider";

  return (
    <Box>
      <PageHeader
        title="Secret Management"
        subtitle="Simple provider setup, secret mapping, and setup guidance in one place."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setProviderOpen(true)}
            sx={{ fontWeight: 700, borderRadius: "8px", px: 2.25 }}
          >
            Add Provider
          </Button>
        }
      />



      {forbidden ? (
        <ForbiddenState message={error || "You do not have access to secrets"} />
      ) : error && !providers.length ? (
        <ErrorState message={error} onRetry={loadProviders} />
      ) : loading ? (
        <LoadingState text="Loading secret providers..." />
      ) : providers.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: "14px",
            borderStyle: "dashed",
            textAlign: "center",
          }}
        >
          <LockIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
            No secret providers configured
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560, mx: "auto" }}>
            Add a provider to begin mapping secrets. The page will stay consistent with the rest of the app and keep the workflow simple.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setProviderOpen(true)}
            sx={{ mt: 3, borderRadius: "8px", fontWeight: 700, px: 3 }}
          >
            Connect Provider
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 360px" },
            alignItems: "start",
          }}
        >
          <Box>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              {providers.map((provider) => (
                <ProviderCard
                  key={provider.id ?? provider.label ?? provider.type}
                  provider={provider}
                  selected={selectedProvider?.id === provider.id}
                  onSelect={(item) => openProvider(item, false)}
                  onSetup={(item) => openProvider(item, true)}
                />
              ))}
            </Box>
          </Box>

          {selectedProvider ? (
            <Paper
              variant="outlined"
              sx={{
                borderRadius: "14px",
                position: "sticky",
                top: 24,
                overflow: "hidden",
              }}
            >
              <Box sx={{ px: 2, py: 1.75, borderBottom: "1px solid", borderColor: "divider" }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                      Provider Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProviderName}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => setSelectedProvider(null)} size="small">
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    variant={setupExpanded ? "contained" : "outlined"}
                    startIcon={<HelpOutlineIcon />}
                    onClick={() => setSetupExpanded((current) => !current)}
                    sx={{ borderRadius: "8px", fontWeight: 700 }}
                  >
                    Setup
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openAddSecret(selectedProvider)}
                    sx={{ borderRadius: "8px", fontWeight: 700 }}
                  >
                    Add Secret
                  </Button>
                </Stack>



                <Collapse in={setupExpanded} timeout="auto">
                  <SetupPanel
                    provider={selectedProvider}
                    copied={arnCopied}
                    onCopy={handleSetupCopy}
                  />
                </Collapse>

                <Box sx={{ mt: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>
                      Configured Secrets
                    </Typography>
                    <Chip
                      label={selectedProviderSecretsLoading ? "Loading" : `${selectedProviderSecrets.length} total`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 22, fontSize: 10, fontWeight: 700 }}
                    />
                  </Box>

                  {selectedProviderSecretsLoading ? (
                    <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}>
                      <CircularProgress size={22} />
                    </Box>
                  ) : selectedProviderSecrets.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: "10px", textAlign: "center" }}>
                      <KeyIcon sx={{ fontSize: 34, color: "text.disabled" }} />
                      <Typography sx={{ fontWeight: 700, fontSize: 14, mt: 1 }}>
                        No secrets configured yet
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5, fontSize: 13 }}>
                        Use Add Secret to map a provider key to an AWE environment.
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => openAddSecret(selectedProvider)}
                        sx={{ mt: 2, borderRadius: "8px", fontWeight: 700 }}
                      >
                        Add Secret
                      </Button>
                    </Paper>
                  ) : (
                    <Stack spacing={1.15}>
                      {selectedProviderSecrets.map((secret) => (
                        <SecretRow
                          key={secret.id ?? `${secret.key}-${secret.environment ?? "default"}`}
                          secret={secret}
                          onDelete={handleDeleteSecret}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Paper>
          ) : null}
        </Box>
      )}

      <Dialog
        open={providerOpen}
        onClose={() => !providerSaving && setProviderOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Connect Secret Provider
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 0.75, display: "block" }}>
                SELECT PROVIDER TYPE
              </Typography>
              <Stack direction="row" spacing={1.25}>
                {PROVIDER_PRESETS.map((preset) => (
                  <Paper
                    key={preset.id}
                    elevation={0}
                    onClick={() => handlePresetChange(preset.id)}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderRadius: "10px",
                      border: "1px solid",
                      borderColor: selectedPreset === preset.id ? "primary.main" : "divider",
                      cursor: "pointer",
                      flex: 1,
                      backgroundColor: selectedPreset === preset.id ? "action.selected" : "background.paper",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
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
              placeholder="e.g. Production Vault"
              fullWidth
              size="small"
              value={providerForm.label}
              onChange={(event) => setProviderForm({ ...providerForm, label: event.target.value })}
            />
            <TextField
              label="Host URL"
              fullWidth
              size="small"
              value={providerForm.host}
              onChange={(event) => setProviderForm({ ...providerForm, host: event.target.value })}
            />
            <TextField
              label="Project ID"
              placeholder="Your Infisical project ID"
              fullWidth
              size="small"
              value={providerForm.projectId}
              onChange={(event) => setProviderForm({ ...providerForm, projectId: event.target.value })}
            />
            <TextField
              label="Environment"
              placeholder="e.g. dev, staging, prod"
              fullWidth
              size="small"
              value={providerForm.environment}
              onChange={(event) => setProviderForm({ ...providerForm, environment: event.target.value })}
            />
            <TextField
              label="Machine Identity ID"
              placeholder="Your machine identity for authentication"
              fullWidth
              size="small"
              value={providerForm.machineIdentityId}
              onChange={(event) => setProviderForm({ ...providerForm, machineIdentityId: event.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setProviderOpen(false)} color="inherit" disabled={providerSaving}>
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
            startIcon={providerSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ fontWeight: 700, borderRadius: "8px", minWidth: 140 }}
          >
            {providerSaving ? "Connecting..." : "Connect Provider"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={secretOpen}
        onClose={() => !secretSaving && closeSecretDialog()}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Map Secret
          {activeProvider ? (
            <Typography variant="caption" color="text.secondary" display="block">
              Adding to provider: <strong>{activeProvider.label ?? activeProvider.type}</strong>
            </Typography>
          ) : null}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Secret Key (in Provider)"
              placeholder="e.g. DATABASE_PASSWORD"
              fullWidth
              size="small"
              value={secretForm.key}
              onChange={(event) => setSecretForm({ ...secretForm, key: event.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={closeSecretDialog} color="inherit" disabled={secretSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSecretSave}
            disabled={secretSaving || !secretForm.key}
            startIcon={secretSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ fontWeight: 700, borderRadius: "8px", minWidth: 120 }}
          >
            {secretSaving ? "Mapping..." : "Map Secret"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


