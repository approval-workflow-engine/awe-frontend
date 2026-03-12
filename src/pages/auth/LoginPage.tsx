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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await call<LoginResponse>(() => loginSystem(form), {
      errorMsg: "Invalid email or password",
    });
    if (data) {
      // After ApiResponse unwrapping in useApiCall, data is already the inner payload
      const body = data as {
        system?: User;
        accessToken?: string;
        refreshToken?: string;
      };
      const system = body.system;
      const accessToken = body.accessToken;
      const refreshToken = body.refreshToken;
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
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(79,110,247,0.07), transparent 55%)",
        px: 2,
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
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <LogoMark />
        </Box>

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
            sx={{ ...inputStyle, mb: 2.5 }}
            onChange={handleChange}
            autoComplete="current-password"
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

          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading || !form.email.trim() || !form.password.trim()}
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
              "Sign In"
            )}
          </Button>
        </form>

        <Typography
          textAlign="center"
          mt={2.5}
          sx={{ fontSize: 13, color: "text.secondary" }}
        >
          Don't have an account?{" "}
          <MuiLink
            component={RouterLink}
            to="/register"
            underline="hover"
            color="primary"
          >
            Register
          </MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}
