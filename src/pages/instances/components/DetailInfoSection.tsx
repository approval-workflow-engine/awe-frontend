import { Box, Typography, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StatusChip from '../../../components/common/StatusChip';
import type { Instance } from '../../../api/schemas/instance';
import { formatDate } from '../../../utils/formatUtils';

const MONO = "'JetBrains Mono', monospace";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box display="flex" alignItems="flex-start" gap={2} py={0.75}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box flex={1}>{value}</Box>
    </Box>
  );
}

function MonoText({ children }: { children: React.ReactNode }) {
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
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography fontWeight={700} fontSize={15} mb={2}>
        Instance Details
      </Typography>

      <Box sx={{ '& > *:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
        <InfoRow label="Instance ID" value={<MonoText>{instance.id}</MonoText>} />
        <InfoRow
          label="Workflow"
          value={
            <Box display="flex" alignItems="center" gap={1}>
              <Typography fontSize={13}>
                {instance.workflow.name}
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>
                v{instance.workflow.version}
              </Typography>
            </Box>
          }
        />
        {/* <InfoRow
          label="Version ID"
          value={<MonoText>{instance.workflow.id}</MonoText>}
        /> */}
        <InfoRow label="Instance Status" value={<StatusChip status={instance.status} />} />
        <InfoRow
          label="Auto Advance"
          value={<MonoText>{instance.autoAdvance ? 'Yes' : 'No'}</MonoText>}
        />
        <InfoRow
          label="Started"
          value={<Typography fontSize={13}>{formatSafeDate(instance.startedAt)}</Typography>}
        />
        {instance.endedAt && (
          <InfoRow
            label="Ended"
            value={<Typography fontSize={13}>{formatSafeDate(instance.endedAt)}</Typography>}
          />
        )}
        {instance.currentTask && (
          <InfoRow
            label="Current Task"
            value={
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
            }
          />
        )}
      </Box>

      <JsonAccordion title="Input Variables" data={instance.inputVariables} />
      <JsonAccordion title="Current Variables" data={instance.currentVariables} />
      <JsonAccordion title="Output Variables" data={instance.outputVariables} />
    </Paper>
  );
}
