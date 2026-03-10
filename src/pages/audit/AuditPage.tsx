import { Box, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";

export default function AuditPage() {
  return (
    <Box>
      <PageHeader
        title="Audit Log"
        subtitle="Track system activity and changes"
      />

      <Paper sx={{ p: 6, textAlign: "center" }} />
    </Box>
  );
}