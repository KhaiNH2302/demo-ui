import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMentorQuery, rankMentors } from '../src/mocks/aiMentorMatching.ts';
import { seedMentors } from '../src/mocks/data/mentoring.ts';

test('parses subject, days, time, mode, budget and trial from a Vietnamese query', () => {
  const criteria = parseMentorQuery('Ôn CSD201 phần cây, tối thứ 3 hoặc 5, online, dưới 100k/buổi, có học thử');
  assert.deepEqual(criteria.subjects, ['CSD201']);
  assert.deepEqual(criteria.days, ['Tue', 'Thu']);
  assert.equal(criteria.timeOfDay, 'evening');
  assert.deepEqual(criteria.modes, ['online']);
  assert.equal(criteria.maxFee, 100000);
  assert.equal(criteria.wantTrial, true);
});

test('maps "cuối tuần" to Saturday and Sunday', () => {
  assert.deepEqual(parseMentorQuery('review đồ án SWP391 cuối tuần').days, ['Sat', 'Sun']);
});

test('ranking only keeps mentors teaching the subject and accepting requests', () => {
  const matches = rankMentors(seedMentors, parseMentorQuery('SWP391 cuối tuần gặp trực tiếp'));
  assert.ok(matches.length > 0);
  for (const match of matches) {
    const mentor = seedMentors.find((m) => m.userId === match.mentorId);
    assert.equal(mentor.acceptingRequests, true);
    assert.equal(match.checks.find((c) => c.key === 'subject').ok, true);
  }
  const scores = matches.map((m) => m.score);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
});

test('results change with the criteria instead of returning every mentor', () => {
  const design = rankMentors(seedMentors, parseMentorQuery('Figma UI/UX')).map((m) => m.mentorId);
  const backend = rankMentors(seedMentors, parseMentorQuery('Spring Boot backend')).map((m) => m.mentorId);
  assert.notDeepEqual(design, backend);
  assert.equal(rankMentors(seedMentors, parseMentorQuery('MAD101')).length, 0);
});
