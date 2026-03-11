import { Box, Typography, IconButton, TextField } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpressionInput from "../shared/ExpressionInput";
import AddRowButton from "../shared/AddRowButton";
import { SectionLabel } from "../shared/CollapsibleSection";
import type { AvailableCtxVar } from "../context";
import type { CanvasNode, CanvasEdge } from "../../type/builderTypes";
import { generateId } from "../../type/builderTypes";

interface GatewayRule {
  id: string;
  label?: string;
  conditionExpression: string;
}

interface DefaultRule {
  id?: string;
  label?: string;
}

interface Props {
  node: CanvasNode;
  availableContext: AvailableCtxVar[];
  edges: CanvasEdge[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<CanvasEdge>) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export default function GatewayConfig({
  node,
  availableContext,
  edges,
  onUpdateConfig,
  onUpdateEdge,
  onDeleteEdge,
}: Props) {
  const c = node.config;
  const rules: GatewayRule[] = (c.rules as GatewayRule[]) ?? [];
  const defaultRule: DefaultRule = (c.defaultRule as DefaultRule) ?? {
    id: "default",
  };

  const set = (key: string, val: unknown) =>
    onUpdateConfig({ ...c, [key]: val });

  /* Find the outgoing edge that corresponds to a rule port. */
  const edgeForRule = (ruleId: string): CanvasEdge | undefined =>
    edges.find((e) => e.source === node.id && e.sourcePort === ruleId);

  const updateRule = (idx: number, patch: Partial<GatewayRule>) => {
    const updated = rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    set("rules", updated);

    /* Sync condition to the outgoing edge for this rule. */
    if (patch.conditionExpression !== undefined) {
      const edge = edgeForRule(rules[idx].id);
      if (edge) onUpdateEdge(edge.id, { condition: patch.conditionExpression });
    }
  };

  const removeRule = (idx: number) => {
    const rule = rules[idx];
    set(
      "rules",
      rules.filter((_, i) => i !== idx),
    );

    /* Remove the corresponding edge so the canvas stays consistent. */
    const edge = edgeForRule(rule.id);
    if (edge) onDeleteEdge(edge.id);
  };

  const addRule = () => {
    const id = generateId("rule");
    set("rules", [...rules, { id, label: "", conditionExpression: "" }]);
  };

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {/* Condition rules */}
      <Box>
        <SectionLabel>Conditions</SectionLabel>
        <Box display="flex" flexDirection="column" gap={0.75}>
          {rules.map((rule, idx) => (
            <Box
              key={rule.id}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "6px",
                p: 0.75,
                backgroundColor: "action.hover",
                "& .delete-btn": { opacity: 0, transition: "opacity 0.15s" },
                "&:hover .delete-btn": { opacity: 1 },
              }}
            >
              <Box display="flex" gap={0.5} alignItems="center" mb={0.5}>
                <TextField
                  size="small"
                  placeholder="Branch label (optional)"
                  value={rule.label ?? ""}
                  onChange={(e) => updateRule(idx, { label: e.target.value })}
                  sx={{
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontSize: 11,
                      "& fieldset": { borderColor: "divider" },
                    },
                  }}
                  inputProps={{ style: { padding: "4px 8px", fontSize: 11 } }}
                />
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={() => removeRule(idx)}
                  sx={{
                    p: 0.25,
                    color: "text.disabled",
                    "&:hover": { color: "#ef4444" },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
              <ExpressionInput
                value={rule.conditionExpression}
                onChange={(v) => updateRule(idx, { conditionExpression: v })}
                placeholder="context.status === 'approved'"
                availableContext={availableContext}
                hint="Must evaluate to true to take this branch"
              />
            </Box>
          ))}
          <AddRowButton label="Add Condition" onClick={addRule} />
        </Box>
      </Box>

      {/* Default branch */}
      <Box
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: "6px",
          p: 0.75,
        }}
      >
        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
          <Typography
            sx={{ fontSize: 10, color: "text.secondary", fontWeight: 600 }}
          >
            Default Branch
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Label (optional)"
          value={defaultRule.label ?? ""}
          onChange={(e) =>
            set("defaultRule", { ...defaultRule, label: e.target.value })
          }
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-root": {
              borderRadius: "6px",
              fontSize: 11,
              "& fieldset": { borderColor: "divider" },
            },
          }}
          inputProps={{ style: { padding: "4px 8px", fontSize: 11 } }}
        />
        <Typography sx={{ fontSize: 9, color: "text.disabled", mt: 0.5 }}>
          Taken when no condition matches
        </Typography>
      </Box>
    </Box>
  );
}
