import { z } from "zod";
import type { CSSProperties } from "react";

export const TYPES = ["text", "button", "container", "input", "image"] as const;
export type ElementType = (typeof TYPES)[number];
export const typeNames: Record<ElementType, string> = {
  text: "文字",
  button: "按钮",
  container: "容器",
  input: "输入框",
  image: "图片",
};
const color = z
  .string()
  .regex(
    /^(#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})|transparent)$/i
  );
const finite = z.number().finite();
const imageSource = z
  .string()
  .max(3_000_000)
  .refine(
    s =>
      !s || /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s)
  );
export const elementSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(100),
  type: z.enum(TYPES),
  text: z.string().max(10000),
  x: finite.min(-10000).max(10000),
  y: finite.min(-10000).max(10000),
  width: finite.min(1).max(5000),
  height: finite.min(1).max(5000),
  background: color,
  color,
  borderColor: color,
  borderWidth: finite.min(0).max(30),
  radius: finite.min(0).max(500),
  opacity: finite.min(0).max(100),
  fontSize: finite.min(1).max(300),
  fontWeight: z.enum(["400", "500", "600", "700"]),
  fontFamily: z.enum(["system-ui", "Arial", "Georgia", "monospace"]),
  lineHeight: finite.min(0.5).max(5),
  align: z.enum(["left", "center", "right"]),
  shadow: z.enum(["none", "soft", "medium", "strong"]),
  padding: finite.min(0).max(200),
  hidden: z.boolean(),
  locked: z.boolean(),
  src: imageSource,
});
export const designSchema = z
  .object({
    version: z.literal(1),
    id: z.string().min(1).max(100),
    name: z.string().min(1).max(100),
    width: finite.min(200).max(4000),
    height: finite.min(200).max(4000),
    background: color,
    elements: z.array(elementSchema).max(500),
    updatedAt: z.number().finite(),
  })
  .refine(
    d => new Set(d.elements.map(e => e.id)).size === d.elements.length,
    "重复的图层 ID"
  );
export type DesignElement = z.infer<typeof elementSchema>;
export type Design = z.infer<typeof designSchema>;
export const uid = () => crypto.randomUUID();
export function createElement(
  type: ElementType,
  props: Partial<DesignElement> = {}
): DesignElement {
  return {
    id: uid(),
    name: typeNames[type],
    type,
    text:
      type === "button"
        ? "新建项目"
        : type === "input"
          ? "请输入内容…"
          : type === "text"
            ? "在这里写下你的想法"
            : "",
    x: 80,
    y: 80,
    width:
      type === "text"
        ? 260
        : type === "container" || type === "image"
          ? 280
          : 160,
    height:
      type === "text"
        ? 40
        : type === "container" || type === "image"
          ? 180
          : 44,
    background:
      type === "text"
        ? "transparent"
        : type === "button"
          ? "#197d70"
          : type === "image"
            ? "#edf2f0"
            : "#ffffff",
    color: type === "button" ? "#ffffff" : "#273b38",
    borderColor: "#e3e9e6",
    borderWidth: type === "input" ? 1 : 0,
    radius: type === "text" ? 0 : 8,
    opacity: 100,
    fontSize: 15,
    fontWeight: "400",
    fontFamily: "system-ui",
    lineHeight: 1.5,
    align: type === "button" || type === "image" ? "center" : "left",
    shadow: "none",
    padding: type === "text" ? 0 : 12,
    hidden: false,
    locked: false,
    src: "",
    ...props,
  };
}
export function blankDesign(): Design {
  return {
    version: 1,
    id: uid(),
    name: "未命名设计",
    width: 1100,
    height: 740,
    background: "#ffffff",
    elements: [],
    updatedAt: Date.now(),
  };
}
export const shadows = {
  none: "none",
  soft: "0 3px 12px #163b3210",
  medium: "0 8px 24px #163b3220",
  strong: "0 16px 40px #163b3233",
};
export function elementStyle(e: DesignElement): CSSProperties {
  return {
    position: "absolute",
    left: e.x,
    top: e.y,
    width: e.width,
    height: e.height,
    boxSizing: "border-box",
    backgroundColor: e.background,
    color: e.color,
    border: `${e.borderWidth}px solid ${e.borderColor}`,
    borderRadius: e.radius,
    opacity: e.opacity / 100,
    fontSize: e.fontSize,
    fontWeight: e.fontWeight,
    fontFamily: e.fontFamily,
    lineHeight: e.lineHeight,
    textAlign: e.align,
    boxShadow: shadows[e.shadow],
    padding: e.padding,
    whiteSpace: "pre-wrap",
    overflow: "hidden",
    display:
      e.type === "button" || e.type === "input" || e.type === "image"
        ? "flex"
        : "block",
    alignItems: "center",
    justifyContent:
      e.align === "center"
        ? "center"
        : e.align === "right"
          ? "flex-end"
          : "flex-start",
  };
}
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );
const unitless = new Set(["opacity", "fontWeight", "lineHeight"]);
export function styleText(e: DesignElement) {
  return Object.entries(elementStyle(e))
    .map(
      ([k, v]) =>
        `${k.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}:${typeof v === "number" && !unitless.has(k) ? `${v}px` : v}`
    )
    .join(";");
}
export function exportHtml(design: Design): string {
  const d = designSchema.parse(design);
  const elements = d.elements
    .filter(e => !e.hidden)
    .map(e => {
      const tag = e.type === "button" ? "button" : "div";
      const content =
        e.type === "image" && e.src
          ? `<img alt="${escapeHtml(e.name)}" src="${escapeHtml(e.src)}" style="width:100%;height:100%;object-fit:cover;display:block">`
          : escapeHtml(e.type === "image" ? e.text || "图片占位" : e.text);
      return `  <${tag} data-layer="${escapeHtml(e.name)}"${e.type === "button" ? ' type="button" tabindex="-1"' : ""}${e.type === "input" ? ' role="img" aria-label="输入框视觉模型"' : ""} style="${styleText(e)}">${content}</${tag}>`;
    })
    .join("\n");
  return `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${escapeHtml(d.name)}</title>\n<!-- FormLab 静态视觉原型：请保留原应用的业务逻辑，仅根据此文件修改界面。布局使用绝对坐标，无业务交互。 -->\n<style>html,body{margin:0;min-height:100%;background:#edf0ef}body{overflow:auto}*{box-sizing:border-box}#design{position:relative;width:${d.width}px;height:${d.height}px;margin:32px auto;background:${d.background};overflow:hidden;font-family:system-ui,sans-serif}button{cursor:default;pointer-events:none;font:inherit}img{pointer-events:none}</style>\n</head>\n<body>\n<main id="design" aria-label="${escapeHtml(d.name)}">\n${elements}\n</main>\n</body>\n</html>`;
}
export function aiBrief(d: Design): string {
  return `# ${d.name} · 界面实现说明\n\n请根据附带的 HTML 修改原软件的视觉界面，不改变原有业务逻辑、数据接口、权限或按钮行为。HTML 中的按钮和输入框仅为视觉示意。\n\n画布：${d.width} × ${d.height}px；背景：${d.background}。所有坐标相对于画布左上角，数组顺序由底层到顶层。固定尺寸原型不是自动响应式页面，请按原软件需求补充响应式布局。\n\n${d.elements
    .filter(e => !e.hidden)
    .map(
      e =>
        `- ${e.name}（${typeNames[e.type]}）：位置 ${e.x},${e.y}；尺寸 ${e.width}×${e.height}；字号 ${e.fontSize}px；背景 ${e.background}；文字色 ${e.color}；圆角 ${e.radius}px；阴影 ${e.shadow}。`
    )
    .join("\n")}\n`;
}
export function download(content: string, name: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[\\/:*?"<>|]/g, "-");
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function encodeShare(d: Design): Promise<string> {
  const input = new Blob([JSON.stringify(designSchema.parse(d))]).stream();
  const compressed = await new Response(
    input.pipeThrough(new CompressionStream("gzip"))
  ).arrayBuffer();
  const bytes = new Uint8Array(compressed);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const hash = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (hash.length > 60000)
    throw new Error("设计包含较大图片，链接过长。请下载项目文件分享。");
  return hash;
}
export async function decodeShare(hash: string): Promise<Design> {
  if (hash.length > 60000 || !/^[A-Za-z0-9_-]+$/.test(hash))
    throw new Error("分享链接无效");
  const data = Uint8Array.from(
    atob(hash.replace(/-/g, "+").replace(/_/g, "/")),
    c => c.charCodeAt(0)
  );
  const reader = new Blob([data])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"))
    .getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 12_000_000) {
      await reader.cancel();
      throw new Error("项目超过大小限制");
    }
    chunks.push(value);
  }
  return designSchema.parse(
    JSON.parse(await new Blob(chunks as BlobPart[]).text())
  );
}
export const STORE_KEY = "formlab.projects.v1";
export function loadProjects(): Design[] {
  try {
    const entries: unknown = JSON.parse(
      localStorage.getItem(STORE_KEY) || "[]"
    );
    if (!Array.isArray(entries)) return [];
    return entries.flatMap(entry => {
      const result = designSchema.safeParse(entry);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}
export function saveProject(d: Design) {
  const valid = designSchema.parse(d);
  const raw = localStorage.getItem(STORE_KEY) || "[]";
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries))
    throw new Error("本机项目存储格式损坏，请先导出当前设计");
  if (entries.some(entry => !designSchema.safeParse(entry).success)) {
    if (!localStorage.getItem(`${STORE_KEY}.recovery`))
      localStorage.setItem(`${STORE_KEY}.recovery`, raw);
  }
  const projects = loadProjects();
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify([valid, ...projects.filter(p => p.id !== valid.id)])
  );
}
