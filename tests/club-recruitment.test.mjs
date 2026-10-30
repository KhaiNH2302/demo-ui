import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { http } from 'msw';
import { setupServer } from 'msw/node';
import { clubHandlers } from '../src/mocks/handlers/clubs.ts';
import {
  seedClubOpportunities,
  seedOpportunityResponses,
  seedClubs,
} from '../src/mocks/data/clubs.ts';
import { seedNotifications } from '../src/mocks/data/notifications.ts';
import { seedConversations } from '../src/mocks/data/conversations.ts';
import {
  isRecruitmentOpen,
  isResultOverdue,
  validateRecruitment,
  reuseRecruitment,
  onboardingCalendar,
} from '../src/features/clubs/recruitment.ts';
import { syncRecruitmentReminders } from '../src/features/clubs/engagementMocks.ts';
import { clubRegistrationUnavailable } from '../src/features/programs/rules.ts';

const server = setupServer(
  ...clubHandlers.map((handler) =>
    http[handler.info.method.toLowerCase()](
      `http://localhost${handler.info.path}`,
      handler.resolver
    )
  )
);
server.listen({ onUnhandledRequest: 'error' });
after(() => server.close());
const student = 'usr_student_07',
  other = 'usr_newbie_08',
  representative = 'usr_manager_03';
const date = (days) => new Date(Date.now() + days * 86400000).toISOString();
async function request(path, user, method = 'GET', body) {
  const response = await fetch(`http://localhost/api/v1${path}`, {
    method,
    headers: {
      ...(user ? { Authorization: `Bearer mock_jwt_token_${user}` } : {}),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, ...(await response.json()) };
}
const valid = () => ({
  clubId: 'club_01',
  type: 'MemberRecruitment',
  title: 'Tuyển ban kỹ thuật mới',
  summary: 'Một học kỳ cùng CLB',
  description: 'Xây dựng sản phẩm phục vụ sinh viên.',
  expectedCommitment: '4 giờ/tuần, một học kỳ',
  quota: 2,
  registrationDeadline: date(5),
  resultDeadline: date(7),
  questions: [],
  positions: [],
  status: 'Published',
  contactUserId: representative,
});

test('recruitment validates its own deadlines and capacity, and keeps events out of new recruitment', () => {
  assert.deepEqual(validateRecruitment(valid()), {});
  assert.ok(validateRecruitment({ ...valid(), type: 'Event' }).type);
  assert.ok(
    validateRecruitment({ ...valid(), resultDeadline: date(1) }).resultDeadline
  );
  assert.ok(
    validateRecruitment({
      ...valid(),
      positions: [{ id: 'x', name: 'Backend', quota: 1, registeredCount: 0 }],
    }).positions
  );
  assert.ok(
    validateRecruitment({
      ...valid(),
      onboarding: { startAt: date(8), endAt: date(7), location: 'Phòng CLB' },
    }).onboarding
  );
  assert.equal(isRecruitmentOpen({ ...valid(), used: 0 }), true);
  assert.equal(isRecruitmentOpen({ ...valid(), used: 2 }), false);
  assert.equal(
    isRecruitmentOpen({ ...valid(), type: 'Event', used: 0 }),
    false
  );
});

test('reuse copies the selected source without old identities, applicants, dates or onboarding', () => {
  const source = {
    ...seedClubOpportunities.find((o) => o.type === 'CollaboratorRecruitment'),
    id: 'source-copy-test',
  };
  const copied = reuseRecruitment(source);
  assert.equal(copied.description, source.description);
  assert.equal(copied.id, undefined);
  assert.equal(copied.registrationDeadline, undefined);
  assert.equal(copied.resultDeadline, undefined);
  assert.equal(copied.onboarding, undefined);
  assert.notEqual(copied.questions[0].id, source.questions[0].id);
  assert.equal(copied.positions[0].registeredCount, 0);
  copied.positions[0].name = 'Different';
  assert.notEqual(copied.positions[0].name, source.positions[0].name);
});

test('saved opportunities and followed clubs are authenticated, idempotent and isolated by account', async () => {
  const opp = seedClubOpportunities.find((o) => o.type === 'MemberRecruitment');
  assert.equal(
    (
      await request('/clubs/preferences', undefined, 'PUT', {
        kind: 'save',
        id: opp.id,
        active: true,
      })
    ).status,
    401
  );
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await request('/clubs/preferences', student, 'PUT', {
          kind: 'save',
          id: opp.id,
          active: true,
        })
      ).status,
      200
    );
  const first = await request('/clubs/preferences', student);
  assert.equal(
    first.data.savedOpportunityIds.filter((id) => id === opp.id).length,
    1
  );
  assert.ok(
    !(
      await request('/clubs/preferences', other)
    ).data.savedOpportunityIds.includes(opp.id)
  );
  assert.equal(
    (
      await request('/clubs/preferences', student, 'PUT', {
        kind: 'save',
        id: seedClubOpportunities.find((o) => o.type === 'Event').id,
        active: true,
      })
    ).status,
    404
  );
  await request('/clubs/preferences', student, 'PUT', {
    kind: 'save',
    id: opp.id,
    active: false,
  });
  assert.ok(
    !(
      await request('/clubs/preferences', student)
    ).data.savedOpportunityIds.includes(opp.id)
  );
});

test('a published recruitment notifies followers once, while drafts do not notify', async () => {
  await request('/clubs/preferences', student, 'PUT', {
    kind: 'follow',
    id: 'club_01',
    active: true,
  });
  const draft = await request('/clubs/opportunities', representative, 'POST', {
    ...valid(),
    status: 'Draft',
  });
  assert.equal(draft.status, 200);
  const before = seedNotifications.filter((n) => n.userId === student).length;
  assert.equal(
    (
      await request(
        `/clubs/opportunities/${draft.data.id}`,
        representative,
        'PUT',
        { status: 'Published' }
      )
    ).status,
    200
  );
  assert.equal(
    seedNotifications.filter((n) => n.userId === student).length,
    before + 1
  );
  assert.equal(
    (
      await request(
        `/clubs/opportunities/${draft.data.id}`,
        representative,
        'PUT',
        { summary: 'Thông tin mới' }
      )
    ).status,
    200
  );
  assert.equal(
    seedNotifications.filter((n) => n.userId === student).length,
    before + 1
  );
  assert.equal(
    (
      await request('/clubs/opportunities', representative, 'POST', {
        ...valid(),
        type: 'Event',
      })
    ).status,
    400
  );
  assert.equal(
    (
      await request('/clubs/opportunities', representative, 'POST', {
        ...valid(),
        contactUserId: other,
      })
    ).status,
    400
  );
});

test('public questions belong to one recruitment and only its representatives may answer', async () => {
  const one = seedClubOpportunities.find(
    (o) => o.clubId === 'club_01' && o.type === 'MemberRecruitment'
  );
  const two = seedClubOpportunities.find(
    (o) => o.id !== one.id && o.type !== 'Event'
  );
  const path = `/clubs/opportunities/${one.id}/questions`;
  assert.equal(
    (
      await request(path, undefined, 'POST', {
        question: 'CLB sinh hoạt vào ngày nào?',
      })
    ).status,
    401
  );
  const asked = await request(path, student, 'POST', {
    question: 'CLB có hướng dẫn bạn mới học lập trình không?',
  });
  assert.equal(asked.status, 201);
  assert.equal(asked.data.answer, undefined);
  assert.ok((await request(path)).data.some((q) => q.id === asked.data.id));
  assert.ok(
    !(await request(`/clubs/opportunities/${two.id}/questions`)).data.some(
      (q) => q.id === asked.data.id
    )
  );
  assert.equal(
    (
      await request(`${path}/${asked.data.id}`, student, 'PUT', {
        answer: 'Giả mạo CLB',
      })
    ).status,
    403
  );
  assert.equal(
    (
      await request(`${path}/${asked.data.id}`, representative, 'PUT', {
        answer: 'CLB có hướng dẫn kỹ năng cơ bản trong buổi sinh hoạt.',
      })
    ).status,
    200
  );
  assert.equal(
    (await request(path)).data.find((q) => q.id === asked.data.id).answeredBy,
    seedClubs[0].representatives[0].fullName
  );
});

test('late results keep their original status, reminders are limited, and review can finish after the expected date', async () => {
  const source = seedClubOpportunities.find(
    (o) => o.type === 'MemberRecruitment'
  );
  const opportunity = {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    quota: 2,
    used: 0,
    positions: [],
    registrationDeadline: date(-3),
    resultDeadline: date(-1),
    contactUserId: representative,
  };
  seedClubOpportunities.push(opportunity);
  const response = {
    ...structuredClone(seedOpportunityResponses[0]),
    id: crypto.randomUUID(),
    opportunityId: opportunity.id,
    opportunityType: 'MemberRecruitment',
    clubId: opportunity.clubId,
    studentId: student,
    status: 'Submitted',
    positionId: undefined,
    history: [],
  };
  seedOpportunityResponses.push(response);
  assert.equal(isResultOverdue(response, opportunity), true);
  const before = seedNotifications.length;
  syncRecruitmentReminders();
  const afterSync = seedNotifications.length;
  assert.ok(afterSync > before);
  syncRecruitmentReminders();
  assert.equal(seedNotifications.length, afterSync);
  assert.equal(response.status, 'Submitted');
  assert.equal(
    (await request(`/clubs/registrations/${response.id}/remind`, other, 'POST'))
      .status,
    403
  );
  assert.equal(
    (
      await request(
        `/clubs/registrations/${response.id}/remind`,
        student,
        'POST'
      )
    ).data.alreadySent,
    false
  );
  const afterReminder = seedNotifications.length;
  assert.equal(
    (
      await request(
        `/clubs/registrations/${response.id}/remind`,
        student,
        'POST'
      )
    ).data.alreadySent,
    true
  );
  assert.equal(seedNotifications.length, afterReminder);
  response.status = 'NeedsMoreInfo';
  assert.equal(clubRegistrationUnavailable(opportunity, response), null);
  const countBeforeSupplement = opportunity.submittedCount;
  const supplement = await request(
    `/clubs/opportunities/${opportunity.id}/register`,
    student,
    'POST',
    { answers: [], note: 'Đã bổ sung thông tin CLB yêu cầu.' }
  );
  assert.equal(supplement.status, 201);
  assert.equal(supplement.data.id, response.id);
  assert.equal(opportunity.submittedCount, countBeforeSupplement);
  assert.equal(
    (
      await request(
        `/clubs/opportunities/${opportunity.id}`,
        representative,
        'PUT',
        {
          registrationDeadline: opportunity.registrationDeadline,
          summary: 'Thông tin bổ sung',
          onboarding: null,
        }
      )
    ).status,
    200
  );
  assert.equal(opportunity.onboarding, null);
  assert.equal(
    (
      await request(
        `/clubs/responses/${response.id}/review`,
        representative,
        'PUT',
        { status: 'Accepted' }
      )
    ).status,
    200
  );
  assert.equal(response.status, 'Accepted');
  assert.equal(opportunity.used, 1);
  const detail = await request(`/clubs/registrations/${response.id}`, student);
  assert.equal(detail.data.contact.userId, representative);
  const channel = `/clubs/registrations/${response.id}/conversation`;
  assert.equal((await request(channel, other, 'POST')).status, 403);
  const first = await request(channel, student, 'POST'),
    second = await request(channel, student, 'POST');
  assert.equal(first.status, 200);
  assert.equal(first.data.id, second.data.id);
  assert.deepEqual(
    seedConversations.find((c) => c.id === first.data.id).participantIds.sort(),
    [student, representative].sort()
  );
});

test('onboarding downloads are real UTC iCalendar data and missing schedules do not generate invented events', () => {
  const opportunity = {
    ...valid(),
    id: 'calendar-test',
    clubName: 'CLB, thử; nghiệm',
    onboarding: {
      startAt: '2026-11-12T19:00:00+07:00',
      endAt: '2026-11-12T20:00:00+07:00',
      location: 'Phòng A, tầng 2',
    },
  };
  const calendar = onboardingCalendar(opportunity);
  assert.ok(calendar.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0'));
  assert.ok(calendar.includes('DTSTART:20261112T120000Z'));
  assert.ok(calendar.includes('DTEND:20261112T130000Z'));
  assert.ok(calendar.includes('LOCATION:Phòng A\\, tầng 2'));
  assert.equal(
    onboardingCalendar({ ...opportunity, onboarding: undefined }),
    null
  );
});
