import { Box, Typography, Paper } from '@mui/material';

export default function InstancesPage() {
  return (
    <Box>
      <Box mb={3}>
        <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: 'text.primary' }}>
          Instances
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Monitor running and completed workflow instances
        </Typography>
      </Box>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        
      </Paper>
    </Box>
  );
}
