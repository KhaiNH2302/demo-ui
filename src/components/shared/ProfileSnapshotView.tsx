import React from 'react';
import { UserAvatar } from './UserAvatar';
import { Chip } from '@/components/ui/Chip';

export interface ProfileSnapshotData {
  id?: string;
  fullName: string;
  avatarUrl?: string;
  studentCode?: string;
  major?: string;
  cohort?: string;
  schoolName?: string;
  bio?: string;
  skills?: string[];
  availability?: string[];
}

export interface ProfileSnapshotViewProps {
  snapshot: ProfileSnapshotData;
  answers?: Array<{ question: string; answer: string }>;
  availability?: string[];
}

/**
 * Khối xem hồ sơ ứng viên đính kèm đơn (CL6, PG4, G3, M4)
 * theo 04-reuse-plan.md § 2.2
 */
export const ProfileSnapshotView: React.FC<ProfileSnapshotViewProps> = ({
  snapshot,
  answers = [],
  availability,
}) => {
  const slots = availability ?? snapshot.availability ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-neutral-50">
        <UserAvatar
          user={{
            id: snapshot.id || '',
            fullName: snapshot.fullName,
            avatarUrl: snapshot.avatarUrl,
          }}
          size="lg"
          linkToProfile={Boolean(snapshot.id)}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-900">{snapshot.fullName}</p>
          <p className="text-xs text-neutral-600">
            {[snapshot.major, snapshot.cohort, snapshot.schoolName].filter(Boolean).join(' · ') ||
              'Sinh viên trong trường'}
          </p>
        </div>
      </div>

      {snapshot.bio && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Giới thiệu ngắn
          </h4>
          <p className="text-sm text-neutral-700 leading-relaxed">{snapshot.bio}</p>
        </div>
      )}

      {snapshot.skills && snapshot.skills.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Kỹ năng
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {snapshot.skills.map((skill) => (
              <Chip key={skill} size="sm">
                {skill}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {slots.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Khung giờ rảnh
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((slot) => (
              <Chip key={slot} size="sm">
                {slot}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {answers.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-neutral-100">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Câu trả lời đăng ký
          </h4>
          {answers.map((qa, idx) => (
            <div key={idx} className="rounded-md border border-neutral-200 bg-white p-3 space-y-1">
              <p className="text-xs font-medium text-neutral-500">{qa.question}</p>
              <p className="text-sm text-neutral-900 whitespace-pre-line">{qa.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
