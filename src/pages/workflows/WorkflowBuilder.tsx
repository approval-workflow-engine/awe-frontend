import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import {
  Box, Typography, IconButton, Button, Chip, CircularProgress,
  Popover, List, ListItem, Tooltip, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import DeleteIcon from '@mui/icons-material/Delete';
import LayersClearIcon from '@mui/icons-material/LayersClear';

import { getWorkflow, getWorkflowVersion, validateWorkflowDefinition, createWorkflowVersion, publishVersion } from '../../api/workflowApi';
import { useApiCall } from '../../hooks/useApiCall';
import NodePalette from './builder/NodePalette';
import CanvasPanel from './builder/CanvasPanel';
import ConfigPanel from './builder/ConfigPanel';
import InputsDialog from './builder/InputsDialog';
import ContextVarsPanel from './builder/ContextVarsPanel';
import ScriptTaskEditorPanel from './builder/ScriptTaskEditorPanel';
import { type CanvasNode, type CanvasEdge, type WorkflowInput, type SelectedItem, buildStartNode, canvasToDefinition, definitionToCanvas } from './builder/builderTypes';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export default function WorkflowBuilder() {
  const { workflowId, versionNumber } = useParams<{ workflowId: string; versionNumber?: string }>();
  const navigate = useNavigate();
  const { call } = useApiCall();

  //  Data
  const [workflowName, setWorkflowName] = useState('');
  const [nodes, setNodes] = useState<CanvasNode[]>([buildStartNode()]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [inputs, setInputs] = useState<WorkflowInput[]>([]);
  const [loadedVersionNumber, setLoadedVersionNumber] = useState<number | null>(null);
  const [savedVersionNumber, setSavedVersionNumber] = useState<number | null>(null);

  //  UI state
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; portId: string } | null>(null);
  const [inputsOpen, setInputsOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validateAnchor, setValidateAnchor] = useState<HTMLButtonElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  //  Unsaved-changes tracking
  const [isDirty, setIsDirty] = useState(false);

  // Prevents the initial load from being treated as a user change
  const markDirtyEnabled = useRef(false);
  const markDirty = useCallback(() => {
    if (markDirtyEnabled.current) setIsDirty(true);
  }, []);

  // Block in-app navigation when there are unsaved changes
  const blocker = useBlocker(isDirty);

  // Block tab close / refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  //  Load data
  useEffect(() => {
    if (!workflowId) return;
    markDirtyEnabled.current = false;
    (async () => {
      // Load workflow name
      const wfRes = await call(() => getWorkflow(workflowId), { showError: false });
      if (wfRes) {
        const body = wfRes as { data?: { name?: string; id?: string } };
        setWorkflowName(body?.data?.name || 'Workflow');
      }

      // Load specific version if provided
      if (versionNumber) {
        const vRes = await call(
          () => getWorkflowVersion(workflowId, Number(versionNumber)),
          { showError: false }
        );
        if (vRes) {
          const body = vRes as { data?: Record<string, unknown> };
          const vData = body?.data as Record<string, unknown> | undefined;
          if (vData) {
            const { nodes: n, edges: e, inputs: i } = definitionToCanvas(vData as Parameters<typeof definitionToCanvas>[0]);
            setNodes(n.length > 0 ? n : [buildStartNode()]);
            setEdges(e);
            setInputs(i);
            setLoadedVersionNumber((vData.versionNumber as number) || Number(versionNumber));
            setSavedVersionNumber((vData.versionNumber as number) || Number(versionNumber));
          }
        }
      }

      // Enable dirty tracking now that initial state is loaded
      markDirtyEnabled.current = true;
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, versionNumber]);

  //  Canvas actions
  const handleUpdateNode = useCallback((id: string, updates: Partial<CanvasNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    markDirty();
  }, [markDirty]);

  const handleAddNode = useCallback((node: CanvasNode) => {
    setNodes(prev => [...prev, node]);
    markDirty();
  }, [markDirty]);

  const handleAddEdge = useCallback((edge: CanvasEdge) => {
    setEdges(prev => [...prev, edge]);
    markDirty();
  }, [markDirty]);

  const handleUpdateEdge = useCallback((id: string, updates: Partial<CanvasEdge>) => {
    setEdges(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    markDirty();
  }, [markDirty]);

  const handleDeleteEdge = useCallback((id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    markDirty();
  }, [markDirty]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItem.type === 'node') {
      if (selectedItem.id === 'start_1') return; // Cannot delete start
      setNodes(prev => prev.filter(n => n.id !== selectedItem.id));
      setEdges(prev => prev.filter(e => e.source !== selectedItem.id && e.target !== selectedItem.id));
    } else {
      setEdges(prev => prev.filter(e => e.id !== selectedItem.id));
    }
    setSelectedItem(null);
    markDirty();
  }, [selectedItem, markDirty]);

  const handleClearCanvas = useCallback(() => {
    setNodes([buildStartNode()]);
    setEdges([]);
    setSelectedItem(null);
    setCodeEditorOpen(false);
    markDirty();
    setClearConfirmOpen(false);
  }, [markDirty]);

  // Keyboard Delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === 'Delete' && selectedItem) handleDeleteSelected();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectedItem, handleDeleteSelected]);

  // Close code editor when selected node is no longer a script_task
  useEffect(() => {
    const node = nodes.find(n => n.id === selectedItem?.id);
    if (codeEditorOpen && (!node || node.type !== 'script_task')) {
      setCodeEditorOpen(false);
    }
  }, [selectedItem, nodes, codeEditorOpen]);

  //  Toolbar actions
  const handleValidate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!workflowId) return;
    setValidating(true);
    setValidationResult(null);
    const def = canvasToDefinition(nodes, edges, inputs);
    console.log(JSON.stringify(def))
    const res = await call(() => validateWorkflowDefinition(def), { showError: false });
    if (res) {
      const body = res as { data?: ValidationResult };
      setValidationResult(body?.data || null);
      setValidateAnchor(e.currentTarget);
    } else {
      setValidationResult({ valid: false, errors: ['Validation request failed'] });
      setValidateAnchor(e.currentTarget);
    }
    setValidating(false);
  };

  const handleSaveDraft = async () => {
    if (!workflowId) return;
    setSaving(true);
    const def = canvasToDefinition(nodes, edges, inputs);
    const res = await call(
      () => createWorkflowVersion(workflowId, def),
      { successMsg: 'Draft saved.', showError: true }
    );
    if (res) {
      const body = res as { data?: { versionNumber?: number; id?: string } };
      const vn = body?.data?.versionNumber || null;
      setSavedVersionNumber(vn);
      setIsDirty(false);
    }
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!workflowId || !savedVersionNumber) return;
    setPublishing(true);
    await call(
      () => publishVersion(workflowId, savedVersionNumber),
      { successMsg: `Version v${savedVersionNumber} published.`, showError: true }
    );
    setPublishing(false);
    setPublishConfirmOpen(false);
    navigate(`/workflows/${workflowId}/versions`);
  };

  //  Derived values
  const versionLabel = loadedVersionNumber
    ? `v${loadedVersionNumber}`
    : savedVersionNumber
    ? `v${savedVersionNumber} (draft)`
    : 'New Draft';

  const canDelete = selectedItem &&
    !(selectedItem.type === 'node' && selectedItem.id === 'start_1');

  const selectedScriptNode = nodes.find(n => n.id === selectedItem?.id && n.type === 'script_task') ?? null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'background.default', overflow: 'hidden' }}>
      {/*  Toolbar  */}
      <Box
        sx={{
          height: 48,
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          gap: 1.5,
        }}
      >
        {/* Left side */}
        <IconButton
          size="small"
          onClick={() => navigate(`/workflows/${workflowId}/versions`)}
          sx={{ color: 'text.secondary' }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>
          {workflowName || 'Builder'}
        </Typography>

        <Chip
          label={versionLabel}
          size="small"
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            height: 20,
            backgroundColor: 'rgba(79,110,247,0.15)',
            color: '#4f6ef7',
            borderRadius: '99px',
          }}
        />

        <Box sx={{ flex: 1 }} />

        {/* Delete selected */}
        {canDelete && (
          <Tooltip title={`Delete selected ${selectedItem?.type}`}>
            <IconButton size="small" onClick={handleDeleteSelected} sx={{ color: '#ef4444' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Divider orientation="vertical" flexItem sx={{ my: 'auto', height: 24, borderColor: 'divider' }} />

        {/* Inputs */}
        <Button
          size="small"
          startIcon={<SettingsInputComponentIcon sx={{ fontSize: 14 }} />}
          onClick={() => setInputsOpen(true)}
          sx={{ fontSize: 12, color: 'text.secondary', borderColor: 'divider', height: 30, borderRadius: '8px' }}
          variant="outlined"
        >
          Inputs
        </Button>

        {/* Clear Canvas */}
        <Button
          size="small"
          startIcon={<LayersClearIcon sx={{ fontSize: 14 }} />}
          onClick={() => setClearConfirmOpen(true)}
          sx={{ fontSize: 12, color: 'text.secondary', borderColor: 'divider', height: 30, borderRadius: '8px' }}
          variant="outlined"
        >
          Clear
        </Button>

        {/* Validate */}
        <Button
          size="small"
          onClick={handleValidate}
          disabled={validating}
          startIcon={
            validating ? <CircularProgress size={12} /> :
            validationResult?.valid ? <CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e' }} /> :
            validationResult ? <ErrorIcon sx={{ fontSize: 14, color: '#ef4444' }} /> :
            undefined
          }
          sx={{
            fontSize: 12,
            height: 30,
            borderRadius: '8px',
            color: validationResult?.valid ? '#22c55e' : validationResult ? '#ef4444' : 'text.secondary',
            borderColor: validationResult?.valid ? '#22c55e' : validationResult ? '#ef4444' : 'divider',
          }}
          variant="outlined"
        >
          {validating ? 'Validating…' :
           validationResult?.valid ? 'Valid' :
           validationResult ? `${validationResult.errors.length} errors` :
           'Validate'}
        </Button>

        {/* Validate errors popover */}
        <Popover
          open={!!validateAnchor && !validationResult?.valid && !!validationResult}
          anchorEl={validateAnchor}
          onClose={() => setValidateAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { mt: 0.5, maxWidth: 360, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' } } }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#ef4444', mb: 1 }}>
              Validation Errors
            </Typography>
            <List disablePadding dense>
              {validationResult?.errors.map((err, i) => (
                <ListItem key={i} sx={{ px: 0, py: 0.25 }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.5 }}>
                    • {err}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        </Popover>

        {/* Save Draft */}
        <Button
          size="small"
          variant="outlined"
          disabled={saving}
          onClick={handleSaveDraft}
          startIcon={saving ? <CircularProgress size={12} /> : <SaveIcon sx={{ fontSize: 14 }} />}
          sx={{ fontSize: 12, height: 30, borderRadius: '8px', borderColor: 'divider', color: 'text.secondary' }}
        >
          Save Draft
        </Button>

        {/* Publish */}
        <Button
          size="small"
          variant="contained"
          disabled={publishing || !savedVersionNumber}
          onClick={() => setPublishConfirmOpen(true)}
          startIcon={publishing ? <CircularProgress size={12} /> : <PublishIcon sx={{ fontSize: 14 }} />}
          sx={{ fontSize: 12, height: 34, borderRadius: '8px', fontWeight: 700, backgroundColor: '#22c55e', color: '#12141c', '&:hover': { backgroundColor: '#16a34a' }, '&.Mui-disabled': { backgroundColor: '#22c55e33', color: '#22c55e66' } }}
        >
          Publish
        </Button>
      </Box>

      {/*  Three-panel layout + code editor  */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left sidebar */}
          <Box sx={{
            width: 200, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider',
            backgroundColor: 'background.default', display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <NodePalette />
            <Divider />
            <ContextVarsPanel nodes={nodes} inputs={inputs} />
          </Box>

          <CanvasPanel
            nodes={nodes}
            edges={edges}
            selectedItem={selectedItem}
            connectingFrom={connectingFrom}
            onUpdateNode={handleUpdateNode}
            onAddNode={handleAddNode}
            onAddEdge={handleAddEdge}
            onSelectItem={setSelectedItem}
            onStartConnect={(nodeId, portId) => {
              setSelectedItem(null);
              setConnectingFrom({ nodeId, portId });
            }}
            onCancelConnect={() => setConnectingFrom(null)}
          />

          {selectedItem && (
            <ConfigPanel
              selectedItem={selectedItem}
              nodes={nodes}
              edges={edges}
              inputs={inputs}
              onClose={() => setSelectedItem(null)}
              onUpdateNode={handleUpdateNode}
              onUpdateEdge={handleUpdateEdge}
              onDeleteEdge={handleDeleteEdge}
              onChangeInputs={newInputs => { setInputs(newInputs); markDirty(); }}
              onOpenCodeEditor={() => setCodeEditorOpen(true)}
            />
          )}
        </Box>

        {/* Script Task Code Editor Panel */}
        {codeEditorOpen && selectedScriptNode && (
          <ScriptTaskEditorPanel
            node={selectedScriptNode}
            onUpdateConfig={config => handleUpdateNode(selectedScriptNode.id, { config })}
            onClose={() => setCodeEditorOpen(false)}
          />
        )}
      </Box>

      {/*  Inputs Dialog  */}
      <InputsDialog
        open={inputsOpen}
        onClose={() => setInputsOpen(false)}
        inputs={inputs}
        onChange={newInputs => { setInputs(newInputs); markDirty(); }}
      />

      {/*  Clear Canvas Dialog  */}
      <Dialog open={clearConfirmOpen} onClose={() => setClearConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Clear Canvas?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            This will remove all nodes and edges, leaving only the Start node. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setClearConfirmOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleClearCanvas}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#ef4444', color: '#fff', '&:hover': { backgroundColor: '#dc2626' } }}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/*  Publish Confirm Dialog  */}
      <Dialog open={publishConfirmOpen} onClose={() => setPublishConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Publish v{savedVersionNumber}?
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            This will make <strong style={{ color: '#e8eaf2' }}>v{savedVersionNumber}</strong> the active version for this workflow.
            Any currently active version will be deprecated.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setPublishConfirmOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={publishing}
            onClick={handlePublish}
            sx={{ borderRadius: '8px', fontWeight: 600, backgroundColor: '#22c55e', color: '#12141c', '&:hover': { backgroundColor: '#16a34a' } }}
          >
            {publishing ? <CircularProgress size={14} /> : 'Publish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/*  Unsaved Changes Dialog  */}
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
          <Button size="small" onClick={() => blocker.reset?.()} sx={{ color: 'text.secondary' }}>
            Stay
          </Button>
          <Button size="small" onClick={() => blocker.proceed?.()} sx={{ color: '#ef4444' }}>
            Leave without saving
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={saving}
            onClick={async () => { await handleSaveDraft(); blocker.proceed?.(); }}
            sx={{ borderRadius: '8px', fontWeight: 600 }}
          >
            {saving ? <CircularProgress size={14} /> : 'Save & Leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
