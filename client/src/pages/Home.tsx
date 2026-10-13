import {
  useEffect,
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  MousePointer2,
  Type,
  Square,
  RectangleHorizontal,
  TextCursorInput,
  ImageIcon,
  Layers3,
  Plus,
  ChevronDown,
  Undo2,
  Redo2,
  Share2,
  Download,
  Eye,
  EyeOff,
  LockKeyhole,
  LockKeyholeOpen,
  Copy,
  Trash2,
  FolderOpen,
  Monitor,
  Tablet,
  Smartphone,
  Minus,
  Maximize2,
  Grid3X3,
  HelpCircle,
  X,
  Check,
  ArrowUpToLine,
  ArrowDownToLine,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  ArrowUp,
  ArrowDown,
  FileCode2,
  FileJson2,
  ArrowRight,
  Upload,
  MoveHorizontal,
  MoveVertical,
  PanelLeftClose,
} from "lucide-react";
import Canvas from "../editor/Canvas";
import Inspector from "../editor/Inspector";
import { useDesign } from "../editor/useDesign";
import {
  createElement,
  blankDesign,
  uid,
  typeNames,
  type Design,
  type DesignElement,
  type ElementType,
  designSchema,
  exportHtml,
  aiBrief,
  download,
  encodeShare,
  decodeShare,
  loadProjects,
  saveProject,
} from "../editor/model";
import { dashboardDesign, loginDesign } from "../editor/templates";

const icons = {
  text: Type,
  button: RectangleHorizontal,
  container: Square,
  input: TextCursorInput,
  image: ImageIcon,
};
function Modal({
  title,
  subtitle,
  children,
  close,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handler = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") close();
      if (ev.key === "Tab" && ref.current) {
        const focusables = [
          ...ref.current.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input:not(:disabled),select,textarea,a[href]"
          ),
        ];
        const first = focusables[0],
          last = focusables.at(-1);
        if (
          ev.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          ev.preventDefault();
          last?.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [close]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={ev => {
        if (ev.target === ev.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={`modal ${wide ? "wide-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="icon-button modal-close"
          aria-label="关闭"
          onClick={close}
        >
          <X size={18} />
        </button>
        <div className="modal-heading">
          <span className="eyebrow">FORMLAB / WORKSPACE</span>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const {
    design,
    change,
    commit,
    open,
    undo,
    redo,
    canUndo,
    canRedo,
    saveStatus,
    ready,
    setReady,
  } = useDesign();
  const [selected, setSelected] = useState<string[]>(["primary-button"]);
  const [tab, setTab] = useState("components");
  const [preview, setPreview] = useState(location.hash.startsWith("#design="));
  const [modal, setModal] = useState<
    "share" | "export" | "projects" | "help" | null
  >(null);
  const [toast, setToast] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const [available, setAvailable] = useState({ width: 820, height: 640 });
  const [snap, setSnap] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [reference, setReference] = useState<{
    src: string;
    opacity: number;
  } | null>(null);
  const [projects, setProjects] = useState<Design[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const projectFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);
  const element = design.elements.find(e => e.id === selected[0]);
  const fitScale = Math.max(
    0.1,
    Math.min(
      (available.width - 100) / design.width,
      (available.height - 110) / design.height,
      1
    )
  );
  const scale = zoom || fitScale;
  const notify = (msg: string) => setToast(msg);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(([entry]) =>
      setAvailable({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [preview]);
  useEffect(() => {
    if (!location.hash.startsWith("#design=")) return;
    let active = true;
    decodeShare(location.hash.slice(8))
      .then(d => {
        if (active) {
          open({
            ...d,
            id: uid(),
            name: `${d.name} · 分享副本`.slice(0, 100),
            updatedAt: Date.now(),
          });
          setSelected([]);
          setReady(true);
          notify("已打开分享快照，编辑不会影响原设计");
        }
      })
      .catch(() => {
        if (active) {
          notify("分享链接无效或浏览器不支持，请改用项目文件导入");
          setPreview(false);
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, [open, setReady]);
  const select = (id: string | null, additive = false) =>
    setSelected(s =>
      id
        ? additive
          ? s.includes(id)
            ? s.filter(v => v !== id)
            : [...s, id]
          : [id]
        : []
    );
  const updateElement = (
    id: string,
    patch: Partial<DesignElement>,
    record = true
  ) =>
    change(
      d => ({
        ...d,
        elements: d.elements.map(e => (e.id === id ? { ...e, ...patch } : e)),
      }),
      record
    );
  const updateSelected = (patch: Partial<DesignElement>) =>
    change(d => ({
      ...d,
      elements: d.elements.map(e =>
        selected.includes(e.id) && (!e.locked || "locked" in patch)
          ? { ...e, ...patch }
          : e
      ),
    }));
  const duplicate = () => {
    const copies = design.elements
      .filter(e => selected.includes(e.id))
      .map(e => ({
        ...e,
        id: uid(),
        name: `${e.name} 副本`.slice(0, 100),
        x: Math.min(e.x + 24, 10000),
        y: Math.min(e.y + 24, 10000),
        locked: false,
      }));
    if (design.elements.length + copies.length > 500)
      return notify("最多支持 500 个图层");
    change(d => ({ ...d, elements: [...d.elements, ...copies] }));
    setSelected(copies.map(e => e.id));
  };
  const remove = () => {
    change(d => ({
      ...d,
      elements: d.elements.filter(e => !selected.includes(e.id) || e.locked),
    }));
    setSelected([]);
  };
  const add = (type: ElementType) => {
    if (design.elements.length >= 500) return notify("最多支持 500 个图层");
    const e = createElement(type, {
      x: Math.round(
        design.width / 2 - (type === "container" || type === "image" ? 140 : 80)
      ),
      y: Math.round(design.height / 2 - 22),
    });
    change(d => ({ ...d, elements: [...d.elements, e] }));
    setSelected([e.id]);
  };
  const reorder = (direction: "front" | "back" | "up" | "down") => {
    change(d => {
      const all = [...d.elements];
      if (direction === "front" || direction === "back") {
        const picked = all.filter(e => selected.includes(e.id) && !e.locked),
          rest = all.filter(e => !picked.includes(e));
        return {
          ...d,
          elements:
            direction === "front" ? [...rest, ...picked] : [...picked, ...rest],
        };
      }
      const i = all.findIndex(e => e.id === selected[0]);
      const j = i + (direction === "up" ? 1 : -1);
      if (i >= 0 && j >= 0 && j < all.length && !all[i].locked)
        [all[i], all[j]] = [all[j], all[i]];
      return { ...d, elements: all };
    });
  };
  const align = (axis: "x" | "y", edge: "start" | "center" | "end") =>
    change(d => {
      const targets = d.elements.filter(
        e => selected.includes(e.id) && !e.locked
      );
      if (!targets.length) return d;
      const dim = axis === "x" ? "width" : "height";
      const start =
        targets.length === 1 ? 0 : Math.min(...targets.map(e => e[axis]));
      const end =
        targets.length === 1
          ? d[dim]
          : Math.max(...targets.map(e => e[axis] + e[dim]));
      return {
        ...d,
        elements: d.elements.map(e =>
          targets.includes(e)
            ? {
                ...e,
                [axis]: Math.round(
                  edge === "start"
                    ? start
                    : edge === "end"
                      ? end - e[dim]
                      : (start + end - e[dim]) / 2
                ),
              }
            : e
        ),
      };
    });
  const distribute = (axis: "x" | "y") =>
    change(d => {
      const items = d.elements
        .filter(e => selected.includes(e.id) && !e.locked)
        .sort((a, b) => a[axis] - b[axis]);
      if (items.length < 3) {
        notify("按住 Shift 选中至少三个元件以分配间距");
        return d;
      }
      const dim = axis === "x" ? "width" : "height",
        first = items[0],
        last = items[items.length - 1];
      const gap =
        (last[axis] +
          last[dim] -
          first[axis] -
          items.reduce((n, e) => n + e[dim], 0)) /
        (items.length - 1);
      let position = first[axis];
      const positions = new Map(
        items.map(e => {
          const v = [e.id, Math.round(position)] as const;
          position += e[dim] + gap;
          return v;
        })
      );
      return {
        ...d,
        elements: d.elements.map(e =>
          positions.has(e.id) ? { ...e, [axis]: positions.get(e.id)! } : e
        ),
      };
    });
  useEffect(() => {
    const key = (ev: KeyboardEvent) => {
      if (
        modal ||
        preview ||
        /INPUT|TEXTAREA|SELECT/.test((ev.target as HTMLElement).tagName) ||
        (ev.target as HTMLElement).isContentEditable
      )
        return;
      const mod = ev.ctrlKey || ev.metaKey;
      if (mod && ev.key.toLowerCase() === "z") {
        ev.preventDefault();
        ev.shiftKey ? redo() : undo();
      } else if (mod && ev.key.toLowerCase() === "y") {
        ev.preventDefault();
        redo();
      } else if (mod && ev.key.toLowerCase() === "d") {
        ev.preventDefault();
        duplicate();
      } else if (mod && ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        try {
          saveProject(design);
          notify("项目已保存到本机");
        } catch {
          notify("本机存储已满，请导出项目备份");
        }
      } else if (ev.key === "Delete" || ev.key === "Backspace") {
        ev.preventDefault();
        remove();
      } else if (ev.key === "Escape") setSelected([]);
      else if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(ev.key)
      ) {
        ev.preventDefault();
        const delta = ev.shiftKey ? 10 : 1;
        change(d => ({
          ...d,
          elements: d.elements.map(e =>
            selected.includes(e.id) && !e.locked
              ? {
                  ...e,
                  x: Math.max(
                    -10000,
                    Math.min(
                      10000,
                      e.x +
                        (ev.key === "ArrowLeft"
                          ? -delta
                          : ev.key === "ArrowRight"
                            ? delta
                            : 0)
                    )
                  ),
                  y: Math.max(
                    -10000,
                    Math.min(
                      10000,
                      e.y +
                        (ev.key === "ArrowUp"
                          ? -delta
                          : ev.key === "ArrowDown"
                            ? delta
                            : 0)
                    )
                  ),
                }
              : e
          ),
        }));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const openProject = (d: Design) => {
    try {
      saveProject(design);
    } catch {
      notify("当前项目未能本机保存，请先导出备份");
      return false;
    }
    open(d);
    setSelected([]);
    setZoom(null);
    setReference(null);
    setPreview(false);
    setModal(null);
    history.replaceState(null, "", location.pathname + location.search);
    return true;
  };
  const showProjects = () => {
    setProjects(loadProjects());
    setModal("projects");
  };
  const importProject = async (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    try {
      if (file.size > 12_000_000) throw new Error();
      const d = designSchema.parse(JSON.parse(await file.text()));
      if (openProject({ ...d, id: uid(), updatedAt: Date.now() }))
        notify("项目导入成功");
    } catch {
      notify("无法导入：请选择有效的 FormLab JSON 项目（最大 12 MB）");
    }
  };
  const importImage = async (
    ev: ChangeEvent<HTMLInputElement>,
    asReference: boolean
  ) => {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (
      !/^image\/(png|jpeg|webp|gif)$/.test(file.type) ||
      file.size > 2_000_000
    )
      return notify("支持 PNG、JPG、WebP、GIF，单张最大 2 MB");
    const reader = new FileReader();
    reader.onload = () => {
      if (asReference) {
        setReference({ src: reader.result as string, opacity: 40 });
        notify("截图仅作为参考，不会包含在导出中");
      } else if (element?.type === "image")
        updateElement(element.id, { src: reader.result as string, padding: 0 });
    };
    reader.onerror = () => notify("读取图片失败，请重试");
    reader.readAsDataURL(file);
  };
  const share = async () => {
    setModal("share");
    setSharing(true);
    setShareUrl("");
    setShareError("");
    setCopied(false);
    try {
      const hash = await encodeShare(design);
      setShareUrl(`${location.origin}${location.pathname}#design=${hash}`);
    } catch (err) {
      setShareError(
        err instanceof Error
          ? err.message
          : "浏览器不支持压缩分享，请下载项目文件分享。"
      );
    } finally {
      setSharing(false);
    }
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      notify("已复制到剪贴板");
    } catch {
      notify("无法自动复制，请选中链接手动复制");
    }
  };
  const exportProject = () =>
    download(
      JSON.stringify(design, null, 2),
      `${design.name}.formlab.json`,
      "application/json"
    );
  const closeModal = useCallback(() => setModal(null), []);
  return (
    <div className={`editor-app ${preview ? "preview-mode" : ""}`}>
      <header className="app-header">
        <a
          className="brand"
          href={location.pathname}
          aria-label="FormLab 首页"
          onClick={ev => ev.preventDefault()}
        >
          <div className="brand-mark">
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
              alt=""
              width={30}
              height={32}
              style={{ borderRadius: 8 }}
            />
          </div>
          <span>
            formlab<span className="brand-dot">.</span>
          </span>
          <span className="brand-description">界面工坊</span>
        </a>
        <div className="header-divider" />
        <div className="project-title">
          <input
            aria-label="项目名称"
            value={design.name}
            maxLength={100}
            onChange={ev => {
              if (ev.target.value.trim())
                change(d => ({ ...d, name: ev.target.value }));
            }}
          />
          <button
            className="icon-button tiny"
            aria-label="打开项目菜单"
            onClick={showProjects}
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <div
          className={`save-state ${saveStatus === "error" ? "save-error" : ""}`}
        >
          <span className="status-dot" />
          {saveStatus === "error"
            ? "保存失败 · 请导出备份"
            : saveStatus === "saving"
              ? "正在保存…"
              : "已保存至本机"}
        </div>
        <div className="header-actions">
          <button
            className={`secondary-button preview-button ${preview ? "active" : ""}`}
            onClick={() => {
              setPreview(p => !p);
              setZoom(null);
            }}
          >
            <Eye size={15} />
            <span>{preview ? "返回编辑" : "预览"}</span>
          </button>
          <button className="secondary-button share-button" onClick={share}>
            <Share2 size={15} />
            <span>分享</span>
          </button>
          <button className="primary-button" onClick={() => setModal("export")}>
            <Download size={15} />
            <span>导出</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </header>
      {!preview && (
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <button
              className="tool-button active"
              aria-label="选择工具"
              onClick={() => notify("点击选择 · 拖拽移动 · Shift 多选")}
            >
              <MousePointer2 size={16} />
              <ChevronDown size={11} />
            </button>
            <span className="toolbar-separator" />
            {(["container", "text", "button", "image"] as ElementType[]).map(
              t => {
                const Icon = icons[t];
                return (
                  <button
                    key={t}
                    className="tool-button"
                    title={`添加${typeNames[t]}`}
                    aria-label={`添加${typeNames[t]}`}
                    onClick={() => add(t)}
                  >
                    <Icon size={17} />
                  </button>
                );
              }
            )}
            <span className="toolbar-separator" />
            <button
              className="tool-button"
              title="撤销 Ctrl+Z"
              aria-label="撤销"
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2 size={16} />
            </button>
            <button
              className="tool-button"
              title="重做 Ctrl+Shift+Z"
              aria-label="重做"
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2 size={16} />
            </button>
          </div>
          <div className="toolbar-center">
            <span className="small-dot" />
            设计你的界面，不止你的想象。
          </div>
          <div className="toolbar-right">
            <button
              className="tool-button"
              onClick={showProjects}
              title="我的项目"
            >
              <FolderOpen size={16} />
              <span>我的项目</span>
            </button>
            <button
              className="tool-button"
              aria-label="帮助"
              onClick={() => setModal("help")}
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      )}
      <main className="editor-body">
        {!preview && (
          <aside className="left-sidebar panel">
            <div className="side-tabs">
              <button
                className={tab === "components" ? "active" : ""}
                onClick={() => setTab("components")}
              >
                元件
              </button>
              <button
                className={tab === "templates" ? "active" : ""}
                onClick={() => setTab("templates")}
              >
                模板
              </button>
            </div>
            {tab === "components" ? (
              <div className="components-section">
                <div className="section-heading">
                  <h3>基础元件</h3>
                  <span>拖出你的灵感</span>
                </div>
                <div className="component-grid">
                  {(
                    [
                      "text",
                      "button",
                      "container",
                      "input",
                      "image",
                    ] as ElementType[]
                  ).map(t => {
                    const Icon = icons[t];
                    return (
                      <button
                        key={t}
                        className="component-card"
                        onClick={() => add(t)}
                        draggable
                        onDragStart={ev =>
                          ev.dataTransfer.setData("text/formlab", t)
                        }
                      >
                        <Icon size={23} strokeWidth={1.3} />
                        <span>{typeNames[t]}</span>
                        <Plus size={11} className="component-plus" />
                      </button>
                    );
                  })}
                  <button
                    className="component-card reference-card"
                    onClick={() => refFileRef.current?.click()}
                  >
                    <Upload size={22} strokeWidth={1.3} />
                    <span>参考截图</span>
                  </button>
                </div>
                {reference && (
                  <div className="reference-controls">
                    <span>参考图透明度</span>
                    <input
                      aria-label="参考图透明度"
                      type="range"
                      min={0}
                      max={100}
                      value={reference.opacity}
                      onChange={ev =>
                        setReference(
                          r => r && { ...r, opacity: Number(ev.target.value) }
                        )
                      }
                    />
                    <button
                      className="icon-button tiny"
                      aria-label="移除截图参考"
                      onClick={() => setReference(null)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="templates-section">
                <button
                  className="template-card"
                  onClick={() => openProject(blankDesign())}
                >
                  <span className="template-mini blank-mini">
                    <Plus size={22} />
                  </span>
                  <strong>空白画布</strong>
                  <small>从零开始，自由创造</small>
                </button>
                <button
                  className="template-card"
                  onClick={() => openProject(dashboardDesign())}
                >
                  <span className="template-mini dashboard-mini">
                    <i />
                    <b />
                    <b />
                    <b />
                  </span>
                  <strong>Orbit 工作台</strong>
                  <small>清晰、有序的桌面界面</small>
                </button>
                <button
                  className="template-card"
                  onClick={() => openProject(loginDesign())}
                >
                  <span className="template-mini login-mini">
                    <i />
                  </span>
                  <strong>极简登录页</strong>
                  <small>轻盈的表单设计</small>
                </button>
              </div>
            )}
            <div className="layers-header">
              <span>
                <Layers3 size={15} />
                图层
              </span>
              <span className="count-pill">{design.elements.length}</span>
              <button
                className="icon-button tiny"
                aria-label="新建容器"
                onClick={() => add("container")}
              >
                <Plus size={15} />
              </button>
            </div>
            <div className="layer-root">
              <Monitor size={14} />
              <span>
                {design.width} × {design.height} · 主画布
              </span>
              <ChevronDown size={12} />
            </div>
            <div className="layers-list">
              {[...design.elements].reverse().map(e => {
                const Icon = icons[e.type];
                return (
                  <div
                    key={e.id}
                    className={`layer-row ${selected.includes(e.id) ? "active" : ""} ${e.hidden ? "hidden-layer" : ""}`}
                  >
                    <button
                      className="layer-select"
                      onClick={ev => select(e.id, ev.shiftKey)}
                    >
                      <Icon size={13} />
                      <span>{e.name || typeNames[e.type]}</span>
                    </button>
                    <div className="layer-options">
                      <button
                        className="icon-button tiny"
                        aria-label={`${e.hidden ? "显示" : "隐藏"} ${e.name}`}
                        onClick={() =>
                          updateElement(e.id, { hidden: !e.hidden })
                        }
                      >
                        {e.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button
                        className="icon-button tiny"
                        aria-label={`${e.locked ? "解锁" : "锁定"} ${e.name}`}
                        onClick={() =>
                          updateElement(e.id, { locked: !e.locked })
                        }
                      >
                        {e.locked ? (
                          <LockKeyhole size={12} />
                        ) : (
                          <LockKeyholeOpen size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              {!design.elements.length && (
                <div className="empty-layers">
                  还没有图层
                  <br />
                  <small>点击上方元件添加</small>
                </div>
              )}
            </div>
            <div className="sidebar-bottom">
              <span className="local-tag">LOCAL FIRST</span>
              <span>你的设计，只属于你。</span>
            </div>
          </aside>
        )}
        <section
          className={`canvas-area ${showGrid && !preview ? "with-grid" : ""}`}
        >
          <div className="canvas-topbar">
            <div className="canvas-breadcrumb">
              <span>{preview ? "纯界面预览" : "页面 01"}</span>
              <span>/</span>
              <strong>{design.name}</strong>
              {preview && <span className="preview-badge">无业务交互</span>}
            </div>
            {!preview && (
              <div className="device-options">
                {[
                  { Icon: Monitor, w: 1100, h: 740, label: "桌面" },
                  { Icon: Tablet, w: 768, h: 1024, label: "平板" },
                  { Icon: Smartphone, w: 390, h: 844, label: "手机" },
                ].map(({ Icon, w, h, label }) => (
                  <button
                    key={label}
                    className={`icon-button ${design.width === w ? "active" : ""}`}
                    aria-label={`${label}画布`}
                    title={`${label} ${w}×${h}（只改画布，不自动重排）`}
                    onClick={() => {
                      change(d => ({ ...d, width: w, height: h }));
                      setZoom(null);
                    }}
                  >
                    <Icon size={16} />
                  </button>
                ))}
                <span>
                  {design.width} × {design.height}
                </span>
              </div>
            )}
          </div>
          <div
            ref={viewportRef}
            className="canvas-viewport"
            onDragOver={ev => ev.preventDefault()}
            onDrop={ev => {
              ev.preventDefault();
              const t = ev.dataTransfer.getData("text/formlab") as ElementType;
              if (!(t in icons)) return;
              if (design.elements.length >= 500)
                return notify("最多支持 500 个图层");
              const board = viewportRef.current?.querySelector(".artboard");
              if (!board) return;
              const rect = board.getBoundingClientRect();
              const e = createElement(t, {
                x: Math.max(0, Math.round((ev.clientX - rect.left) / scale)),
                y: Math.max(0, Math.round((ev.clientY - rect.top) / scale)),
              });
              change(d => ({ ...d, elements: [...d.elements, e] }));
              setSelected([e.id]);
            }}
          >
            <Canvas
              design={design}
              selected={selected}
              select={select}
              update={(id, p) => updateElement(id, p, false)}
              commit={commit}
              scale={scale}
              preview={preview}
              snap={snap}
              reference={reference}
            />
          </div>
          <div className="canvas-bottom">
            <span className="canvas-tip">
              {preview
                ? "这是一个静态视觉原型，按钮不会执行操作。"
                : "Shift 多选 · 方向键微调 · Ctrl / ⌘ + Z 撤销"}
            </span>
            <div className="zoom-controls">
              <button
                className="icon-button"
                aria-label="缩小"
                onClick={() => setZoom(Math.max(0.1, scale - 0.1))}
              >
                <Minus size={14} />
              </button>
              <button
                className="zoom-value"
                title="恢复适应画布"
                onClick={() => setZoom(null)}
              >
                {Math.round(scale * 100)}%<ChevronDown size={11} />
              </button>
              <button
                className="icon-button"
                aria-label="放大"
                onClick={() => setZoom(Math.min(2, scale + 0.1))}
              >
                <Plus size={14} />
              </button>
              <span className="toolbar-separator" />
              <button
                className="icon-button"
                title="适应画布"
                aria-label="适应画布"
                onClick={() => setZoom(null)}
              >
                <Maximize2 size={14} />
              </button>
              {!preview && (
                <button
                  className={`icon-button ${showGrid ? "active" : ""}`}
                  aria-label="切换网格"
                  onClick={() => setShowGrid(v => !v)}
                >
                  <Grid3X3 size={14} />
                </button>
              )}
            </div>
          </div>
          {!preview && selected.length > 0 && (
            <div className="context-toolbar">
              <span className="context-count">
                {selected.length > 1 ? `${selected.length} 个元件` : "排列"}
              </span>
              {[
                {
                  Icon: AlignHorizontalJustifyStart,
                  axis: "x",
                  edge: "start",
                  name: "左对齐",
                },
                {
                  Icon: AlignHorizontalJustifyCenter,
                  axis: "x",
                  edge: "center",
                  name: "水平居中",
                },
                {
                  Icon: AlignHorizontalJustifyEnd,
                  axis: "x",
                  edge: "end",
                  name: "右对齐",
                },
                {
                  Icon: AlignVerticalJustifyStart,
                  axis: "y",
                  edge: "start",
                  name: "顶部对齐",
                },
                {
                  Icon: AlignVerticalJustifyCenter,
                  axis: "y",
                  edge: "center",
                  name: "垂直居中",
                },
                {
                  Icon: AlignVerticalJustifyEnd,
                  axis: "y",
                  edge: "end",
                  name: "底部对齐",
                },
              ].map(({ Icon, axis, edge, name }) => (
                <button
                  key={name}
                  className="icon-button"
                  title={name}
                  aria-label={name}
                  onClick={() =>
                    align(axis as "x" | "y", edge as "start" | "center" | "end")
                  }
                >
                  <Icon size={15} />
                </button>
              ))}
              <span className="toolbar-separator" />
              <button
                className="icon-button"
                title="横向等间距"
                aria-label="横向等间距"
                onClick={() => distribute("x")}
              >
                <MoveHorizontal size={15} />
              </button>
              <button
                className="icon-button"
                title="纵向等间距"
                aria-label="纵向等间距"
                onClick={() => distribute("y")}
              >
                <MoveVertical size={15} />
              </button>
              <span className="toolbar-separator" />
              <button
                className="icon-button"
                aria-label="上移一层"
                title="上移一层"
                onClick={() => reorder("up")}
              >
                <ArrowUp size={15} />
              </button>
              <button
                className="icon-button"
                aria-label="下移一层"
                title="下移一层"
                onClick={() => reorder("down")}
              >
                <ArrowDown size={15} />
              </button>
              <button
                className="icon-button"
                aria-label="置顶"
                title="置顶"
                onClick={() => reorder("front")}
              >
                <ArrowUpToLine size={15} />
              </button>
              <button
                className="icon-button"
                aria-label="置底"
                title="置底"
                onClick={() => reorder("back")}
              >
                <ArrowDownToLine size={15} />
              </button>
            </div>
          )}
        </section>
        {!preview && (
          <Inspector
            design={design}
            element={element}
            update={updateSelected}
            updateDesign={p => change(d => ({ ...d, ...p }))}
            duplicate={duplicate}
            remove={remove}
            onImage={() => imageFileRef.current?.click()}
          />
        )}
      </main>
      <footer className="app-footer">
        <div>
          <span className="footer-mark">f.</span>
          <span>让界面，成为你的想法。</span>
        </div>
        <div>
          {!preview && (
            <label className="snap-toggle">
              <input
                type="checkbox"
                checked={snap}
                onChange={ev => setSnap(ev.target.checked)}
              />
              8px 网格吸附
            </label>
          )}
          <span className="footer-version">FormLab 1.0</span>
        </div>
      </footer>
      <input
        className="sr-only"
        ref={projectFileRef}
        type="file"
        accept=".json"
        onChange={importProject}
      />
      <input
        className="sr-only"
        ref={imageFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={ev => importImage(ev, false)}
      />
      <input
        className="sr-only"
        ref={refFileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={ev => importImage(ev, true)}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          <span>{toast}</span>
          <button aria-label="关闭提示" onClick={() => setToast("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {!ready && <div className="loading-overlay">正在打开分享的设计…</div>}
      {modal === "share" && (
        <Modal
          title="让好设计，被看见。"
          subtitle="分享的是当前设计的快照，不需要账号或服务器。"
          close={closeModal}
        >
          <div className="share-visual">
            <Share2 size={28} strokeWidth={1.4} />
            <div>
              <strong>{design.name}</strong>
              <span>
                {design.width} × {design.height} · {design.elements.length}{" "}
                个图层
              </span>
            </div>
            <span className="snapshot-badge">设计快照</span>
          </div>
          <label className="property-label" htmlFor="share-link">
            分享链接
          </label>
          <div className="share-link-row">
            <input
              id="share-link"
              readOnly
              value={sharing ? "正在压缩设计…" : shareUrl || "使用项目文件分享"}
              onFocus={ev => ev.target.select()}
            />
            <button
              className="primary-button"
              disabled={!shareUrl || sharing}
              onClick={() => copy(shareUrl)}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "已复制" : "复制链接"}
            </button>
          </div>
          {shareError && <p className="error-message">{shareError}</p>}
          <div className="share-notice">
            <LockKeyhole size={16} />
            <p>
              链接中包含完整设计；任何获得链接的人都可查看、另存并编辑副本。修改后请重新生成链接。大图项目建议用文件分享。
            </p>
          </div>
          <button className="secondary-button full" onClick={exportProject}>
            <FileJson2 size={17} />
            下载项目文件分享
            <Download size={14} />
          </button>
          <p className="modal-footnote">
            分享链接需在同一网站地址可访问时使用。GitHub Pages
            部署后，在正式网站重新生成即可。
          </p>
        </Modal>
      )}
      {modal === "export" && (
        <Modal
          title="从设计，到下一步。"
          subtitle="把界面交给 AI，让它实现你的想法。"
          close={closeModal}
        >
          <button
            className="export-option"
            onClick={() => {
              download(exportHtml(design), `${design.name}.html`, "text/html");
              notify("静态 HTML 已导出");
            }}
          >
            <span className="export-icon">
              <FileCode2 size={24} />
            </span>
            <span>
              <strong>
                静态 HTML <b>推荐</b>
              </strong>
              <small>完整内嵌 CSS · 可独立打开 · 无业务交互</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <button
            className="export-option"
            onClick={() => {
              exportProject();
              notify("可编辑项目已导出");
            }}
          >
            <span className="export-icon muted">
              <FileJson2 size={24} />
            </span>
            <span>
              <strong>FormLab 项目</strong>
              <small>保留全部图层与属性，可重新导入编辑</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <button
            className="export-option"
            onClick={() => {
              download(
                aiBrief(design),
                `${design.name}-AI说明.md`,
                "text/markdown"
              );
              notify("AI 实现说明已导出");
            }}
          >
            <span className="export-icon sand">
              <Type size={24} />
            </span>
            <span>
              <strong>AI 实现说明</strong>
              <small>布局与样式参数，告诉 AI 哪些需要改变</small>
            </span>
            <ArrowRight size={18} />
          </button>
          <div className="export-note">
            建议同时交给 AI：
            <strong>静态 HTML + AI 实现说明 + 原软件源码</strong>
            。导出只还原视觉，不会连接原软件数据。
          </div>
        </Modal>
      )}
      {modal === "projects" && (
        <Modal
          title="你的想法，都在这里。"
          subtitle="项目仅存储在此浏览器，重要设计请下载备份。"
          close={closeModal}
          wide
        >
          <div className="projects-actions">
            <button
              className="primary-button"
              onClick={() => openProject(blankDesign())}
            >
              <Plus size={15} />
              新建设计
            </button>
            <button
              className="secondary-button"
              onClick={() => projectFileRef.current?.click()}
            >
              <Upload size={15} />
              导入项目
            </button>
            <button
              className="secondary-button"
              onClick={() =>
                openProject({
                  ...design,
                  id: uid(),
                  name: `${design.name} 副本`.slice(0, 100),
                })
              }
            >
              <Copy size={14} />
              复制当前
            </button>
          </div>
          <div className="project-list">
            {projects.map(p => (
              <button
                className="project-list-item"
                key={p.id}
                onClick={() => openProject(p)}
              >
                <span className="project-thumb">
                  <Monitor size={25} />
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.width} × {p.height} · {p.elements.length} 个图层 ·{" "}
                    {new Date(p.updatedAt).toLocaleDateString("zh-CN")}
                  </small>
                </span>
                {p.id === design.id ? (
                  <span className="current-pill">当前</span>
                ) : (
                  <ArrowRight size={17} />
                )}
              </button>
            ))}
            {!projects.length && (
              <p className="empty-projects">
                暂无已保存项目，当前设计稍后会自动保存。
              </p>
            )}
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal
          title="只改表面，自由表达。"
          subtitle="无需编程，重制你想要的软件界面。"
          close={closeModal}
        >
          <div className="help-steps">
            <div>
              <b>01</b>
              <span>
                <strong>搭建界面</strong>
                <p>
                  从模板或空白画布开始。可以上传软件截图作为半透明参考，再添加文字、容器、按钮等元件。
                </p>
              </span>
            </div>
            <div>
              <b>02</b>
              <span>
                <strong>手动调整</strong>
                <p>
                  拖动元件，拉动四角改变尺寸。在右侧设置坐标、字体、颜色、圆角与阴影；Shift
                  点击可多选。
                </p>
              </span>
            </div>
            <div>
              <b>03</b>
              <span>
                <strong>交给 AI 实现</strong>
                <p>
                  导出 HTML 和 AI 说明，连同原软件源码交给
                  AI。这里制作的是视觉原型，不会直接修改另一个软件。
                </p>
              </span>
            </div>
          </div>
          <div className="shortcuts">
            <span>
              撤销 <kbd>⌘ / Ctrl Z</kbd>
            </span>
            <span>
              复制 <kbd>⌘ / Ctrl D</kbd>
            </span>
            <span>
              微调 <kbd>↑ ↓ ← →</kbd>
            </span>
            <span>
              删除 <kbd>Delete</kbd>
            </span>
          </div>
          <p className="modal-footnote">
            容器是独立的视觉图层，不会自动包住子元素。设备规格只调整画布，不自动重新排版。当前使用平面图层列表。
          </p>
        </Modal>
      )}
    </div>
  );
}
