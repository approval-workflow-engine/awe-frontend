import { Box, Typography, Button } from "@mui/material";
import { ErrorOutline, Refresh } from "@mui/icons-material";

export function ErrorState({
  message = "Request failed",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
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
        <ErrorOutline sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h5" fontWeight="600" color="error.main" gutterBottom>
        Something went wrong
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 400, mb: 4 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onRetry}
          sx={{
            bgcolor: "text.primary",
            "&:hover": { bgcolor: "text.secondary" },
          }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
}
