import {
  Box,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

export interface StartVariable {
  jsonPath: string;
  dataType:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "list"
    | "date"
    | "time"
    | "date-time"
    | "null";
  required?: boolean;
  defaultValue?: unknown;
}

interface Props {
  schema: StartVariable[];
  values: Record<string, unknown>;
  onChange: (
    key: string,
    value: unknown,
  ) => void;
  setJsonError: (value: string) => void;
}

export default function WorkflowContextForm({
  schema,
  values,
  onChange,
  setJsonError,
}: Props) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
    >
      {schema.map((item) => {
        const value = values[item.jsonPath];

        return (
          <Box key={item.jsonPath}>
            <Typography
              fontSize={13}
              fontWeight={500}
              mb={0.5}
            >
              {item.jsonPath}

              {item.required && (
                <Box
                  component="span"
                  sx={{
                    color: "error.main",
                    ml: 0.5,
                  }}
                >
                  *
                </Box>
              )}
            </Typography>

            {(item.dataType === "string" ||
              item.dataType === "number" ||
              item.dataType === "date" ||
              item.dataType === "time" ||
              item.dataType === "date-time") && (
              <TextField
                fullWidth
                size="small"
                type={
                  item.dataType === "number"
                    ? "number"
                    : item.dataType === "date"
                      ? "date"
                      : item.dataType === "time"
                        ? "time"
                        : item.dataType === "date-time"
                          ? "datetime-local"
                    : "text"
                }
                value={value ?? ""}
                onChange={(e) =>
                  onChange(
                    item.jsonPath,
                    item.dataType === "number"
                      ? e.target.value === ""
                        ? ""
                        : Number(
                            e.target.value,
                          )
                      : e.target.value,
                  )
                }
              />
            )}

            {item.dataType === "boolean" && (
              <Switch
                checked={Boolean(value)}
                onChange={(e) =>
                  onChange(
                    item.jsonPath,
                    e.target.checked,
                  )
                }
              />
            )}

            {(item.dataType === "object" ||
              item.dataType === "list") && (
              <TextField
                fullWidth
                multiline
                minRows={4}
                value={JSON.stringify(
                  value ??
                    (item.dataType === "list"
                      ? []
                      : {}),
                  null,
                  2,
                )}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(
                      e.target.value,
                    );

                    onChange(
                      item.jsonPath,
                      parsed,
                    );

                    setJsonError("");
                  } catch {
                    setJsonError(
                      `Invalid JSON for ${item.jsonPath}`,
                    );
                  }
                }}
                slotProps={{
                  htmlInput: {
                    style: {
                      fontFamily:
                        "'JetBrains Mono', monospace",
                      fontSize: 12,
                    },
                  },
                }}
              />
            )}

            <Typography
              fontSize={11}
              color="text.secondary"
              mt={0.5}
            >
              Type: {item.dataType}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}