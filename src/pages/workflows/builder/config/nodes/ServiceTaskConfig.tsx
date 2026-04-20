import { useState, useEffect, useMemo } from "react";
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
import NumberInput from "../shared/NumberInput";
import AddRowButton from "../shared/AddRowButton";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import ResponseMapSection, {
  type ResponseMapRow,
} from "../shared/ResponseMapSection";
import { flattenJsonToBody, bodyToJson } from "../bodyHelpers";
import { HTTP_METHODS, METHOD_COLORS } from "../constants";
import type { AvailableCtxVar } from "../context";
import type { CanvasNode } from "../../type/types";

interface HeaderRow {
  key: string;
  valueExpression: string;
}

interface Backoff {
  type: "fixed" | "exponential";
  delay: number;
  unit: "millisecond" | "second" | "minute";
}

interface TimeoutConfig {
  delay: number;
  unit: "millisecond" | "second" | "minute";
}

function getTimeoutConfig(config: Record<string, unknown>): TimeoutConfig | undefined {
  const timeout = config.timeout;
  if (timeout && typeof timeout === "object" && !Array.isArray(timeout)) {
    const parsed = timeout as Partial<TimeoutConfig>;
    if (typeof parsed.delay === "number" && parsed.delay > 0) {
      const unit =
        parsed.unit === "millisecond" ||
        parsed.unit === "second" ||
        parsed.unit === "minute"
          ? parsed.unit
          : "millisecond";

      return {
        delay: parsed.delay,
        unit,
      };
    }
  }

  if (typeof config.timeoutMs === "number" && config.timeoutMs > 0) {
    return {
      delay: config.timeoutMs,
      unit: "millisecond",
    };
  }

  return undefined;
}

interface Props {
  node: CanvasNode;
  availableContext: AvailableCtxVar[];
  availableSecrets?: AvailableCtxVar[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
}

export default function ServiceTaskConfig({
  node,
  availableContext,
  availableSecrets = [],
  onUpdateConfig,
}: Props) {
  const c = node.config;
  const set = (key: string, val: unknown) =>
    onUpdateConfig({ ...c, [key]: val });

  const headers: HeaderRow[] = (c.headers as HeaderRow[]) ?? [];
  const body: Array<{ jsonPath: string; valueExpression: string }> = useMemo(
    () =>
      (c.body as Array<{ jsonPath: string; valueExpression: string }>) ?? [],
    [c.body],
  );

  const [bodyJson, setBodyJson] = useState(() => bodyToJson(body));
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBodyJson(bodyToJson(body));
  }, [node.id, body]);

  const [bodyError, setBodyError] = useState("");

  const handleBodyChange = (text: string) => {
    setBodyJson(text);
    if (!text.trim()) {
      setBodyError("");
      set("body", []);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setBodyError("");
      set("body", flattenJsonToBody(parsed));
    } catch (err) {
      setBodyError((err as Error).message);
    }
  };

  const updateHeader = (idx: number, patch: Partial<HeaderRow>) =>
    set(
      "headers",
      headers.map((h, i) => (i === idx ? { ...h, ...patch } : h)),
    );
  const removeHeader = (idx: number) =>
    set(
      "headers",
      headers.filter((_, i) => i !== idx),
    );

  const method = (c.method as string) || "GET";
  const backoff = (c.backoff as Backoff) ?? {
    type: "fixed",
    delay: 1,
    unit: "second",
  };
  const timeout = getTimeoutConfig(c);

  const setBackoff = (patch: Partial<Backoff>) =>
    set("backoff", { ...backoff, ...patch });

  const setTimeoutConfig = (value: TimeoutConfig | undefined) => {
    const nextConfig = { ...c } as Record<string, unknown>;

    if (value) {
      nextConfig.timeout = value;
    } else {
      delete nextConfig.timeout;
    }

    delete nextConfig.timeoutMs;

    onUpdateConfig(nextConfig);
  };

  const setTimeoutDelay = (delay: number | undefined) => {
    if (delay === undefined) {
      setTimeoutConfig(undefined);
      return;
    }

    setTimeoutConfig({
      delay,
      unit: timeout?.unit ?? "second",
    });
  };

  const setTimeoutUnit = (unit: TimeoutConfig["unit"]) => {
    setTimeoutConfig({
      delay: timeout?.delay ?? 1,
      unit,
    });
  };

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Box display="flex" flexDirection="column" gap={1}>
        <Box display="flex" gap={0.5}>
          {HTTP_METHODS.map((m) => (
            <Button
              key={m}
              size="small"
              onClick={() => set("method", m)}
              sx={{
                fontSize: 9,
                height: 22,
                borderRadius: "5px",
                minWidth: 0,
                px: 0.75,
                fontWeight: 700,
                textTransform: "none",
                backgroundColor:
                  method === m ? `${METHOD_COLORS[m]}22` : "transparent",
                color: method === m ? METHOD_COLORS[m] : "text.disabled",
                border: "1px solid",
                borderColor: method === m ? `${METHOD_COLORS[m]}55` : "divider",
                "&:hover": { backgroundColor: `${METHOD_COLORS[m]}15` },
              }}
            >
              {m}
            </Button>
          ))}
        </Box>
        <Box>
          <ExpressionInput
            label="URL"
            value={(c.urlExpression as string) ?? ""}
            onChange={(v) => set("urlExpression", v)}
            placeholder={
              '"https://api.example.com/items" or "https://api.example.com/" + context.id'
            }
            availableContext={availableContext}
            availableSecrets={availableSecrets}
            hint='FEEL expression: use "url" for static URLs, "url/" + context.var for dynamic paths'
          />
        </Box>
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      <CollapsibleSection title="Headers" count={headers.length}>
        <Box display="flex" flexDirection="column" gap={0.75}>
          {headers.map((h, idx) => (
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
                  placeholder="Header name"
                  value={h.key}
                  onChange={(e) => updateHeader(idx, { key: e.target.value })}
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
                  onClick={() => removeHeader(idx)}
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
                value={h.valueExpression}
                onChange={(v) => updateHeader(idx, { valueExpression: v })}
                placeholder="Bearer context.token"
                availableContext={availableContext}
                availableSecrets={availableSecrets}
              />
            </Box>
          ))}
          <AddRowButton
            label="Add Header"
            onClick={() =>
              set("headers", [...headers, { key: "", valueExpression: "" }])
            }
          />
        </Box>
      </CollapsibleSection>

      {method !== "GET" && method !== "DELETE" && (
        <CollapsibleSection title="Request Body" count={body.length}>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography
              sx={{ fontSize: 9, color: "text.secondary", opacity: 0.8 }}
            >
              JSON body - use context.varName for dynamic values
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: bodyError ? "rgba(239,68,68,0.5)" : "divider",
                borderRadius: "6px",
                overflow: "hidden",
              }}
            >
              <textarea
                value={bodyJson}
                onChange={(e) => handleBodyChange(e.target.value)}
                rows={5}
                spellCheck={false}
                placeholder={'{\n  "key": "context.value"\n}'}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "6px 8px",
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "transparent",
                  color: "inherit",
                  border: "none",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </Box>
            {bodyError ? (
              <Typography sx={{ fontSize: 9, color: "#ef4444" }}>
                {bodyError}
              </Typography>
            ) : body.length > 0 ? (
              <Typography sx={{ fontSize: 9, color: "#22c55e" }}>
                Valid JSON · {body.length} field{body.length !== 1 ? "s" : ""}
              </Typography>
            ) : null}
          </Box>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Response Map"
        count={(c.responseMap as ResponseMapRow[])?.length ?? 0}
      >
        <ResponseMapSection
          rows={(c.responseMap as ResponseMapRow[]) ?? []}
          onChange={(v) => set("responseMap", v)}
          hint="Extract values from the API response"
        />
      </CollapsibleSection>

      <CollapsibleSection title="Retry & Timeout">
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Max Attempts
            </Typography>
            <Box sx={{ width: 100 }}>
              <NumberInput
                value={(c.maxAttempts as number) ?? 1}
                onChange={(v) => set("maxAttempts", v ?? 1)}
                min={1}
                allowEmpty={false}
              />
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Timeout
            </Typography>
            <Box display="flex" gap={0.5} sx={{ width: 140 }}>
              <NumberInput
                value={timeout?.delay}
                onChange={setTimeoutDelay}
                min={1}
              />
              <Box display="flex" gap={0.25}>
                {(["millisecond", "second", "minute"] as const).map((u) => (
                  <Button
                    key={u}
                    size="small"
                    onClick={() => setTimeoutUnit(u)}
                    title={u}
                    sx={{
                      fontSize: 8,
                      height: 22,
                      borderRadius: "4px",
                      minWidth: 30,
                      px: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                      backgroundColor:
                        timeout?.unit === u ? "action.selected" : "transparent",
                      color:
                        timeout?.unit === u ? "text.primary" : "text.disabled",
                      border: "1px solid",
                      borderColor:
                        timeout?.unit === u ? "action.focus" : "divider",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    {u === "millisecond" ? "ms" : u === "second" ? "s" : "m"}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Retry Delay
            </Typography>
            <Box display="flex" gap={0.5} sx={{ width: 140 }}>
              <NumberInput
                value={backoff.delay}
                onChange={(v) => setBackoff({ delay: v ?? 1 })}
                min={1}
                allowEmpty={false}
              />
              <Box display="flex" gap={0.25}>
                {(["millisecond", "second", "minute"] as const).map((u) => (
                  <Button
                    key={u}
                    size="small"
                    onClick={() => setBackoff({ unit: u })}
                    title={u}
                    sx={{
                      fontSize: 8,
                      height: 22,
                      borderRadius: "4px",
                      minWidth: 30,
                      px: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                      backgroundColor:
                        backoff.unit === u ? "action.selected" : "transparent",
                      color:
                        backoff.unit === u ? "text.primary" : "text.disabled",
                      border: "1px solid",
                      borderColor:
                        backoff.unit === u ? "action.focus" : "divider",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    {u === "millisecond" ? "ms" : u === "second" ? "s" : "m"}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Backoff Type
            </Typography>
            <Box display="flex" gap={0.5}>
              {(["fixed", "exponential"] as const).map((t) => (
                <Button
                  key={t}
                  size="small"
                  onClick={() => setBackoff({ type: t })}
                  sx={{
                    fontSize: 9,
                    height: 22,
                    borderRadius: "5px",
                    minWidth: 0,
                    px: 0.75,
                    fontWeight: 700,
                    textTransform: "none",
                    backgroundColor:
                      backoff.type === t ? "action.selected" : "transparent",
                    color:
                      backoff.type === t ? "text.primary" : "text.disabled",
                    border: "1px solid",
                    borderColor:
                      backoff.type === t ? "action.focus" : "divider",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {t}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </CollapsibleSection>

    </Box>
  );
}
