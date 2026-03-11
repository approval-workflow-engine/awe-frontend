import { Alert, Box } from "@mui/material";

interface DialogErrorAlertProps {
  /** Single error message string. */
  message?: string | null;
  /** Optional list of individual error messages rendered as bullet points. */
  errors?: string[];
}

/**
 * Reusable inline error display for dialogs and forms.
 * Renders nothing when there is no message or errors to show.
 */
export default function DialogErrorAlert({
  message,
  errors,
}: DialogErrorAlertProps) {
  const hasContent = message || (errors && errors.length > 0);
  if (!hasContent) return null;

  return (
    <Box sx={{ mt: 1.5 }}>
      <Alert
        severity="error"
        sx={{
          fontSize: 12,
          py: 0.75,
          alignItems: "flex-start",
          "& .MuiAlert-message": { width: "100%" },
        }}
      >
        {message && <span>{message}</span>}
        {errors && errors.length > 0 && (
          <ul style={{ margin: message ? "4px 0 0 0" : 0, paddingLeft: 18 }}>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </Alert>
    </Box>
  );
}
