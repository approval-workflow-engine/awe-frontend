import { Box, Typography } from "@mui/material";
import Logo from "./Logo";

export default function LogoMark() {
  return (
    <Box
      textAlign="center"
      mb={3}
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Logo />

      <Typography fontWeight={700} fontSize={22} mt={1}>
        AWE
      </Typography>

      <Typography fontSize={12} color="#94a3b8">
        Approval Workflow Engine
      </Typography>
    </Box>
  );
}