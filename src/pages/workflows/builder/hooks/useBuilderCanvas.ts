import { useState, useCallback, useRef, useEffect } from "react";
import { useBlocker } from "react-router-dom";
import type { CanvasNode, CanvasEdge, SelectedItem, WorkflowInput } from "../type/types";
import { buildStartNode } from "../utils/nodeHelpers";

interface UseBuilderCanvasReturn {
  nodes: CanvasNode[];
  setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
  edges: CanvasEdge[];
  setEdges: React.Dispatch<React.SetStateAction<CanvasEdge[]>>;
  inputs: WorkflowInput[];
  setInputs: React.Dispatch<React.SetStateAction<WorkflowInput[]>>;
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
}

export function useBuilderCanvas(): UseBuilderCanvasReturn {
  const [nodes, setNodes] = useState<CanvasNode[]>([buildStartNode()]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [inputs, setInputs] = useState<WorkflowInput[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; portId: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const markDirtyEnabled = useRef(false);

  const markDirty = useCallback(() => {
    if (markDirtyEnabled.current) {
      setIsDirty(true);
    }
  }, []);

  const setMarkDirtyEnabled = useCallback((enabled: boolean) => {
    markDirtyEnabled.current = enabled;
  }, []);

  const blocker = useBlocker(isDirty);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleUpdateNode = useCallback(
    (id: string, updates: Partial<CanvasNode>) => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
      markDirty();
    },
    [markDirty],
  );

  const handleAddNode = useCallback(
    (node: CanvasNode) => {
      setNodes((prev) => [...prev, node]);
      markDirty();
    },
    [markDirty],
  );

  const handleAddEdge = useCallback(
    (edge: CanvasEdge) => {
      setEdges((prev) => [...prev, edge]);
      markDirty();
    },
    [markDirty],
  );

  const handleUpdateEdge = useCallback(
    (id: string, updates: Partial<CanvasEdge>) => {
      setEdges((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
      markDirty();
    },
    [markDirty],
  );

  const handleDeleteEdge = useCallback(
    (id: string) => {
      setEdges((prev) => prev.filter((e) => e.id !== id));
      markDirty();
    },
    [markDirty],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedItem) return;
    if (selectedItem.type === "node") {
      setNodes((prev) => {
        if (prev.find((n) => n.id === selectedItem.id)?.type === "start") return prev;
        return prev.filter((n) => n.id !== selectedItem.id);
      });
      setEdges((prev) =>
        prev.filter((e) => e.source !== selectedItem.id && e.target !== selectedItem.id),
      );
    } else {
      setEdges((prev) => prev.filter((e) => e.id !== selectedItem.id));
    }
    setSelectedItem(null);
    markDirty();
  }, [selectedItem, markDirty]);

  const handleClearCanvas = useCallback(
    (onClear?: () => void) => {
      setNodes([buildStartNode()]);
      setEdges([]);
      setInputs([]);
      setSelectedItem(null);
      markDirty();
      onClear?.();
    },
    [markDirty],
  );

  return {
    nodes, setNodes,
    edges, setEdges,
    inputs, setInputs,
    selectedItem, setSelectedItem,
    connectingFrom, setConnectingFrom,
    isDirty, setIsDirty,
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
  };
}

