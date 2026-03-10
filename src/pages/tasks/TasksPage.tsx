import { Box, Typography, Paper } from '@mui/material';

export default function TasksPage() {
  return (
    <Box>
      <Box mb={3}>
        <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: 'text.primary' }}>
          Pending Tasks
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Review and complete tasks assigned to you
        </Typography>
      </Box>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        
      </Paper>
    </Box>
  );
}
