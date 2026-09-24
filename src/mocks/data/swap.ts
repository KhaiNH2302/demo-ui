import type { SwapRequest, SwapConnection } from '@/types/entities';

export const seedSwapRequests: SwapRequest[] = [
  {
    id: 'swap_req_01',
    studentId: 'usr_student_01',
    offeringId: 'off_01', // SWP391
    currentClassCode: 'SE1601',
    targetClassCode: 'SE1602',
    schedule: [
      { day: 'Mon', start: '07:30', end: '09:50' },
      { day: 'Wed', start: '07:30', end: '09:50' },
    ],
    status: 'Open',
    version: 1,
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'swap_req_02',
    studentId: 'usr_student_07',
    offeringId: 'off_01', // SWP391 - Đối ứng hoàn hảo với req 01!
    currentClassCode: 'SE1602',
    targetClassCode: 'SE1601',
    schedule: [
      { day: 'Tue', start: '13:00', end: '15:20' },
      { day: 'Thu', start: '13:00', end: '15:20' },
    ],
    status: 'Open',
    version: 1,
    createdAt: '2026-09-21T14:30:00Z',
    updatedAt: '2026-09-21T14:30:00Z',
  },
  {
    id: 'swap_req_03',
    studentId: 'usr_student_01',
    offeringId: 'off_02', // PRJ301
    currentClassCode: 'IA1601',
    targetClassCode: 'IA1603',
    schedule: [
      { day: 'Fri', start: '09:50', end: '12:10' },
    ],
    status: 'Connected',
    version: 2,
    createdAt: '2026-09-15T08:00:00Z',
    updatedAt: '2026-09-18T16:00:00Z',
  },
  {
    id: 'swap_req_04',
    studentId: 'usr_mentor_02',
    offeringId: 'off_02',
    currentClassCode: 'IA1603',
    targetClassCode: 'IA1601',
    status: 'Connected',
    version: 2,
    createdAt: '2026-09-16T09:00:00Z',
    updatedAt: '2026-09-18T16:00:00Z',
  },
];

export const seedSwapConnections: SwapConnection[] = [
  {
    id: 'conn_01',
    requestAId: 'swap_req_03',
    requestBId: 'swap_req_04',
    initiatorId: 'usr_student_01',
    recipientId: 'usr_mentor_02',
    status: 'Confirmed',
    createdAt: '2026-09-17T10:00:00Z',
    respondedAt: '2026-09-18T16:00:00Z',
  },
  {
    id: 'conn_02',
    requestAId: 'swap_req_02',
    requestBId: 'swap_req_01',
    initiatorId: 'usr_student_07',
    recipientId: 'usr_student_01',
    status: 'Pending',
    createdAt: '2026-09-22T08:30:00Z',
  },
];
