import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { schoolAffiliationHandlers } from '../src/mocks/handlers/schoolAffiliations.ts';
import { adminHandlers } from '../src/mocks/handlers/admin.ts';
import { seedSchoolAffiliations } from '../src/mocks/data/schoolAffiliationsLocal.ts';

const handlers = [...schoolAffiliationHandlers, ...adminHandlers].map((handler) =>
  http[handler.info.method.toLowerCase()](`http://localhost${handler.info.path}`, handler.resolver));
const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: 'error' });
after(() => server.close());

const call = async (path, user, method = 'GET', body) => {
  const response = await fetch(`http://localhost/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer mock_jwt_token_${user}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, ...(await response.json()) };
};

test('School Admin sees only assigned university and cannot use System Admin role management', async () => {
  const schoolAdmin = 'usr_schooladmin_10';
  const queue = await call('/admin/school-affiliations', schoolAdmin);
  assert.equal(queue.status, 200);
  assert.ok(queue.data.every((item) => item.school === 'Đại học FPT Hà Nội'));
  assert.equal((await call('/admin/school-affiliations', 'usr_opsmanager_06')).status, 403);
  assert.equal((await call('/admin/admins', schoolAdmin)).status, 403);
  const foreign = { ...seedSchoolAffiliations[0], id: 'aff_foreign', school: 'Đại học FPT TP.HCM', status: 'Pending' };
  seedSchoolAffiliations.push(foreign);
  try {
    assert.equal((await call(`/admin/school-affiliations/${foreign.id}/decision`, schoolAdmin, 'POST', { decision: 'Verified' })).status, 403);
    assert.ok(!(await call('/admin/school-affiliations', schoolAdmin)).data.some((item) => item.id === foreign.id));
  } finally {
    seedSchoolAffiliations.splice(seedSchoolAffiliations.indexOf(foreign), 1);
  }
});

test('affiliation review requires current state and reasons; Student can supplement the same request', async () => {
  const admin = 'usr_schooladmin_10';
  const pending = seedSchoolAffiliations.find((item) => item.status === 'Pending');
  assert.equal((await call(`/admin/school-affiliations/${pending.id}/decision`, admin, 'POST', { decision: 'NeedsMoreInfo' })).status, 400);
  assert.equal((await call(`/admin/school-affiliations/${pending.id}/decision`, admin, 'POST', { decision: 'Verified' })).status, 200);
  assert.equal((await call(`/admin/school-affiliations/${pending.id}/decision`, admin, 'POST', { decision: 'Verified' })).status, 409);
  assert.equal((await call(`/admin/school-affiliations/${pending.id}/decision`, admin, 'POST', { decision: 'Revoked' })).status, 400);
  assert.equal((await call(`/admin/school-affiliations/${pending.id}/decision`, admin, 'POST', { decision: 'Revoked', reason: 'Không còn thuộc trường' })).status, 200);
  const needsMore = seedSchoolAffiliations.find((item) => item.status === 'NeedsMoreInfo');
  const count = seedSchoolAffiliations.length;
  const supplemented = await call('/school-affiliations', needsMore.studentId, 'POST', { schoolEmail: 'student@fpt.edu.vn', evidenceName: 'bo_sung.pdf', evidenceNote: 'Đã bổ sung dấu xác nhận' });
  assert.equal(supplemented.status, 200);
  assert.equal(supplemented.data.id, needsMore.id);
  assert.equal(supplemented.data.status, 'Pending');
  assert.equal(seedSchoolAffiliations.length, count);
  assert.equal((await call('/school-affiliations', needsMore.studentId, 'POST', { schoolEmail: 'student@fpt.edu.vn', evidenceName: 'again.pdf' })).status, 409);
});

test('System Admin can change School Admin university scope', async () => {
  const admin = 'usr_admin_05';
  const schoolAdmin = 'usr_schooladmin_10';
  assert.equal((await call(`/admin/admins/${schoolAdmin}/scope`, schoolAdmin, 'PUT', { assignedSchool: 'Đại học FPT TP.HCM', reason: 'Điều chuyển' })).status, 403);
  assert.equal((await call(`/admin/admins/${schoolAdmin}/scope`, admin, 'PUT', { assignedSchool: '', reason: 'Điều chuyển' })).status, 400);
  assert.equal((await call(`/admin/admins/${schoolAdmin}/scope`, admin, 'PUT', { assignedSchool: 'Đại học FPT TP.HCM' })).status, 400);
  assert.equal((await call(`/admin/admins/${schoolAdmin}/scope`, admin, 'PUT', { assignedSchool: 'Đại học FPT TP.HCM', reason: 'Điều chuyển' })).status, 200);
  assert.deepEqual((await call('/admin/school-affiliations', schoolAdmin)).data, []);
  assert.equal((await call(`/admin/admins/${schoolAdmin}/scope`, admin, 'PUT', { assignedSchool: 'Đại học FPT Hà Nội', reason: 'Khôi phục phạm vi demo' })).status, 200);
});

test('System Admin grants and revokes School Admin with a university and audit reason', async () => {
  const candidate = 'usr_staff_06';
  const admin = 'usr_admin_05';
  assert.equal((await call('/admin/admins', admin, 'POST', { userId: candidate, role: 'school_admin', assignedSchool: 'Đại học FPT Hà Nội' })).status, 400);
  assert.equal((await call('/admin/admins', admin, 'POST', { userId: candidate, role: 'school_admin', assignedSchool: 'Đại học FPT Hà Nội', reason: 'Phụ trách xác minh' })).status, 200);
  assert.equal((await call('/admin/school-affiliations', candidate)).status, 200);
  const remove = async (reason) => {
    const response = await fetch(`http://localhost/api/v1/admin/admins/${candidate}`, {
      method: 'DELETE', headers: { Authorization: `Bearer mock_jwt_token_${admin}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return response.status;
  };
  assert.equal(await remove(''), 400);
  assert.equal(await remove('Kết thúc phân công'), 200);
  assert.equal((await call('/admin/school-affiliations', candidate)).status, 403);
});
