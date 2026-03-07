import { Box, Typography } from "@mui/material";

export default function Logo() {
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: "8px",
        backgroundColor: "primary.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 0 12px rgba(79,110,247,0.4)",
        flexShrink: 0,
      }}
    >
      <Typography
        sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: "#fff",
        }}
      >
        A
      </Typography>
    </Box>
  );
}
