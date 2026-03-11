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
} from "@mui/material";
import { CircularProgress } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LogoMark from "../../components/common/LogoMark";
import { inputStyle } from "../../styles/authStyles";
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

  const navigate = useNavigate();
  const { loading, call } = useApiCall();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    const data = await call(() => registerSystem(payload), {
      showError: true,
      successMsg: "Registration successful. You can now sign in.",
    });
    if (data) {
      navigate("/login", { replace: true });
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        bgcolor: "background.default",
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(79,110,247,0.07), transparent 55%)",
        px: 2,
        py: 4,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 400,
          p: "32px",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px",
        }}
      >
        {/* Branding */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <LogoMark />
          <Typography
            sx={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              color: "text.primary",
              mt: 1.5,
              mb: 0.5,
            }}
          >
            Create your account
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Register a new AWE system
          </Typography>
        </Box>

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
                  <IconButton
                    onClick={() => setShowPw((p) => !p)}
                    edge="end"
                    size="small"
                    sx={{ color: "text.disabled" }}
                  >
                    {showPw ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
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
            sx={{ ...inputStyle, mb: 2 }}
            onChange={handleChange}
            autoComplete="new-password"
            required
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{
              height: 40,
              fontWeight: 600,
              fontSize: 14,
              borderRadius: "8px",
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Register System"
            )}
          </Button>
        </form>

        <Typography
          textAlign="center"
          mt={2.5}
          sx={{ fontSize: 13, color: "text.secondary" }}
        >
          Already registered?{" "}
          <MuiLink
            component={RouterLink}
            to="/login"
            underline="hover"
            color="primary"
          >
            Sign In
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
