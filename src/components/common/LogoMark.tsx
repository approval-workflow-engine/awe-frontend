import { Box, Typography } from "@mui/material";

export default function LogoMark() {
  return (
    <Box textAlign="center" mb={3}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "12px",
          background: "linear-gradient(135deg,#5a6cff,#4f6ef7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          boxShadow: "0 0 25px rgba(79,110,247,0.7)",
        }}
      >
        <Typography fontWeight={700} color="#fff">
          A
        </Typography>
      </Box>

      <Typography fontWeight={700} fontSize={22} mt={1}>
        AWE
      </Typography>

      <Typography fontSize={12} color="#94a3b8">
        Approval Workflow Engine
      </Typography>
    </Box>
  );
}