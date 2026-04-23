const json = (r) => {
  if (!r.ok) throw new Error(`API error ${r.status}`);
  return r.json();
};

const post = (url, body) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);

const put = (url, body) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json);

const del = (url) => fetch(url, { method: 'DELETE' }).then(json);

export const api = {
  tags: {
    list: () => fetch('/api/tags').then(json),
    create: (tag) => post('/api/tags', tag),
    remove: (id) => del(`/api/tags/${id}`),
  },
  expenses: {
    list: () => fetch('/api/expenses').then(json),
    create: (expense) => post('/api/expenses', expense),
    update: (id, expense) => put(`/api/expenses/${id}`, expense),
    remove: (id) => del(`/api/expenses/${id}`),
  },
  budget: {
    income: {
      list: () => fetch('/api/budget/income').then(json),
      create: (item) => post('/api/budget/income', item),
      update: (id, item) => put(`/api/budget/income/${id}`, item),
      remove: (id) => del(`/api/budget/income/${id}`),
    },
    items: {
      list: () => fetch('/api/budget/items').then(json),
      create: (item) => post('/api/budget/items', item),
      update: (id, item) => put(`/api/budget/items/${id}`, item),
      remove: (id) => del(`/api/budget/items/${id}`),
    },
  },
};
