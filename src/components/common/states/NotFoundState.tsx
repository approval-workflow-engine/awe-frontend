import { Box, Typography, Button } from "@mui/material";
import { SearchOffOutlined, ArrowBack, Dashboard } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";

export function NotFoundState({
  message = "The requested resource could not be found.",
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
          bgcolor: "action.hover",
          color: "text.disabled",
          p: 2,
          borderRadius: "50%",
          mb: 2,
          display: "flex",
        }}
      >
        <SearchOffOutlined sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h5" fontWeight="600" gutterBottom>
        Not Found
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 450, mb: 4 }}>
        {message}
      </Typography>
      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="contained"
          startIcon={<Dashboard />}
          component={Link}
          to="/"
          sx={{
            bgcolor: "primary.main",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          Dashboard
        </Button>
      </Box>
    </Box>
  );
}
