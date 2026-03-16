import { Box, Paper, Typography } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";

export default function AuditPage() {
  return (
    <Box>
      <PageHeader
        title="Audit Log"
        subtitle="Track system activity and changes"
      />

      <Paper sx={{ p: 6, textAlign: "center" }}>
        <Typography color="text.secondary" fontSize={13}>
          No audit logs available.
        </Typography>
      </Paper>
    </Box>
  );
}