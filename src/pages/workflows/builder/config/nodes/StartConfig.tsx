import { useCallback, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DataTypeSelect from "../shared/DataTypeSelect";
import ExpressionInput from "../shared/ExpressionInput";
import AddRowButton from "../shared/AddRowButton";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import { EXPR_FONT } from "../constants";
import { generateId } from "../../utils/nodeHelpers";
import type {
  CanvasNode,
  WorkflowInput,
} from "../../type/types";
import { DataType } from "../../type/types";
import type { AvailableCtxVar } from "../context";

interface FetchableConfig {
  id: string;
  label?: string;
  method: "GET";
  urlExpression: string;
  headers: Array<{ key: string; valueExpression: string }>;
}

interface InputDataMapRow {
  jsonPath: string;
  dataType: string;
  contextVariableName: string;
  fetchableId?: string;
}

interface SecretDataMapRow {
  secretKey: string;
  secretId: string;
}

interface Props {
  node: CanvasNode;
  onUpdateConfig: (c: Record<string, unknown>) => void;
  onChangeInputs: (v: WorkflowInput[]) => void;
  allAvailableSecrets?: AvailableCtxVar[];
}

const VALID_IDENT = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

const VALID_TYPES: WorkflowInput["type"][] = [
  "string",
  "number",
  "boolean",
  "object",
];

export const ROW_FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    fontSize: 11,
    "& fieldset": { borderColor: "divider" },
  },
} as const;

// eslint-disable-next-line react-refresh/only-export-components
export const ROW_INPUT_PROPS = { style: { padding: "4px 8px", fontSize: 11 } };

export default function StartConfig({
  node,
  onUpdateConfig,
  onChangeInputs,
  allAvailableSecrets = [],
}: Props) {
  const rows: InputDataMapRow[] =
    (node.config.inputDataMap as InputDataMapRow[]) ?? [];
  const fetchables: FetchableConfig[] =
    (node.config.fetchables as FetchableConfig[]) ?? [];
  const secretRows: SecretDataMapRow[] =
    (node.config.secretDataMap as SecretDataMapRow[]) ?? [];

  const [addInputType, setAddInputType] = useState<"direct" | "fetched">(
    "direct",
  );

  const sync = useCallback(
    (newRows: InputDataMapRow[], newFetchables: FetchableConfig[]) => {
      onUpdateConfig({
        ...node.config,
        inputDataMap: newRows,
        fetchables: newFetchables,
      });
      onChangeInputs(
        newRows
          .filter((r) => r.contextVariableName.trim() !== "")
          .map((r) => ({
            name: r.contextVariableName,
            type: VALID_TYPES.includes(r.dataType as WorkflowInput["type"])
              ? (r.dataType as WorkflowInput["type"])
              : "string",
            required: true,
          })),
      );
    },
    [node.config, onUpdateConfig, onChangeInputs],
  );

  const updateRow = (idx: number, patch: Partial<InputDataMapRow>) =>
    sync(
      rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
      fetchables,
    );

  const removeRow = (idx: number) =>
    sync(
      rows.filter((_, i) => i !== idx),
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

  const addDirectInput = () =>
    sync(
      [
        ...rows,
        {
          jsonPath: "",
          dataType: DataType.STRING,
          contextVariableName: "",
        },
      ],
      fetchables,
    );

  const addFetchedInput = () => {
    if (fetchables.length === 0) return;
    sync(
      [
        ...rows,
        {
          jsonPath: "",
          dataType: DataType.STRING,
          contextVariableName: "",
          fetchableId: fetchables[0]?.id ?? "",
        },
      ],
      fetchables,
    );
  };

  const addFetchSource = () =>
    sync(rows, [
      ...fetchables,
      {
        id: generateId("fetch"),
        method: "GET",
        urlExpression: "",
        headers: [],
      },
    ]);

  const updateSecretRow = (idx: number, patch: Partial<SecretDataMapRow>) => {
    const newSecrets = secretRows.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onUpdateConfig({
      ...node.config,
      secretDataMap: newSecrets,
    });
  };

  const addSecretRow = () => {
    onUpdateConfig({
      ...node.config,
      secretDataMap: [...secretRows, { secretKey: "", secretId: "" }],
    });
  };

  const removeSecretRow = (idx: number) => {
    onUpdateConfig({
      ...node.config,
      secretDataMap: secretRows.filter((_, i) => i !== idx),
    });
  };

  const directRows = rows
    .map((r, i) => ({ row: r, idx: i }))
    .filter(({ row }) => !row.fetchableId);

  const fetchedRows = rows
    .map((r, i) => ({ row: r, idx: i }))
    .filter(({ row }) => !!row.fetchableId);

  const orphanCount = fetchedRows.filter(
    ({ row }) =>
      row.fetchableId && !fetchables.some((f) => f.id === row.fetchableId),
  ).length;

  const canAddFetched = fetchables.length > 0;

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <CollapsibleSection
        title="Fetch Source"
        defaultOpen
        count={fetchables.length}
      >
        <Box display="flex" flexDirection="column" gap={0.75}>
          {fetchables.length === 0 && (
            <Typography
              sx={{ fontSize: 11, color: "text.disabled", fontStyle: "italic" }}
            >
              No fetch sources configured
            </Typography>
          )}
          {fetchables.map((f, fIdx) => (
            <FetchSourceCard
              key={f.id}
              fetchable={f}
              onUpdate={(patch) => updateFetchable(fIdx, patch)}
              onRemove={() => removeFetchable(fIdx)}
            />
          ))}
          <AddRowButton label="Add Fetch Source" onClick={addFetchSource} />
        </Box>
      </CollapsibleSection>

      <Divider sx={{ borderColor: "divider" }} />

      <CollapsibleSection title="Inputs" defaultOpen count={rows.length}>
        <Box display="flex" flexDirection="column" gap={0.75}>
          {orphanCount > 0 && (
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
                sx={{
                  fontSize: 13,
                  color: "#ef4444",
                  mt: 0.1,
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{ fontSize: 10, color: "#ef4444", lineHeight: 1.4 }}
              >
                {orphanCount} fetched input
                {orphanCount > 1 ? "s reference" : " references"} a deleted
                fetch source. Remove or reassign.
              </Typography>
            </Box>
          )}

          {rows.length === 0 && (
            <Typography
              sx={{ fontSize: 11, color: "text.disabled", fontStyle: "italic" }}
            >
              No inputs configured
            </Typography>
          )}

          {directRows.map(({ row, idx }) => (
            <DirectInputCard
              key={idx}
              row={row}
              onUpdate={(patch) => updateRow(idx, patch)}
              onRemove={() => removeRow(idx)}
            />
          ))}

          {fetchedRows.map(({ row, idx }) => (
            <FetchedInputCard
              key={idx}
              row={row}
              fetchables={fetchables}
              onUpdate={(patch) => updateRow(idx, patch)}
              onRemove={() => removeRow(idx)}
            />
          ))}

          <Box display="flex" flexDirection="column" gap={0.5} mt={0.25}>
            <ToggleButtonGroup
              value={addInputType}
              exclusive
              onChange={(_, v) => v && setAddInputType(v)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  fontSize: 10,
                  py: 0.25,
                  px: 1,
                  textTransform: "none",
                  lineHeight: 1.6,
                },
              }}
            >
              <ToggleButton value="direct">Direct Input</ToggleButton>
              <ToggleButton value="fetched" disabled={!canAddFetched}>
                Fetched Input
              </ToggleButton>
            </ToggleButtonGroup>
            {addInputType === "fetched" && !canAddFetched && (
              <Typography
                sx={{ fontSize: 10, color: "text.disabled", fontStyle: "italic" }}
              >
                Add a Fetch Source above before adding fetched inputs.
              </Typography>
            )}
            <AddRowButton
              label="Add Input"
              onClick={
                addInputType === "direct" ? addDirectInput : addFetchedInput
              }
            />
          </Box>
        </Box>
      </CollapsibleSection>

      <Divider sx={{ borderColor: "divider" }} />

      <CollapsibleSection title="Secrets (Declaration)" defaultOpen count={secretRows.length}>
        <Box display="flex" flexDirection="column" gap={1}>
          {secretRows.length === 0 && (
            <Typography sx={{ fontSize: 11, color: "text.disabled", fontStyle: "italic" }}>
              No secrets mapped to this workflow
            </Typography>
          )}
          {secretRows.map((s, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 0.5, alignItems: 'center', p: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: '6px', backgroundColor: 'action.hover' }}>
               <TextField
                size="small"
                placeholder="Key (e.g. DB_PASS)"
                value={s.secretKey}
                onChange={(e) => updateSecretRow(idx, { secretKey: e.target.value })}
                sx={{ flex: 1, ...ROW_FIELD_SX }}
                inputProps={ROW_INPUT_PROPS}
              />
              <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>=</Typography>
              <FormControl size="small" sx={{ flex: 1.5, ...ROW_FIELD_SX }}>
                <Select
                  value={s.secretId}
                  onChange={(e) => updateSecretRow(idx, { secretId: e.target.value })}
                  displayEmpty
                  sx={{ fontSize: 11, borderRadius: "6px" }}
                >
                  <MenuItem value="" disabled sx={{ fontSize: 11 }}>Select Secret</MenuItem>
                  {allAvailableSecrets?.map((sec: any) => (
                    <MenuItem key={sec.id} value={sec.id} sx={{ fontSize: 11 }}>
                      {sec.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton size="small" onClick={() => removeSecretRow(idx)} sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: '#ef4444' } }}>
                <DeleteOutlineIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          ))}
          <AddRowButton label="Add Secret Mapping" onClick={addSecretRow} />
          <Typography sx={{ fontSize: 9, color: 'text.secondary', fontStyle: 'italic', px: 0.5 }}>
            Mapped secrets will be available as <b>secret.KEY</b> in downstream nodes.
          </Typography>
        </Box>
      </CollapsibleSection>
    </Box>
  );
}

interface FetchSourceCardProps {
  fetchable: FetchableConfig;
  onUpdate: (patch: Partial<FetchableConfig>) => void;
  onRemove: () => void;
}

function FetchSourceCard({
  fetchable,
  onUpdate,
  onRemove,
}: FetchSourceCardProps) {
  const headers = fetchable.headers ?? [];

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "6px",
        p: 0.5,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        backgroundColor: "action.hover",
      }}
    >
      <Box display="flex" gap={0.5} alignItems="center">
        <Box
          sx={{
            fontSize: 9,
            fontWeight: 700,
            fontFamily: EXPR_FONT,
            px: 0.6,
            py: 0.2,
            borderRadius: "3px",
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
          placeholder="label (e.g. result)"
          value={fetchable.label ?? ""}
          onChange={(e) => onUpdate({ label: e.target.value })}
          sx={{ flex: 1, ...ROW_FIELD_SX }}
          inputProps={ROW_INPUT_PROPS}
        />
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "#ef4444" } }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Box>

      <Box>
        <ExpressionInput
          label="URL"
          value={fetchable.urlExpression}
          onChange={(v) => onUpdate({ urlExpression: v })}
          placeholder={'"https://api.example.com/items" or "https://api.example.com/" + context.id'}
          hint='FEEL expression: use "url" for static, "url/" + context.var for dynamic'
        />
      </Box>

      <CollapsibleSection title="Headers" count={headers.length}>
        <Box display="flex" flexDirection="column" gap={0.75} mt={0.25}>
          {headers.map((h, hIdx) => (
            <Box
              key={hIdx}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "6px",
                p: 0.75,
                backgroundColor: "action.hover",
                "& .del-h": { opacity: 0, transition: "opacity 0.15s" },
                "&:hover .del-h": { opacity: 1 },
              }}
            >
              <Box display="flex" gap={0.5} alignItems="center" mb={0.5}>
                <TextField
                  size="small"
                  placeholder="Header name"
                  value={h.key}
                  onChange={(e) =>
                    onUpdate({
                      headers: headers.map((hh, i) =>
                        i === hIdx ? { ...hh, key: e.target.value } : hh,
                      ),
                    })
                  }
                  sx={{ flex: 1, ...ROW_FIELD_SX }}
                  inputProps={ROW_INPUT_PROPS}
                />
                <IconButton
                  className="del-h"
                  size="small"
                  onClick={() =>
                    onUpdate({ headers: headers.filter((_, i) => i !== hIdx) })
                  }
                  sx={{ p: 0.25, color: "text.disabled", "&:hover": { color: "#ef4444" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
              <ExpressionInput
                value={h.valueExpression}
                onChange={(v) =>
                  onUpdate({
                    headers: headers.map((hh, i) =>
                      i === hIdx ? { ...hh, valueExpression: v } : hh,
                    ),
                  })
                }
                placeholder="Bearer context.token"
                availableContext={[]}
              />
            </Box>
          ))}
          <AddRowButton
            label="Add Header"
            onClick={() =>
              onUpdate({ headers: [...headers, { key: "", valueExpression: "" }] })
            }
          />
        </Box>
      </CollapsibleSection>
    </Box>
  );
}

interface DirectInputCardProps {
  row: InputDataMapRow;
  onUpdate: (patch: Partial<InputDataMapRow>) => void;
  onRemove: () => void;
}

function DirectInputCard({ row, onUpdate, onRemove }: DirectInputCardProps) {
  const invalid =
    row.contextVariableName.length > 0 &&
    !VALID_IDENT.test(row.contextVariableName);

  return (
    <Box
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
              backgroundColor: "rgba(79,110,247,0.12)",
              color: "#4f6ef7",
              border: "1px solid rgba(79,110,247,0.3)",
              flexShrink: 0,
              letterSpacing: "0.04em",
            }}
          >
            IN
          </Box>
          <TextField
            size="small"
            placeholder="Label / variable name"
            value={row.contextVariableName}
            error={invalid}
            onChange={(e) =>
              onUpdate({
                contextVariableName: e.target.value,
                jsonPath: "$." + e.target.value,
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
            onClick={onRemove}
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
          onChange={(v) => onUpdate({ dataType: v })}
        />
      </Box>
    </Box>
  );
}

interface FetchedInputCardProps {
  row: InputDataMapRow;
  fetchables: FetchableConfig[];
  onUpdate: (patch: Partial<InputDataMapRow>) => void;
  onRemove: () => void;
}

function FetchedInputCard({
  row,
  fetchables,
  onUpdate,
  onRemove,
}: FetchedInputCardProps) {
  const invalidVar =
    row.contextVariableName.length > 0 &&
    !VALID_IDENT.test(row.contextVariableName);

  const sourceFetchable = fetchables.find((f) => f.id === row.fetchableId);
  const isOrphaned = !sourceFetchable;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: isOrphaned ? "rgba(239,68,68,0.5)" : "divider",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 0.75,
          py: 0.75,
          backgroundColor: isOrphaned
            ? "rgba(239,68,68,0.04)"
            : "action.hover",
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
              backgroundColor: "rgba(168,85,247,0.12)",
              color: "#a855f7",
              border: "1px solid rgba(168,85,247,0.3)",
              flexShrink: 0,
              letterSpacing: "0.04em",
            }}
          >
            FETCH
          </Box>
          <FormControl size="small" sx={{ flex: 1, ...ROW_FIELD_SX }}>
            <Select
              value={row.fetchableId ?? ""}
              onChange={(e) => onUpdate({ fetchableId: e.target.value })}
              displayEmpty
              sx={{ fontSize: 11, borderRadius: "6px" }}
            >
              {fetchables.length === 0 && (
                <MenuItem value="" disabled sx={{ fontSize: 11 }}>
                  No fetch sources
                </MenuItem>
              )}
              {fetchables.map((f) => (
                <MenuItem key={f.id} value={f.id} sx={{ fontSize: 11 }}>
                  {f.label || "(unlabeled)"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            size="small"
            onClick={onRemove}
            sx={{
              p: 0.25,
              color: "text.disabled",
              "&:hover": { color: "#ef4444" },
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 13 }} />
          </IconButton>
        </Box>

        <Box
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
          <Typography
            sx={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "text.secondary",
            }}
          >
            Field Mapping
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5}>
            <TextField
              size="small"
              placeholder="var_name"
              value={row.contextVariableName}
              error={invalidVar}
              onChange={(e) =>
                onUpdate({ contextVariableName: e.target.value })
              }
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "6px",
                  fontSize: 11,
                  fontFamily: EXPR_FONT,
                  "& fieldset": {
                    borderColor: invalidVar ? "error.main" : "divider",
                  },
                },
              }}
              inputProps={ROW_INPUT_PROPS}
            />
            <Typography
              sx={{
                fontSize: 11,
                color: "text.disabled",
                flexShrink: 0,
                mx: 0.25,
                userSelect: "none",
              }}
            >
              =
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
              }}
            >
              <TextField
                size="small"
                placeholder="$.field_path"
                value= { row.jsonPath}
                onChange={(e) => onUpdate({ jsonPath: e.target.value })}
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
            </Box>
          </Box>

          <DataTypeSelect
            value={row.dataType || DataType.STRING}
            onChange={(v) => onUpdate({ dataType: v })}
          />
        </Box>

        <Typography
          sx={{
            fontSize: 9,
            color: "text.disabled",
            fontStyle: "italic",
            lineHeight: 1.4,
            px: 0.25,
          }}
        >
          fetched values are resolved when used and are not stored
        </Typography>
      </Box>
    </Box>
  );
}
