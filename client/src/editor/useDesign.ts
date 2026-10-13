import { useCallback, useEffect, useRef, useState } from "react";
import { loadProjects, saveProject, type Design } from "./model";
import { dashboardDesign } from "./templates";

export function useDesign() {
  const [design, setDesign] = useState<Design>(
    () => loadProjects()[0] || dashboardDesign()
  );
  const current = useRef(design);
  const history = useRef<Design[]>([design]);
  const cursor = useRef(0);
  const [revision, setRevision] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved"
  );
  const [ready, setReady] = useState(!location.hash.startsWith("#design="));
  const commit = useCallback(() => {
    if (
      JSON.stringify(current.current) ===
      JSON.stringify(history.current[cursor.current])
    )
      return;
    history.current = [
      ...history.current.slice(0, cursor.current + 1),
      current.current,
    ].slice(-100);
    cursor.current = history.current.length - 1;
    setRevision(n => n + 1);
  }, []);
  const change = useCallback(
    (fn: (d: Design) => Design, record = true) => {
      const next = { ...fn(current.current), updatedAt: Date.now() };
      current.current = next;
      setDesign(next);
      if (record) commit();
    },
    [commit]
  );
  const open = useCallback((d: Design) => {
    current.current = d;
    setDesign(d);
    history.current = [d];
    cursor.current = 0;
    setRevision(n => n + 1);
  }, []);
  const undo = useCallback(() => {
    if (cursor.current > 0) {
      cursor.current--;
      current.current = history.current[cursor.current];
      setDesign(current.current);
      setRevision(n => n + 1);
    }
  }, []);
  const redo = useCallback(() => {
    if (cursor.current < history.current.length - 1) {
      cursor.current++;
      current.current = history.current[cursor.current];
      setDesign(current.current);
      setRevision(n => n + 1);
    }
  }, []);
  useEffect(() => {
    if (!ready) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      try {
        saveProject(design);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [design, ready]);
  useEffect(() => {
    const flush = () => {
      if (ready)
        try {
          saveProject(current.current);
        } catch {
          /* 保留当前画布，使用导出文件备份 */
        }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [ready]);
  void revision;
  return {
    design,
    change,
    commit,
    open,
    undo,
    redo,
    canUndo: cursor.current > 0,
    canRedo: cursor.current < history.current.length - 1,
    saveStatus,
    ready,
    setReady,
  };
}
