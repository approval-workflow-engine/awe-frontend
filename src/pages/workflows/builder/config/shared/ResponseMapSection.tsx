import { Box, Typography, IconButton } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContextVariableSelector from "./ContextVariableSelector";
import DataTypeSelect from "./DataTypeSelect";
import JsonPathInput from "./JsonPathInput";
import AddRowButton from "./AddRowButton";
import type { ContextVariable } from "../../type/types";
import { DataType } from "../../type/types";

export interface ResponseMapRow {
  jsonPath: string;
  type: string;
  contextVariable?: ContextVariable;
}

interface Props {
  rows: ResponseMapRow[];
  onChange: (rows: ResponseMapRow[]) => void;
  hint?: string;
}

const EMPTY_CV: ContextVariable = { name: "", scope: "global" };

export default function ResponseMapSection({
  rows,
  onChange,
  hint,
}: Props) {
  const update = (idx: number, patch: Partial<ResponseMapRow>) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const remove = (idx: number) =>
    onChange(rows.filter((_, i) => i !== idx));

  return (
    <Box display="flex" flexDirection="column" gap={0.75}>
      {hint && (
        <Typography
          sx={{ fontSize: 9, color: "text.secondary", opacity: 0.8, mb: 0.25 }}
        >
          {hint}
        </Typography>
      )}
      {rows.map((row, idx) => (
        <Box
          key={idx}
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
              py: 0.5,
              backgroundColor: "action.hover",
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
            }}
          >
            <Box display="flex" gap={0.5} alignItems="center">
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <JsonPathInput
                  value={row.jsonPath}
                  onChange={(v) => update(idx, { jsonPath: v })}
                  placeholder="result.field"
                />
              </Box>
              <DataTypeSelect
                value={row.type || DataType.STRING}
                onChange={(v) => update(idx, { type: v })}
              />
              <IconButton
                className="delete-btn"
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
        </Box>
      ))}
      <AddRowButton
        label="Add Mapping"
        onClick={() =>
          onChange([...rows, { jsonPath: "", type: DataType.STRING }])
        }
      />
    </Box>
  );
}
