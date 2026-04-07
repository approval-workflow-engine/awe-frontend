import {
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import MoreIcon from "@mui/icons-material/MoreVertOutlined";

export type UIType = "text" | "textarea" | "number" | "dropdown" | "checkbox" | "date-picker";

export interface UITypeOption {
  value: UIType;
  label: string;
  description: string;
  icon: React.ComponentType<{ sx?: Record<string, unknown> }>;
  compatibleTypes?: string[];
}

const UI_TYPES: UITypeOption[] = [
  {
    value: "text",
    label: "Text",
    description: "Single-line text input",
    icon: TextFieldsIcon,
    compatibleTypes: ["string"],
  },
  {
    value: "textarea",
    label: "Textarea",
    description: "Multi-line text input",
    icon: TextSnippetIcon,
    compatibleTypes: ["string"],
  },
  {
    value: "number",
    label: "Number",
    description: "Numeric input field",
    icon: TextFieldsIcon,
    compatibleTypes: ["number"],
  },
  {
    value: "dropdown",
    label: "Dropdown",
    description: "Select from predefined options",
    icon: MoreIcon,
    compatibleTypes: ["string", "number"],
  },
  {
    value: "checkbox",
    label: "Checkbox",
    description: "Toggle boolean value",
    icon: TextFieldsIcon,
    compatibleTypes: ["boolean"],
  },
  {
    value: "date-picker",
    label: "Date Picker",
    description: "Select a date",
    icon: TextFieldsIcon,
    compatibleTypes: ["date", "date-time"],
  },
];

interface Props {
  value?: UIType;
  onChange: (value: UIType) => void;
  dataType?: string;
}

export default function UITypeSelect({ value, onChange, dataType }: Props) {
  // Filter UI types based on data type compatibility
  const compatibleTypes = dataType
    ? UI_TYPES.filter(
        (ut) => !ut.compatibleTypes || ut.compatibleTypes.includes(dataType),
      )
    : UI_TYPES;

  return (
    <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
      <Typography
        sx={{ fontSize: 9, color: "text.secondary", mb: 0.25 }}
      >
        UI Type
      </Typography>
      <Select
        value={value || ""}
        onChange={(e) => onChange(e.target.value as UIType)}
        sx={{
          borderRadius: "6px",
          fontSize: 11,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
        }}
        displayEmpty
        renderValue={(val) => {
          if (!val) return <em style={{ opacity: 0.7 }}>Select UI type</em>;
          const type = UI_TYPES.find((ut) => ut.value === val);
          return (
            <Tooltip title={type?.description || ""}>
              <span>{type?.label || val}</span>
            </Tooltip>
          );
        }}
      >
        <MenuItem value="" disabled>
          <em>Select UI type</em>
        </MenuItem>
        {compatibleTypes.map((type) => (
          <MenuItem key={type.value} value={type.value}>
            <Box display="flex" alignItems="center" gap={0.75}>
              <type.icon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Box>
                <Typography sx={{ fontSize: 11, fontWeight: 500 }}>
                  {type.label}
                </Typography>
                <Typography sx={{ fontSize: 9, color: "text.secondary" }}>
                  {type.description}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
