import { Box, Paper } from "@mui/material";

export default function AuthLayout({ children }: any) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 50% 0%, rgba(79,110,247,0.15), transparent 60%), #f4f6fb",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 480,
          p: 4,
          borderRadius: 3,
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}