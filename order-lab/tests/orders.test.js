import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createOrder,
  transition,
  expire,
  quote,
  availableActions,
} from "../src/domain/orders.js";
const seed = JSON.parse(
  fs.readFileSync(new URL("../public/mockdata.json", import.meta.url)),
);
const setup = (changes = {}) => {
  const db = structuredClone(seed);
  db.orders = [];
  const input = {
    productId: "p1",
    skuId: "s1a",
    qty: 1,
    mode: "single",
    couponId: "",
    address: db.addresses[0],
    ...changes,
  };
  const o = createOrder(db, input, 1000);
  return { db, o };
};
const act = (db, o, a, p = {}, role = "buyer", now = 2000) =>
  transition(db, o.id, a, p, role, now);
const pay = (db, o) => act(db, o, "pay", { method: "微信支付" });
const ship = (db, o) =>
  act(
    db,
    o,
    "ship",
    { carrier: "顺丰速运", tracking: "SF12345678" },
    "merchant",
  );
test("单买完整闭环及重复支付/收货拦截", () => {
  const { db, o } = setup();
  pay(db, o);
  assert.equal(o.status, "toship");
  assert.throws(() => pay(db, o));
  ship(db, o);
  act(db, o, "receive");
  assert.equal(o.status, "completed");
  assert.throws(() => act(db, o, "receive"));
  act(db, o, "review", { rating: 5, content: "实际收到的商品很满意" });
  assert.equal(o.review.rating, 5);
  assert.throws(() =>
    act(db, o, "review", { rating: 5, content: "实际收到的商品很满意" }),
  );
});
test("拼单支付后必须成团才能发货", () => {
  const { db, o } = setup({ mode: "group" });
  pay(db, o);
  assert.equal(o.status, "grouping");
  assert.throws(() => ship(db, o));
  act(db, o, "join", {}, "simulator");
  ship(db, o);
  assert.equal(o.status, "shipped");
});
test("超时取消、恢复库存优惠券且重复扫描不重复释放", () => {
  const { db, o } = setup({ qty: 2, couponId: "c1" });
  const stock = db.products[0].skus[0].stock;
  assert.equal(db.coupons[0].orderId, o.id);
  expire(db, o.payDeadline);
  assert.equal(o.status, "closed");
  assert.equal(db.products[0].skus[0].stock, stock + 2);
  assert.equal(db.coupons[0].orderId, null);
  expire(db, o.payDeadline + 100);
  assert.equal(db.products[0].skus[0].stock, stock + 2);
});
test("拼单超时即使售后审核中也统一退款关闭", () => {
  const { db, o } = setup({ mode: "group" });
  pay(db, o);
  act(db, o, "refund", { type: "refund", reason: "不想要了" });
  expire(db, o.group.deadline);
  assert.equal(o.payment, "refunded");
  assert.equal(o.afterSale.status, "refunded");
  assert.equal(o.group.status, "failed");
  assert.equal(o.afterSales.length, 1);
});
test("退款暂停发货；撤销恢复；拒绝可重新申请", () => {
  const { db, o } = setup();
  pay(db, o);
  act(db, o, "refund", { type: "refund", reason: "暂时不需要" });
  assert.throws(() => ship(db, o));
  act(db, o, "withdraw");
  assert.ok(availableActions(o, "merchant").includes("ship"));
  act(db, o, "refund", { type: "refund", reason: "再次申请" });
  act(db, o, "reject", { reason: "请补充原因" }, "merchant");
  assert.equal(o.payment, "paid");
  act(db, o, "refund", { type: "refund", reason: "再次说明情况" });
  act(db, o, "approve", {}, "merchant");
  assert.equal(o.payment, "refunded");
  assert.equal(o.afterSales.length, 2);
});
test("退货退款须寄回并商家收货；不能提前退款", () => {
  const { db, o } = setup();
  pay(db, o);
  ship(db, o);
  act(db, o, "refund", { type: "return", reason: "尺码不合适" });
  act(db, o, "approve", {}, "merchant");
  assert.equal(o.afterSale.status, "returning");
  assert.throws(() => act(db, o, "refundReceived", {}, "merchant"));
  act(db, o, "return", { carrier: "中通", tracking: "ZT12345678" });
  act(db, o, "refundReceived", {}, "merchant");
  assert.equal(o.status, "closed");
  assert.equal(o.payment, "refunded");
  assert.throws(() => act(db, o, "refundReceived", {}, "merchant"));
});
test("角色检查、地址和物流校验", () => {
  const { db, o } = setup();
  assert.throws(() => act(db, o, "pay", { method: "微信支付" }, "merchant"));
  assert.throws(() =>
    act(db, o, "address", { name: "张", phone: "123", detail: "xx" }),
  );
  pay(db, o);
  assert.throws(() =>
    act(db, o, "ship", { carrier: "", tracking: "123" }, "merchant"),
  );
  ship(db, o);
  assert.throws(() => act(db, o, "address", db.addresses[0]));
});
test("数量、库存、优惠券、金额边界", () => {
  const db = structuredClone(seed),
    p = db.products[0];
  for (const q of [0, -1, 1.5, 21, NaN])
    assert.throws(() => quote(p, "s1a", q, "group", "", db.coupons));
  assert.throws(() => quote(p, "s1a", 1, "group", "c1", db.coupons));
  const q = quote(p, "s1a", 2, "single", "c1", db.coupons);
  assert.equal(q.total, 10480);
  assert.equal(q.shipping, 0);
  p.skus[0].stock = 0;
  assert.throws(() => quote(p, "s1a", 1, "single", "", db.coupons));
});
test("优惠券只能占用一次，下单保留地址和价格快照", () => {
  const { db, o } = setup({ qty: 2, couponId: "c1" });
  assert.throws(() =>
    createOrder(
      db,
      {
        productId: "p1",
        skuId: "s1a",
        qty: 2,
        mode: "single",
        couponId: "c1",
        address: db.addresses[0],
      },
      3000,
    ),
  );
  db.addresses[0].name = "其他";
  db.products[0].skus[0].price = 1;
  assert.equal(o.address.name, "林小满");
  assert.equal(o.unitPrice, 5490);
});
test("仅未发货禁止退货申请，完成15天后禁止售后", () => {
  const { db, o } = setup();
  pay(db, o);
  assert.throws(() =>
    act(db, o, "refund", { type: "return", reason: "不要了" }),
  );
  ship(db, o);
  act(db, o, "receive");
  assert.throws(() =>
    act(
      db,
      o,
      "refund",
      { type: "refund", reason: "不要了" },
      "buyer",
      2000 + 16 * 86400000,
    ),
  );
});
test("物流只有4个推进节点，不自动改变交易状态", () => {
  const { db, o } = setup();
  pay(db, o);
  ship(db, o);
  for (let i = 0; i < 4; i++) act(db, o, "logistics", {}, "simulator");
  assert.equal(o.logistics.length, 5);
  assert.equal(o.status, "shipped");
  assert.throws(() => act(db, o, "logistics", {}, "simulator"));
});
test("支付超时边界不能支付", () => {
  const { db, o } = setup();
  assert.throws(() =>
    act(db, o, "pay", { method: "微信支付" }, "buyer", o.payDeadline),
  );
});
test("已发货仅退款不回补库存；退货验收才回补", () => {
  for (const type of ["refund", "return"]) {
    const { db, o } = setup();
    pay(db, o);
    ship(db, o);
    const stock = db.products[0].skus[0].stock;
    act(db, o, "refund", { type, reason: "测试售后原因" });
    act(db, o, "approve", {}, "merchant");
    if (type === "return") {
      act(db, o, "return", { carrier: "中通", tracking: "ZT12345678" });
      act(db, o, "refundReceived", {}, "merchant");
    }
    assert.equal(
      db.products[0].skus[0].stock,
      stock + (type === "return" ? 1 : 0),
    );
  }
});
