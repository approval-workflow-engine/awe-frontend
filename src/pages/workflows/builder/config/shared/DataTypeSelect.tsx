import { Box, Typography, FormControl, Select, MenuItem } from "@mui/material";
import { EXPR_FONT, DATA_TYPE_COLORS } from "../constants";
import { DataType } from "../../type/builderTypes";

interface Props {
  value: string;
  onChange: (v: DataType) => void;
  size?: "small" | "xsmall";
  exclude?: DataType[];
}

export default function DataTypeSelect({
  value,
  onChange,
  size = "small",
  exclude,
}: Props) {
  const color = DATA_TYPE_COLORS[value] ?? "#8b91a8";
  const height = size === "xsmall" ? 24 : 28;
  const types = Object.values(DataType).filter((dt) => !exclude?.includes(dt));

  return (
    <FormControl size="small" sx={{ minWidth: 90 }}>
      <Select
        value={value || DataType.STRING}
        onChange={(e) => onChange(e.target.value as DataType)}
        sx={{ borderRadius: "6px", fontSize: 11, height, color }}
        renderValue={(v) => (
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: DATA_TYPE_COLORS[v as string] ?? "#8b91a8",
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{ fontSize: 11, fontFamily: EXPR_FONT, color: "inherit" }}
            >
              {v}
            </Typography>
          </Box>
        )}
      >
        {types.map((dt) => (
          <MenuItem
            key={dt}
            value={dt}
            sx={{ fontSize: 11, fontFamily: EXPR_FONT }}
          >
            <Box display="flex" alignItems="center" gap={0.75}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  backgroundColor: DATA_TYPE_COLORS[dt] ?? "#8b91a8",
                }}
              />
              {dt}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
