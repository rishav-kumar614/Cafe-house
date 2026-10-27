process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.ADMIN_EMAIL = 'owner@test.local';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.UPLOAD_DIR = (await import('node:path')).join((await import('node:os')).tmpdir(), 'ember-and-bean-test-uploads');

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

const { connectDatabase, disconnectDatabase } = await import('../src/db.js');
const { createApp } = await import('../src/app.js');
const { bootstrap } = await import('../src/seed/seed.js');
const { AdminUser } = await import('../src/models/AdminUser.js');
const { Order } = await import('../src/models/Order.js');

let app;
const XHR = { 'X-Requested-With': 'XMLHttpRequest' };

before(async () => {
  await connectDatabase({ inMemory: true });
  await bootstrap({ log: () => {} });
  app = createApp();
});

after(async () => {
  await disconnectDatabase();
});

async function product(slug) {
  const res = await request(app).get(`/api/products/${slug}`).expect(200);
  return res.body.product;
}

async function adminAgent(email = 'owner@test.local', password = 'test-password-123') {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set(XHR).send({ email, password }).expect(200);
  return agent;
}

describe('menu API', () => {
  test('health reports a connected database', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.equal(res.body.db, 'connected');
  });

  test('lists all 14 seeded categories with product counts', async () => {
    const res = await request(app).get('/api/categories').expect(200);
    assert.equal(res.body.categories.length, 14);
    assert.ok(res.body.categories.every((c) => c.productCount > 0));
  });

  test('filters products by category, diet and search', async () => {
    const pizza = await request(app).get('/api/products?category=pizza').expect(200);
    assert.equal(pizza.body.products.length, 7);

    const veg = await request(app).get('/api/products?veg=veg').expect(200);
    assert.ok(veg.body.products.length > 0 && veg.body.products.every((p) => p.isVeg));

    const nonVeg = await request(app).get('/api/products?veg=non-veg').expect(200);
    assert.ok(nonVeg.body.products.length > 0 && nonVeg.body.products.every((p) => !p.isVeg));

    const search = await request(app).get('/api/products?q=paneer').expect(200);
    assert.ok(search.body.products.some((p) => p.slug === 'paneer-tikka-pizza'));
    assert.ok(search.body.products.every((p) => JSON.stringify(p).toLowerCase().includes('paneer')));
  });

  test('a dish shared by several categories appears in each', async () => {
    for (const category of ['italian', 'snacks-sides', 'bakery']) {
      const res = await request(app).get(`/api/products?category=${category}`).expect(200);
      assert.ok(res.body.products.some((p) => p.slug === 'garlic-bread'), category);
    }
  });

  test('rejects operator injection in query strings', async () => {
    await request(app).get('/api/products?category[$ne]=x').expect(400);
    await request(app).get('/api/products?q[$regex]=.*').expect(400);
  });

  test('returns product details with related dishes', async () => {
    const res = await request(app).get('/api/products/cafe-latte').expect(200);
    assert.equal(res.body.product.name, 'Cafe Latte');
    assert.ok(res.body.related.length >= 2);
    await request(app).get('/api/products/does-not-exist').expect(404);
  });
});

describe('pricing and orders', () => {
  test('quote is calculated on the server from stored prices', async () => {
    const pizza = await product('margherita-pizza');
    const res = await request(app)
      .post('/api/orders/quote')
      .send({
        orderType: 'takeaway',
        items: [{ productId: pizza.id, quantity: 2, size: 'large', options: { crust: 'cheese-burst', extras: ['olives', 'cheese'] } }],
        total: 1, // ignored
      })
      .expect(200);
    const { quote } = res.body;
    // 249 + 300 (large) + 80 (cheese burst) + 40 (olives) + 60 (cheese) = 729 rupees each
    assert.equal(quote.lines[0].unitPrice, 72900);
    assert.equal(quote.subtotal, 145800);
    assert.equal(quote.tax, Math.round(145800 * 0.05));
    assert.equal(quote.packagingFee, 2000);
    assert.equal(quote.total, 145800 + 7290 + 2000);
  });

  test('rejects invalid selections', async () => {
    const pizza = await product('margherita-pizza');
    const bad = async (item, status = 400) =>
      request(app).post('/api/orders/quote').send({ items: [{ productId: pizza.id, quantity: 1, ...item }] }).expect(status);
    await bad({ options: {} }); // crust is required
    await bad({ size: 'gigantic', options: { crust: 'classic' } });
    await bad({ options: { crust: ['classic', 'thin'] } });
    await bad({ options: { crust: 'classic', extras: ['cheese', 'olives', 'jalapeno', 'mushroom', 'capsicum'] } });
    await bad({ options: { crust: 'classic', secret: 'x' } });
    await bad({ quantity: 0, options: { crust: 'classic' } });
    await bad({ quantity: 999, options: { crust: 'classic' } });
    await request(app).post('/api/orders/quote').send({ items: [] }).expect(400);
  });

  test('creates an order, stores it and lets only the token holder view it', async () => {
    const latte = await product('cafe-latte');
    const res = await request(app)
      .post('/api/orders')
      .send({
        orderType: 'dine-in',
        tableNumber: 7,
        customer: { name: 'Test Guest', phone: '+91 98765 43210', email: '' },
        items: [{ productId: latte.id, quantity: 3, size: 'large', options: { milk: 'oat', extras: ['shot'] } }],
        subtotal: 0,
        total: 0,
      })
      .expect(201);

    const { order, accessToken } = res.body;
    assert.match(order.orderNumber, /^EB-\d{6}-\d{4}$/);
    // 169 + 60 (large) + 40 (oat) + 40 (shot) = 309 each
    assert.equal(order.items[0].unitPrice, 30900);
    assert.equal(order.subtotal, 92700);
    assert.equal(order.packagingFee, 0);
    assert.equal(order.total, 92700 + Math.round(92700 * 0.05));

    const stored = await Order.findOne({ orderNumber: order.orderNumber }).lean();
    assert.equal(stored.customer.phone, '+91 98765 43210');
    assert.equal(stored.tableNumber, 7);
    assert.equal(stored.status, 'pending');

    await request(app).get(`/api/orders/${order.orderNumber}`).expect(404);
    await request(app).get(`/api/orders/${order.orderNumber}`).set('x-order-token', 'wrong').expect(404);
    const view = await request(app).get(`/api/orders/${order.orderNumber}`).set('x-order-token', accessToken).expect(200);
    assert.equal(view.body.order.total, order.total);
    assert.equal(view.body.order.customer.phone, undefined);
  });

  test('order numbers are unique', async () => {
    const tea = await product('green-tea');
    const make = () =>
      request(app)
        .post('/api/orders')
        .send({ orderType: 'takeaway', customer: { name: 'A B', phone: '9876543210' }, items: [{ productId: tea.id, quantity: 1 }] })
        .expect(201);
    const results = await Promise.all([make(), make(), make(), make()]);
    const numbers = new Set(results.map((r) => r.body.order.orderNumber));
    assert.equal(numbers.size, 4);
  });

  test('validates customer details', async () => {
    const tea = await product('green-tea');
    const res = await request(app)
      .post('/api/orders')
      .send({ orderType: 'pickup', customer: { name: 'A', phone: 'abc', email: 'nope' }, items: [{ productId: tea.id, quantity: 1 }] })
      .expect(400);
    const paths = res.body.issues.map((i) => i.path);
    assert.ok(paths.includes('orderType'));
    assert.ok(paths.includes('customer.name'));
    assert.ok(paths.includes('customer.phone'));
    assert.ok(paths.includes('customer.email'));
  });

  test('unavailable dishes cannot be ordered', async () => {
    const agent = await adminAgent();
    const fries = await product('french-fries');
    await agent.patch(`/api/admin/products/${fries.id}`).set(XHR).send({ isAvailable: false }).expect(200);
    const res = await request(app)
      .post('/api/orders/quote')
      .send({ items: [{ productId: fries.id, quantity: 1 }] })
      .expect(409);
    assert.match(res.body.error, /unavailable/);
    await agent.patch(`/api/admin/products/${fries.id}`).set(XHR).send({ isAvailable: true }).expect(200);
  });
});

describe('admin security', () => {
  test('admin endpoints require a session', async () => {
    await request(app).get('/api/admin/orders').expect(401);
    await request(app).get('/api/admin/products').expect(401);
    await request(app).post('/api/admin/categories').set(XHR).send({ name: 'Hack' }).expect(401);
    await request(app).put('/api/admin/settings').set(XHR).send({}).expect(401);
  });

  test('wrong password is rejected; forged cookies are rejected', async () => {
    await request(app).post('/api/auth/login').set(XHR).send({ email: 'owner@test.local', password: 'nope-nope-nope' }).expect(401);
    await request(app).post('/api/auth/login').set(XHR).send({ email: 'ghost@test.local', password: 'nope-nope-nope' }).expect(401);
    await request(app).get('/api/admin/orders').set('Cookie', 'eb_admin=forged.token.value').expect(401);
  });

  test('mutations require the CSRF header', async () => {
    const agent = await adminAgent();
    await agent.post('/api/admin/categories').send({ name: 'No Header' }).expect(403);
  });

  test('admin can manage categories, products and orders', async () => {
    const agent = await adminAgent();
    const cat = await agent.post('/api/admin/categories').set(XHR).send({ name: 'Seasonal Specials', station: 'pastry-case' }).expect(201);
    const catId = cat.body.category._id;

    const created = await agent
      .post('/api/admin/products')
      .set(XHR)
      .send({
        name: 'Mango Tart',
        categories: [catId],
        basePrice: 15000,
        isVeg: true,
        model: { kind: 'procedural', key: 'pastry', params: { flavor: 'pineapple' } },
      })
      .expect(201);
    const productId = created.body.product._id;

    await agent
      .put(`/api/admin/products/${productId}`)
      .set(XHR)
      .send({ name: 'Mango Tart', categories: [catId], basePrice: 17500, isVeg: true })
      .expect(200);
    const pub = await product('mango-tart');
    assert.equal(pub.basePrice, 17500);

    await agent.delete(`/api/admin/categories/${catId}`).set(XHR).expect(409);
    await agent.delete(`/api/admin/products/${productId}`).set(XHR).expect(200);
    await agent.delete(`/api/admin/categories/${catId}`).set(XHR).expect(200);

    const orders = await agent.get('/api/admin/orders').expect(200);
    assert.ok(orders.body.total >= 1);
    const id = orders.body.orders[0]._id;
    await agent.patch(`/api/admin/orders/${id}/status`).set(XHR).send({ status: 'completed' }).expect(409);
    await agent.patch(`/api/admin/orders/${id}/status`).set(XHR).send({ status: 'confirmed' }).expect(200);
    const detail = await agent.get(`/api/admin/orders/${id}`).expect(200);
    assert.equal(detail.body.order.status, 'confirmed');
    assert.deepEqual(detail.body.allowedTransitions, ['preparing', 'cancelled']);
  });

  test('staff can manage orders but not the catalog', async () => {
    await AdminUser.create({ email: 'staff@test.local', role: 'staff', passwordHash: await AdminUser.hashPassword('staff-password-1') });
    const staff = await adminAgent('staff@test.local', 'staff-password-1');
    await staff.get('/api/admin/orders').expect(200);
    await staff.post('/api/admin/categories').set(XHR).send({ name: 'Nope' }).expect(403);
    await staff.get('/api/admin/settings').expect(403);
    const tea = await product('green-tea');
    await staff.patch(`/api/admin/products/${tea.id}`).set(XHR).send({ basePrice: 1 }).expect(403);
    await staff.patch(`/api/admin/products/${tea.id}`).set(XHR).send({ isAvailable: true }).expect(200);
  });

  test('uploads accept real images only', async () => {
    const agent = await adminAgent();
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const ok = await agent.post('/api/admin/uploads/image').set(XHR).attach('file', png, 'dot.png').expect(201);
    assert.match(ok.body.url, /^\/uploads\/images\/.+\.png$/);
    await request(app).get(ok.body.url).expect(200);
    await agent.post('/api/admin/uploads/image').set(XHR).attach('file', Buffer.from('<script>alert(1)</script>'), 'evil.png').expect(415);
    await agent.post('/api/admin/uploads/model').set(XHR).attach('file', png, 'fake.glb').expect(415);
  });

  test('logout clears the session', async () => {
    const agent = await adminAgent();
    await agent.get('/api/auth/me').expect(200);
    await agent.post('/api/auth/logout').set(XHR).expect(200);
    await agent.get('/api/auth/me').expect(401);
  });
});
