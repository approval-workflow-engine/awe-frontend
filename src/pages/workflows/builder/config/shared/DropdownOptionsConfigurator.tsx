import {
  Box,
  TextField,
  IconButton,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddRowButton from "./AddRowButton";

export interface DropdownOption {
  label?: string;
  valueExpression: string;
}

interface Props {
  options: DropdownOption[];
  onChange: (options: DropdownOption[]) => void;
}

export default function DropdownOptionsConfigurator({
  options,
  onChange,
}: Props) {
  const updateOption = (idx: number, patch: Partial<DropdownOption>) =>
    onChange(options.map((o, i) => (i === idx ? { ...o, ...patch } : o)));

  const removeOption = (idx: number) =>
    onChange(options.filter((_, i) => i !== idx));

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 9,
          color: "text.secondary",
          mb: 0.75,
        }}
      >
        Dropdown Options
      </Typography>
      <Box display="flex" flexDirection="column" gap={0.5}>
        {options.map((option, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              gap: 0.5,
              alignItems: "flex-start",
              p: 0.75,
              borderRadius: "6px",
              backgroundColor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
              "& .delete-btn": { opacity: 0, transition: "opacity 0.15s" },
              "&:hover .delete-btn": { opacity: 1 },
            }}
          >
            <TextField
              size="small"
              placeholder="Display label"
              value={option.label || ""}
              onChange={(e) => updateOption(idx, { label: e.target.value })}
              sx={{
                flex: 0.4,
                "& input": { fontSize: 11, padding: "4px 8px" },
                "& fieldset": { borderColor: "divider" },
              }}
            />
            <TextField
              size="small"
              placeholder="Value expression / static value"
              value={option.valueExpression}
              onChange={(e) => updateOption(idx, { valueExpression: e.target.value })}
              sx={{
                flex: 0.6,
                "& input": { fontSize: 11, padding: "4px 8px" },
                "& fieldset": { borderColor: "divider" },
              }}
            />
            <IconButton
              className="delete-btn"
              size="small"
              onClick={() => removeOption(idx)}
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
          label="Add Option"
          onClick={() =>
            onChange([...options, { label: "", valueExpression: "" }])
          }
        />
      </Box>
    </Box>
  );
}
