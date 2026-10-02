import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Clock } from 'lucide-react';
import { seedUsers } from '@/mocks/data/users';
import { seedCourseOfferings } from '@/mocks/data/courseOfferings';
import type { SwapRequest } from '@/types/entities';

interface SwapRequestCardProps {
  request: SwapRequest;
}

export const SwapRequestCard: React.FC<SwapRequestCardProps> = ({ request }) => {
  const navigate = useNavigate();

  const user =
    seedUsers.find((u) => u.id === request.studentId) || {
      id: request.studentId,
      fullName: 'Sinh viên FPT',
      cohort: 'K18',
      major: 'Kỹ thuật phần mềm',
      avatarUrl: undefined,
    };

  const offering = seedCourseOfferings.find((o) => o.id === request.offeringId);

  return (
    <Card
      onClick={() => navigate(`/swap/${request.id}`)}
      className="p-4 cursor-pointer hover:border-brand-400 hover:shadow-sm transition-all border-neutral-200 dark:border-neutral-800 flex flex-col justify-between"
    >
      <CardContent className="p-0 space-y-3">
        {/* Top: offering & time */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="font-semibold text-xs truncate max-w-[150px]">
            {offering?.courseCode || 'Môn học'}
          </Badge>
          <span className="text-[11px] text-neutral-400 flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" /> 2 giờ trước
          </span>
        </div>

        {/* Classes flow */}
        <div className="p-2.5 rounded-xl bg-neutral-100/70 dark:bg-[#18191a] border border-neutral-200/80 dark:border-[#393a3b] text-center">
          <div className="font-mono text-sm font-bold text-neutral-900 dark:text-neutral-100">
            <span className="text-brand-600 dark:text-brand-400">{request.currentClassCode}</span>
            <span className="text-neutral-400 mx-2">→</span>
            <span className="text-emerald-600 dark:text-emerald-400">{request.targetClassCode}</span>
          </div>
        </div>

        {request.note && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 italic">
            "{request.note}"
          </p>
        )}

        {/* Author info */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <UserAvatar
            user={{
              id: user.id,
              fullName: user.fullName,
              avatarUrl: user.avatarUrl,
            }}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
              {user.fullName}
            </span>
            <span className="text-[10px] text-neutral-500 block truncate">
              {user.major || 'Kỹ thuật phần mềm'} · {user.cohort || 'K18'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
