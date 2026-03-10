import { Box, Paper } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";

export default function TasksPage() {
  return (
    <Box>
      <PageHeader
        title="Pending Tasks"
        subtitle="Review and complete tasks assigned to you"
      />

      <Paper sx={{ p: 6, textAlign: "center" }} />
    </Box>
  );
}