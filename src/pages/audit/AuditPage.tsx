import { Box, Typography, Paper } from '@mui/material';

export default function AuditPage() {
  return (
    <Box>
      <Box mb={3}>
        <Typography sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: 'text.primary' }}>
          Audit Log
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Track system activity and changes
        </Typography>
      </Box>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        
      </Paper>
    </Box>
  );
}
