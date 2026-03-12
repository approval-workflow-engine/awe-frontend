import React from "react";
import { Alert, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useError } from "../../context/ErrorContext";

export default function ErrorBanner() {
  const { error, setError } = useError();

  // auto-clear after 3 seconds
  React.useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  if (!error) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: (theme) => theme.zIndex.snackbar + 1,
        width: "calc(100% - 32px)",
        maxWidth: 600,
      }}
    >
      <Alert
        severity="error"
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setError(null)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {error}
      </Alert>
    </Box>
  );
}
