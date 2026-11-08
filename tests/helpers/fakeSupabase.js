// Minimal stand-in for the Supabase client used by lib/server/api/*. Every
// supabase.from(table) chain is recorded in `log` as { table, ops: [[method,
// ...args]] } and resolves to whatever `respond(entry)` returns, so tests can
// assert which queries were sent and feed back rows.
//
// Use from a test with:
//   jest.mock('../../lib/server/supabase', () => require('./fakeSupabase').module);
//   const fake = require('./fakeSupabase');
const METHODS = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'is', 'not', 'in', 'lt', 'order', 'single'];

const state = {
  log: [],
  respond: () => ({ data: [], error: null }),
  userId: 'user-1',
};

const from = (table) => {
  const entry = { table, ops: [] };
  state.log.push(entry);
  const builder = {};
  for (const m of METHODS) {
    builder[m] = (...args) => {
      entry.ops.push([m, ...args]);
      return builder;
    };
  }
  builder.then = (resolve, reject) =>
    Promise.resolve()
      .then(() => state.respond(entry))
      .then(resolve, reject);
  return builder;
};

const client = {
  from,
  rpc: jest.fn(async () => ({ data: [], error: null })),
  auth: {
    getUser: jest.fn(async () => ({ data: { user: { id: state.userId } }, error: null })),
    getSession: jest.fn(async () => ({ data: { session: { user: { id: state.userId } } } })),
    signOut: jest.fn(async () => ({ error: null })),
  },
};

const reset = () => {
  state.log = [];
  state.respond = () => ({ data: [], error: null });
};

// Helpers for assertions.
const opsOf = (entry, method) => entry.ops.filter(([m]) => m === method);
const hasOp = (entry, method, ...args) =>
  entry.ops.some(([m, ...a]) => m === method && args.every((x, i) => JSON.stringify(a[i]) === JSON.stringify(x)));

module.exports = { module: { supabase: client }, client, state, reset, opsOf, hasOp };
