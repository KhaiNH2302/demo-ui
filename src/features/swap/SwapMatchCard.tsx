import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { Sparkles, Mail, Send, CheckCircle2 } from 'lucide-react';
import { seedUsers } from '@/mocks/data/users';
import { seedCourseOfferings } from '@/mocks/data/courseOfferings';
import type { SwapRequest } from '@/types/entities';

interface SwapMatchCardProps {
  myRequest: SwapRequest;
  partnerRequest: SwapRequest;
  aiScore?: number;
  aiReasons?: string[];
  hasSentInvite?: boolean;
  onSendInvite?: () => void;
}

export const SwapMatchCard: React.FC<SwapMatchCardProps> = ({
  myRequest,
  partnerRequest,
  aiScore,
  aiReasons = [],
  hasSentInvite = false,
  onSendInvite,
}) => {
  const navigate = useNavigate();

  const partnerUser =
    seedUsers.find((u) => u.id === partnerRequest.studentId) || {
      id: partnerRequest.studentId,
      fullName: 'Sinh viên FPT',
      cohort: 'K18',
      major: 'Kỹ thuật phần mềm',
      avatarUrl: undefined,
    };

  const offering = seedCourseOfferings.find((o) => o.id === partnerRequest.offeringId);

  const isPerfectMatch =
    myRequest.currentClassCode === partnerRequest.targetClassCode &&
    myRequest.targetClassCode === partnerRequest.currentClassCode;

  const displayScore = aiScore || (isPerfectMatch ? 95 : 78);

  return (
    <Card className="flex flex-col justify-between hover:shadow-sm transition-all border-neutral-200 dark:border-neutral-800">
      <CardHeader className="space-y-3 pb-3">
        {/* User Info Header */}
        <div className="flex items-center gap-3">
          <UserAvatar
            user={{
              id: partnerUser.id,
              fullName: partnerUser.fullName,
              avatarUrl: partnerUser.avatarUrl,
            }}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 block truncate">
              {partnerUser.fullName}
            </span>
            <span className="text-xs text-neutral-500 block truncate">
              {partnerUser.major || 'Kỹ thuật phần mềm'} · {partnerUser.cohort || 'K18'}
            </span>
          </div>
        </div>

        {/* Offering & Match Type Badge */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <Badge variant="secondary" className="font-semibold text-xs truncate max-w-[140px]">
            {offering?.courseCode || 'Môn học'}
          </Badge>

          {isPerfectMatch ? (
            <Badge variant="success" className="text-[11px] font-medium shrink-0">
              ★ Đối ứng hoàn hảo
            </Badge>
          ) : (
            <Badge variant="brand" className="text-[11px] font-medium shrink-0">
              ◐ Khớp một chiều
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Class swap flow: current -> target */}
        <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-[#18191a] border border-neutral-200/80 dark:border-[#393a3b] text-center">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-0.5">
            Lớp bạn ấy có → muốn đổi
          </span>
          <div className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100">
            <span className="text-brand-600 dark:text-brand-400">{partnerRequest.currentClassCode}</span>
            <span className="text-neutral-400 mx-2">→</span>
            <span className="text-emerald-600 dark:text-emerald-400">{partnerRequest.targetClassCode}</span>
          </div>
        </div>

        {/* AI Score & Reasoning */}
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-brand-700 dark:text-brand-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>AI Đánh giá: {displayScore}% phù hợp</span>
          </div>
          {aiReasons.length > 0 ? (
            <p className="text-[11px] text-neutral-500 line-clamp-2">
              • {aiReasons.join(' • ')}
            </p>
          ) : (
            <p className="text-[11px] text-neutral-500 line-clamp-1">
              • {isPerfectMatch ? 'Hai chiều tương thích hoàn toàn, không xung đột lịch' : 'Khớp nguyện vọng đổi lớp của bạn'}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/swap/${partnerRequest.id}`)}
        >
          Xem chi tiết
        </Button>

        {hasSentInvite ? (
          <Button
            variant="secondary"
            size="sm"
            disabled
            className="flex-1 text-xs"
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
          >
            Đã gửi mời
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={onSendInvite}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Gửi lời mời
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
