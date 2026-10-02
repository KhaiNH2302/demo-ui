import React from 'react';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import type { StudentProfile, User } from '@/types/entities';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';

export interface CompletenessItem {
  id: string;
  label: string;
  weight: number;
  isComplete: boolean;
  actionKey: string;
}

export function getProfileCompletenessItems(
  profile?: StudentProfile | null,
  user?: User | null
): CompletenessItem[] {
  const hasUniversity =
    Boolean(user?.school) ||
    Boolean(profile?.education?.some((e) => e.type === 'university' && e.schoolName));
  const hasMajor = Boolean(user?.major) || Boolean(profile?.education?.[0]?.major);
  const hasAvatar = Boolean(user?.avatarUrl && !user.avatarUrl.includes('placeholder'));
  const hasBio = Boolean(profile?.intro?.trim() || profile?.about?.trim() || profile?.bio?.trim());
  const hasPlaces = Boolean(profile?.currentCity?.trim() || profile?.hometown?.trim());
  const hasSkills = Boolean(profile?.skills && profile.skills.length >= 2);
  const hasInterestsOrHobbies = Boolean(
    (profile?.interests && profile.interests.length > 0) ||
      (profile?.hobbies && profile.hobbies.length > 0)
  );
  const hasSchedule = Boolean(profile?.availability && profile.availability.length > 0);
  const hasLinks = Boolean(profile?.links && profile.links.length > 0);

  return [
    {
      id: 'education',
      label: 'Thông tin trường & chuyên ngành',
      weight: 25,
      isComplete: hasUniversity && hasMajor,
      actionKey: 'overview',
    },
    {
      id: 'avatar',
      label: 'Ảnh đại diện cá nhân',
      weight: 15,
      isComplete: hasAvatar,
      actionKey: 'contact_basic',
    },
    {
      id: 'skills',
      label: 'Kỹ năng chuyên môn (≥ 2 kỹ năng)',
      weight: 15,
      isComplete: hasSkills,
      actionKey: 'learning',
    },
    {
      id: 'bio',
      label: 'Tiểu sử ngắn hoặc giới thiệu',
      weight: 10,
      isComplete: hasBio,
      actionKey: 'details',
    },
    {
      id: 'places',
      label: 'Nơi sống hoặc quê quán',
      weight: 10,
      isComplete: hasPlaces,
      actionKey: 'places',
    },
    {
      id: 'interests',
      label: 'Sở thích & Lĩnh vực quan tâm',
      weight: 10,
      isComplete: hasInterestsOrHobbies,
      actionKey: 'learning',
    },
    {
      id: 'schedule',
      label: 'Khung giờ rảnh để ghép nối AI',
      weight: 10,
      isComplete: hasSchedule,
      actionKey: 'learning',
    },
    {
      id: 'links',
      label: 'Liên kết mạng xã hội / GitHub / LinkedIn',
      weight: 5,
      isComplete: hasLinks,
      actionKey: 'contact_basic',
    },
  ];
}

export function calculateProfileCompleteness(
  profile?: StudentProfile | null,
  user?: User | null
): { percentage: number; items: CompletenessItem[] } {
  const items = getProfileCompletenessItems(profile, user);
  const earned = items.filter((it) => it.isComplete).reduce((sum, it) => sum + it.weight, 0);
  return {
    percentage: Math.min(100, Math.round(earned)),
    items,
  };
}

interface ProfileCompletenessProps {
  profile: StudentProfile;
  user: User;
  onNavigateSection?: (sectionKey: string) => void;
}

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({
  profile,
  user,
  onNavigateSection,
}) => {
  const { percentage, items } = calculateProfileCompleteness(profile, user);
  const incompleteItems = items.filter((it) => !it.isComplete);

  if (percentage === 100) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div className="text-xs">
          <strong className="font-semibold text-sm block">Hồ sơ đã đạt 100% hoàn thiện!</strong>
          <span>Thông tin đầy đủ giúp bạn tăng tối đa cơ hội kết nối đổi lớp, tìm nhóm và nhận hỗ trợ từ Mentor.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-surface border border-neutral-200 dark:border-neutral-700/80 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Độ hoàn thiện hồ sơ: {percentage}%
          </h4>
        </div>
        <span className="text-xs font-semibold text-primary">{percentage}%</span>
      </div>

      <Progress value={percentage} className="h-2" />

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Hoàn thiện thêm các mục dưới đây để hồ sơ của bạn nổi bật hơn trên hệ thống SCS:
      </p>

      <div className="space-y-1.5 pt-1">
        {incompleteItems.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs text-neutral-700 dark:text-neutral-300"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>{item.label}</span>
            </div>
            {onNavigateSection && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-primary hover:text-primary-dark"
                onClick={() => onNavigateSection(item.actionKey)}
              >
                Cập nhật
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
