import {
  Box,
  Typography,
  IconButton,
  FormControl,
  MenuItem,
  Select,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpressionInput from "../shared/ExpressionInput";
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

type RecipientField = "to" | "cc" | "bcc";

interface Props {
  node: CanvasNode;
  availableContext: AvailableCtxVar[];
  availableSecrets?: AvailableCtxVar[];
  onUpdateConfig: (c: Record<string, unknown>) => void;
}

function getRows(
  config: Record<string, unknown>,
  field: RecipientField,
): RecipientRow[] {
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
  const set = (key: string, val: unknown) =>
    onUpdateConfig({ ...c, [key]: val });

  const toRows = getRows(c, "to");
  const ccRows = getRows(c, "cc");
  const bccRows = getRows(c, "bcc");

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
          <Typography
            sx={{ fontSize: 9, color: "text.secondary", opacity: 0.8 }}
          >
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
            placeholder={
              '"Hello " + context.requesterName + ", your request is pending approval."'
            }
            availableContext={availableContext}
            availableSecrets={availableSecrets}
          />
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
