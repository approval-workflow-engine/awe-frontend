import { useState, useCallback, useRef, useEffect } from "react";
import { useBlocker } from "react-router-dom";
import type { CanvasNode, CanvasEdge, SelectedItem, WorkflowInput } from "../type/types";
import { buildStartNode } from "../utils/nodeHelpers";

const HISTORY_LIMIT = 30;

type CanvasSnapshot = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
};

const cloneState = <T,>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

interface UseBuilderCanvasReturn {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  inputs: WorkflowInput[];
  selectedItem: SelectedItem;
  setSelectedItem: React.Dispatch<React.SetStateAction<SelectedItem>>;
  connectingFrom: { nodeId: string; portId: string } | null;
  setConnectingFrom: React.Dispatch<React.SetStateAction<{ nodeId: string; portId: string } | null>>;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  setMarkDirtyEnabled: (enabled: boolean) => void;
  markDirty: () => void;
  blocker: ReturnType<typeof useBlocker>;
  handleUpdateNode: (id: string, updates: Partial<CanvasNode>) => void;
  handleAddNode: (node: CanvasNode) => void;
  handleAddEdge: (edge: CanvasEdge) => void;
  handleUpdateEdge: (id: string, updates: Partial<CanvasEdge>) => void;
  handleDeleteEdge: (id: string) => void;
  handleDeleteSelected: () => void;
  handleClearCanvas: (onClear?: () => void) => void;
  replaceInputs: (nextInputs: WorkflowInput[]) => void;
  hydrateCanvas: (nextNodes: CanvasNode[], nextEdges: CanvasEdge[], nextInputs: WorkflowInput[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  beginHistoryBatch: () => void;
  endHistoryBatch: () => void;
  clearHistory: () => void;
}

export function useBuilderCanvas(): UseBuilderCanvasReturn {
  const [nodes, setNodes] = useState<CanvasNode[]>([buildStartNode()]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [inputs, setInputs] = useState<WorkflowInput[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; portId: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const markDirtyEnabled = useRef(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const historyRef = useRef<{ past: CanvasSnapshot[]; future: CanvasSnapshot[] }>({ past: [], future: [] });
  const historyReadyRef = useRef(false);
  const historyBatchRef = useRef(false);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const inputsRef = useRef(inputs);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { inputsRef.current = inputs; }, [inputs]);

  useEffect(() => {
    historyReadyRef.current = true;
  }, []);

  const blocker = useBlocker(isDirty);

  const markDirty = useCallback(() => {
    if (markDirtyEnabled.current) {
      setIsDirty(true);
    }
  }, []);

  const setMarkDirtyEnabled = useCallback((enabled: boolean) => {
    markDirtyEnabled.current = enabled;
  }, []);

  const createSnapshot = useCallback((): CanvasSnapshot => ({
    nodes: cloneState(nodesRef.current),
    edges: cloneState(edgesRef.current),
    inputs: cloneState(inputsRef.current),
  }), []);

  const pushSnapshot = useCallback(() => {
    const snapshot = createSnapshot();
    const nextPast = [...historyRef.current.past, snapshot].slice(-HISTORY_LIMIT);
    historyRef.current = { past: nextPast, future: [] };
    setCanUndo(nextPast.length > 0);
    setCanRedo(false);
  }, [createSnapshot]);

  const captureSnapshotOnMutation = useCallback(() => {
    if (!historyReadyRef.current || historyBatchRef.current) return;
    pushSnapshot();
  }, [pushSnapshot]);

  const beginHistoryBatch = useCallback(() => {
    if (!historyReadyRef.current) return;
    pushSnapshot();
    historyBatchRef.current = true;
  }, [pushSnapshot]);

  const endHistoryBatch = useCallback(() => {
    historyBatchRef.current = false;
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = { past: [], future: [] };
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const applySnapshot = useCallback((snapshot: CanvasSnapshot) => {
    historyReadyRef.current = false;
    historyBatchRef.current = false;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setInputs(snapshot.inputs);
    setSelectedItem(null);
    setConnectingFrom(null);
    setTimeout(() => {
      historyReadyRef.current = true;
    }, 0);
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.past.length === 0) return;
    const previous = historyRef.current.past[historyRef.current.past.length - 1];
    const current = createSnapshot();

    historyRef.current = {
      past: historyRef.current.past.slice(0, -1),
      future: [current, ...historyRef.current.future],
    };

    applySnapshot(previous);
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
    setIsDirty(true);
  }, [applySnapshot, createSnapshot]);

  const redo = useCallback(() => {
    if (historyRef.current.future.length === 0) return;
    const next = historyRef.current.future[0];
    const current = createSnapshot();

    historyRef.current = {
      past: [...historyRef.current.past, current].slice(-HISTORY_LIMIT),
      future: historyRef.current.future.slice(1),
    };

    applySnapshot(next);
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
    setIsDirty(true);
  }, [applySnapshot, createSnapshot]);

  const hydrateCanvas = useCallback((nextNodes: CanvasNode[], nextEdges: CanvasEdge[], nextInputs: WorkflowInput[]) => {
    historyReadyRef.current = false;
    historyBatchRef.current = false;
    setNodes(nextNodes.length > 0 ? nextNodes : [buildStartNode()]);
    setEdges(nextEdges);
    setInputs(nextInputs);
    setSelectedItem(null);
    setConnectingFrom(null);
    setIsDirty(false);
    historyRef.current = { past: [], future: [] };
    setCanUndo(false);
    setCanRedo(false);
    setTimeout(() => {
      historyReadyRef.current = true;
    }, 0);
  }, []);

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<CanvasNode>) => {
      captureSnapshotOnMutation();
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
      markDirty();
    },
    [captureSnapshotOnMutation, markDirty],
  );

  const handleAddNode = useCallback(
    (node: CanvasNode) => {
      captureSnapshotOnMutation();
      setNodes((prev) => [...prev, node]);
      markDirty();
    },
    [captureSnapshotOnMutation, markDirty],
  );

  const handleAddEdge = useCallback(
    (edge: CanvasEdge) => {
      captureSnapshotOnMutation();
      setEdges((prev) => [...prev, edge]);
      markDirty();
    },
    [captureSnapshotOnMutation, markDirty],
  );

  const handleUpdateEdge = useCallback(
    (id: string, updates: Partial<CanvasEdge>) => {
      captureSnapshotOnMutation();
      setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      markDirty();
    },
    [captureSnapshotOnMutation, markDirty],
  );

  const handleDeleteEdge = useCallback(
    (id: string) => {
      captureSnapshotOnMutation();
      setEdges((prev) => prev.filter((e) => e.id !== id));
      markDirty();
    },
    [captureSnapshotOnMutation, markDirty],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItem.type === "node") {
      const targetNode = nodesRef.current.find((n) => n.id === selectedItem.id);
      if (!targetNode || targetNode.type === "start") return;
    }

    captureSnapshotOnMutation();

    if (selectedItem.type === "node") {
      setNodes((prev) => prev.filter((n) => n.id !== selectedItem.id));
      setEdges((prev) =>
        prev.filter((e) => e.source !== selectedItem.id && e.target !== selectedItem.id),
      );
    } else {
      setEdges((prev) => prev.filter((e) => e.id !== selectedItem.id));
    }
    setSelectedItem(null);
    markDirty();
  }, [selectedItem, captureSnapshotOnMutation, markDirty]);

  const handleClearCanvas = useCallback(
    (onClear?: () => void) => {
      captureSnapshotOnMutation();
      historyBatchRef.current = false;
      setNodes([buildStartNode()]);
      setEdges([]);
      setInputs([]);
      setSelectedItem(null);
      markDirty();
      onClear?.();
    },
    [captureSnapshotOnMutation, markDirty],
  );

  const replaceInputs = useCallback((nextInputs: WorkflowInput[]) => {
    captureSnapshotOnMutation();
    setInputs(nextInputs);
    markDirty();
  }, [captureSnapshotOnMutation, markDirty]);

  return {
    nodes,
    edges,
    inputs,
    selectedItem,
    setSelectedItem,
    connectingFrom,
    setConnectingFrom,
    isDirty,
    setIsDirty,
    setMarkDirtyEnabled,
    markDirty,
    blocker,
    handleUpdateNode,
    handleAddNode,
    handleAddEdge,
    handleUpdateEdge,
    handleDeleteEdge,
    handleDeleteSelected,
    handleClearCanvas,
    replaceInputs,
    hydrateCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
    beginHistoryBatch,
    endHistoryBatch,
    clearHistory,
  };
}
