import { Box, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";

export default function InstancesPage() {
  return (
    <Box>
      <PageHeader
        title="Instances"
        subtitle="Monitor running and completed workflow instances"
      />

      <Paper sx={{ p: 6, textAlign: "center" }} />
    </Box>
  );
}