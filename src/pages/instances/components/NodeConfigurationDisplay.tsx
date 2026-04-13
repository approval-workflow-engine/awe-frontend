import { Box, Typography } from '@mui/material';

const MONO = "'JetBrains Mono', monospace";

interface NodeConfigurationDisplayProps {
  nodeType: string;
  config: any;
}

function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={1}>
        {title}
      </Typography>
      <Box display="flex" flexDirection="column" gap={1}>
        {children}
      </Box>
    </Box>
  );
}

function ConfigRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <Box display="grid" gridTemplateColumns="140px 1fr" gap={2} alignItems="flex-start">
      <Typography fontSize={12} color="text.secondary">{label}</Typography>
      <Typography fontSize={12} sx={{ fontFamily: mono ? MONO : 'inherit', wordBreak: 'break-word', color: 'text.primary' }}>
        {value === undefined || value === null || value === '' ? (
          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>None</span>
        ) : (
          value
        )}
      </Typography>
    </Box>
  );
}

function StartNodeConfig({ config }: { config: any }) {
  return (
    <>
      {config.inputDataMap && config.inputDataMap.length > 0 && (
        <ConfigSection title="Input Mapping">
          {config.inputDataMap.map((map: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="JSON Path" value={map.jsonPath} mono />
              <ConfigRow label="Type" value={map.dataType} mono />
              <ConfigRow label="Context Var" value={map.contextVariableName} mono />
              {map.fetchableId && <ConfigRow label="Fetchable ID" value={map.fetchableId} mono />}
            </Box>
          ))}
        </ConfigSection>
      )}
      {config.fetchables && config.fetchables.length > 0 && (
        <ConfigSection title="Fetchables">
          {config.fetchables.map((fetchable: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="ID" value={fetchable.id} mono />
              <ConfigRow label="Method" value={fetchable.method} mono />
              <ConfigRow label="URL" value={fetchable.urlExpression} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
    </>
  );
}

function UserNodeConfig({ config }: { config: any }) {
  return (
    <>
      <ConfigSection title="Task Details">
        <ConfigRow label="Title" value={config.title} />
        <ConfigRow label="Description" value={config.description} />
        <ConfigRow label="Assignee" value={config.assignee} />
      </ConfigSection>
      {config.requestMap && config.requestMap.length > 0 && (
        <ConfigSection title="Displayed Fields">
          {config.requestMap.map((map: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="Label" value={map.label} />
              <ConfigRow label="Value" value={map.valueExpression} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
      {config.responseMap && config.responseMap.length > 0 && (
        <ConfigSection title="Input Fields">
          {config.responseMap.map((map: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="Field ID" value={map.fieldId} mono />
              <ConfigRow label="Label" value={map.label} />
              <ConfigRow label="Context Var" value={map.contextVariableName} mono />
              <ConfigRow label="Type" value={map.type} mono />
              <ConfigRow label="UI Type" value={map.uiType} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
    </>
  );
}

function ServiceNodeConfig({ config }: { config: any }) {
  return (
    <>
      <ConfigSection title="Endpoint">
        <ConfigRow label="Method" value={config.method} mono />
        <ConfigRow label="URL" value={config.urlExpression} mono />
        <ConfigRow label="Timeout" value={config.timeoutMs ? `${config.timeoutMs}ms` : undefined} />
        <ConfigRow label="Max Attempts" value={config.maxAttempts} />
        {config.backoff && (
          <ConfigRow label="Backoff" value={`${config.backoff.type} / ${config.backoff.delay}${config.backoff.unit}`} />
        )}
      </ConfigSection>
      {config.headers && config.headers.length > 0 && (
        <ConfigSection title="Headers">
          {config.headers.map((h: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="Key" value={h.key} />
              <ConfigRow label="Value" value={h.valueExpression} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
      {config.body && config.body.length > 0 && (
        <ConfigSection title="Request Body Mapping">
          {config.body.map((b: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="JSON Path" value={b.jsonPath} mono />
              <ConfigRow label="Value" value={b.valueExpression} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
      {config.responseMap && config.responseMap.length > 0 && (
        <ConfigSection title="Response Mapping">
          {config.responseMap.map((map: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="JSON Path" value={map.jsonPath} mono />
              <ConfigRow label="Type" value={map.type} mono />
              <ConfigRow label="Context Var" value={map.contextVariableName} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
    </>
  );
}

function ScriptNodeConfig({ config }: { config: any }) {
  return (
    <>
      <ConfigSection title="Execution">
        <ConfigRow label="Runtime" value={config.runtime} mono />
        <ConfigRow label="Service" value={config.executionService} mono />
        <ConfigRow label="Entry Function" value={config.entryFunctionName} mono />
        <ConfigRow label="Max Attempts" value={config.maxAttempts} />
      </ConfigSection>
      {config.parameterMap && config.parameterMap.length > 0 && (
        <ConfigSection title="Parameters">
          {config.parameterMap.map((p: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="Name" value={p.name} mono />
              <ConfigRow label="Value" value={p.valueExpression} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
      <ConfigSection title="Source Code">
        <Box
          component="pre"
          sx={{
            fontFamily: MONO,
            fontSize: 11,
            m: 0,
            p: 1.5,
            borderRadius: 1,
            backgroundColor: 'action.hover',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {config.sourceCode}
        </Box>
      </ConfigSection>
      {config.responseMap && config.responseMap.length > 0 && (
        <ConfigSection title="Response Mapping">
          {config.responseMap.map((map: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="JSON Path" value={map.jsonPath} mono />
              <ConfigRow label="Type" value={map.type} mono />
              <ConfigRow label="Context Var" value={map.contextVariableName} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
    </>
  );
}

function DecisionNodeConfig({ config }: { config: any }) {
  return (
    <>
      {config.rules && config.rules.length > 0 && (
        <ConfigSection title="Rules">
          {config.rules.map((rule: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="ID" value={rule.id} mono />
              <ConfigRow label="Label" value={rule.label} />
              <ConfigRow label="Condition" value={rule.conditionExpression} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
      {config.defaultRule && (
        <ConfigSection title="Default Rule">
          <Box sx={{ p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
            <ConfigRow label="ID" value={config.defaultRule.id} mono />
            <ConfigRow label="Label" value={config.defaultRule.label} />
          </Box>
        </ConfigSection>
      )}
    </>
  );
}

function EndNodeConfig({ config }: { config: any }) {
  return (
    <>
      <ConfigSection title="End Details">
        <ConfigRow label="Success" value={config.success ? 'True' : 'False'} />
        <ConfigRow label="Message" value={config.message} />
      </ConfigSection>
      {config.resultMap && config.resultMap.length > 0 && (
        <ConfigSection title="Result Mapping">
          {config.resultMap.map((map: any, idx: number) => (
            <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <ConfigRow label="Variable" value={map.variableName} mono />
              <ConfigRow label="Value" value={map.valueExpression} mono />
            </Box>
          ))}
        </ConfigSection>
      )}
    </>
  );
}

export function NodeConfigurationDisplay({ nodeType, config }: NodeConfigurationDisplayProps) {
  if (!config) return null;

  switch (nodeType.toLowerCase()) {
    case 'start':
      return <StartNodeConfig config={config} />;
    case 'user':
    case 'user_task':
      return <UserNodeConfig config={config} />;
    case 'service':
    case 'service_task':
      return <ServiceNodeConfig config={config} />;
    case 'script':
    case 'script_task':
      return <ScriptNodeConfig config={config} />;
    case 'decision':
      return <DecisionNodeConfig config={config} />;
    case 'end':
      return <EndNodeConfig config={config} />;
    default:
      return (
        <Box sx={{ mt: 2 }}>
          <Typography fontSize={12} color="text.secondary" fontWeight={600} mb={0.5}>
            Raw Configuration
          </Typography>
          <Box
            component="pre"
            sx={{
              fontFamily: MONO,
              fontSize: 11,
              m: 0,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'action.hover',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}
          >
            {JSON.stringify(config, null, 2)}
          </Box>
        </Box>
      );
  }
}
