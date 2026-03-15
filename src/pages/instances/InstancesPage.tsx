import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Paper, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../../components/common/PageHeader';
import InstanceTable from './components/InstanceTable';
import CreateInstanceDialog from './components/CreateInstanceDialog';
import { useInstances } from './hooks/useInstances';
import type { BackendInstance } from '../../types';

export default function InstancesPage() {
  const navigate = useNavigate();
  const { instances, loading, fetch } = useInstances();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);

  const handleCreated = (instance: BackendInstance) => {
    navigate(`/instances/${instance.id}`);
  };

  return (
    <Box>
      <PageHeader
        title="Instances"
        subtitle="Monitor all running and completed workflow instances"
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Reload">
              <IconButton size="small" onClick={() => fetch()} disabled={loading}
                sx={{ color: 'text.secondary' }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Create Instance
            </Button>
          </Box>
        }
      />

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <InstanceTable instances={instances} loading={loading} />
      </Paper>

      <CreateInstanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  );
}
