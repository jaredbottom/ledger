import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { createClient } from '@libsql/client/web';

const app = new Hono().basePath('/api');

// Module-level flag — runs once per Worker instance (not every request)
let migrated = false;

function getDb(env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

async function migrate(db) {
  if (migrated) return;
  await db.batch([
    { sql: `CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color_bg TEXT NOT NULL,
      color_text TEXT NOT NULL,
      color_border TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      place TEXT NOT NULL,
      card TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS expense_tags (
      expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (expense_id, tag_id)
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS budget_income (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      tax_rate REAL DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS budget_income_tags (
      income_id TEXT NOT NULL REFERENCES budget_income(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (income_id, tag_id)
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS budget_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      created_at INTEGER DEFAULT (unixepoch())
    )`, args: [] },
    { sql: `CREATE TABLE IF NOT EXISTS budget_item_tags (
      item_id TEXT NOT NULL REFERENCES budget_items(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    )`, args: [] },
  ]);
  migrated = true;
}

// Run migrations before any API handler
app.use('*', async (c, next) => {
  await migrate(getDb(c.env));
  await next();
});

function rowToTag(row) {
  return {
    id: row.id,
    name: row.name,
    color: { bg: row.color_bg, text: row.color_text, border: row.color_border },
  };
}

// ── Tags ──────────────────────────────────────────────────────────────────────

app.get('/tags', async (c) => {
  const db = getDb(c.env);
  const result = await db.execute('SELECT * FROM tags ORDER BY created_at');
  return c.json(result.rows.map(rowToTag));
});

app.post('/tags', async (c) => {
  const { id, name, color } = await c.req.json();
  const db = getDb(c.env);
  await db.execute({
    sql: 'INSERT INTO tags (id, name, color_bg, color_text, color_border) VALUES (?, ?, ?, ?, ?)',
    args: [id, name, color.bg, color.text, color.border],
  });
  return c.json({ id, name, color }, 201);
});

app.delete('/tags/:id', async (c) => {
  const db = getDb(c.env);
  await db.execute({ sql: 'DELETE FROM tags WHERE id = ?', args: [c.req.param('id')] });
  return c.json({ ok: true });
});

// ── Expenses ──────────────────────────────────────────────────────────────────

app.get('/expenses', async (c) => {
  const db = getDb(c.env);
  const [expenses, tagLinks] = await Promise.all([
    db.execute('SELECT * FROM expenses ORDER BY date DESC, created_at DESC'),
    db.execute('SELECT expense_id, tag_id FROM expense_tags'),
  ]);

  const tagMap = {};
  tagLinks.rows.forEach((r) => {
    if (!tagMap[r.expense_id]) tagMap[r.expense_id] = [];
    tagMap[r.expense_id].push(r.tag_id);
  });

  return c.json(
    expenses.rows.map((row) => ({
      id: row.id,
      amount: row.amount,
      place: row.place,
      card: row.card || '',
      date: row.date,
      tags: tagMap[row.id] || [],
    }))
  );
});

app.post('/expenses', async (c) => {
  const { id, amount, place, card, date, tags } = await c.req.json();
  const db = getDb(c.env);
  await db.batch([
    { sql: 'INSERT INTO expenses (id, amount, place, card, date) VALUES (?, ?, ?, ?, ?)', args: [id, amount, place, card || '', date] },
    ...(tags || []).map((tagId) => ({ sql: 'INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)', args: [id, tagId] })),
  ]);
  return c.json({ id, amount, place, card: card || '', date, tags: tags || [] }, 201);
});

app.put('/expenses/:id', async (c) => {
  const id = c.req.param('id');
  const { amount, place, card, date, tags } = await c.req.json();
  const db = getDb(c.env);
  await db.batch([
    { sql: 'UPDATE expenses SET amount = ?, place = ?, card = ?, date = ? WHERE id = ?', args: [amount, place, card || '', date, id] },
    { sql: 'DELETE FROM expense_tags WHERE expense_id = ?', args: [id] },
    ...(tags || []).map((tagId) => ({ sql: 'INSERT INTO expense_tags (expense_id, tag_id) VALUES (?, ?)', args: [id, tagId] })),
  ]);
  return c.json({ id, amount, place, card: card || '', date, tags: tags || [] });
});

app.delete('/expenses/:id', async (c) => {
  const db = getDb(c.env);
  await db.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [c.req.param('id')] });
  return c.json({ ok: true });
});

// ── Budget Income ─────────────────────────────────────────────────────────────

app.get('/budget/income', async (c) => {
  const db = getDb(c.env);
  const [rows, tagLinks] = await Promise.all([
    db.execute('SELECT * FROM budget_income ORDER BY created_at'),
    db.execute('SELECT income_id, tag_id FROM budget_income_tags'),
  ]);

  const tagMap = {};
  tagLinks.rows.forEach((r) => {
    if (!tagMap[r.income_id]) tagMap[r.income_id] = [];
    tagMap[r.income_id].push(r.tag_id);
  });

  return c.json(
    rows.rows.map((row) => ({
      id: row.id,
      name: row.name,
      amount: row.amount,
      frequency: row.frequency,
      taxRate: row.tax_rate,
      tags: tagMap[row.id] || [],
    }))
  );
});

app.post('/budget/income', async (c) => {
  const { id, name, amount, frequency, taxRate, tags } = await c.req.json();
  const db = getDb(c.env);
  await db.batch([
    { sql: 'INSERT INTO budget_income (id, name, amount, frequency, tax_rate) VALUES (?, ?, ?, ?, ?)', args: [id, name, amount, frequency, taxRate || 0] },
    ...(tags || []).map((tagId) => ({ sql: 'INSERT INTO budget_income_tags (income_id, tag_id) VALUES (?, ?)', args: [id, tagId] })),
  ]);
  return c.json({ id, name, amount, frequency, taxRate: taxRate || 0, tags: tags || [] }, 201);
});

app.put('/budget/income/:id', async (c) => {
  const id = c.req.param('id');
  const { name, amount, frequency, taxRate, tags } = await c.req.json();
  const db = getDb(c.env);
  await db.batch([
    { sql: 'UPDATE budget_income SET name = ?, amount = ?, frequency = ?, tax_rate = ? WHERE id = ?', args: [name, amount, frequency, taxRate || 0, id] },
    { sql: 'DELETE FROM budget_income_tags WHERE income_id = ?', args: [id] },
    ...(tags || []).map((tagId) => ({ sql: 'INSERT INTO budget_income_tags (income_id, tag_id) VALUES (?, ?)', args: [id, tagId] })),
  ]);
  return c.json({ id, name, amount, frequency, taxRate: taxRate || 0, tags: tags || [] });
});

app.delete('/budget/income/:id', async (c) => {
  const db = getDb(c.env);
  await db.execute({ sql: 'DELETE FROM budget_income WHERE id = ?', args: [c.req.param('id')] });
  return c.json({ ok: true });
});

// ── Budget Items ──────────────────────────────────────────────────────────────

app.get('/budget/items', async (c) => {
  const db = getDb(c.env);
  const [rows, tagLinks] = await Promise.all([
    db.execute('SELECT * FROM budget_items ORDER BY created_at'),
    db.execute('SELECT item_id, tag_id FROM budget_item_tags'),
  ]);

  const tagMap = {};
  tagLinks.rows.forEach((r) => {
    if (!tagMap[r.item_id]) tagMap[r.item_id] = [];
    tagMap[r.item_id].push(r.tag_id);
  });

  return c.json(
    rows.rows.map((row) => ({
      id: row.id,
      name: row.name,
      amount: row.amount,
      frequency: row.frequency,
      tags: tagMap[row.id] || [],
    }))
  );
});

app.post('/budget/items', async (c) => {
  const { id, name, amount, frequency, tags } = await c.req.json();
  const db = getDb(c.env);
  await db.batch([
    { sql: 'INSERT INTO budget_items (id, name, amount, frequency) VALUES (?, ?, ?, ?)', args: [id, name, amount, frequency] },
    ...(tags || []).map((tagId) => ({ sql: 'INSERT INTO budget_item_tags (item_id, tag_id) VALUES (?, ?)', args: [id, tagId] })),
  ]);
  return c.json({ id, name, amount, frequency, tags: tags || [] }, 201);
});

app.put('/budget/items/:id', async (c) => {
  const id = c.req.param('id');
  const { name, amount, frequency, tags } = await c.req.json();
  const db = getDb(c.env);
  await db.batch([
    { sql: 'UPDATE budget_items SET name = ?, amount = ?, frequency = ? WHERE id = ?', args: [name, amount, frequency, id] },
    { sql: 'DELETE FROM budget_item_tags WHERE item_id = ?', args: [id] },
    ...(tags || []).map((tagId) => ({ sql: 'INSERT INTO budget_item_tags (item_id, tag_id) VALUES (?, ?)', args: [id, tagId] })),
  ]);
  return c.json({ id, name, amount, frequency, tags: tags || [] });
});

app.delete('/budget/items/:id', async (c) => {
  const db = getDb(c.env);
  await db.execute({ sql: 'DELETE FROM budget_items WHERE id = ?', args: [c.req.param('id')] });
  return c.json({ ok: true });
});

export const onRequest = handle(app);
