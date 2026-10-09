import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { setupServer } from 'msw/node';
import { http } from 'msw';
import { programHandlers } from '../src/features/programs/mocks.ts';
import { clubHandlers } from '../src/mocks/handlers/clubs.ts';
import { seedProgramChannels, seedProgramRegistrations } from '../src/mocks/data/programs.ts';
import { seedClubOpportunities, seedClubs, seedOpportunityResponses } from '../src/mocks/data/clubs.ts';
import { seedNotifications } from '../src/mocks/data/notifications.ts';

// Browser handlers use relative masks; bind that origin explicitly in Node.
const handlers = [...programHandlers, ...clubHandlers].map((handler) => http[handler.info.method.toLowerCase()](`http://localhost${handler.info.path}`, handler.resolver));
const server = setupServer(...handlers);
server.listen({ onUnhandledRequest: 'error' });
after(() => server.close());
const manager = 'usr_opsmanager_06', student = 'usr_student_07', other = 'usr_newbie_08';
const future = (days) => new Date(Date.now() + days * 86400000).toISOString();
const request = async (path, user, method = 'GET', body) => {
  const response = await fetch(`http://localhost/api/v1${path}`, { method, headers: { Authorization: `Bearer mock_jwt_token_${user}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, ...(await response.json()) };
};
const programPayload = { type: 'Volunteer', title: 'Concurrency program', summary: 'Test', description: 'Meaningful test program', startAt: future(7), endAt: future(8), registrationDeadline: future(5), mode: 'Offline', locationOrLink: 'Hòa Lạc', quota: 1, confirmMode: 'Approval', status: 'Published', slots: [{ id: 'test-slot', name: 'Ca duy nhất', quota: 1, confirmedCount: 0 }], questions: [] };

test('program registration protects deadline, duplicate, last seat, ownership and re-registration', async () => {
  assert.equal((await request('/programs', student, 'POST', programPayload)).status, 403);
  const created = await request('/programs', manager, 'POST', programPayload);
  assert.equal(created.status, 201);
  const id = created.data.id, register = (user) => request(`/programs/${id}/register`, user, 'POST', { slotId: 'test-slot', answers: [], acknowledgedTerms: true });
  const first = await register(student), second = await register(other);
  assert.equal(first.status, 201); assert.equal(second.status, 201);
  assert.equal(first.data.visibleToCoParticipants, false);
  assert.equal((await register(student)).status, 409);
  assert.equal((await request(`/programs/registrations/${first.data.id}`, other, 'PUT', { action: 'withdraw' })).status, 403);
  assert.equal((await request(`/programs/registrations/${first.data.id}`, student, 'PUT', { status: 'Confirmed' })).status, 403);
  const approvals = await Promise.all([first, second].map((reg) => request(`/programs/registrations/${reg.data.id}`, manager, 'PUT', { status: 'Confirmed' })));
  assert.deepEqual(approvals.map((response) => response.status).sort(), [200, 409]);
  const program = seedProgramChannels.find((item) => item.id === id);
  assert.equal(program.confirmedCount, 1); assert.equal(program.slots[0].confirmedCount, 1);
  const accepted = seedProgramRegistrations.find((reg) => reg.programId === id && reg.status === 'Confirmed');
  const before = seedNotifications.length;
  const announcement = await request(`/programs/${id}/announcements`, manager, 'POST', { title: 'Hướng dẫn tham gia', body: 'Tập trung ở sảnh Alpha.' });
  assert.equal(announcement.status, 201); assert.equal(announcement.data.recipientCount, 1);
  assert.equal(seedNotifications.length, before + 1); assert.equal(seedNotifications[0].userId, accepted.studentId);
  assert.equal((await request(`/programs/${id}/announcements`, student, 'POST', { title: 'Spoof', body: 'No' })).status, 403);
  assert.equal((await request(`/programs/registrations/${accepted.id}`, accepted.studentId, 'PUT', { action: 'withdraw' })).status, 200);
  assert.equal(program.confirmedCount, 0); assert.equal(program.slots[0].confirmedCount, 0);
  assert.equal((await request(`/programs/registrations/${accepted.id}`, accepted.studentId, 'PUT', { action: 'withdraw' })).status, 409);
  const registeredAgain = await register(accepted.studentId);
  assert.equal(registeredAgain.status, 201); assert.equal(registeredAgain.data.id, accepted.id);
  assert.equal(seedProgramRegistrations.filter((reg) => reg.programId === id && reg.studentId === accepted.studentId).length, 1);
  program.registrationDeadline = future(-1);
  const withdrawAgain = await request(`/programs/registrations/${accepted.id}`, accepted.studentId, 'PUT', { action: 'withdraw' });
  assert.equal(withdrawAgain.status, 200);
  assert.equal((await register(accepted.studentId)).status, 409);
  program.registrationDeadline = future(5); program.status = 'Closed';
  assert.equal((await register(accepted.studentId)).status, 409);
});

test('Student proposal approval requires Event Manager and reason, creates one owned draft', async () => {
  const payload = { type: 'Workshop', title: 'Git cho sinh viên', description: 'Học Git qua thực hành.', goal: 'Làm việc nhóm tốt hơn', targetAudience: 'Sinh viên năm nhất', expectedParticipants: 20, suggestedStartAt: future(10), location: 'Phòng học', costInfo: 'Free', safetyNotes: 'Tuân thủ nội quy', mode: 'Offline', contactInfo: 'student@fpt.edu.vn', acknowledgedTerms: true };
  const created = await request('/programs/proposals', student, 'POST', payload);
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal((await request('/programs/proposals?review=true', student)).status, 403);
  assert.equal((await request(`/programs/proposals/${id}`, student, 'PUT', { status: 'Approved', reviewReason: 'Self approval' })).status, 403);
  assert.equal((await request(`/programs/proposals/${id}`, manager, 'PUT', { status: 'Approved' })).status, 400);
  const approved = await request(`/programs/proposals/${id}`, manager, 'PUT', { status: 'Approved', reviewReason: 'Nội dung phù hợp và đủ nguồn lực.' });
  assert.equal(approved.status, 200);
  const program = seedProgramChannels.find((item) => item.id === approved.data.programId);
  assert.equal(program.status, 'Draft'); assert.equal(program.organizer.userId, manager); assert.deepEqual(program.coOrganizers, []);
  assert.equal((await request(`/programs/${program.id}`, student, 'PUT', { status: 'Published' })).status, 403);
  assert.equal((await request(`/programs/proposals/${id}`, manager, 'PUT', { status: 'Approved', reviewReason: 'Retry' })).status, 409);
  const draft = await request('/programs/proposals', student, 'POST', { status: 'Draft', title: 'Ý tưởng đang soạn' });
  assert.equal(draft.status, 201); assert.equal(draft.data.status, 'Draft');
  const managerQueue = await request('/programs/proposals?review=true', manager);
  assert.ok(!managerQueue.data.some((item) => item.id === draft.data.id));
  assert.equal((await request(`/programs/proposals/${draft.data.id}`, student, 'PUT', { status: 'PendingReview' })).status, 400);
  const submitted = await request(`/programs/proposals/${draft.data.id}`, student, 'PUT', { ...payload, status: 'PendingReview' });
  assert.equal(submitted.status, 200);
  const withdrawn = await request(`/programs/proposals/${draft.data.id}`, student, 'PUT', { action: 'withdraw' });
  assert.equal(withdrawn.data.status, 'Draft');
  assert.equal((await request(`/programs/proposals/${draft.data.id}`, student, 'PUT', { ...payload, status: 'PendingReview' })).status, 200);
  assert.equal((await request(`/programs/proposals/${draft.data.id}`, manager, 'PUT', { status: 'Rejected', reviewReason: 'Chưa đủ nguồn lực.' })).status, 200);
  assert.equal((await request(`/programs/proposals/${draft.data.id}`, student, 'PUT', { ...payload, status: 'PendingReview' })).status, 409);
  const resubmitted = await request('/programs/proposals', student, 'POST', { ...payload, status: 'PendingReview' });
  assert.equal(resubmitted.status, 201); assert.notEqual(resubmitted.data.id, draft.data.id);
  const sampleMutation = await fetch('http://localhost/api/v1/programs/proposals', { method: 'POST', headers: { 'X-Demo-Sample': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  assert.equal(sampleMutation.status, 403);
});

test('club approval respects capacity, Accepted withdrawal frees position and repeat submit cannot reset decision', async () => {
  const club = seedClubs.find((item) => item.representatives?.length && !item.representatives.some((rep) => [student, other].includes(rep.userId)));
  assert.ok(club);
  const rep = club.representatives[0].userId;
  const opportunity = { ...structuredClone(seedClubOpportunities[0]), id: 'club-capacity-regression', clubId: club.id, clubName: club.name, type: 'MemberRecruitment', status: 'Published', quota: 1, used: 0, startAt: future(10), registrationDeadline: future(5), resultDeadline: future(7), questions: [], positions: [{ id: 'position-test', name: 'Vai trò test', quota: 1, registeredCount: 0, description: 'Test' }] };
  seedClubOpportunities.unshift(opportunity);
  const register = (user) => request(`/clubs/opportunities/${opportunity.id}/register`, user, 'POST', { positionId: 'position-test', answers: [] });
  const first = await register(student), second = await register(other);
  assert.equal(first.status, 201); assert.equal(second.status, 201);
  assert.equal((await register(student)).status, 409);
  assert.equal((await request(`/clubs/responses/${first.data.id}/review`, student, 'PUT', { status: 'Accepted' })).status, 403);
  const results = await Promise.all([first, second].map((reg) => request(`/clubs/responses/${reg.data.id}/review`, rep, 'PUT', { status: 'Accepted' })));
  assert.deepEqual(results.map((response) => response.status).sort(), [200, 409]);
  assert.equal(opportunity.used, 1); assert.equal(opportunity.positions[0].registeredCount, 1);
  const accepted = seedOpportunityResponses.find((reg) => reg.opportunityId === opportunity.id && reg.status === 'Accepted');
  assert.equal((await register(accepted.studentId)).status, 409);
  assert.equal((await request(`/clubs/registrations/${accepted.id}`, accepted.studentId, 'PUT', { status: 'Submitted' })).status, 400);
  assert.equal((await request(`/clubs/registrations/${accepted.id}`, accepted.studentId, 'PUT', { action: 'withdraw' })).status, 200);
  assert.equal(opportunity.used, 0); assert.equal(opportunity.positions[0].registeredCount, 0);
  assert.equal((await register(accepted.studentId)).status, 201);
  assert.equal(seedOpportunityResponses.filter((reg) => reg.opportunityId === opportunity.id && reg.studentId === accepted.studentId).length, 1);
  assert.equal((await register(rep)).status, 403);
  opportunity.registrationDeadline = future(-1);
  assert.equal((await request(`/clubs/registrations/${accepted.id}`, accepted.studentId, 'PUT', { action: 'withdraw' })).status, 200);
  assert.equal((await register(accepted.studentId)).status, 409);
});


test('retired program review and guest club mutations cannot bypass permission checks', async () => {
  assert.equal((await request('/admin/programs/any/review', manager, 'PUT', { status: 'Published' })).status, 410);
  const club=seedClubs[0], opportunity=seedClubOpportunities[0];
  for (const [path,method,body] of [
    ['/clubs/opportunities','POST',{clubId:club.id,title:'Unauthorized',description:'No',quota:1,registrationDeadline:future(2)}],
    ['/clubs/'+club.id,'PUT',{name:'Unauthorized'}],
    ['/clubs/opportunities/'+opportunity.id,'PUT',{status:'Closed'}],
    ['/clubs/representative-requests','POST',{clubId:club.id,evidenceNote:'No'}]
  ]) {
    const response=await fetch('http://localhost/api/v1'+path,{method,headers:{'X-Demo-Sample':'1','Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal(response.status,403);
  }
  assert.notEqual(club.name,'Unauthorized');
  const draft={...opportunity,id:'private-draft-test',status:'Draft'};
  seedClubOpportunities.push(draft);
  const response=await request('/clubs/opportunities/'+draft.id,student);
  assert.equal(response.status,403);
  const publicList=await request('/clubs/opportunities?status=Draft',student);
  assert.ok(!publicList.data.some((item)=>item.id===draft.id));
});


test('maximum three pending proposals applies to new and draft submission and withdrawal releases a place', async () => {
  const payload={type:'Workshop',title:'Giới hạn đề xuất',description:'Thực hành Git',goal:'Học tập',targetAudience:'Sinh viên',expectedParticipants:20,suggestedStartAt:future(10),location:'Phòng học',costInfo:'Free',safetyNotes:'Theo nội quy',contactInfo:'test@fpt.edu.vn',acknowledgedTerms:true};
  const first=await request('/programs/proposals',other,'POST',payload);
  assert.equal(first.status,201);
  assert.equal((await request('/programs/proposals',other,'POST',payload)).status,201);
  assert.equal((await request('/programs/proposals',other,'POST',payload)).status,201);
  assert.equal((await request('/programs/proposals',other,'POST',payload)).status,409);
  const draft=await request('/programs/proposals',other,'POST',{...payload,status:'Draft'});
  assert.equal(draft.status,201);
  assert.equal((await request('/programs/proposals/'+draft.data.id,other,'PUT',{...payload,status:'PendingReview'})).status,409);
  assert.equal((await request('/programs/proposals/'+first.data.id,other,'PUT',{action:'withdraw'})).status,200);
  assert.equal((await request('/programs/proposals/'+draft.data.id,other,'PUT',{...payload,status:'PendingReview'})).status,200);
  assert.equal((await request('/programs/proposals',other,'POST',payload)).status,409);
});
