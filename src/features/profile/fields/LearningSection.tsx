import React, { useState } from 'react';
import { Sparkles, Compass, Target, Clock, Bot, Plus, X, Check } from 'lucide-react';
import type { ScheduleSlot, Audience, ProfileFieldKey, StudentProfile } from '@/types/entities';
import { AudienceSelect } from './AudienceSelect';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  SKILL_SUGGESTIONS,
  INTEREST_SUGGESTIONS,
  GOAL_SUGGESTIONS,
} from '../profileConstants';

interface LearningSectionProps {
  skills?: string[];
  interests?: string[];
  goals?: string[];
  availability?: ScheduleSlot[];
  privacy?: StudentProfile['privacy'];
  fieldAudience?: Partial<Record<ProfileFieldKey, Audience>>;
  onUpdate: (updates: {
    skills?: string[];
    interests?: string[];
    goals?: string[];
    availability?: ScheduleSlot[];
    privacy?: StudentProfile['privacy'];
    fieldAudience?: Partial<Record<ProfileFieldKey, Audience>>;
  }) => void;
  isOwner: boolean;
  canViewAudience?: (aud: Audience) => boolean;
}

export const LearningSection: React.FC<LearningSectionProps> = ({
  skills = [],
  interests = [],
  goals = [],
  availability = [],
  privacy = {
    swapMatching: true,
    groupMatching: true,
    mentoringMatching: true,
  },
  fieldAudience = {},
  onUpdate,
  isOwner,
  canViewAudience = () => true,
}) => {
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  const skillsAudience = fieldAudience.skills || 'public';
  const interestsAudience = fieldAudience.interests || 'public';
  const goalsAudience = fieldAudience.goals || 'public';
  const availabilityAudience = fieldAudience.availability || 'only_me';

  const canSeeSkills = isOwner || canViewAudience(skillsAudience);
  const canSeeInterests = isOwner || canViewAudience(interestsAudience);
  const canSeeGoals = isOwner || canViewAudience(goalsAudience);
  const canSeeAvailability = isOwner || canViewAudience(availabilityAudience);

  const updateAudience = (field: ProfileFieldKey, aud: Audience) => {
    onUpdate({
      fieldAudience: {
        ...fieldAudience,
        [field]: aud,
      },
    });
  };

  // Skill actions
  const addSkill = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    onUpdate({ skills: [...skills, trimmed] });
    setSkillInput('');
  };

  const removeSkill = (val: string) => {
    onUpdate({ skills: skills.filter((s) => s !== val) });
  };

  // Interest actions
  const addInterest = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || interests.includes(trimmed)) return;
    onUpdate({ interests: [...interests, trimmed] });
    setInterestInput('');
  };

  const removeInterest = (val: string) => {
    onUpdate({ interests: interests.filter((i) => i !== val) });
  };

  // Goal actions
  const addGoal = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed || goals.includes(trimmed)) return;
    onUpdate({ goals: [...goals, trimmed] });
    setGoalInput('');
  };

  const removeGoal = (val: string) => {
    onUpdate({ goals: goals.filter((g) => g !== val) });
  };

  return (
    <div className="space-y-8">
      {/* 1. Kỹ năng */}
      {canSeeSkills && (
        <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Kỹ năng chuyên môn & Công nghệ
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Các ngôn ngữ lập trình, framework hoặc công cụ thành thạo
              </p>
            </div>
            {isOwner && (
              <AudienceSelect
                value={skillsAudience}
                onChange={(aud) => updateAudience('skills', aud)}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {skills.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
              >
                <span>{s}</span>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
            {skills.length === 0 && (
              <span className="text-xs text-neutral-400 italic">Chưa có kỹ năng nào được thêm.</span>
            )}
          </div>

          {isOwner && (
            <div className="pt-2 space-y-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex gap-2">
                <Input
                  className="text-xs h-8"
                  placeholder="Nhập kỹ năng mới (VD: Docker, Next.js...)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs shrink-0"
                  onClick={() => addSkill(skillInput)}
                  disabled={!skillInput.trim()}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
                </Button>
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Gợi ý nhanh:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s))
                    .slice(0, 10)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Lĩnh vực quan tâm */}
      {canSeeInterests && (
        <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-500" />
                Lĩnh vực quan tâm
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Các chủ đề, hướng đi học thuật hoặc nghề nghiệp muốn phát triển
              </p>
            </div>
            {isOwner && (
              <AudienceSelect
                value={interestsAudience}
                onChange={(aud) => updateAudience('interests', aud)}
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {interests.map((item) => (
              <Badge
                key={item}
                variant="secondary"
                className="px-2.5 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200/50 dark:border-emerald-800/40"
              >
                <span>{item}</span>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removeInterest(item)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
            {interests.length === 0 && (
              <span className="text-xs text-neutral-400 italic">Chưa có lĩnh vực quan tâm nào.</span>
            )}
          </div>

          {isOwner && (
            <div className="pt-2 space-y-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex gap-2">
                <Input
                  className="text-xs h-8"
                  placeholder="Thêm lĩnh vực quan tâm khác..."
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addInterest(interestInput);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs shrink-0"
                  onClick={() => addInterest(interestInput)}
                  disabled={!interestInput.trim()}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
                </Button>
              </div>

              <div>
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Gợi ý phổ biến:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_SUGGESTIONS.filter((s) => !interests.includes(s))
                    .slice(0, 8)
                    .map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addInterest(s)}
                        className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Mục tiêu kết nối & Học tập */}
      {canSeeGoals && (
        <div className="space-y-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                Mục tiêu hiện tại trên SCS
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Giúp sinh viên khác và hệ thống AI gợi ý đúng người bạn đang tìm kiếm
              </p>
            </div>
            {isOwner && (
              <AudienceSelect
                value={goalsAudience}
                onChange={(aud) => updateAudience('goals', aud)}
              />
            )}
          </div>

          <div className="space-y-2 pt-2">
            {goals.map((goal) => (
              <div
                key={goal}
                className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{goal}</span>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removeGoal(goal)}
                    className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {goals.length === 0 && (
              <span className="text-xs text-neutral-400 italic">Chưa chọn mục tiêu nào.</span>
            )}
          </div>

          {isOwner && (
            <div className="pt-2 space-y-2 border-t border-neutral-100 dark:border-neutral-800">
              <div className="flex gap-2">
                <Input
                  className="text-xs h-8"
                  placeholder="Thêm mục tiêu riêng..."
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addGoal(goalInput);
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs shrink-0"
                  onClick={() => addGoal(goalInput)}
                  disabled={!goalInput.trim()}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm
                </Button>
              </div>

              <div>
                <p className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Chọn nhanh mục tiêu phổ biến:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {GOAL_SUGGESTIONS.filter((g) => !goals.includes(g)).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => addGoal(g)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors text-left"
                    >
                      + {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Khung giờ rảnh */}
      {canSeeAvailability && (
        <div className="space-y-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Khung giờ rảnh hàng tuần
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Dùng cho thuật toán đối chiếu lịch để sắp xếp đổi lớp hoặc học nhóm không trùng giờ
              </p>
            </div>
            {isOwner && (
              <AudienceSelect
                value={availabilityAudience}
                onChange={(aud) => updateAudience('availability', aud)}
              />
            )}
          </div>

          <div className="pt-2">
            <ScheduleInput
              value={availability}
              onChange={(slots) => onUpdate({ availability: slots })}
              disabled={!isOwner}
            />
          </div>
        </div>
      )}

      {/* 5. Thiết lập ghép nối thông minh (AI matching - Chỉ chủ sở hữu) */}
      {isOwner && (
        <div className="space-y-4 p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              Thiết lập ghép nối thông minh AI
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Cho phép thuật toán SCS phân tích thông tin hồ sơ của bạn để chủ động gợi ý cơ hội phù hợp
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-surface border border-neutral-200/80 dark:border-neutral-700/80">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                  Đổi lớp học phần tự động
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block leading-relaxed">
                  Thông báo cho bạn ngay khi có sinh viên khác muốn nhượng / đổi lớp phù hợp với nguyện vọng môn của bạn.
                </span>
              </div>
              <Switch
                checked={privacy?.swapMatching ?? true}
                onCheckedChange={(val) =>
                  onUpdate({
                    privacy: {
                      ...privacy,
                      swapMatching: val,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-surface border border-neutral-200/80 dark:border-neutral-700/80">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                  Ghép nhóm đồ án & Học tập
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block leading-relaxed">
                  Gợi ý bạn vào các nhóm đồ án đang tìm thành viên có bộ kỹ năng hoặc lịch rảnh tương thích.
                </span>
              </div>
              <Switch
                checked={privacy?.groupMatching ?? true}
                onCheckedChange={(val) =>
                  onUpdate({
                    privacy: {
                      ...privacy,
                      groupMatching: val,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-surface border border-neutral-200/80 dark:border-neutral-700/80">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">
                  Kết nối Cố vấn (Mentoring)
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block leading-relaxed">
                  Đề xuất kết nối với các Mentor cùng chuyên ngành hoặc sinh viên cần được kèm cặp học tập.
                </span>
              </div>
              <Switch
                checked={privacy?.mentoringMatching ?? true}
                onCheckedChange={(val) =>
                  onUpdate({
                    privacy: {
                      ...privacy,
                      mentoringMatching: val,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
