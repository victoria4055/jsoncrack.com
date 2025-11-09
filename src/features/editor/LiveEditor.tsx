import React from "react";
import { useSessionStorage } from "@mantine/hooks";
import styled from "styled-components";
import { ViewMode } from "../../enums/viewMode.enum";
import { GraphView } from "./views/GraphView";
import { TreeView } from "./views/TreeView";
import { useMemo } from "react";

import {useEffect, useState } from "react";
import useJson from "../../store/useJson";
import useGraph from "./views/GraphView/stores/useGraph";

const StyledLiveEditor = styled.div`
  position: relative;
  height: 100%;
  background: ${({ theme }) => theme.GRID_BG_COLOR};
  overflow: auto;
  cursor: url("/assets/cursor.svg"), auto;

  & > ul {
    margin-top: 0 !important;
    padding: 12px !important;
    font-family: monospace;
    font-size: 14px;
    font-weight: 500;
  }

  .tab-group {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
  }
`;

const NodeEditPanel: React.FC = () => {
  const selectedNode = useGraph((state) => state.selectedNode);
  const jsonText = useJson((state) => state.getJson());
  const setJson = useJson((state) => state.setJson);
  const clearSelected = () => useGraph.setState({ selectedNode: null });

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");

  let path: (string | number)[] | null = null;
  const node = selectedNode ?? null;

  if (node && Array.isArray(node.path)) {
    path = node.path;
  }

  // Ensure useMemo is always called
  const currentValue = useMemo(() => {
    if (!path || !jsonText) return undefined; // Handle invalid path or jsonText
    try {
      const obj = JSON.parse(jsonText || "{}");
      let temp: any = obj;
      for (let i = 0; i < path.length; i++) {
        const k: any = path[i];
        if (temp == null || !(k in temp)) {
          return undefined;
        }
        temp = temp[k];
      }
      return temp;
    } catch {
      return undefined;
    }
  }, [jsonText, path]);

  useEffect(() => {
    setIsEditing(false);
    if (currentValue === undefined || currentValue === null) {
      setDraft("");
    } else if (typeof currentValue === "object") {
      setDraft(JSON.stringify(currentValue, null, 2));
    } else {
      setDraft(String(currentValue));
    }
  }, [selectedNode, jsonText, currentValue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearSelected();
        setIsEditing(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelected]);

  function handleSave() {
    try {
      let next: any = draft;
      try {
        next = JSON.parse(draft);
      } catch {
        next = draft;
      }
      const obj = JSON.parse(jsonText || "{}");
      let temp: any = obj;
      for (let i = 0; i < path!.length - 1; i++) {
        const k: any = path![i];
        if (!(k in temp)) {
          return;
        }
        temp = temp[k];
      }

      const lastKey: any = path![path!.length - 1];
      temp[lastKey] = next;

      setJson(JSON.stringify(obj, null, 2));
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  }

  function handleCancel() {
    setIsEditing(false);
    if (currentValue === undefined || currentValue === null) {
      setDraft("");
    } else if (typeof currentValue === "object") {
      setDraft(JSON.stringify(currentValue, null, 2));
    } else {
      setDraft(String(currentValue));
    }
  }

  if (!selectedNode || !path) {
    return <div>No node selected</div>; // Render fallback UI
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "20px", // Add spacing from the top
        right: "20px", // Add spacing from the right
        width: "350px", // Adjust width for better readability
        height: "auto", // Let the height adjust dynamically
        maxHeight: "90%", // Prevent the panel from overflowing the viewport
        backgroundColor: "#ffffff", // Use a solid white background
        border: "1px solid #ccc", // Add a border for better visibility
        borderRadius: "8px", // Add rounded corners
        padding: "15px", // Increase padding for better spacing
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Add a subtle shadow for depth
        boxSizing: "border-box",
        overflowY: "auto",
        zIndex: 10,
      }}
    >
    <button
      aria-label="Close"
    onClick={() => { clearSelected(); setIsEditing(false); }}
    style={{
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    border: "none",
    borderRadius: 4,
    background: "transparent",
    fontSize: 18,
    lineHeight: 1,
    color: "#333",
    cursor: "pointer",
  }}
  >
    ×
  </button>
  <h3 style={{ 
    color: "#000", 
    fontWeight: "700", 
    fontSize: "18px", 
    marginTop: "0", 
    marginBottom: "10px" 
  }}>
    Node Editor
  </h3>
      <div>
      <strong style={{ color: "#111" }}>Path:</strong> {path.map((p) => `[${p}]`).join("")}
      </div>
      <div style={{ marginTop: "10px" }}>
      <strong style={{ color: "#111" }}>Value:</strong>
        {isEditing ? (
          <>
            <textarea
              style={{ width: "100%",
                height: "150px",
                marginTop: "5px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "8px",
                fontSize: "14px",
                fontFamily: "monospace", }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div style={{marginTop: "10px", display: "flex", gap: "10px" }}>
            <button
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#007BFF",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={handleSave}
            >
              Save
            </button>
            <button
              style={{
                padding: "8px 12px",
                fontSize: "14px",
                border: "none",
                borderRadius: "4px",
                backgroundColor: "#6c757d",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={handleCancel}
            >
              Cancel
            </button>
            </div>
          </>
        ) : (
          <>
            <pre
              style={{
                width: "100%",
                height: "150px",
                marginTop: "5px",
                backgroundColor: "#f0f0f0",
                padding: "5px",
                overflow: "auto",
              }}
            >
              {currentValue === undefined
                ? "undefined"
                : currentValue === null
                ? "null"
                : typeof currentValue === "object"
                ? JSON.stringify(currentValue, null, 2)
                : String(currentValue)}
            </pre>
            <button
            style={{
              marginTop: "10px",
              padding: "8px 12px",
              fontSize: "14px",
              border: "none",
              borderRadius: "4px",
              backgroundColor: "#007BFF",
              color: "#fff",
              cursor: "pointer",
            }}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          </>
        )}
      </div>
    </div>
  );
};

const View = () => {
  const [viewMode] = useSessionStorage({
    key: "viewMode",
    defaultValue: ViewMode.Graph,
  });

  if (viewMode === ViewMode.Graph) return <GraphView />;
  if (viewMode === ViewMode.Tree) return <TreeView />;
  return null;
};

const LiveEditor = () => {
  return (
    <StyledLiveEditor onContextMenuCapture={e => e.preventDefault()}>
      <View />
      <NodeEditPanel />
    </StyledLiveEditor>
  );
};

export default LiveEditor;
