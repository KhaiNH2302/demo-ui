export type SchoolAffiliationStatus = 'Pending' | 'NeedsMoreInfo' | 'Verified' | 'Rejected' | 'Revoked';

export interface SchoolAffiliationRequest {
  id: string;
  studentId: string;
  studentName: string;
  school: string;
  schoolEmail: string;
  studentCode: string;
  evidenceName: string;
  evidenceNote: string;
  status: SchoolAffiliationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reason?: string;
}
