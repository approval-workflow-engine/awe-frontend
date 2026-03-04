import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Link, useNavigate } from "react-router-dom";
import LogoMark from "../../components/common/LogoMark";
import { cardStyle, inputStyle, buttonStyle } from "../../styles/authStyles";
import { registerSystem } from "../../api/auth.api";

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    orgName: "",
    contactEmail: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await registerSystem(form);
      navigate("/login");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Registration failed. Please try again.";
      setError(message);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <Paper sx={cardStyle} elevation={0}>
        <LogoMark />

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="System Name *"
            name="name"
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            label="Organisation Name *"
            name="orgName"
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            label="Contact Email *"
            name="contactEmail"
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            label="Password *"
            name="password"
            type={showPw ? "text" : "password"}
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(!showPw)}>
                    {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password *"
            name="confirmPassword"
            type="password"
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
            onChange={handleChange}
          />

          <Button fullWidth variant="contained" type="submit" sx={buttonStyle}>
            Register System
          </Button>
        </form>

        <Typography textAlign="center" mt={0.5} color="#94a3b8">
          Already registered?{" "}
          <Link to="/login" style={{ color: "#5a6cff" }}>
            Sign In
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
