import {
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import EdgeConfigSection from "./config/EdgeConfigSection";
import {
  type CanvasNode,
  type CanvasEdge,
  type SelectedItem,
  type WorkflowInput,
} from "../type/types";
import type { ValidationError } from "../../../../types";
import { getEffectiveNodeColor, getNodeTypeLabel } from "../utils/nodeHelpers";
import { getAvailableContext } from "../config/context";
import NodeIcon from "../config/shared/NodeIcon";
import StartConfig from "../config/nodes/StartConfig";
import EndConfig from "../config/nodes/EndConfig";
import UserTaskConfig from "../config/nodes/UserTaskConfig";
import ServiceTaskConfig from "../config/nodes/ServiceTaskConfig";
import ScriptTaskConfig from "../config/nodes/ScriptTaskConfig";
import GatewayConfig from "../config/nodes/GatewayConfig";

interface Props {
  selectedItem: SelectedItem;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
  nodeErrors?: ValidationError[];
  onClose: () => void;
  onUpdateNode: (id: string, patch: Partial<CanvasNode>) => void;
  onUpdateEdge: (id: string, patch: Partial<CanvasEdge>) => void;
  onDeleteEdge: (id: string) => void;
  onChangeInputs: (inputs: WorkflowInput[]) => void;
  onOpenCodeEditor: () => void;
  width?: number;
}

export default function ConfigPanel({
  selectedItem,
  nodes,
  edges,
  inputs,
  nodeErrors,
  onClose,
  onUpdateNode,
  onUpdateEdge,
  onDeleteEdge,
  onChangeInputs,
  onOpenCodeEditor,
  width,
}: Props) {
  const panelWidth = width ?? 260;
  if (!selectedItem) return null;

  if (selectedItem.type === "edge") {
    const edge = edges.find((e) => e.id === selectedItem.id);
    if (!edge) return null;
    return (
      <EdgeConfigSection
        edge={edge}
        nodes={nodes}
        panelWidth={panelWidth}
        onClose={onClose}
        onDeleteEdge={onDeleteEdge}
      />
    );
  }

  const node = nodes.find((n) => n.id === selectedItem.id);
  if (!node) return null;

  const accentColor = getEffectiveNodeColor(node);
  const availableContext = getAvailableContext(node.id, nodes, edges, inputs);

  const updateConfig = (newConfig: Record<string, unknown>) =>
    onUpdateNode(node.id, { config: newConfig });

  const renderConfig = () => {
    switch (node.type) {
      case "start":
        return (
          <StartConfig
            node={node}
            onUpdateConfig={updateConfig}
            onChangeInputs={onChangeInputs}
          />
        );
      case "end":
        return (
          <EndConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
          />
        );
      case "user_task":
        return (
          <UserTaskConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
          />
        );
      case "service_task":
        return (
          <ServiceTaskConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
          />
        );
      case "script_task":
        return (
          <ScriptTaskConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
            onOpenCodeEditor={onOpenCodeEditor}
          />
        );
      case "exclusive_gateway":
        return (
          <GatewayConfig
            node={node}
            onUpdateConfig={updateConfig}
            availableContext={availableContext}
            edges={edges}
            onUpdateEdge={onUpdateEdge}
            onDeleteEdge={onDeleteEdge}
          />
        );
      default:
        return (
          <Typography
            sx={{ fontSize: 11, color: "text.disabled", fontStyle: "italic" }}
          >
            No configuration available for this node type.
          </Typography>
        );
    }
  };

  return (
    <Box
      sx={{
        width: panelWidth,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.25,
          py: 0.875,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <NodeIcon type={node.type} color={accentColor} />
        <TextField
          size="small"
          value={node.label}
          onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
          variant="standard"
          sx={{
            flex: 1,
            "& .MuiInputBase-root": { fontSize: 12, fontWeight: 600 },
            "& .MuiInput-underline:before": { borderBottom: "none" },
            "& .MuiInput-underline:hover:before": { borderBottom: "1px solid" },
          }}
          inputProps={{ style: { padding: 0 } }}
        />
        <Tooltip title={getNodeTypeLabel(node.type)}>
          <Chip
            label={getNodeTypeLabel(node.type)}
            size="small"
            sx={{
              fontSize: 9,
              height: 18,
              borderRadius: "4px",
              backgroundColor: `${accentColor}18`,
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          />
        </Tooltip>
        <IconButton size="small" onClick={onClose} sx={{ p: 0.25, ml: 0.25 }}>
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {nodeErrors && nodeErrors.length > 0 && (
          <Box
            sx={{
              borderRadius: "8px",
              border: "1px solid rgba(239,68,68,0.3)",
              backgroundColor: "rgba(239,68,68,0.06)",
              p: 1,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 12, color: "#ef4444" }} />
              <Typography
                sx={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#ef4444",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Validation Errors
              </Typography>
            </Box>
            {nodeErrors.map((err, i) => (
              <Typography
                key={i}
                sx={{ fontSize: 11, color: "#ef4444", lineHeight: 1.6 }}
              >
                • {err.message}
              </Typography>
            ))}
          </Box>
        )}
        {renderConfig()}

        <Box sx={{ mt: 2, pb: 1 }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 600,
              color: "text.secondary",
              mb: 0.75,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Live Configuration JSON
          </Typography>
          <Box
            sx={{
              p: 1.25,
              backgroundColor: "background.default",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: "divider",
              overflowX: "auto",
            }}
          >
            <pre
              style={{
                margin: 0,
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {JSON.stringify(node.config || {}, null, 2)}
            </pre>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
