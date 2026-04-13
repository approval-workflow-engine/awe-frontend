import { Box, Typography, Chip } from "@mui/material";
import { type CanvasNode, type WorkflowInput } from "../type/types";

interface ContextVarEntry {
  name: string;
  type: string;
  source: string;
}

interface ContextVarsPanelProps {
  nodes: CanvasNode[];
  inputs: WorkflowInput[];
  availableSecrets?: ContextVarEntry[];
}

export default function ContextVarsPanel({
  nodes,
  inputs,
  availableSecrets = [],
}: ContextVarsPanelProps) {
  const inputVars: ContextVarEntry[] = inputs.map((i) => ({
    name: i.name,
    type: i.type,
    source: "Input",
  }));

  const startNode = nodes.find((n) => n.type === "start");
  const startInputVars: ContextVarEntry[] = [];
  if (startNode) {
    const idm =
      (startNode.config.inputDataMap as Array<{
        contextVariableName?: string;
        dataType?: string;
        fetchableId?: string;
      }>) ?? [];
    for (const row of idm) {
      const varName = row.contextVariableName;
      if (varName)
        startInputVars.push({
          name: varName,
          type: row.dataType || "string",
          source: row.fetchableId ? "Fetch" : "Input",
        });
    }
  }

  const outputVars: ContextVarEntry[] = [];
  for (const node of nodes) {
    if (node.type === "start" || node.type === "end") continue;
    const rm = node.config.responseMap;

    if (Array.isArray(rm)) {
      for (const row of rm as Array<{
        contextVariable?: { name?: string };
        type?: string;
      }>) {
        const varName = row.contextVariable?.name;
        if (varName)
          outputVars.push({
            name: varName,
            type: row.type || "string",
            source: node.label,
          });
      }
    }

    if (rm && typeof rm === "object" && !Array.isArray(rm)) {
      for (const key of Object.keys(rm as Record<string, unknown>)) {
        if (key)
          outputVars.push({ name: key, type: "string", source: node.label });
      }
    }
  }

  const displayInputVars =
    startInputVars.length > 0 ? startInputVars : inputVars;
  const hasAnything = displayInputVars.length > 0 || outputVars.length > 0 || availableSecrets.length > 0;

  return (
    <Box sx={{ flex: 1, overflowY: "auto", px: 1, pt: 1.5, pb: 2 }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "text.secondary",
          px: 0.5,
          mb: 1,
        }}
      >
        Live Context
      </Typography>

      {!hasAnything && (
        <Typography
          sx={{
            fontSize: 10,
            color: "text.secondary",
            px: 0.5,
            fontStyle: "italic",
          }}
        >
          No variables yet
        </Typography>
      )}

      {displayInputVars.length > 0 && (
        <Box mb={1}>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "text.secondary",
              px: 0.5,
              mb: 0.5,
            }}
          >
            Inputs
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {displayInputVars.map((v, i) => (
              <VarRow key={i} entry={v} />
            ))}
          </Box>
        </Box>
      )}

      {outputVars.length > 0 && (
        <Box mb={1}>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "text.secondary",
              px: 0.5,
              mb: 0.5,
            }}
          >
            Node Outputs
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {outputVars.map((v, i) => (
              <VarRow key={i} entry={v} />
            ))}
          </Box>
        </Box>
      )}

      {availableSecrets.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "primary.main",
              px: 0.5,
              mb: 0.5,
            }}
          >
            Secrets (secret.*)
          </Typography>
          <Box display="flex" flexDirection="column" gap={0.5}>
            {availableSecrets.map((v, i) => (
              <VarRow key={i} entry={v} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

function VarRow({ entry }: { entry: ContextVarEntry }) {
  const isFetch = entry.source === "Fetch";
  const isInput = entry.source === "Input" || isFetch;
  const dotColor = isFetch ? "#a855f7" : isInput ? "#4f6ef7" : "#8b91a8";
  const chipColor = isFetch ? "#a855f7" : isInput ? "#4f6ef7" : "#8b91a8";
  const chipBg = isFetch
    ? "rgba(168,85,247,0.12)"
    : isInput
      ? "rgba(79,110,247,0.12)"
      : "rgba(139,145,168,0.12)";
  const chipBorder = isFetch
    ? "rgba(168,85,247,0.25)"
    : isInput
      ? "rgba(79,110,247,0.25)"
      : "rgba(139,145,168,0.25)";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.75,
        py: 0.5,
        borderRadius: "6px",
        backgroundColor: "action.hover",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          flexShrink: 0,
          backgroundColor: dotColor,
        }}
      />
      <Typography
        sx={{
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          color: "text.primary",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.name}
      </Typography>
      <Chip
        label={entry.type}
        size="small"
        sx={{
          fontSize: 8,
          height: 14,
          flexShrink: 0,
          backgroundColor: chipBg,
          color: chipColor,
          border: `1px solid ${chipBorder}`,
          "& .MuiChip-label": { px: 0.5 },
        }}
      />
    </Box>
  );
}
