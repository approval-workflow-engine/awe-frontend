import { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Link } from "react-router-dom";
import LogoMark from "../../components/common/LogoMark";
import { cardStyle, inputStyle, buttonStyle } from "../../styles/authStyles";
import { registerSystem } from "../../api/auth.api";

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);

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
    await registerSystem(form);
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
            type={showPw ? "text" : "password"}
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
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
            type="password"
            size="small"
            sx={{ ...inputStyle, mb: 1 }}
          />

          <Button fullWidth variant="contained" sx={buttonStyle}>
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