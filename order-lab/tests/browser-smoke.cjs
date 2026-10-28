const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:5173");
  await page.getByRole("heading", { name: "我的订单", exact: true }).waitFor();
  await page.getByRole("link", { name: "＋ 创建新订单" }).click();
  await page
    .getByRole("button", { name: "去下单", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "提交订单", exact: true }).click();
  await page.getByRole("heading", { name: "订单详情", exact: true }).waitFor();
  async function action(name, fill) {
    await page.getByRole("button", { name, exact: true }).click();
    if (fill) await fill();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "确认" + name, exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  await action("模拟支付");
  await action("模拟好友参团");
  await page.getByRole("button", { name: "商家视角", exact: true }).click();
  await action("确认发货", async () => {
    await page
      .getByRole("textbox", { name: "快递单号", exact: true })
      .fill("SF1234567890");
  });
  await action("推进物流");
  await page.getByRole("button", { name: "买家视角", exact: true }).click();
  await action("确认收货");
  await action("评价商品", async () => {
    await page
      .getByRole("textbox", { name: "评价内容" })
      .fill("实物非常不错，下次还会继续购买。");
  });
  await page.getByRole("heading", { name: "我的评价", exact: true }).waitFor();
  await action("申请售后", async () => {
    await page.getByLabel("售后类型").selectOption("return");
    await page
      .getByRole("textbox", { name: "原因", exact: true })
      .fill("实际大小不合适，申请退货退款");
  });
  await page.getByRole("button", { name: "商家视角", exact: true }).click();
  await action("同意售后");
  await page.getByRole("button", { name: "买家视角", exact: true }).click();
  await action("填写退货单号", async () => {
    await page
      .getByRole("textbox", { name: "快递单号", exact: true })
      .fill("ZT1234567890");
  });
  await page.getByRole("button", { name: "商家视角", exact: true }).click();
  await action("收货并退款");
  assert.ok((await page.locator("body").innerText()).includes("退款成功"));
  await page.reload();
  await page.getByRole("heading", { name: "订单详情", exact: true }).waitFor();
  assert.ok((await page.locator("body").innerText()).includes("退款成功"));
  await page.goto("http://127.0.0.1:5173/#/orders");
  await page.getByRole("heading", { name: "我的订单", exact: true }).waitFor();
  await page.getByRole("textbox", { name: "搜索订单" }).fill("不存在的商品XYZ");
  await page.getByRole("heading", { name: "没有符合条件的订单" }).waitFor();
  await page.getByRole("button", { name: "重置", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  await page.goto("http://127.0.0.1:5173/#/lab");
  await page.getByRole("button", { name: "快进 25 小时", exact: true }).click();
  await page.getByRole("button", { name: "确认操作", exact: true }).click();
  const db = await page.evaluate(
    () => JSON.parse(localStorage.getItem("pinxiang-order-lab-v1")).db,
  );
  assert.ok(!db.orders.some((o) => ["unpaid", "grouping"].includes(o.status)));
  await page.getByRole("button", { name: "恢复初始数据" }).click();
  await page.getByRole("button", { name: "确认操作", exact: true }).click();
  await page
    .getByRole("heading", { name: "演示控制台", exact: true })
    .waitFor();
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("pinxiang-order-lab-v1")).db.orders
          .length,
    ),
    12,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: create/pay/group/ship/logistics/receive/review/return/refund/reload/search/mobile/timeout/reset; zero pageerrors",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
