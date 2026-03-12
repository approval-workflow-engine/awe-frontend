import { Box, Typography, Button, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpressionInput from "./ExpressionInput";
import ContextVariableSelector from "./ContextVariableSelector";
import DataTypeSelect from "./DataTypeSelect";
import JsonPathInput from "./JsonPathInput";
import AddRowButton from "./AddRowButton";
import type { AvailableCtxVar } from "../context";
import type { ContextVariable } from "../../type/types";
import { DataType } from "../../type/types";

type OnErrorMode = "terminate" | "map";

interface ErrorMapRow {
  fromType: "jsonPath" | "expression";
  jsonPath?: string;
  dataType?: string;
  valueExpression?: string;
  contextVariable: ContextVariable;
}

interface Props {
  value: unknown;
  onChange: (v: unknown) => void;
  availableContext: AvailableCtxVar[];
}

const EMPTY_CV: ContextVariable = { name: "", scope: "global" };

export default function OnErrorSection({
  value,
  onChange,
  availableContext,
}: Props) {
  const mode: OnErrorMode = value === "terminate" ? "terminate" : "map";
  const errorMap: ErrorMapRow[] =
    mode === "map" && typeof value === "object" && value !== null
      ? (((value as Record<string, unknown>).errorMap as ErrorMapRow[]) ?? [])
      : [];

  const updateMap = (rows: ErrorMapRow[]) => onChange({ errorMap: rows });
  const update = (idx: number, patch: Partial<ErrorMapRow>) =>
    updateMap(errorMap.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) =>
    updateMap(errorMap.filter((_, i) => i !== idx));

  const activeStyle = (color: string) => ({
    backgroundColor: `rgba(${color},0.15)`,
    color: `rgb(${color})`,
    border: `1px solid rgba(${color},0.3)`,
    boxShadow: "none",
    "&:hover": { backgroundColor: `rgba(${color},0.25)`, boxShadow: "none" },
  });

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Box display="flex" gap={0.5}>
        <Button
          size="small"
          variant={mode === "terminate" ? "contained" : "outlined"}
          onClick={() => onChange("terminate")}
          sx={{
            fontSize: 10,
            height: 26,
            borderRadius: "6px",
            flex: 1,
            fontWeight: 600,
            textTransform: "none",
            ...(mode === "terminate"
              ? activeStyle("239,68,68")
              : { borderColor: "divider", color: "text.secondary" }),
          }}
        >
          Terminate
        </Button>
        <Button
          size="small"
          variant={mode === "map" ? "contained" : "outlined"}
          onClick={() => onChange({ errorMap: [] })}
          sx={{
            fontSize: 10,
            height: 26,
            borderRadius: "6px",
            flex: 1,
            fontWeight: 600,
            textTransform: "none",
            ...(mode === "map"
              ? activeStyle("79,110,247")
              : { borderColor: "divider", color: "text.secondary" }),
          }}
        >
          Map to Context
        </Button>
      </Box>

      {mode === "terminate" && (
        <Typography
          sx={{
            fontSize: 10,
            color: "text.disabled",
            fontStyle: "italic",
            px: 0.5,
          }}
        >
          Workflow will end as failed if this node errors.
        </Typography>
      )}

      {mode === "map" && (
        <Box display="flex" flexDirection="column" gap={0.75}>
          {errorMap.map((row, idx) => (
            <Box
              key={idx}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "6px",
                p: 0.75,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                backgroundColor: "action.hover",
              }}
            >
              <Box display="flex" gap={0.5}>
                <Button
                  size="small"
                  variant={
                    row.fromType === "jsonPath" ? "contained" : "outlined"
                  }
                  onClick={() => update(idx, { fromType: "jsonPath" })}
                  sx={{
                    fontSize: 9,
                    height: 22,
                    borderRadius: "5px",
                    flex: 1,
                    textTransform: "none",
                    ...(row.fromType === "jsonPath"
                      ? {
                          backgroundColor: "action.selected",
                          color: "text.primary",
                          boxShadow: "none",
                        }
                      : { borderColor: "divider", color: "text.disabled" }),
                  }}
                >
                  From Response
                </Button>
                <Button
                  size="small"
                  variant={
                    row.fromType === "expression" ? "contained" : "outlined"
                  }
                  onClick={() => update(idx, { fromType: "expression" })}
                  sx={{
                    fontSize: 9,
                    height: 22,
                    borderRadius: "5px",
                    flex: 1,
                    textTransform: "none",
                    ...(row.fromType === "expression"
                      ? {
                          backgroundColor: "action.selected",
                          color: "text.primary",
                          boxShadow: "none",
                        }
                      : { borderColor: "divider", color: "text.disabled" }),
                  }}
                >
                  By Expression
                </Button>
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
              {row.fromType === "jsonPath" && (
                <Box display="flex" gap={0.5}>
                  <Box flex={1}>
                    <JsonPathInput
                      value={row.jsonPath ?? ""}
                      onChange={(v) => update(idx, { jsonPath: v })}
                      placeholder="error.message"
                    />
                  </Box>
                  <DataTypeSelect
                    value={row.dataType ?? DataType.STRING}
                    onChange={(v) => update(idx, { dataType: v })}
                  />
                </Box>
              )}
              {row.fromType === "expression" && (
                <ExpressionInput
                  value={row.valueExpression ?? ""}
                  onChange={(v) => update(idx, { valueExpression: v })}
                  placeholder="context.someVar"
                  availableContext={availableContext}
                />
              )}
              <Box>
                <Typography
                  sx={{ fontSize: 9, color: "text.secondary", mb: 0.25 }}
                >
                  Store as
                </Typography>
                <ContextVariableSelector
                  value={row.contextVariable ?? EMPTY_CV}
                  onChange={(v) => update(idx, { contextVariable: v })}
                />
              </Box>
            </Box>
          ))}
          <AddRowButton
            label="Add Error Mapping"
            onClick={() =>
              updateMap([
                ...errorMap,
                {
                  fromType: "jsonPath",
                  jsonPath: "",
                  contextVariable: EMPTY_CV,
                },
              ])
            }
          />
        </Box>
      )}
    </Box>
  );
}
