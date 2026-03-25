import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, IconButton, Paper, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import InstanceTable from './components/InstanceTable';
import CreateInstanceDialog from './components/CreateInstanceDialog';
import { useInstances } from './hooks/useInstances';
import { usePolling } from '../../hooks/usePolling';
import type { InstanceListItem } from '../../api/schemas/instance';

const POLL_INTERVAL_MS = 5000;

export default function InstancesPage() {
  const navigate = useNavigate();
  const { instances, loading, fetch, silentFetch } = useInstances();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => { fetch(); }, [fetch]);

  usePolling(() => { silentFetch(); }, POLL_INTERVAL_MS, true);

  const handleCreated = (instance: InstanceListItem) => {
    navigate(`/instances/${instance.id}`, { state: { instance } });
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
