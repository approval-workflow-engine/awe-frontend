import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpressionInput from "../shared/ExpressionInput";
import ContextVariableSelector from "../shared/ContextVariableSelector";
import DataTypeSelect from "../shared/DataTypeSelect";
import UITypeSelect from "../shared/UITypeSelect";
import DropdownOptionsConfigurator from "../shared/DropdownOptionsConfigurator";
import DefaultValueInput from "../shared/DefaultValueInput";
import AddRowButton from "../shared/AddRowButton";
import { SectionLabel } from "../shared/CollapsibleSection";
import type { AvailableCtxVar } from "../context";
import type { CanvasNode, ContextVariable } from "../../type/types";
import type { UIType } from "../shared/UITypeSelect";
import type { DropdownOption } from "../shared/DropdownOptionsConfigurator";
import { DataType } from "../../type/types";
import { generateId } from "../../utils/nodeHelpers";

interface ResponseMapRowUser {
  fieldId: string;
  label: string;
  contextVariable?: ContextVariable;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  uiType?: UIType;
  options?: DropdownOption[];
}

interface Props {
  node: CanvasNode;
  availableContext: AvailableCtxVar[];
  availableSecrets?: AvailableCtxVar[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
}

const EMPTY_CV: ContextVariable = { name: "", scope: "global" };

function getDefaultValueForType(dataType: string): unknown {
  if (dataType === DataType.BOOLEAN) {
    return false;
  }

  if (dataType === DataType.NUMBER) {
    return 0;
  }

  if (dataType === DataType.NULL) {
    return null;
  }

  if (dataType === DataType.OBJECT) {
    return "{}";
  }

  if (dataType === DataType.LIST) {
    return "[]";
  }

  return "";
}

export default function UserTaskConfig({
  node,
  availableContext,
  availableSecrets = [],
  onUpdateConfig,
}: Props) {
  const c = node.config;
  const set = (key: string, val: unknown) =>
    onUpdateConfig({ ...c, [key]: val });

  const reqMap: Array<{ label: string; valueExpression: string }> =
    (c.requestMap as Array<{ label: string; valueExpression: string }>) ?? [];
  const resMap: ResponseMapRowUser[] =
    (c.responseMap as ResponseMapRowUser[]) ?? [];

  const updateReq = (
    idx: number,
    patch: Partial<{ label: string; valueExpression: string }>,
  ) =>
    set(
      "requestMap",
      reqMap.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  const removeReq = (idx: number) =>
    set(
      "requestMap",
      reqMap.filter((_, i) => i !== idx),
    );

  const updateRes = (idx: number, patch: Partial<ResponseMapRowUser>) =>
    set(
      "responseMap",
      resMap.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    );
  const removeRes = (idx: number) =>
    set(
      "responseMap",
      resMap.filter((_, i) => i !== idx),
    );

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Box display="flex" flexDirection="column" gap={1}>
        <TextField
          size="small"
          label="Title"
          value={(c.title as string) ?? ""}
          onChange={(e) => set("title", e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "6px",
              fontSize: 11,
              "& fieldset": { borderColor: "divider" },
            },
            "& .MuiInputLabel-root": { fontSize: 11 },
          }}
          inputProps={{ style: { padding: "5px 8px", fontSize: 11 } }}
        />
        <TextField
          size="small"
          label="Description"
          value={(c.description as string) ?? ""}
          onChange={(e) => set("description", e.target.value)}
          multiline
          minRows={2}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "6px",
              fontSize: 11,
              "& fieldset": { borderColor: "divider" },
            },
            "& .MuiInputLabel-root": { fontSize: 11 },
          }}
        />
        <ExpressionInput
          label="Assignee (optional)"
          value={(c.assignee as string) ?? ""}
          onChange={(v) => set("assignee", v)}
          placeholder="context.assignee"
          availableContext={availableContext}
          availableSecrets={availableSecrets}
          hint="If left empty, the task will be unassigned and visible to all users"
        />
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      <Box>
        <SectionLabel>Display Data</SectionLabel>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Typography
            sx={{
              fontSize: 9,
              color: "text.secondary",
              opacity: 0.8,
              mb: 0.25,
            }}
          >
            Data shown to the reviewer/approver
          </Typography>
          {reqMap.map((row, idx) => (
            <Box
              key={idx}
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
                  placeholder="Label"
                  value={row.label}
                  onChange={(e) => updateReq(idx, { label: e.target.value })}
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
                  onClick={() => removeReq(idx)}
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
                value={row.valueExpression}
                onChange={(v) => updateReq(idx, { valueExpression: v })}
                placeholder="context.value"
                availableContext={availableContext}
                availableSecrets={availableSecrets}
              />
            </Box>
          ))}
          <AddRowButton
            label="Add Field"
            onClick={() =>
              set("requestMap", [...reqMap, { label: "", valueExpression: "" }])
            }
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      <Box>
        <SectionLabel>Input Fields</SectionLabel>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Typography
            sx={{
              fontSize: 9,
              color: "text.secondary",
              opacity: 0.8,
              mb: 0.25,
            }}
          >
            Fields the reviewer/approver must fill in
          </Typography>
          {resMap.map((row, idx) => (
            <Box
              key={row.fieldId}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "6px",
                overflow: "hidden",
                "& .delete-btn": { opacity: 0, transition: "opacity 0.15s" },
                "&:hover .delete-btn": { opacity: 1 },
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
                    placeholder="Field label"
                    value={row.label}
                    onChange={(e) => updateRes(idx, { label: e.target.value })}
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
                  <DataTypeSelect
                    value={row.type || DataType.STRING}
                    onChange={(v) =>
                      updateRes(idx, {
                        type: v,
                        ...(row.required === false
                          ? { defaultValue: getDefaultValueForType(v) }
                          : {}),
                      })
                    }
                    exclude={[DataType.NULL]}
                  />
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onClick={() => removeRes(idx)}
                    sx={{
                      p: 0.25,
                      color: "text.disabled",
                      "&:hover": { color: "#ef4444" },
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>

                <UITypeSelect
                  value={row.uiType}
                  onChange={(v) => updateRes(idx, { uiType: v, options: v === "dropdown" ? row.options || [] : undefined })}
                  dataType={row.type}
                />

                {row.uiType === "dropdown" && (
                  <DropdownOptionsConfigurator
                    options={row.options || []}
                    onChange={(opts) => updateRes(idx, { options: opts })}
                  />
                )}

                <Box display="flex" gap={0.5}>
                  <Button
                    size="small"
                    variant={row.required !== false ? "contained" : "outlined"}
                    onClick={() =>
                      updateRes(idx, {
                        required: true,
                        defaultValue: undefined,
                      })
                    }
                    sx={{
                      fontSize: 9,
                      height: 22,
                      borderRadius: "5px",
                      flex: 1,
                      textTransform: "none",
                    }}
                  >
                    Required
                  </Button>
                  <Button
                    size="small"
                    variant={row.required === false ? "contained" : "outlined"}
                    onClick={() =>
                      updateRes(idx, {
                        required: false,
                        defaultValue:
                          row.defaultValue === undefined
                            ? getDefaultValueForType(row.type || DataType.STRING)
                            : row.defaultValue,
                      })
                    }
                    sx={{
                      fontSize: 9,
                      height: 22,
                      borderRadius: "5px",
                      flex: 1,
                      textTransform: "none",
                    }}
                  >
                    Optional
                  </Button>
                </Box>

                {row.required === false && (
                  <Box>
                    <Typography
                      sx={{ fontSize: 9, color: "text.secondary", mb: 0.25 }}
                    >
                      Default Value
                    </Typography>
                    <DefaultValueInput
                      dataType={row.type || DataType.STRING}
                      value={row.defaultValue}
                      onChange={(v) => updateRes(idx, { defaultValue: v })}
                    />
                  </Box>
                )}

                <Box>
                  <Typography
                    sx={{ fontSize: 9, color: "text.secondary", mb: 0.25 }}
                  >
                    Store as
                  </Typography>
                  <ContextVariableSelector
                    value={row.contextVariable ?? EMPTY_CV}
                    onChange={(v) => updateRes(idx, { contextVariable: v })}
                  />
                </Box>
              </Box>
            </Box>
          ))}
          <AddRowButton
            label="Add Field"
            onClick={() =>
              set("responseMap", [
                ...resMap,
                {
                  fieldId: generateId("field"),
                  label: "",
                  type: DataType.STRING,
                  required: true,
                },
              ])
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
