import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { VersionIncrementType } from '../../../../api/schemas';

interface NavigationBlocker {
  state: string;
  reset?: () => void;
  proceed?: () => void;
}

interface BuilderDialogsProps {
  clearConfirmOpen: boolean;
  onCloseClearConfirm: () => void;
  onConfirmClear: () => void;

  commitConfirmOpen: boolean;
  onCloseCommitConfirm: () => void;
  onConfirmCommit: () => void;
  committing: boolean;
  commitActionMode: "commit" | "commitAndActivate";
  releaseIncrementType: VersionIncrementType;
  onReleaseIncrementTypeChange: (value: VersionIncrementType) => void;

  activateConfirmOpen: boolean;
  onCloseActivateConfirm: () => void;
  onConfirmActivate: () => void;
  activating: boolean;

  deactivateConfirmOpen: boolean;
  onCloseDeactivateConfirm: () => void;
  onConfirmDeactivate: () => void;
  deactivating: boolean;

  cloneConfirmOpen: boolean;
  onCloseCloneConfirm: () => void;
  onConfirmClone: () => void;
  cloning: boolean;
  canCloneVersion: boolean;

  blocker: NavigationBlocker;
  onSaveAndLeave: () => Promise<unknown>;
  saving: boolean;

  savedVersionNumber: number | string | null;
}

export default function BuilderDialogs({
  clearConfirmOpen,
  onCloseClearConfirm,
  onConfirmClear,
  commitConfirmOpen,
  onCloseCommitConfirm,
  onConfirmCommit,
  committing,
  commitActionMode,
  releaseIncrementType,
  onReleaseIncrementTypeChange,
  activateConfirmOpen,
  onCloseActivateConfirm,
  onConfirmActivate,
  activating,
  deactivateConfirmOpen,
  onCloseDeactivateConfirm,
  onConfirmDeactivate,
  deactivating,
  cloneConfirmOpen,
  onCloseCloneConfirm,
  onConfirmClone,
  cloning,
  canCloneVersion,
  blocker,
  onSaveAndLeave,
  saving,
  savedVersionNumber,
}: BuilderDialogsProps) {
  return (
    <>
      <Dialog open={clearConfirmOpen} onClose={onCloseClearConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Clear Canvas?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            This will remove all nodes and edges, leaving only the Start node. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={onCloseClearConfirm} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            size="small"
            onClick={onConfirmClear}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', '&:hover': { backgroundColor: '#dc2626' } }}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={commitConfirmOpen} onClose={onCloseCommitConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          {commitActionMode === "commitAndActivate"
            ? `Commit & Activate`
            : `Commit`}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {commitActionMode === "commitAndActivate"
              ? `This will publish and immediately activate the draft`
              : `Locking draft marks it as ready for activation. The version can no longer be edited after committing.`}
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel id="increment-type-label">Version Bump</InputLabel>
            <Select
              labelId="increment-type-label"
              value={releaseIncrementType}
              label="Version Bump"
              onChange={(event) =>
                onReleaseIncrementTypeChange(
                  event.target.value as VersionIncrementType,
                )
              }
            >
              <MenuItem value="major">Major</MenuItem>
              <MenuItem value="minor">Minor</MenuItem>
              <MenuItem value="patch">Patch</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={onCloseCommitConfirm} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            size="small"
            disabled={committing}
            onClick={onConfirmCommit}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#f59e0b', color: '#fff', '&:hover': { backgroundColor: '#d97706' } }}
          >
            {committing ? (
              <CircularProgress size={14} sx={{ color: '#fff' }} />
            ) : commitActionMode === "commitAndActivate" ? (
              'Commit & Activate'
            ) : (
              'Commit'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activateConfirmOpen} onClose={onCloseActivateConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Activate 
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            This will make <strong>v{savedVersionNumber}</strong> the live version for this workflow. The currently active version (if any) will be archived.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={onCloseActivateConfirm} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            size="small"
            disabled={activating}
            onClick={onConfirmActivate}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#22c55e', color: '#fff', '&:hover': { backgroundColor: '#16a34a' } }}
          >
            {activating ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Activate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deactivateConfirmOpen} onClose={onCloseDeactivateConfirm} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Deactivate v{savedVersionNumber}?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            This will move <strong>v{savedVersionNumber}</strong> back to Committed status. It will no longer be the live version and no new instances can be started until another version is activated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={onCloseDeactivateConfirm} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained"
            size="small"
            disabled={deactivating}
            onClick={onConfirmDeactivate}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', '&:hover': { backgroundColor: '#dc2626' } }}
          >
            {deactivating ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Deactivate'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cloneConfirmOpen}
        onClose={() => {
          if (!cloning) {
            onCloseCloneConfirm();
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Clone v{savedVersionNumber}?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            This will create a new draft copy of this version so you can edit it safely without changing the original.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            onClick={onCloseCloneConfirm}
            disabled={cloning}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={cloning || !canCloneVersion}
            onClick={onConfirmClone}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#3b82f6', color: '#fff', '&:hover': { backgroundColor: '#2563eb' } }}
          >
            {cloning ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Clone'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Unsaved Changes
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            You have unsaved changes. Save your draft before leaving, or your work will be lost.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => blocker.reset?.()} sx={{ color: 'text.secondary' }}>Stay</Button>
          <Button size="small" onClick={() => blocker.proceed?.()} sx={{ color: '#ef4444' }}>Leave without saving</Button>
          <Button
            variant="contained"
            size="small"
            disabled={saving}
            onClick={async () => {
              const saved = await onSaveAndLeave();
              if (saved) {
                blocker.proceed?.();
              }
            }}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={14} /> : 'Save & Leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
