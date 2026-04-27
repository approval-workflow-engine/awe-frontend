import { Box, Typography, Button } from "@mui/material";
import { LockOutlined, ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export function ForbiddenState({
  message = "You do not have permission to access this resource.",
}: {
  message?: string;
}) {
  const navigate = useNavigate();
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={2}
      textAlign="center"
    >
      <Box
        sx={{
          bgcolor: "error.light",
          color: "error.main",
          p: 2,
          borderRadius: "50%",
          mb: 2,
          display: "flex",
          opacity: 0.8,
        }}
      >
        <LockOutlined sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h5" fontWeight="600" color="error.main" gutterBottom>
        Access Denied
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ maxWidth: 400, mb: 4 }}
      >
        {message}
      </Typography>
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
      >
        Go Back
      </Button>
    </Box>
  );
}
