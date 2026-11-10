import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leaveInput, profileInput, staffInput } from '../lib/validation';

test('personal updates cannot assign roles or another staff identifier', () => {
  assert.equal(profileInput.safeParse({ name: 'Example', email: 'example@university.example', phone: '', role: 'Administrator' }).success, false);
  assert.equal(profileInput.safeParse({ name: 'Example', email: 'example@university.example', phone: '', id: 2 }).success, false);
});
test('leave dates reject reversed ranges and impossible calendar dates', () => {
  const request = { staffId: 7, start: '2026-12-10', end: '2026-12-09', type: 'Annual leave', reason: 'Family visit' };
  assert.equal(leaveInput.safeParse(request).success, false);
  assert.equal(leaveInput.safeParse({ ...request, start: '2026-02-30', end: '2026-03-01' }).success, false);
});
test('password validation rejects a multibyte value exceeding bcrypt’s byte limit', () => {
  const staff = { name: 'Example', email: 'example@university.example', departmentId: 1, position: 'Lecturer', role: 'Staff Member', phone: '', status: 'Active', password: '密'.repeat(30) };
  assert.equal(staffInput.safeParse(staff).success, false);
});
