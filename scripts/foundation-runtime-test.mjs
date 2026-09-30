import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../foundation-runtime.js', import.meta.url), 'utf8');
let failWrites = false;
const listeners = {};
const localStorage = {
  values: new Map(),
  setItem(key, value) {
    if (failWrites) throw new Error('quota exceeded');
    this.values.set(key, String(value));
  },
  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  },
  removeItem(key) {
    this.values.delete(key);
  }
};
const sandbox = {
  console,
  document: {},
  window: {
    localStorage,
    addEventListener(type, handler) {
      listeners[type] = handler;
    }
  }
};

vm.runInNewContext(source, sandbox, { filename: 'foundation-runtime.js' });
const foundation = sandbox.window.NarrativeFoundation;
assert.equal(foundation.storage.available, true);

failWrites = true;
foundation.storage.setItem('project', '{"ok":true}');
assert.equal(foundation.storage.available, false);
assert.equal(foundation.storage.getItem('project'), '{"ok":true}');
foundation.storage.removeItem('project');
assert.equal(foundation.storage.getItem('project'), null);
assert.equal(typeof listeners.error, 'function');
assert.equal(typeof listeners.unhandledrejection, 'function');

console.log('Foundation runtime test passed: quota fallback and error hooks are available.');
