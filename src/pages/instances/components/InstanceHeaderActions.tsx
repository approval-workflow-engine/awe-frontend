import {
  Box,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SecurityIcon from "@mui/icons-material/Security";

interface InstanceHeaderActionsProps {
  loading: boolean;
  canPause: boolean;
  canResume: boolean;
  canTerminate: boolean;
  onReload: () => void;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onTerminate: () => Promise<void>;
  onViewAudit?: () => void;
}

export default function InstanceHeaderActions({
  loading,
  canPause,
  canResume,
  canTerminate,
  onReload,
  onPause,
  onResume,
  onTerminate,
  onViewAudit,
}: InstanceHeaderActionsProps) {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title="Reload">
        <IconButton
          size="small"
          onClick={onReload}
          disabled={loading}
          sx={{ color: "text.secondary" }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {onViewAudit && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<SecurityIcon />}
          onClick={onViewAudit}
          disabled={loading}
        >
          View Audit
        </Button>
      )}

      {canPause && (
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={14} /> : <PauseIcon />}
          onClick={onPause}
          disabled={loading}
        >
          Pause
        </Button>
      )}

      {canResume && (
        <Button
          variant="contained"
          size="small"
          startIcon={
            loading ? <CircularProgress size={14} /> : <PlayArrowIcon />
          }
          onClick={onResume}
          disabled={loading}
        >
          Resume Instance
        </Button>
      )}

      {canTerminate && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={
            loading ? (
              <CircularProgress size={14} />
            ) : (
              <StopCircleOutlinedIcon />
            )
          }
          onClick={onTerminate}
          disabled={loading}
        >
          Terminate
        </Button>
      )}
    </Box>
  );
}
