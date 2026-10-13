import { describe, it, expect } from "vitest";
import {
  blankDesign,
  createElement,
  designSchema,
  exportHtml,
  styleText,
  encodeShare,
  decodeShare,
  aiBrief,
  STORE_KEY,
  saveProject,
  loadProjects,
} from "./model";
import { dashboardDesign, loginDesign } from "./templates";

describe("FormLab core", () => {
  it("all templates validate and have unique layer IDs", () => {
    for (const design of [blankDesign(), dashboardDesign(), loginDesign()])
      expect(designSchema.parse(design)).toEqual(design);
  });
  it("HTML is standalone, ordered, escaped, static and hides hidden layers", () => {
    const d = blankDesign();
    d.name = "<script>alert(1)</script>";
    d.elements = [
      createElement("text", {
        text: '<img src=x onerror="alert(1)">',
        name: '" onmouseover="alert(1)',
      }),
      createElement("button"),
      createElement("input"),
      createElement("text", { text: "SECRET_HIDDEN", hidden: true }),
    ];
    const html = exportHtml(d);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<style>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("SECRET_HIDDEN");
    expect(html).not.toContain("<input");
    expect(html).toContain("pointer-events:none");
    expect(html).toContain("&quot; onmouseover=&quot;");
    expect(html.indexOf("&lt;img")).toBeLessThan(html.indexOf("<button"));
    expect(html).not.toMatch(/<script|onclick=|https?:\/\//);
  });
  it("numeric CSS has correct units and opacity conversion", () => {
    const e = createElement("button", {
      opacity: 50,
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 1.7,
    });
    const css = styleText(e);
    expect(css).toContain("font-size:22px");
    expect(css).toContain("opacity:0.5");
    expect(css).toContain("line-height:1.7");
    expect(css).toContain("font-weight:600");
  });
  it("project validation rejects code injection, unsafe sources, duplicate IDs and extreme numbers", () => {
    const d = blankDesign();
    const e = createElement("image");
    for (const patch of [
      { src: "javascript:alert(1)" },
      { src: "data:image/svg+xml;base64,AAAA" },
      { background: "red;position:fixed" },
      { color: "#12345" },
      { width: Infinity },
      { opacity: 101 },
      { fontFamily: 'Arial" onclick="alert(1)' },
    ])
      expect(
        designSchema.safeParse({ ...d, elements: [{ ...e, ...patch }] }).success
      ).toBe(false);
    expect(designSchema.safeParse({ ...d, elements: [e, e] }).success).toBe(
      false
    );
    expect(designSchema.safeParse({ ...d, version: 2 }).success).toBe(false);
  });
  it("compressed unicode sharing is a lossless round trip", async () => {
    const d = dashboardDesign();
    d.name = "分享设计 · 中文测试";
    const hash = await encodeShare(d);
    expect(hash).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(hash.length).toBeLessThan(60000);
    expect(await decodeShare(hash)).toEqual(d);
  });
  it("corrupt and oversized links fail safely", async () => {
    await expect(decodeShare("bad!!")).rejects.toThrow();
    await expect(decodeShare("A".repeat(60001))).rejects.toThrow();
    await expect(decodeShare("AAAA")).rejects.toThrow();
  });
  it("embedded raster images survive HTML and sharing", async () => {
    const d = blankDesign();
    const src = "data:image/png;base64,iVBORw0KGgo=";
    d.elements = [createElement("image", { src, padding: 0 })];
    expect(exportHtml(d)).toContain(src);
    expect((await decodeShare(await encodeShare(d))).elements[0].src).toBe(src);
  });
  it("AI handoff explicitly preserves original business logic", () => {
    const md = aiBrief(dashboardDesign());
    expect(md).toContain("不改变原有业务逻辑");
    expect(md).toContain("不是自动响应式");
    expect(md).toContain("新建项目按钮");
  });
  it("local save preserves other projects and replaces matching ID", () => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => storage.get(k) || null,
        setItem: (k: string, v: string) => storage.set(k, v),
      },
    });
    const a = blankDesign(),
      b = loginDesign();
    saveProject(a);
    saveProject(b);
    saveProject({ ...a, name: "已更新" });
    expect(loadProjects()).toHaveLength(2);
    expect(loadProjects()[0].name).toBe("已更新");
    expect(loadProjects()[1].id).toBe(b.id);
    storage.set(STORE_KEY, "broken");
    expect(loadProjects()).toEqual([]);
  });
});

describe("persistent data protection", () => {
  const storage = () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) || null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    return values;
  };
  it("keeps valid projects when one entry is corrupt and backs up original raw data", () => {
    const values = storage();
    const a = blankDesign();
    const raw = JSON.stringify([a, { version: 99, name: "broken" }]);
    values.set(STORE_KEY, raw);
    expect(loadProjects()).toEqual([a]);
    saveProject(loginDesign());
    expect(loadProjects()).toHaveLength(2);
    expect(values.get(`${STORE_KEY}.recovery`)).toBe(raw);
  });
  it("never overwrites unparseable storage or silently drops older projects", () => {
    const values = storage();
    values.set(STORE_KEY, "unparseable");
    expect(() => saveProject(blankDesign())).toThrow();
    expect(values.get(STORE_KEY)).toBe("unparseable");
    values.set(STORE_KEY, "[]");
    for (let n = 0; n < 31; n++) saveProject(blankDesign());
    expect(loadProjects()).toHaveLength(31);
  });
  it("refuses invalid current design without writing", () => {
    const values = storage();
    const d = blankDesign();
    saveProject(d);
    const before = values.get(STORE_KEY);
    expect(() =>
      saveProject({ ...d, elements: [createElement("text", { x: 10001 })] })
    ).toThrow();
    expect(values.get(STORE_KEY)).toBe(before);
  });
});
