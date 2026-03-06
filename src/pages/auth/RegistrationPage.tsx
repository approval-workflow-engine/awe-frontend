import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link as MuiLink,
  Dialog,
  DialogContent,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LogoMark from "../../components/common/LogoMark";
import { cardStyle, inputStyle, buttonStyle } from "../../styles/authStyles";
import { registerSystem } from "../../api/authApi";
import { useApiCall } from "../../hooks/useApiCall";

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    orgName: "",
    contactEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [pwError, setPwError] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const navigate = useNavigate();
  const { loading, call } = useApiCall();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "password" || name === "confirmPassword") setPwError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }
    const payload = {
      name: form.name,
      orgName: form.orgName,
      contactEmail: form.contactEmail,
      password: form.password,
      ...(form.description ? { description: form.description } : {}),
    };
    const data = await call(
      () => registerSystem(payload),
      { showError: true }
    );
    if (data) {
      // Extract API key from response — may be at different levels depending on backend
      const resp = data as { data?: { apiKey?: string } };
      const key = resp?.data?.apiKey || null;
      if (key) {
        setApiKey(key);
      } else {
        // No API key in response — go directly to login
        navigate("/login", { replace: true });
      }
    }
  };

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDone = () => {
    navigate("/login", { replace: true });
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        bgcolor: "background.default",
        backgroundImage: "radial-gradient(ellipse at top, rgba(79,110,247,0.07), transparent 55%)",
      }}
    >
      <Paper sx={{ ...cardStyle, my: 4 }} elevation={0}>
        <LogoMark />

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="System Name *"
            name="name"
            size="small"
            value={form.name}
            sx={{ ...inputStyle, mb: 1.5 }}
            onChange={handleChange}
            required
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            size="small"
            value={form.description}
            sx={{ ...inputStyle, mb: 1.5 }}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            label="Organisation Name *"
            name="orgName"
            size="small"
            value={form.orgName}
            sx={{ ...inputStyle, mb: 1.5 }}
            onChange={handleChange}
            required
          />

          <TextField
            fullWidth
            label="Contact Email *"
            name="contactEmail"
            type="email"
            size="small"
            value={form.contactEmail}
            sx={{ ...inputStyle, mb: 1.5 }}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <TextField
            fullWidth
            label="Password *"
            name="password"
            type={showPw ? "text" : "password"}
            size="small"
            value={form.password}
            sx={{ ...inputStyle, mb: 1.5 }}
            onChange={handleChange}
            autoComplete="new-password"
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(p => !p)} edge="end" size="small">
                    {showPw ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password *"
            name="confirmPassword"
            type="password"
            size="small"
            value={form.confirmPassword}
            error={!!pwError}
            helperText={pwError}
            sx={{ ...inputStyle, mb: 1.5 }}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={buttonStyle}
          >
            {loading ? "Registering…" : "Register System"}
          </Button>
        </form>

        <Typography textAlign="center" mt={2.5} variant="body2" color="text.secondary">
          Already registered?{" "}
          <MuiLink component={RouterLink} to="/login" underline="hover" color="primary">
            Sign In
          </MuiLink>
        </Typography>
      </Paper>

      {/* Non-dismissible API Key Modal */}
      <Dialog
        open={!!apiKey}
        disableEscapeKeyDown
        onClose={() => {
          // Prevent closing by clicking outside
        }}
        slotProps={{
          backdrop: {
            onClick: (e) => e.stopPropagation(),
          },
        }}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: 480,
            p: 0,
            border: '1px solid #252a3d',
            backgroundColor: '#0f1117',
          },
        }}
      >
        <DialogContent sx={{ p: 3 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: '10px',
                backgroundColor: 'rgba(245,158,11,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#e8eaf2' }}>
                Your API Key
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#8b91a8' }}>
                System registered successfully
              </Typography>
            </Box>
          </Box>

          {/* Warning */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '8px',
              backgroundColor: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              mb: 2,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <WarningAmberIcon sx={{ color: '#f59e0b', fontSize: 16, mt: 0.1, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
              This API key will <strong>never be shown again</strong>. Copy it now and store it securely before closing this dialog.
            </Typography>
          </Box>

          {/* API Key display */}
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
              backgroundColor: '#0a0b0f',
              border: '1px solid #252a3d',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: '#f59e0b',
                wordBreak: 'break-all',
                flex: 1,
              }}
            >
              {apiKey}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
              <IconButton
                onClick={handleCopy}
                size="small"
                sx={{
                  color: copied ? '#22c55e' : '#8b91a8',
                  flexShrink: 0,
                  '&:hover': { color: '#f59e0b' },
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Close button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleDone}
            sx={{
              height: 40,
              fontWeight: 600,
              fontSize: 14,
              borderRadius: '8px',
              backgroundColor: '#f59e0b',
              color: '#0a0b0f',
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
