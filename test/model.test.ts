import assert from 'node:assert/strict';
import { describe as group, test } from 'node:test';
import { buildModel, describe, heatCounts, MapDataError } from '../src/model.ts';

group('buildModel', () => {
  test('reads nested capabilities, giving each an id from its name path', () => {
    const model = buildModel([{ name: 'Teaching', children: [{ name: 'Courses' }] }]);
    assert.deepEqual([...model.byId.keys()], ['Teaching', 'Teaching > Courses']);
    assert.equal(model.byId.get('Teaching > Courses')!.parent!.name, 'Teaching');
  });

  test('reads a flat list with parent ids, keeping its order', () => {
    const model = buildModel({
      capabilities: [
        { id: 'b', name: 'B', parent: 'a' },
        { id: 'a', name: 'A' },
        { id: 'c', name: 'C', parent: 'a' },
      ],
    });
    assert.deepEqual(model.roots.map((root) => root.id), ['a']);
    assert.deepEqual(model.roots[0].children.map((child) => child.id), ['b', 'c']);
  });

  test('draws each level by how deep the model goes beneath it and its siblings', () => {
    const model = buildModel([
      { name: 'Deep', children: [{ name: 'Mid', children: [{ name: 'Leaf' }] }, { name: 'Lone' }] },
      { name: 'Shallow' },
    ]);
    const role = (id: string) => model.byId.get(id)!.role;
    assert.equal(role('Deep'), 'column');
    assert.equal(role('Shallow'), 'column', 'shares the look of the deepest beside it');
    assert.equal(role('Deep > Mid'), 'panel');
    assert.equal(role('Deep > Lone'), 'panel');
    assert.equal(role('Deep > Mid > Leaf'), 'card');
  });

  test('a list with no levels is all cards, and five or more levels top out at sections', () => {
    assert.equal(buildModel([{ name: 'A' }]).roots[0].role, 'card');
    let deep: { name: string; children?: unknown[] } = { name: 'L6' };
    for (let level = 5; level >= 1; level--) {
      deep = { name: `L${level}`, children: [deep] };
    }
    assert.equal(buildModel([deep as never]).roots[0].role, 'section');
  });

  test('says what is wrong with data it cannot draw', () => {
    assert.throws(() => buildModel({} as never), /"capabilities" list/);
    assert.throws(() => buildModel([{ name: '' }]), /needs a name/);
    assert.throws(() => buildModel([{ id: 'x', name: 'A' }, { id: 'x', name: 'B' }]), /share the id "x"/);
    assert.throws(() => buildModel([{ id: 'a', name: 'A', parent: 'missing' }]), /isn't in the map/);
    assert.throws(
      () => buildModel([{ id: 'a', name: 'A', parent: 'b' }, { id: 'b', name: 'B', parent: 'a' }]),
      (error: Error) => error instanceof MapDataError && /inside itself/.test(error.message),
    );
  });
});

group('heat', () => {
  const model = buildModel({
    legend: [
      { value: 'high', label: 'At risk', color: '#d63939' },
      { value: 'ok', label: 'Healthy', color: '#2fb344' },
    ],
    capabilities: [
      { name: 'Parent', heat: 'high', children: [{ name: 'One', heat: 'high', count: 3 }, { name: 'Two', heat: 'ok' }] },
    ],
  });

  test('counts only the capabilities at the bottom', () => {
    assert.deepEqual(Object.fromEntries(heatCounts(model)), { high: 1, ok: 1 });
  });

  test('describes a capability in words, not only colour', () => {
    assert.equal(describe(model, model.byId.get('Parent > One')!), 'One, At risk, 3');
  });
});
