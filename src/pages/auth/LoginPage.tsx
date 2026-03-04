import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Link } from "react-router-dom";
import LogoMark from "../../components/common/LogoMark";
import { cardStyle, inputStyle, buttonStyle } from "../../styles/authStyles";
import { loginSystem } from "../../api/auth.api";

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await loginSystem(form);
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
          <TextField
            fullWidth
            label="Email *"
            name="email"
            size="small"
            sx={{ ...inputStyle, mb: 2 }}
            onChange={handleChange}
          />

          <TextField
            fullWidth
            label="Password *"
            name="password"
            type={showPw ? "text" : "password"}
            size="small"
            sx={{ ...inputStyle, mb: 2 }}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPw(!showPw)}>
                    {showPw ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button fullWidth variant="contained" type="submit" sx={buttonStyle}>
            Sign In
          </Button>
        </form>

        <Typography textAlign="center" mt={2} color="#94a3b8">
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#5a6cff" }}>
            Register System
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
