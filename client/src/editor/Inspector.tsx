import { useEffect, useState } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  LockKeyhole,
  SlidersHorizontal,
  MousePointer2,
} from "lucide-react";
import { type Design, type DesignElement, typeNames } from "./model";

export function NumericField({
  label,
  value,
  onChange,
  min = 0,
  max = 5000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        aria-label={label}
        value={Number(value.toFixed(2))}
        min={min}
        max={max}
        step={step}
        onChange={ev => {
          if (ev.target.value !== "") {
            const n = Number(ev.target.value);
            if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
          }
        }}
      />
    </label>
  );
}
export function ColorField({
  label,
  value,
  onChange,
  transparent = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  transparent?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const apply = () => {
    const v = draft.trim();
    if (
      /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v) ||
      (transparent && v === "transparent")
    )
      onChange(v);
    else setDraft(value);
  };
  return (
    <div className="color-property">
      <span className="property-label">{label}</span>
      <div className="color-row">
        <label
          className={`color-swatch ${value === "transparent" ? "transparent" : ""}`}
          style={{ backgroundColor: value }}
        >
          <input
            aria-label={`${label}颜色`}
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#ffffff"}
            onChange={ev => onChange(ev.target.value)}
          />
        </label>
        <input
          aria-label={`${label}色值`}
          className="color-code"
          value={draft}
          onChange={ev => setDraft(ev.target.value)}
          onBlur={apply}
          onKeyDown={ev => {
            if (ev.key === "Enter") ev.currentTarget.blur();
          }}
        />
        {transparent && (
          <button
            className={`icon-button tiny ${value === "transparent" ? "active" : ""}`}
            title="设为透明"
            aria-label={`${label}设为透明`}
            onClick={() => onChange("transparent")}
          >
            ∅
          </button>
        )}
      </div>
    </div>
  );
}
export default function Inspector({
  design,
  element: e,
  update,
  updateDesign,
  duplicate,
  remove,
  onImage,
}: {
  design: Design;
  element?: DesignElement;
  update: (p: Partial<DesignElement>) => void;
  updateDesign: (p: Partial<Design>) => void;
  duplicate: () => void;
  remove: () => void;
  onImage: () => void;
}) {
  const disabled = e?.locked;
  return (
    <aside className="inspector panel">
      <div className="panel-header">
        <span>设计属性</span>
        <SlidersHorizontal size={15} />
      </div>
      {!e ? (
        <>
          <div className="inspector-intro">
            <div className="element-icon">
              <MousePointer2 size={19} />
            </div>
            <div>
              <strong>画布设置</strong>
              <small>选取元件以编辑样式</small>
            </div>
          </div>
          <section className="property-section">
            <h3>画布尺寸</h3>
            <div className="field-grid">
              <NumericField
                label="宽度"
                value={design.width}
                min={200}
                max={4000}
                onChange={width => updateDesign({ width })}
              />
              <NumericField
                label="高度"
                value={design.height}
                min={200}
                max={4000}
                onChange={height => updateDesign({ height })}
              />
            </div>
            <ColorField
              label="背景填充"
              value={design.background}
              transparent={false}
              onChange={background => updateDesign({ background })}
            />
          </section>
          <div className="inspector-note">
            每一个细节都由你决定。
            <br />
            在画布上点击元件，开始调整。
          </div>
        </>
      ) : (
        <>
          <div className="inspector-intro">
            <div className="element-icon">
              {e.type === "text" ? "T" : e.type === "button" ? "▣" : "□"}
            </div>
            <div>
              <strong>{e.name}</strong>
              <small>
                {typeNames[e.type]}元件{e.locked ? " · 已锁定" : ""}
              </small>
            </div>
            <button
              className="icon-button tiny"
              aria-label="锁定图层"
              onClick={() => update({ locked: !e.locked })}
            >
              <LockKeyhole size={14} />
            </button>
          </div>
          <fieldset disabled={disabled}>
            <section className="property-section">
              <h3>
                位置与尺寸 <span>px</span>
              </h3>
              <div className="field-grid">
                <NumericField
                  label="X"
                  value={e.x}
                  min={-10000}
                  max={10000}
                  onChange={x => update({ x })}
                />
                <NumericField
                  label="Y"
                  value={e.y}
                  min={-10000}
                  max={10000}
                  onChange={y => update({ y })}
                />
                <NumericField
                  label="W"
                  value={e.width}
                  min={1}
                  onChange={width => update({ width })}
                />
                <NumericField
                  label="H"
                  value={e.height}
                  min={1}
                  onChange={height => update({ height })}
                />
              </div>
            </section>
            <section className="property-section">
              <h3>内容与排版</h3>
              <label className="property-label" htmlFor="layer-name">
                图层名称
              </label>
              <input
                id="layer-name"
                className="text-field"
                value={e.name}
                maxLength={100}
                onChange={ev => update({ name: ev.target.value })}
              />
              {e.type !== "container" && (
                <>
                  <label className="property-label" htmlFor="element-text">
                    {e.type === "image" ? "占位说明" : "文字内容"}
                  </label>
                  <textarea
                    id="element-text"
                    rows={2}
                    value={e.text}
                    maxLength={10000}
                    onChange={ev => update({ text: ev.target.value })}
                  />
                  {e.type === "image" && (
                    <button className="secondary-button full" onClick={onImage}>
                      上传图片
                    </button>
                  )}
                </>
              )}
              <select
                aria-label="字体"
                className="select-field"
                value={e.fontFamily}
                onChange={ev =>
                  update({
                    fontFamily: ev.target.value as DesignElement["fontFamily"],
                  })
                }
              >
                <option value="system-ui">系统字体 · System UI</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia · 衬线</option>
                <option value="monospace">Monospace · 等宽</option>
              </select>
              <div className="field-grid">
                <NumericField
                  label="字号"
                  value={e.fontSize}
                  min={1}
                  max={300}
                  onChange={fontSize => update({ fontSize })}
                />
                <select
                  className="select-field"
                  aria-label="字重"
                  value={e.fontWeight}
                  onChange={ev =>
                    update({
                      fontWeight: ev.target
                        .value as DesignElement["fontWeight"],
                    })
                  }
                >
                  <option value="400">常规 400</option>
                  <option value="500">中等 500</option>
                  <option value="600">半粗 600</option>
                  <option value="700">粗体 700</option>
                </select>
                <NumericField
                  label="行高"
                  value={e.lineHeight}
                  min={0.5}
                  max={5}
                  step={0.1}
                  onChange={lineHeight => update({ lineHeight })}
                />
                <NumericField
                  label="内距"
                  value={e.padding}
                  max={200}
                  onChange={padding => update({ padding })}
                />
              </div>
              <div className="segmented align-segment">
                {(["left", "center", "right"] as const).map((a, i) => {
                  const Icon = [AlignLeft, AlignCenter, AlignRight][i];
                  return (
                    <button
                      key={a}
                      aria-label={["文字左对齐", "文字居中", "文字右对齐"][i]}
                      className={e.align === a ? "active" : ""}
                      onClick={() => update({ align: a })}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </section>
            <section className="property-section">
              <h3>外观</h3>
              <ColorField
                label="填充"
                value={e.background}
                onChange={background => update({ background })}
              />
              <ColorField
                label="文字颜色"
                value={e.color}
                onChange={color => update({ color })}
              />
              <div className="field-grid">
                <NumericField
                  label="圆角"
                  value={e.radius}
                  max={500}
                  onChange={radius => update({ radius })}
                />
                <NumericField
                  label="透明度 %"
                  value={e.opacity}
                  max={100}
                  onChange={opacity => update({ opacity })}
                />
              </div>
            </section>
            <section className="property-section">
              <h3>描边与效果</h3>
              <ColorField
                label="边框颜色"
                value={e.borderColor}
                onChange={borderColor => update({ borderColor })}
              />
              <NumericField
                label="描边宽度"
                value={e.borderWidth}
                max={30}
                onChange={borderWidth => update({ borderWidth })}
              />
              <label className="property-label" htmlFor="shadow">
                阴影
              </label>
              <select
                id="shadow"
                className="select-field"
                value={e.shadow}
                onChange={ev =>
                  update({ shadow: ev.target.value as DesignElement["shadow"] })
                }
              >
                <option value="none">无阴影</option>
                <option value="soft">轻柔 · Soft</option>
                <option value="medium">浮起 · Medium</option>
                <option value="strong">悬浮 · Strong</option>
              </select>
            </section>
          </fieldset>
          <div className="layer-actions">
            <button className="secondary-button" onClick={duplicate}>
              <Copy size={14} />
              复制元件
            </button>
            <button
              className="icon-button danger"
              aria-label="删除元件"
              disabled={disabled}
              onClick={remove}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </>
      )}
      <div className="inspector-footer">
        <span className="status-dot" />
        纯视觉设计 · 不修改原软件
      </div>
    </aside>
  );
}
