import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Snackbar,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EditIcon from "@mui/icons-material/Edit";
import Editor from "@monaco-editor/react";
import { type CanvasNode } from "../type/types";

const MIN_HEIGHT = 200;
const MAX_HEIGHT = 600;

interface ScriptTaskEditorPanelProps {
  node: CanvasNode;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

export default function ScriptTaskEditorPanel({
  node,
  onUpdateConfig,
  onClose,
  isReadOnly = false,
}: ScriptTaskEditorPanelProps) {
  const theme = useTheme();
  const [panelHeight, setPanelHeight] = useState(300);
  const [validateSnack, setValidateSnack] = useState(false);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const functionName =
    (node.config.entryFunctionName as string) ||
    (node.config.mainFunction as string) ||
    "main";
  const paramRows =
    (node.config.parameterMap as Array<{ name?: string; key?: string }>) ?? [];
  const params = paramRows.map((p) => p.name || p.key || "").filter(Boolean);
  const signature = `def ${functionName}(${params.join(", ")}):`;

  useEffect(() => {
    if (!node.config.sourceCode) {
      onUpdateConfig({
        ...node.config,
        sourceCode: `\t# code here\n`,
      });
    }
  }, [node.config, node.id, onUpdateConfig]);

  const handleDragHandleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragRef.current = { startY: e.clientY, startH: panelHeight };
    },
    [panelHeight],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - e.clientY;
      const newH = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, dragRef.current.startH + delta),
      );
      setPanelHeight(newH);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const sourceCode = (node.config.sourceCode as string) ?? "";
  const codeMode = (node.config.codeMode as string) || "editor";
  const attachedFileName = node.config.attachedFileName as string | undefined;
  const fileCodeOriginal = node.config.fileCodeOriginal as string | undefined;
  const isEdited = !!(
    attachedFileName &&
    fileCodeOriginal !== undefined &&
    sourceCode !== fileCodeOriginal
  );

  return (
    <Box
      sx={{
        height: panelHeight,
        flexShrink: 0,
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        onMouseDown={handleDragHandleMouseDown}
        sx={{
          height: 6,
          flexShrink: 0,
          cursor: "ns-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
          borderBottom: "1px solid",
          borderColor: "divider",
          "&:hover": { backgroundColor: "action.hover" },
        }}
      >
        <DragHandleIcon sx={{ fontSize: 12, color: "text.disabled" }} />
      </Box>

      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "background.paper",
        }}
      >
        <Chip
          label="Python 3"
          size="small"
          sx={{
            fontSize: 10,
            height: 20,
            fontFamily: "'JetBrains Mono', monospace",
            backgroundColor: "rgba(59,130,246,0.1)",
            color: "#3b82f6",
            border: "1px solid rgba(59,130,246,0.25)",
          }}
        />
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: "text.primary",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.label}
        </Typography>

        {!isReadOnly && (
          <Button
            size="small"
            startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 13 }} />}
            onClick={() => setValidateSnack(true)}
            sx={{
              fontSize: 11,
              height: 26,
              borderRadius: "6px",
              color: "text.secondary",
              borderColor: "divider",
              "&:hover": { borderColor: "text.secondary", color: "text.primary" },
            }}
            variant="outlined"
          >
            Validate
          </Button>
        )}

        {isReadOnly && (
          <Chip
            label="Read Only"
            size="small"
            sx={{
              fontSize: 10,
              height: 22,
              fontFamily: "'JetBrains Mono', monospace",
              backgroundColor: "rgba(156,163,175,0.1)",
              color: "#6b7280",
              border: "1px solid rgba(156,163,175,0.25)",
            }}
          />
        )}

        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "text.disabled", p: 0.25 }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {codeMode === "file" && attachedFileName && (
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            flexShrink: 0,
            backgroundColor: "rgba(245,158,11,0.04)",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 0.75,
          }}
        >
          <AttachFileIcon sx={{ fontSize: 12, color: "text.disabled" }} />
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: "text.secondary",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {attachedFileName}
          </Typography>
          {isEdited && (
            <Chip
              icon={<EditIcon sx={{ fontSize: 9 }} />}
              label="Edited"
              size="small"
              sx={{
                fontSize: 8,
                height: 16,
                backgroundColor: "rgba(245,158,11,0.12)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.3)",
                "& .MuiChip-label": { px: 0.5 },
              }}
            />
          )}
        </Box>
      )}

      <Box
        sx={{
          px: 1.5,
          py: 0.5,
          flexShrink: 0,
          backgroundColor: "action.hover",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1,
          userSelect: "none",
        }}
      >
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: "text.disabled",
            lineHeight: 1.5,
            flex: 1,
            pl: 6,
          }}
        >
          {signature}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <Editor
          height="100%"
          language="python"
          theme={theme.palette.mode === "dark" ? "vs-dark" : "vs"}
          value={sourceCode}
          onChange={(value) =>
            onUpdateConfig({ ...node.config, sourceCode: value ?? "" })
          }
          options={{
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            wordWrap: "on",
            automaticLayout: true,
            padding: { top: 0, bottom: 8 },
            tabSize: 4,
            readOnly: isReadOnly,
          }}
        />
      </Box>

      <Snackbar
        open={validateSnack}
        autoHideDuration={3000}
        onClose={() => setValidateSnack(false)}
        message="Backend validation not yet connected."
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
