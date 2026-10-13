import { useRef, type PointerEvent, type CSSProperties } from "react";
import { elementStyle, type Design, type DesignElement } from "./model";

export function ElementContent({ element: e }: { element: DesignElement }) {
  if (e.type === "image")
    return e.src ? (
      <img
        src={e.src}
        alt={e.name}
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          pointerEvents: "none",
        }}
      />
    ) : (
      <span className="image-placeholder">
        <span>{e.text || "图片占位"}</span>
      </span>
    );
  return <>{e.text}</>;
}
type Drag = {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  original: DesignElement;
  originals: DesignElement[];
  resize: string | null;
  capture: HTMLElement;
};
export default function Canvas({
  design,
  selected,
  select,
  update,
  commit,
  scale,
  preview,
  snap,
  reference,
}: {
  design: Design;
  selected: string[];
  select: (id: string | null, additive?: boolean) => void;
  update: (id: string, patch: Partial<DesignElement>) => void;
  commit: () => void;
  scale: number;
  preview: boolean;
  snap: boolean;
  reference: { src: string; opacity: number } | null;
}) {
  const drag = useRef<Drag | null>(null);
  const begin = (
    ev: PointerEvent<HTMLElement>,
    e: DesignElement,
    resize: string | null = null
  ) => {
    if (preview || e.locked || ev.button !== 0) return;
    ev.stopPropagation();
    ev.preventDefault();
    if (ev.shiftKey && !resize) {
      select(e.id, true);
      return;
    }
    const group =
      selected.includes(e.id) && !resize
        ? design.elements.filter(
            item => selected.includes(item.id) && !item.locked
          )
        : [e];
    if (!selected.includes(e.id)) select(e.id);
    ev.currentTarget.setPointerCapture(ev.pointerId);
    drag.current = {
      id: e.id,
      pointerId: ev.pointerId,
      startX: ev.clientX,
      startY: ev.clientY,
      original: { ...e },
      originals: group.map(item => ({ ...item })),
      resize,
      capture: ev.currentTarget,
    };
  };
  const move = (ev: PointerEvent<HTMLElement>) => {
    const g = drag.current;
    if (!g || g.pointerId !== ev.pointerId) return;
    const dx = (ev.clientX - g.startX) / scale,
      dy = (ev.clientY - g.startY) / scale;
    const round = (n: number) =>
      Math.round(n / (snap ? 8 : 1)) * (snap ? 8 : 1);
    if (!g.resize) {
      const gx = Math.max(...g.originals.map(item => -10000 - item.x));
      const mx = Math.min(...g.originals.map(item => 10000 - item.x));
      const gy = Math.max(...g.originals.map(item => -10000 - item.y));
      const my = Math.min(...g.originals.map(item => 10000 - item.y));
      const deltaX = Math.max(
        gx,
        Math.min(mx, round(g.original.x + dx) - g.original.x)
      );
      const deltaY = Math.max(
        gy,
        Math.min(my, round(g.original.y + dy) - g.original.y)
      );
      g.originals.forEach(item =>
        update(item.id, { x: item.x + deltaX, y: item.y + deltaY })
      );
    } else {
      const west = g.resize.includes("w"),
        north = g.resize.includes("n");
      const w = Math.max(
        8,
        Math.min(5000, round(g.original.width + (west ? -dx : dx)))
      );
      const h = Math.max(
        8,
        Math.min(5000, round(g.original.height + (north ? -dy : dy)))
      );
      update(g.id, {
        width: w,
        height: h,
        x: Math.max(
          -10000,
          Math.min(
            10000,
            west ? g.original.x + g.original.width - w : g.original.x
          )
        ),
        y: Math.max(
          -10000,
          Math.min(
            10000,
            north ? g.original.y + g.original.height - h : g.original.y
          )
        ),
      });
    }
  };
  const finish = () => {
    if (drag.current) {
      drag.current = null;
      commit();
    }
  };
  return (
    <div
      className="artboard-wrapper"
      style={{ width: design.width * scale, height: design.height * scale }}
    >
      {!preview && (
        <div className="artboard-label">
          <span>{design.name}</span>
          <span>
            {design.width} × {design.height}
          </span>
        </div>
      )}
      <div
        className={`artboard ${preview ? "is-preview" : ""}`}
        style={{
          width: design.width,
          height: design.height,
          background: design.background,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          overflow: preview ? "hidden" : undefined,
        }}
        onPointerDown={() => select(null)}
      >
        {reference && !preview && (
          <img
            className="reference-image"
            src={reference.src}
            alt="截图参考，不导出"
            style={{ opacity: reference.opacity / 100 }}
          />
        )}
        {design.elements
          .filter(e => !e.hidden)
          .map(e => (
            <div
              key={e.id}
              data-element={e.id}
              className={`design-element ${!preview && selected.includes(e.id) ? "selected-element" : ""} ${e.locked ? "locked-element" : ""}`}
              style={elementStyle(e)}
              onPointerDown={ev => begin(ev, e)}
              onPointerMove={move}
              onPointerUp={finish}
              onPointerCancel={finish}
              onLostPointerCapture={finish}
            >
              <ElementContent element={e} />
            </div>
          ))}
        {!preview &&
          design.elements
            .filter(e => selected.includes(e.id) && !e.hidden)
            .map(e => (
              <div
                key={`outline-${e.id}`}
                className="selection-outline"
                style={
                  {
                    left: e.x,
                    top: e.y,
                    width: e.width,
                    height: e.height,
                    "--handle-scale": 1 / scale,
                  } as CSSProperties
                }
              >
                <span className="selection-tag">{e.name}</span>
                {!e.locked &&
                  ["nw", "ne", "sw", "se"].map(c => (
                    <span
                      key={c}
                      aria-label={`调整 ${e.name} 尺寸 ${c}`}
                      role="button"
                      className={`resize-handle ${c}`}
                      onPointerDown={ev => begin(ev, e, c)}
                      onPointerMove={move}
                      onPointerUp={finish}
                      onPointerCancel={finish}
                      onLostPointerCapture={finish}
                    />
                  ))}
                <span className="selection-dimensions">
                  {Math.round(e.width)} × {Math.round(e.height)}
                </span>
              </div>
            ))}
        {!design.elements.length && !preview && (
          <div className="blank-hint">
            <span>这里，是新想法的起点。</span>
            <small>从左侧添加元件，或上传一张截图作为参考。</small>
          </div>
        )}
      </div>
    </div>
  );
}
