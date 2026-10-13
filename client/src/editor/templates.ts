import {
  blankDesign,
  createElement,
  type Design,
  type DesignElement,
} from "./model";

export function dashboardDesign(): Design {
  const d = { ...blankDesign(), name: "Orbit · 工作台", background: "#f8faf9" };
  const items: DesignElement[] = [];
  const box = (
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    background = "#ffffff",
    extra: Partial<DesignElement> = {}
  ) =>
    items.push(
      createElement("container", {
        name,
        x,
        y,
        width,
        height,
        background,
        padding: 0,
        ...extra,
      })
    );
  const text = (
    name: string,
    content: string,
    x: number,
    y: number,
    width: number,
    fontSize = 14,
    color = "#32433e",
    extra: Partial<DesignElement> = {}
  ) =>
    items.push(
      createElement("text", {
        name,
        text: content,
        x,
        y,
        width,
        height: Math.ceil(fontSize * 2),
        fontSize,
        color,
        ...extra,
      })
    );
  box("侧边导航", 0, 0, 194, 740, "#ffffff", {
    radius: 0,
    borderWidth: 1,
    borderColor: "#e8eeea",
  });
  box("品牌标记", 24, 30, 29, 29, "#197d70", { radius: 9 });
  text("品牌符号", "o", 31, 28, 22, 24, "#ffffff", { fontWeight: "700" });
  text("品牌名称", "orbit", 63, 26, 100, 25, "#233c33", { fontWeight: "700" });
  text("工作空间标签", "WORKSPACE", 26, 106, 150, 10, "#9aa69f", {
    fontWeight: "600",
  });
  box("当前导航", 14, 142, 165, 40, "#eaf4ef", { radius: 6 });
  ["▦   总览", "□   我的项目", "◷   任务日历", "♧   团队成员"].forEach((s, i) =>
    text(
      `导航 ${i + 1}`,
      s,
      27,
      150 + i * 51,
      140,
      13,
      i === 0 ? "#197d70" : "#7b8981",
      { fontWeight: i === 0 ? "600" : "400" }
    )
  );
  text("资源标签", "资源", 26, 391, 140, 11, "#9aa69f");
  ["▤   文件中心", "◈   项目设置"].forEach((s, i) =>
    text(`资源 ${i + 1}`, s, 27, 430 + i * 49, 140, 13, "#7b8981")
  );
  box("升级提示卡", 16, 584, 161, 91, "#f4f6f3", { radius: 8 });
  text("提示标题", "给好想法，多一点空间", 27, 598, 145, 11, "#4e6157", {
    fontWeight: "600",
  });
  text("提示说明", "探索更多团队协作可能", 27, 620, 142, 10, "#8b978f");
  text("升级链接", "了解专业版  ↗", 27, 646, 142, 11, "#197d70", {
    fontWeight: "600",
  });
  box("头像", 25, 699, 24, 24, "#e8eee7", { radius: 20 });
  text("头像字母", "L", 31, 701, 15, 11, "#597664", { fontWeight: "600" });
  text("用户名", "Lin's workspace", 58, 702, 124, 10, "#65776c");
  text("面包屑", "工作空间   /   总览", 228, 28, 350, 12, "#8a978f");
  box("顶栏分隔线", 194, 67, 906, 1, "#e8eeea", { radius: 0 });
  text("日期", "2026 年 10 月 14 日，星期三", 845, 29, 225, 11, "#8a978f", {
    align: "right",
  });
  text("欢迎标题", "早上好，Lin", 228, 97, 440, 29, "#273c31", {
    fontWeight: "600",
  });
  text(
    "欢迎说明",
    "让每一个好想法，都有条不紊地发生。",
    229,
    145,
    540,
    13,
    "#8b9890"
  );
  items.push(
    createElement("button", {
      id: "primary-button",
      name: "新建项目按钮",
      text: "+  新建项目",
      x: 926,
      y: 111,
      width: 138,
      height: 42,
      fontSize: 13,
      fontWeight: "500",
      background: "#197d70",
      radius: 7,
      shadow: "soft",
    })
  );
  const metrics = [
    { label: "进行中的项目", value: "12", change: "+ 2 个本周新增", icon: "□" },
    { label: "已完成任务", value: "86", change: "↑ 12.8% 较上周", icon: "✓" },
    { label: "团队效率", value: "94.2%", change: "↑ 4.6% 较上周", icon: "↗" },
  ];
  metrics.forEach((m, i) => {
    const x = 228 + 284 * i;
    box(`指标卡 ${i + 1}`, x, 197, 266, 140, "#ffffff", {
      borderWidth: 1,
      radius: 9,
    });
    text(`指标标题 ${i + 1}`, m.label, x + 20, 216, 190, 12, "#8b9790");
    text(`指标图标 ${i + 1}`, m.icon, x + 221, 214, 30, 18, "#7c9b88");
    text(`指标数值 ${i + 1}`, m.value, x + 20, 242, 210, 32, "#2d4436", {
      fontWeight: "600",
    });
    text(`指标变化 ${i + 1}`, m.change, x + 20, 302, 230, 10, "#659273");
  });
  box("项目列表卡", 228, 364, 535, 324, "#ffffff", {
    borderWidth: 1,
    radius: 9,
  });
  text("项目列表标题", "最近的项目", 249, 382, 290, 15, "#33483b", {
    fontWeight: "600",
  });
  text("查看全部", "查看全部  →", 651, 386, 91, 11, "#8b9890", {
    align: "right",
  });
  text("表头项目", "项目名称", 250, 430, 230, 10, "#96a198");
  text("表头状态", "状态", 541, 430, 80, 10, "#96a198");
  text("表头日期", "截止日期", 648, 430, 90, 10, "#96a198");
  [
    {
      name: "品牌官网改版",
      detail: "设计 · 8 个任务",
      color: "#ecf2e6",
      label: "进行中",
      date: "10 月 28 日",
    },
    {
      name: "移动端体验升级",
      detail: "产品 · 12 个任务",
      color: "#fbede2",
      label: "进行中",
      date: "11 月 02 日",
    },
    {
      name: "秋季营销计划",
      detail: "市场 · 6 个任务",
      color: "#e9edf7",
      label: "已完成",
      date: "10 月 12 日",
    },
  ].forEach((p, i) => {
    const y = 466 + i * 70;
    box(`项目分隔线 ${i}`, 248, y - 9, 495, 1, "#f0f3ef", { radius: 0 });
    box(`项目缩略块 ${i}`, 250, y + 4, 35, 35, p.color, { radius: 8 });
    text(
      `项目缩略字 ${i}`,
      ["B", "M", "A"][i],
      261,
      y + 10,
      24,
      14,
      "#798b6e",
      { fontWeight: "600" }
    );
    text(`项目名称 ${i}`, p.name, 300, y + 1, 222, 12, "#435647", {
      fontWeight: "500",
    });
    text(`项目详情 ${i}`, p.detail, 300, y + 25, 210, 10, "#a0aaa3");
    box(`状态底色 ${i}`, 532, y + 11, 63, 23, i === 2 ? "#edf0ed" : "#edf5ef", {
      radius: 4,
    });
    text(`项目状态 ${i}`, p.label, 540, y + 14, 50, 10, "#71917a", {
      align: "center",
    });
    text(`项目日期 ${i}`, p.date, 649, y + 15, 90, 10, "#8b9890");
  });
  box("周活动卡", 784, 364, 280, 324, "#ffffff", { borderWidth: 1, radius: 9 });
  text("活动标题", "本周活动", 805, 382, 170, 15, "#33483b", {
    fontWeight: "600",
  });
  text("活动统计", "32", 805, 425, 90, 30, "#2d4436", { fontWeight: "600" });
  text("活动说明", "个任务已完成", 863, 443, 170, 11, "#94a095");
  [52, 76, 63, 113, 86, 130, 72].forEach((h, i) => {
    box(
      `活动柱 ${i}`,
      808 + i * 34,
      621 - h,
      19,
      h,
      i === 5 ? "#197d70" : "#deebe1",
      { radius: 4 }
    );
    text(
      `星期 ${i}`,
      ["一", "二", "三", "四", "五", "六", "日"][i],
      808 + i * 34,
      636,
      20,
      10,
      "#9da79f",
      { align: "center" }
    );
  });
  text("页面脚注", "专注当下，让协作自然发生。", 230, 710, 540, 10, "#a8b1aa");
  d.elements = items;
  return d;
}
export function loginDesign(): Design {
  const d = {
    ...blankDesign(),
    name: "极简登录页",
    width: 900,
    height: 650,
    background: "#f1f5f2",
  };
  d.elements = [
    createElement("container", {
      name: "登录卡片",
      x: 250,
      y: 82,
      width: 400,
      height: 488,
      radius: 20,
      shadow: "medium",
    }),
    createElement("text", {
      name: "标题",
      text: "把想法变成现实",
      x: 290,
      y: 128,
      width: 320,
      height: 55,
      fontSize: 28,
      fontWeight: "600",
    }),
    createElement("text", {
      name: "说明",
      text: "登录你的工作空间，继续创造。",
      x: 290,
      y: 190,
      width: 320,
      fontSize: 14,
      color: "#94a095",
    }),
    createElement("text", {
      name: "邮箱标签",
      text: "电子邮箱",
      x: 290,
      y: 253,
      width: 300,
      fontSize: 13,
    }),
    createElement("input", {
      name: "邮箱输入框",
      text: "you@example.com",
      x: 290,
      y: 288,
      width: 320,
      color: "#9ca8a0",
    }),
    createElement("text", {
      name: "密码标签",
      text: "密码",
      x: 290,
      y: 353,
      width: 300,
      fontSize: 13,
    }),
    createElement("input", {
      name: "密码输入框",
      text: "••••••••",
      x: 290,
      y: 386,
      width: 320,
    }),
    createElement("button", {
      name: "登录按钮",
      text: "登录工作空间 →",
      x: 290,
      y: 469,
      width: 320,
      height: 46,
    }),
  ];
  return d;
}
