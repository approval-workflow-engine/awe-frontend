import { useState } from "react";
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
  const [jsonDrafts, setJsonDrafts] = useState<Record<string, string>>({});

  const formatLabel = (jsonPath: string) =>
    jsonPath.replace(/^\$\.?/, "");

  const getContextKey = (item: StartVariable) =>
    formatLabel(item.jsonPath);

  const getJsonValueText = (item: StartVariable, value: unknown) => {
    const contextKey = getContextKey(item);

    if (contextKey in jsonDrafts) {
      return jsonDrafts[contextKey] ?? "";
    }

    return JSON.stringify(
      value ?? (item.dataType === "list" ? [] : {}),
      null,
      2,
    );
  };

  const handleJsonChange = (item: StartVariable, rawValue: string) => {
    const contextKey = getContextKey(item);

    setJsonDrafts((current) => ({
      ...current,
      [contextKey]: rawValue,
    }));

    try {
      const parsed = JSON.parse(rawValue);
      onChange(contextKey, parsed);
      setJsonError("");
      setJsonDrafts((current) => {
        const next = { ...current };
        delete next[contextKey];
        return next;
      });
    } catch {
      setJsonError(`Invalid JSON for ${formatLabel(item.jsonPath)}`);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
    >
      {schema.map((item) => {
        const contextKey = getContextKey(item);
        const value = values[contextKey];

        return (
          <Box key={contextKey}>
            <Typography
              fontSize={13}
              fontWeight={500}
              mb={0.5}
            >
              {formatLabel(item.jsonPath)}

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
                    contextKey,
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
                    contextKey,
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
                value={getJsonValueText(item, value)}
                onChange={(e) =>
                  handleJsonChange(item, e.target.value)
                }
                error={contextKey in jsonDrafts}
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
          </Box>
        );
      })}
    </Box>
  );
}