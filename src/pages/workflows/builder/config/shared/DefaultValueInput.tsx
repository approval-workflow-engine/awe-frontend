import { FormControl, MenuItem, Select, TextField, Typography } from "@mui/material";
import { DataType } from "../../type/types";

interface Props {
  dataType: string;
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    fontSize: 11,
    "& fieldset": { borderColor: "divider" },
  },
} as const;

function toStringValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function DefaultValueInput({
  dataType,
  value,
  onChange,
  placeholder,
}: Props) {
  if (dataType === DataType.BOOLEAN) {
    const normalized =
      typeof value === "boolean"
        ? value
          ? "true"
          : "false"
        : toStringValue(value) || "false";

    return (
      <FormControl size="small" fullWidth sx={fieldSx}>
        <Select
          value={normalized}
          onChange={(e) => onChange(e.target.value === "true")}
          sx={{ fontSize: 11, borderRadius: "6px" }}
        >
          <MenuItem value="true" sx={{ fontSize: 11 }}>
            true
          </MenuItem>
          <MenuItem value="false" sx={{ fontSize: 11 }}>
            false
          </MenuItem>
        </Select>
      </FormControl>
    );
  }

  if (dataType === DataType.NUMBER) {
    const normalized =
      typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : toStringValue(value);

    return (
      <TextField
        size="small"
        type="number"
        value={normalized}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") {
            onChange("");
            return;
          }

          const parsed = Number(next);
          onChange(Number.isNaN(parsed) ? next : parsed);
        }}
        fullWidth
        sx={fieldSx}
        inputProps={{ style: { padding: "4px 8px", fontSize: 11 } }}
      />
    );
  }

  if (dataType === DataType.NULL) {
    return (
      <TextField
        size="small"
        value="null"
        disabled
        fullWidth
        sx={fieldSx}
        inputProps={{ style: { padding: "4px 8px", fontSize: 11 } }}
      />
    );
  }

  if (dataType === DataType.OBJECT || dataType === DataType.LIST) {
    return (
      <TextField
        size="small"
        value={toStringValue(value)}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        multiline
        minRows={2}
        placeholder={placeholder ?? (dataType === DataType.OBJECT ? '{"key":"value"}' : '["value"]')}
        sx={fieldSx}
      />
    );
  }

  return (
    <TextField
      size="small"
      value={toStringValue(value)}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      placeholder={placeholder ?? "Default value"}
      sx={fieldSx}
      inputProps={{ style: { padding: "4px 8px", fontSize: 11 } }}
      helperText={
        <Typography sx={{ fontSize: 9, color: "text.disabled", ml: 0 }}>
          Leave empty only when field is required.
        </Typography>
      }
    />
  );
}
