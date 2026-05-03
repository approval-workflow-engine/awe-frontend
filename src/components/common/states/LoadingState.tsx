import { Box, Typography, CircularProgress } from "@mui/material";

export function LoadingState({ text = "Loading..." }: { text?: string }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={8}
      px={2}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}
