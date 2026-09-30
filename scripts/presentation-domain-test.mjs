import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../presentation-domain.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox, { filename: 'presentation-domain.js' });
const domain = sandbox.window.NarrativePresentationDomain;
const project = {
  id: 'project_test',
  language: 'vi',
  brief: { objective: 'Test contract' },
  theme: { id: 'theme_test' },
  slides: [{ id: 'slide_test', intent: 'cover', layoutId: 'cover.v1', title: 'Tiêu đề', subtitle: 'Phụ đề', speakerNotes: 'Ghi chú', sourceRefs: ['src_test'] }],
  versions: [{ id: 'v1' }],
  currentVersionId: 'v1',
  qa: { status: 'passed', issues: [] }
};

const payload = domain.toPresentationJSON(project);
assert.equal(payload.schemaVersion, 'presentation-json.v1');
assert.equal(payload.slides[0].elements[0].content.text, 'Tiêu đề');
const validVerdict = domain.validatePresentationJSON(payload);
assert.equal(validVerdict.ok, true);
assert.equal(validVerdict.errors.length, 0);

const invalid = JSON.parse(JSON.stringify(payload));
invalid.slides[0].elements[1].id = invalid.slides[0].elements[0].id;
const verdict = domain.validatePresentationJSON(invalid);
assert.equal(verdict.ok, false);
assert.ok(verdict.errors.some((error) => error.includes('trùng')));

console.log('Presentation domain test passed: serialization and validation are isolated from DOM.');
