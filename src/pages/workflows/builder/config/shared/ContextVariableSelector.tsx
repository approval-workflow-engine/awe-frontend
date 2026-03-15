import {
  Box,
  TextField,
} from "@mui/material";
import { EXPR_FONT } from "../constants";
import type { ContextVariable } from "../../type/types";

interface Props {
  value: ContextVariable;
  onChange: (v: ContextVariable) => void;
}

const VALID_IDENT = /^[a-zA-Z_][a-zA-Z0-9_.]*$/;

export default function ContextVariableSelector({
  value,
  onChange,
}: Props) {
  const invalid = value.name.length > 0 && !VALID_IDENT.test(value.name);
  return (
    <Box display="flex" gap={0.5} alignItems="center">
      <TextField
        size="small"
        placeholder="var_name"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        error={invalid}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: "6px",
            fontSize: 11,
            fontFamily: EXPR_FONT,
            "& fieldset": { borderColor: invalid ? "error.main" : "divider" },
          },
        }}
        inputProps={{ style: { padding: "4px 8px", fontSize: 11 } }}
      />
    </Box>
  );
}
