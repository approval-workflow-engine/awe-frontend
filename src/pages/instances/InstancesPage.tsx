import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Paper, LinearProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Create Instance
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <InstanceTable instances={instances} />
      </Paper>

      <CreateInstanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  );
}
