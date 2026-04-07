import type { ReactNode } from 'react';
import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StatusChip from '../../../components/common/StatusChip';
import type { Instance } from '../../../api/schemas/instance';
import { formatDate } from '../../../utils/formatUtils';

const MONO = "'JetBrains Mono', monospace";

function MonoText({ children }: { children: ReactNode }) {
  return <Typography sx={{ fontFamily: MONO, fontSize: 12 }}>{children}</Typography>;
}

function JsonAccordion({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mt: 1.5 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 40 }}>
        <Typography fontSize={13} fontWeight={600}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Box
          component="pre"
          sx={{
            fontFamily: MONO,
            fontSize: 12,
            m: 0,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: 'action.hover',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {JSON.stringify(data, null, 2)}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

interface Props {
  instance: Instance;
}

export default function DetailInfoSection({ instance }: Props) {
  const formatSafeDate = (s: string | null) => s ? formatDate(s) : '-';

  const infoItems: Array<{ label: string; value: ReactNode; fullWidth?: boolean }> = [
    {
      label: 'Instance ID',
      value: <MonoText>{instance.id}</MonoText>,
      fullWidth: true,
    },
    {
      label: 'Workflow',
      value: (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize={13}>
            {instance.workflow.name}
          </Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
            v{instance.workflow.version}
          </Typography>
        </Box>
      ),
    },
    {
      label: 'Instance Status',
      value: <StatusChip status={instance.status} />,
    },
    {
      label: 'Auto Advance',
      value: <MonoText>{instance.autoAdvance ? 'Yes' : 'No'}</MonoText>,
    },
    {
      label: 'Started',
      value: <Typography fontSize={13}>{formatSafeDate(instance.startedAt)}</Typography>,
    },
  ];

  if (instance.endedAt) {
    infoItems.push({
      label: 'Ended',
      value: <Typography fontSize={13}>{formatSafeDate(instance.endedAt)}</Typography>,
    });
  }

  if (instance.currentTask) {
    infoItems.push({
      label: 'Current Task',
      fullWidth: true,
      value: (
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontSize={13} fontWeight={500}>
              {instance.currentTask.name || `${instance.currentTask.type} Node`}
            </Typography>
            <StatusChip status={instance.currentTask.status} />
          </Box>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary', mt: 0.5 }}>
            {instance.currentTask.type} • {instance.currentTask.nodeId}
          </Typography>
        </Box>
      ),
    });
  }

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography fontWeight={700} fontSize={14} mb={1.5}>
        Instance Details
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
          columnGap: 2,
          rowGap: 1,
        }}
      >
        {infoItems.map((item) => (
          <Box
            key={item.label}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 0.75,
              gridColumn: item.fullWidth ? '1 / -1' : undefined,
            }}
          >
            <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.25 }}>
              {item.label}
            </Typography>
            <Box>{item.value}</Box>
          </Box>
        ))}
      </Box>

      <Accordion disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />} sx={{ minHeight: 36 }}>
          <Typography fontSize={12} fontWeight={600}>
            Variables
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2 }}>
          <JsonAccordion title="Input Variables" data={instance.inputVariables} />
          <JsonAccordion title="Current Variables" data={instance.currentVariables} />
          <JsonAccordion title="Output Variables" data={instance.outputVariables} />
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}
