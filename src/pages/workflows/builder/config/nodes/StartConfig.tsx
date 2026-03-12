import { useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Switch,
  Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ExpressionInput from "../shared/ExpressionInput";
import DataTypeSelect from "../shared/DataTypeSelect";
import AddRowButton from "../shared/AddRowButton";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import { EXPR_FONT } from "../constants";
import { generateId } from "../../utils/nodeHelpers";
import type { AvailableCtxVar } from "../context";
import type {
  CanvasNode,
  WorkflowInput,
} from "../../type/types";
import { DataType } from "../../type/types";

interface FetchableConfig {
  id: string;
  label?: string;
  method: "GET";
  urlExpression: string;
  headers?: Array<{ key: string; value: string }>;
}

interface InputDataMapRow {
  jsonPath: string;
  dataType: string;
  contextVariableName: string;
  fetchableId?: string;
  persist: boolean;
  default?: unknown;
  required?: boolean;
}

interface Props {
  node: CanvasNode;
  onUpdateConfig: (c: Record<string, unknown>) => void;
  onChangeInputs: (v: WorkflowInput[]) => void;
  availableContext: AvailableCtxVar[];
}

const VALID_IDENT = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

const ROW_FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    fontSize: 11,
    "& fieldset": { borderColor: "divider" },
  },
} as const;

const ROW_INPUT_PROPS = { style: { padding: "4px 8px", fontSize: 11 } };

export default function StartConfig({
  node,
  onUpdateConfig,
  onChangeInputs,
  availableContext,
}: Props) {
  const rows: InputDataMapRow[] =
    (node.config.inputDataMap as InputDataMapRow[]) ?? [];
  const fetchables: FetchableConfig[] =
    (node.config.fetchables as FetchableConfig[]) ?? [];

  const sync = useCallback(
    (newRows: InputDataMapRow[], newFetchables: FetchableConfig[]) => {
      onUpdateConfig({
        ...node.config,
        inputDataMap: newRows,
        fetchables: newFetchables,
      });
      const validTypes: WorkflowInput["type"][] = [
        "string",
        "number",
        "boolean",
        "object",
      ];
      onChangeInputs(
        newRows
          .filter((r) => !r.fetchableId)
          .map((r) => ({
            name: r.contextVariableName,
            type: validTypes.includes(r.dataType as WorkflowInput["type"])
              ? (r.dataType as WorkflowInput["type"])
              : "string",
            required: r.required ?? false,
          })),
      );
    },
    [node.config, onUpdateConfig, onChangeInputs],
  );

  const updateRow = (fullIdx: number, patch: Partial<InputDataMapRow>) =>
    sync(
      rows.map((r, i) => (i === fullIdx ? { ...r, ...patch } : r)),
      fetchables,
    );

  const removeRow = (fullIdx: number) =>
    sync(
      rows.filter((_, i) => i !== fullIdx),
      fetchables,
    );

  const updateFetchable = (fIdx: number, patch: Partial<FetchableConfig>) =>
    sync(
      rows,
      fetchables.map((f, i) => (i === fIdx ? { ...f, ...patch } : f)),
    );

  const removeFetchable = (fIdx: number) => {
    const fId = fetchables[fIdx].id;
    sync(
      rows.filter((r) => r.fetchableId !== fId),
      fetchables.filter((_, i) => i !== fIdx),
    );
  };

  const directRowCount = rows.filter((r) => !r.fetchableId).length;
  const orphanedRows = rows
    .map((r, i) => ({ row: r, fullIdx: i }))
    .filter(
      ({ row }) =>
        row.fetchableId && !fetchables.some((f) => f.id === row.fetchableId),
    );

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <CollapsibleSection
        title="Direct Inputs"
        defaultOpen
        count={directRowCount}
      >
        <Box display="flex" flexDirection="column" gap={0.75}>
          {directRowCount === 0 && (
            <Typography
              sx={{ fontSize: 11, color: "text.disabled", fontStyle: "italic" }}
            >
              No direct inputs configured
            </Typography>
          )}
          {rows.map((row, fullIdx) => {
            if (row.fetchableId) return null;
            const invalid =
              row.contextVariableName.length > 0 &&
              !VALID_IDENT.test(row.contextVariableName);
            return (
              <Box
                key={fullIdx}
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
                      placeholder="var_name"
                      value={row.contextVariableName}
                      error={invalid}
                      onChange={(e) =>
                        updateRow(fullIdx, {
                          contextVariableName: e.target.value,
                          jsonPath: e.target.value,
                        })
                      }
                      sx={{
                        flex: 1,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          fontSize: 11,
                          fontFamily: EXPR_FONT,
                          "& fieldset": {
                            borderColor: invalid ? "error.main" : "divider",
                          },
                        },
                      }}
                      inputProps={ROW_INPUT_PROPS}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeRow(fullIdx)}
                      sx={{
                        p: 0.25,
                        color: "text.disabled",
                        "&:hover": { color: "#ef4444" },
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                  <DataTypeSelect
                    value={row.dataType || DataType.STRING}
                    onChange={(v) => updateRow(fullIdx, { dataType: v })}
                  />
                  {row.contextVariableName && (
                    <Typography
                      sx={{
                        fontSize: 9,
                        color: "text.disabled",
                        fontFamily: EXPR_FONT,
                        pl: 0.25,
                      }}
                    >
                      {"jsonPath: "}
                      <Box component="span" sx={{ color: "primary.main" }}>
                        {row.contextVariableName}
                      </Box>
                    </Typography>
                  )}
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
                      onChange={(e) =>
                        updateRow(fullIdx, { required: e.target.checked })
                      }
                    />
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                      Persist
                    </Typography>
                    <Switch
                      size="small"
                      checked={row.persist ?? false}
                      onChange={(e) =>
                        updateRow(fullIdx, { persist: e.target.checked })
                      }
                    />
                  </Box>
                  {!row.required && (
                    <TextField
                      size="small"
                      label="Default value"
                      value={(row.default as string) ?? ""}
                      onChange={(e) =>
                        updateRow(fullIdx, { default: e.target.value })
                      }
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "6px",
                          fontSize: 11,
                          "& fieldset": { borderColor: "divider" },
                        },
                        "& .MuiInputLabel-root": { fontSize: 11 },
                      }}
                      inputProps={ROW_INPUT_PROPS}
                    />
                  )}
                </Box>
              </Box>
            );
          })}
          <AddRowButton
            label="Add Input"
            onClick={() =>
              sync(
                [
                  ...rows,
                  {
                    jsonPath: "",
                    dataType: DataType.STRING,
                    contextVariableName: "",
                    persist: false,
                    required: false,
                  },
                ],
                fetchables,
              )
            }
          />
        </Box>
      </CollapsibleSection>

      <Divider sx={{ borderColor: "divider" }} />

      <CollapsibleSection
        title="Fetched Inputs"
        defaultOpen
        count={fetchables.length}
      >
        <Box display="flex" flexDirection="column" gap={1}>
          {orphanedRows.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 0.75,
                p: 0.75,
                borderRadius: "6px",
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <WarningAmberIcon
                sx={{ fontSize: 13, color: "#ef4444", mt: 0.1, flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: 10, color: "#ef4444", lineHeight: 1.4 }}>
                {orphanedRows.length} field mapping
                {orphanedRows.length > 1 ? "s reference" : " references"} a
                deleted fetchable. Remove or reassign
                {orphanedRows.length > 1 ? " them" : " it"}.
              </Typography>
            </Box>
          )}
          {fetchables.length === 0 && (
            <Typography
              sx={{ fontSize: 11, color: "text.disabled", fontStyle: "italic" }}
            >
              No fetched inputs configured
            </Typography>
          )}
          {fetchables.map((fetchable, fIdx) => {
            const fetchableRows = rows
              .map((r, i) => ({ row: r, fullIdx: i }))
              .filter(({ row }) => row.fetchableId === fetchable.id);
            const headers = fetchable.headers ?? [];
            return (
              <Box
                key={fetchable.id}
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
                    <Box
                      sx={{
                        fontSize: 9,
                        fontWeight: 700,
                        fontFamily: EXPR_FONT,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: "4px",
                        backgroundColor: "rgba(6,182,212,0.12)",
                        color: "#06b6d4",
                        border: "1px solid rgba(6,182,212,0.3)",
                        flexShrink: 0,
                        letterSpacing: "0.04em",
                      }}
                    >
                      GET
                    </Box>
                    <TextField
                      size="small"
                      placeholder="Label (optional)"
                      value={fetchable.label ?? ""}
                      onChange={(e) =>
                        updateFetchable(fIdx, { label: e.target.value })
                      }
                      sx={{ flex: 1, ...ROW_FIELD_SX }}
                      inputProps={ROW_INPUT_PROPS}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removeFetchable(fIdx)}
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
                    label="URL"
                    value={fetchable.urlExpression}
                    onChange={(v) =>
                      updateFetchable(fIdx, { urlExpression: v })
                    }
                    placeholder="https://api.example.com/data"
                    availableContext={availableContext}
                  />
                </Box>

                <Box
                  sx={{
                    px: 0.75,
                    py: 0.75,
                    borderTop: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <CollapsibleSection title="Headers" count={headers.length}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      gap={0.5}
                      mt={0.25}
                    >
                      {headers.map((h, hIdx) => (
                        <Box
                          key={hIdx}
                          display="flex"
                          gap={0.5}
                          alignItems="center"
                          sx={{
                            "& .del-h": {
                              opacity: 0,
                              transition: "opacity 0.15s",
                            },
                            "&:hover .del-h": { opacity: 1 },
                          }}
                        >
                          <TextField
                            size="small"
                            placeholder="Header name"
                            value={h.key}
                            onChange={(e) => {
                              const newH = headers.map((hh, i) =>
                                i === hIdx
                                  ? { ...hh, key: e.target.value }
                                  : hh,
                              );
                              updateFetchable(fIdx, { headers: newH });
                            }}
                            sx={{ flex: 1, ...ROW_FIELD_SX }}
                            inputProps={ROW_INPUT_PROPS}
                          />
                          <TextField
                            size="small"
                            placeholder="Value"
                            value={h.value}
                            onChange={(e) => {
                              const newH = headers.map((hh, i) =>
                                i === hIdx
                                  ? { ...hh, value: e.target.value }
                                  : hh,
                              );
                              updateFetchable(fIdx, { headers: newH });
                            }}
                            sx={{ flex: 1, ...ROW_FIELD_SX }}
                            inputProps={ROW_INPUT_PROPS}
                          />
                          <IconButton
                            className="del-h"
                            size="small"
                            onClick={() =>
                              updateFetchable(fIdx, {
                                headers: headers.filter((_, i) => i !== hIdx),
                              })
                            }
                            sx={{
                              p: 0.25,
                              color: "text.disabled",
                              "&:hover": { color: "#ef4444" },
                            }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      ))}
                      <AddRowButton
                        label="Add Header"
                        onClick={() =>
                          updateFetchable(fIdx, {
                            headers: [...headers, { key: "", value: "" }],
                          })
                        }
                      />
                    </Box>
                  </CollapsibleSection>
                </Box>

                <Box
                  sx={{
                    px: 0.75,
                    py: 0.75,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "text.secondary",
                    }}
                  >
                    Field Mappings
                  </Typography>
                  {fetchableRows.length === 0 && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "text.disabled",
                        fontStyle: "italic",
                      }}
                    >
                      No fields mapped
                    </Typography>
                  )}
                  {fetchableRows.map(({ row, fullIdx }) => {
                    const invalidVar =
                      row.contextVariableName.length > 0 &&
                      !VALID_IDENT.test(row.contextVariableName);
                    return (
                      <Box
                        key={fullIdx}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: "6px",
                          p: 0.75,
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Box display="flex" gap={0.5} alignItems="center">
                          <TextField
                            size="small"
                            placeholder="$.path"
                            value={row.jsonPath}
                            onChange={(e) =>
                              updateRow(fullIdx, { jsonPath: e.target.value })
                            }
                            sx={{
                              flex: 1,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: "6px",
                                fontSize: 11,
                                fontFamily: EXPR_FONT,
                                "& fieldset": { borderColor: "divider" },
                              },
                            }}
                            inputProps={ROW_INPUT_PROPS}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeRow(fullIdx)}
                            sx={{
                              p: 0.25,
                              color: "text.disabled",
                              "&:hover": { color: "#ef4444" },
                            }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                        <DataTypeSelect
                          value={row.dataType || DataType.STRING}
                          onChange={(v) => updateRow(fullIdx, { dataType: v })}
                        />
                        <TextField
                          size="small"
                          placeholder="var_name"
                          value={row.contextVariableName}
                          error={invalidVar}
                          onChange={(e) =>
                            updateRow(fullIdx, {
                              contextVariableName: e.target.value,
                            })
                          }
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "6px",
                              fontSize: 11,
                              fontFamily: EXPR_FONT,
                              "& fieldset": {
                                borderColor: invalidVar
                                  ? "error.main"
                                  : "divider",
                              },
                            },
                          }}
                          inputProps={ROW_INPUT_PROPS}
                        />
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Typography
                            sx={{ fontSize: 11, color: "text.secondary" }}
                          >
                            Persist
                          </Typography>
                          <Switch
                            size="small"
                            checked={row.persist ?? false}
                            onChange={(e) =>
                              updateRow(fullIdx, { persist: e.target.checked })
                            }
                          />
                        </Box>
                      </Box>
                    );
                  })}
                  <AddRowButton
                    label="Add Field"
                    onClick={() =>
                      sync(
                        [
                          ...rows,
                          {
                            jsonPath: "",
                            dataType: DataType.STRING,
                            contextVariableName: "",
                            fetchableId: fetchable.id,
                            persist: false,
                          },
                        ],
                        fetchables,
                      )
                    }
                  />
                </Box>
              </Box>
            );
          })}
          <AddRowButton
            label="Add Fetchable"
            onClick={() =>
              sync(rows, [
                ...fetchables,
                {
                  id: generateId("fetch"),
                  method: "GET",
                  urlExpression: "",
                  headers: [],
                },
              ])
            }
          />
        </Box>
      </CollapsibleSection>
    </Box>
  );
}
