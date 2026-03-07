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
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import LogoMark from "../../components/common/LogoMark";
import { cardStyle, inputStyle, buttonStyle } from "../../styles/authStyles";
import { loginSystem } from "../../api/authApi";
import { useApp } from "../../context/useApp";
import { useApiCall } from "../../hooks/useApiCall";
import type { LoginResponse, User } from "../../types";

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const { login } = useApp();
  const navigate = useNavigate();
  const { loading, call } = useApiCall();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await call<LoginResponse>(
      () => loginSystem(form),
      { errorMsg: "Invalid email or password" }
    );
    if (data) {
      // Backend wraps responses in ApiResponse: { success, data: { ... } }
      // Handle both wrapped and bare formats defensively.
      const body = data as unknown as {
        data?: { system?: User; accessToken?: string; refreshToken?: string };
        system?: User; accessToken?: string; refreshToken?: string;
      };
      const system = body.data?.system ?? body.system;
      const accessToken = body.data?.accessToken ?? body.accessToken;
      const refreshToken = body.data?.refreshToken ?? body.refreshToken;
      if (system && accessToken && refreshToken) {
        login(system, accessToken, refreshToken);
        navigate("/dashboard", { replace: true });
      }
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
        backgroundImage: "radial-gradient(ellipse at top, rgba(79,110,247,0.07), transparent 55%)",
      }}
    >
      <Paper sx={cardStyle} elevation={0}>
        <LogoMark />

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            size="small"
            value={form.email}
            sx={{ ...inputStyle, mb: 2 }}
            onChange={handleChange}
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPw ? "text" : "password"}
            size="small"
            value={form.password}
            sx={{ ...inputStyle, mb: 2 }}
            onChange={handleChange}
            autoComplete="current-password"
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

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={buttonStyle}
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <Typography textAlign="center" mt={2.5} variant="body2" color="text.secondary">
          Don't have an account?{" "}
          <MuiLink component={RouterLink} to="/register" underline="hover" color="primary">
            Register System
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
