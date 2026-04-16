import { Box, Typography, IconButton, Button, FormControl, MenuItem, Select } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpressionInput from "../shared/ExpressionInput";
import NumberInput from "../shared/NumberInput";
import AddRowButton from "../shared/AddRowButton";
import { CollapsibleSection } from "../shared/CollapsibleSection";
import ResponseMapSection, {
  type ResponseMapRow,
} from "../shared/ResponseMapSection";
import type { AvailableCtxVar } from "../context";
import type { CanvasNode } from "../../type/types";

type RecipientRow = {
  valueExpression: string;
};

type Backoff = {
  type: "fixed" | "exponential";
  delay: number;
  unit: "millisecond" | "second" | "minute";
};

type FailurePolicy = "fail" | "continue";

type RecipientField = "to" | "cc" | "bcc";

interface Props {
  node: CanvasNode;
  availableContext: AvailableCtxVar[];
  availableSecrets?: AvailableCtxVar[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
}

function getRows(config: Record<string, unknown>, field: RecipientField): RecipientRow[] {
  const rows = config[field] as RecipientRow[] | undefined;
  return Array.isArray(rows) ? rows : [];
}

export default function EmailTaskConfig({
  node,
  availableContext,
  availableSecrets = [],
  onUpdateConfig,
}: Props) {
  const c = node.config;
  const set = (key: string, val: unknown) => onUpdateConfig({ ...c, [key]: val });

  const toRows = getRows(c, "to");
  const ccRows = getRows(c, "cc");
  const bccRows = getRows(c, "bcc");

  const backoff = (c.backoff as Backoff) ?? {
    type: "fixed",
    delay: 1,
    unit: "second",
  };
  const setBackoff = (patch: Partial<Backoff>) =>
    set("backoff", { ...backoff, ...patch });

  const failurePolicy = (c.failurePolicy as FailurePolicy) ?? "fail";

  const updateRecipient = (
    field: RecipientField,
    index: number,
    patch: Partial<RecipientRow>,
  ) => {
    const rows = getRows(c, field);
    set(
      field,
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeRecipient = (field: RecipientField, index: number) => {
    const rows = getRows(c, field);
    set(
      field,
      rows.filter((_, i) => i !== index),
    );
  };

  const addRecipient = (field: RecipientField) => {
    const rows = getRows(c, field);
    set(field, [...rows, { valueExpression: "" }]);
  };

  const renderRecipientSection = (
    field: RecipientField,
    title: string,
    rows: RecipientRow[],
    placeholder: string,
  ) => (
    <CollapsibleSection title={title} count={rows.length}>
      <Box display="flex" flexDirection="column" gap={0.75}>
        {rows.map((row, idx) => (
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
            <Box display="flex" gap={0.5} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <ExpressionInput
                  value={row.valueExpression}
                  onChange={(value) =>
                    updateRecipient(field, idx, { valueExpression: value })
                  }
                  placeholder={placeholder}
                  availableContext={availableContext}
                  availableSecrets={availableSecrets}
                />
              </Box>
              <IconButton
                className="delete-btn"
                size="small"
                onClick={() => removeRecipient(field, idx)}
                sx={{
                  p: 0.25,
                  color: "text.disabled",
                  "&:hover": { color: "#ef4444" },
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Box>
          </Box>
        ))}
        <AddRowButton
          label={`Add ${title}`}
          onClick={() => addRecipient(field)}
        />
      </Box>
    </CollapsibleSection>
  );

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <CollapsibleSection title="Provider" defaultOpen>
        <Box display="flex" flexDirection="column" gap={0.5}>
          <FormControl size="small" sx={{ width: "100%" }}>
            <Select
              value={(c.provider as string) ?? "google_smtp"}
              onChange={(event) => set("provider", event.target.value)}
              sx={{ fontSize: 11, borderRadius: "6px" }}
            >
              <MenuItem value="google_smtp" sx={{ fontSize: 11 }}>
                Google SMTP
              </MenuItem>
            </Select>
          </FormControl>
          <Typography sx={{ fontSize: 9, color: "text.secondary", opacity: 0.8 }}>
            Uses Gmail SMTP with app password credentials.
          </Typography>
        </Box>
      </CollapsibleSection>

      <CollapsibleSection title="Sender & Auth" defaultOpen>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <ExpressionInput
            label="Sender (From)"
            value={(c.senderExpression as string) ?? ""}
            onChange={(value) => set("senderExpression", value)}
            placeholder={'"noreply@company.com"'}
            availableContext={availableContext}
            availableSecrets={availableSecrets}
            hint="Use static string or FEEL expression"
          />

          <ExpressionInput
            label="SMTP Username"
            value={(c.authUserExpression as string) ?? ""}
            onChange={(value) => set("authUserExpression", value)}
            placeholder="secret.SMTP_USER"
            availableContext={availableContext}
            availableSecrets={availableSecrets}
          />

          <ExpressionInput
            label="SMTP App Password"
            value={(c.authPassExpression as string) ?? ""}
            onChange={(value) => set("authPassExpression", value)}
            placeholder="secret.SMTP_APP_PASSWORD"
            availableContext={availableContext}
            availableSecrets={availableSecrets}
          />
        </Box>
      </CollapsibleSection>

      {renderRecipientSection(
        "to",
        "To Recipients",
        toRows,
        '"approver@company.com" or context.requesterEmail',
      )}

      {renderRecipientSection(
        "cc",
        "Cc Recipients",
        ccRows,
        '"manager@company.com"',
      )}

      {renderRecipientSection(
        "bcc",
        "Bcc Recipients",
        bccRows,
        '"audit@company.com"',
      )}

      <CollapsibleSection title="Message" defaultOpen>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <ExpressionInput
            label="Subject"
            value={(c.subjectExpression as string) ?? ""}
            onChange={(value) => set("subjectExpression", value)}
            placeholder={'"Approval required for request " + context.requestId'}
            availableContext={availableContext}
            availableSecrets={availableSecrets}
          />

          <ExpressionInput
            label="Body"
            multiline
            value={(c.bodyExpression as string) ?? ""}
            onChange={(value) => set("bodyExpression", value)}
            placeholder={'"Hello " + context.requesterName + ", your request is pending approval."'}
            availableContext={availableContext}
            availableSecrets={availableSecrets}
          />
        </Box>
      </CollapsibleSection>

      <CollapsibleSection title="Retry & Failure Policy" defaultOpen>
        <Box display="flex" flexDirection="column" gap={0.75}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Max Attempts
            </Typography>
            <Box sx={{ width: 100 }}>
              <NumberInput
                value={(c.maxAttempts as number) ?? 1}
                onChange={(value) => set("maxAttempts", value ?? 1)}
                min={1}
                allowEmpty={false}
              />
            </Box>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Retry Delay
            </Typography>
            <Box display="flex" gap={0.5} sx={{ width: 140 }}>
              <NumberInput
                value={backoff.delay}
                onChange={(value) => setBackoff({ delay: value ?? 1 })}
                min={1}
                allowEmpty={false}
              />
              <Box display="flex" gap={0.25}>
                {(["millisecond", "second", "minute"] as const).map((unit) => (
                  <Button
                    key={unit}
                    size="small"
                    onClick={() => setBackoff({ unit })}
                    title={unit}
                    sx={{
                      fontSize: 8,
                      height: 22,
                      borderRadius: "4px",
                      minWidth: 30,
                      px: 0.5,
                      fontWeight: 600,
                      textTransform: "none",
                      backgroundColor:
                        backoff.unit === unit ? "action.selected" : "transparent",
                      color:
                        backoff.unit === unit ? "text.primary" : "text.disabled",
                      border: "1px solid",
                      borderColor:
                        backoff.unit === unit ? "action.focus" : "divider",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    {unit === "millisecond" ? "ms" : unit === "second" ? "s" : "m"}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Backoff Type
            </Typography>
            <Box display="flex" gap={0.5}>
              {(["fixed", "exponential"] as const).map((type) => (
                <Button
                  key={type}
                  size="small"
                  onClick={() => setBackoff({ type })}
                  sx={{
                    fontSize: 9,
                    height: 22,
                    borderRadius: "5px",
                    minWidth: 0,
                    px: 0.75,
                    fontWeight: 700,
                    textTransform: "none",
                    backgroundColor:
                      backoff.type === type ? "action.selected" : "transparent",
                    color:
                      backoff.type === type ? "text.primary" : "text.disabled",
                    border: "1px solid",
                    borderColor:
                      backoff.type === type ? "action.focus" : "divider",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  {type}
                </Button>
              ))}
            </Box>
          </Box>

          <Box display="flex" flexDirection="column" gap={0.5}>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              On Send Failure
            </Typography>
            <Box display="flex" gap={0.5}>
              <Button
                size="small"
                onClick={() => set("failurePolicy", "fail")}
                sx={{
                  fontSize: 9,
                  height: 24,
                  borderRadius: "5px",
                  textTransform: "none",
                  flex: 1,
                  backgroundColor:
                    failurePolicy === "fail" ? "rgba(239,68,68,0.15)" : "transparent",
                  color: failurePolicy === "fail" ? "#ef4444" : "text.disabled",
                  border: "1px solid",
                  borderColor:
                    failurePolicy === "fail" ? "rgba(239,68,68,0.45)" : "divider",
                }}
              >
                Fail Task
              </Button>
              <Button
                size="small"
                onClick={() => set("failurePolicy", "continue")}
                sx={{
                  fontSize: 9,
                  height: 24,
                  borderRadius: "5px",
                  textTransform: "none",
                  flex: 1,
                  backgroundColor:
                    failurePolicy === "continue"
                      ? "rgba(34,197,94,0.15)"
                      : "transparent",
                  color:
                    failurePolicy === "continue" ? "#22c55e" : "text.disabled",
                  border: "1px solid",
                  borderColor:
                    failurePolicy === "continue"
                      ? "rgba(34,197,94,0.45)"
                      : "divider",
                }}
              >
                Continue Workflow
              </Button>
            </Box>
          </Box>
        </Box>
      </CollapsibleSection>

      <CollapsibleSection
        title="Response Map"
        count={(c.responseMap as ResponseMapRow[])?.length ?? 0}
      >
        <ResponseMapSection
          rows={(c.responseMap as ResponseMapRow[]) ?? []}
          onChange={(rows) => set("responseMap", rows)}
          hint="Map email execution metadata to context (e.g., messageId, status)"
        />
      </CollapsibleSection>
    </Box>
  );
}
