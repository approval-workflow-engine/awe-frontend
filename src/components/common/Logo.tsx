import { Box } from "@mui/material";

export default function Logo() {
  return (
    <Box
      component="img"
      src="/logo3.png"
      alt="Logo"
      sx={{
        width: 32,
        height: 32,
        borderRadius: "8px",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  );
}
