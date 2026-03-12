import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Switch,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ExpressionInput from "../shared/ExpressionInput";
import ContextVariableSelector from "../shared/ContextVariableSelector";
import DataTypeSelect from "../shared/DataTypeSelect";
import AddRowButton from "../shared/AddRowButton";
import { SectionLabel } from "../shared/CollapsibleSection";
import { EXPR_FONT } from "../constants";
import type { AvailableCtxVar } from "../context";
import type {
  CanvasNode,
  WorkflowInput,
  ContextVariable,
} from "../../type/types";
import { DataType } from "../../type/types";

interface InputDataMapRow {
  label?: string;
  jsonPath: string;
  type: string;
  contextVariable: ContextVariable;
  required?: boolean;
  default?: unknown;
  validationExpression?: string;
}

interface Props {
  node: CanvasNode;
  onUpdateConfig: (c: Record<string, unknown>) => void;
  onChangeInputs: (v: WorkflowInput[]) => void;
  availableContext: AvailableCtxVar[];
}

const EMPTY_CV: ContextVariable = { name: "", scope: "global" };

export default function StartConfig({
  node,
  onUpdateConfig,
  onChangeInputs,
  availableContext,
}: Props) {
  const rows: InputDataMapRow[] =
    (node.config.inputDataMap as InputDataMapRow[]) ?? [];
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (idx: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(idx)) n.delete(idx);
      else n.add(idx);
      return n;
    });

  const sync = useCallback(
    (newRows: InputDataMapRow[]) => {
      onUpdateConfig({ ...node.config, inputDataMap: newRows });
      const validTypes: WorkflowInput["type"][] = [
        "string",
        "number",
        "boolean",
        "object",
      ];
      onChangeInputs(
        newRows.map((r) => ({
          name: r.contextVariable.name,
          type: validTypes.includes(r.type as WorkflowInput["type"])
            ? (r.type as WorkflowInput["type"])
            : "string",
          required: r.required ?? false,
        })),
      );
    },
    [node.config, onUpdateConfig, onChangeInputs],
  );

  const update = (idx: number, patch: Partial<InputDataMapRow>) =>
    sync(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) => {
    setExpanded((s) => {
      const n = new Set<number>();
      s.forEach((i) => {
        if (i < idx) n.add(i);
        else if (i > idx) n.add(i - 1);
      });
      return n;
    });
    sync(rows.filter((_, i) => i !== idx));
  };

  return (
    <Box display="flex" flexDirection="column" gap={1.25}>
      <SectionLabel>Input Data Map</SectionLabel>
      {rows.length === 0 && (
        <Typography
          sx={{ fontSize: 11, color: "text.disabled", fontStyle: "italic" }}
        >
          No inputs configured
        </Typography>
      )}
      {rows.map((row, idx) => (
        <Box
          key={idx}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 0.75,
              py: 0.75,
              backgroundColor: "action.hover",
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Box display="flex" gap={0.5} alignItems="center">
              <TextField
                size="small"
                placeholder="Label (optional)"
                value={row.label ?? ""}
                onChange={(e) => update(idx, { label: e.target.value })}
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
              <Tooltip
                title={expanded.has(idx) ? "Collapse" : "Validation & default"}
              >
                <IconButton
                  size="small"
                  onClick={() => toggleExpand(idx)}
                  sx={{
                    p: 0.25,
                    color: "text.disabled",
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  <KeyboardArrowRightIcon
                    sx={{
                      fontSize: 13,
                      transform: expanded.has(idx) ? "rotate(90deg)" : "none",
                      transition: "transform 0.15s",
                    }}
                  />
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                onClick={() => remove(idx)}
                sx={{
                  p: 0.25,
                  color: "text.disabled",
                  "&:hover": { color: "#ef4444" },
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
            <Box display="flex" gap={0.5} alignItems="center">
              <DataTypeSelect
                value={row.type || DataType.STRING}
                onChange={(v) => update(idx, { type: v })}
              />
            </Box>
            <Box>
              <Typography
                sx={{ fontSize: 9, color: "text.secondary", mb: 0.25 }}
              >
                Field name → stored as context variable
              </Typography>
              <ContextVariableSelector
                value={row.contextVariable ?? EMPTY_CV}
                onChange={(cv) =>
                  update(idx, { contextVariable: cv, jsonPath: cv.name })
                }
              />
              {row.contextVariable?.name && (
                <Typography
                  sx={{
                    fontSize: 9,
                    color: "text.disabled",
                    fontFamily: EXPR_FONT,
                    mt: 0.4,
                    pl: 0.25,
                  }}
                >
                  {"jsonPath: "}
                  <Box component="span" sx={{ color: "primary.main" }}>
                    {row.contextVariable.name}
                  </Box>
                </Typography>
              )}
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                Required
              </Typography>
              <Switch
                size="small"
                checked={row.required ?? false}
                onChange={(e) => update(idx, { required: e.target.checked })}
              />
            </Box>
          </Box>
          {expanded.has(idx) && (
            <Box
              sx={{
                px: 0.75,
                py: 0.75,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              {!row.required && (
                <TextField
                  size="small"
                  label="Default value"
                  value={(row.default as string) ?? ""}
                  onChange={(e) => update(idx, { default: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "6px",
                      fontSize: 11,
                      "& fieldset": { borderColor: "divider" },
                    },
                    "& .MuiInputLabel-root": { fontSize: 11 },
                  }}
                  inputProps={{ style: { padding: "4px 8px", fontSize: 11 } }}
                />
              )}
              <ExpressionInput
                label="Validation"
                value={row.validationExpression ?? ""}
                onChange={(v) => update(idx, { validationExpression: v })}
                placeholder="value !== null && value.length > 0"
                availableContext={availableContext}
                hint="Must return true for the input to be accepted"
              />
            </Box>
          )}
        </Box>
      ))}
      <AddRowButton
        label="Add Input"
        onClick={() =>
          sync([
            ...rows,
            {
              jsonPath: "",
              type: DataType.STRING,
              contextVariable: EMPTY_CV,
              required: false,
            },
          ])
        }
      />
    </Box>
  );
}
