import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Home,
  MapPin,
  Calendar,
  Globe,
  Link2,
  ExternalLink,
  Pencil,
  Sparkles,
} from 'lucide-react';
import type { StudentProfile, User, Audience, ProfileFieldKey } from '@/types/entities';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';

interface ProfileIntroCardProps {
  profile: StudentProfile;
  user: User;
  isOwner: boolean;
  canViewAudience: (aud?: Audience) => boolean;
  onUpdateProfile: (updates: Partial<StudentProfile>) => Promise<void> | void;
  onNavigateToAboutTab?: (sectionKey?: string) => void;
}

export const ProfileIntroCard: React.FC<ProfileIntroCardProps> = ({
  profile,
  user,
  isOwner,
  canViewAudience,
  onUpdateProfile,
  onNavigateToAboutTab,
}) => {
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  const [introText, setIntroText] = useState(profile.intro || '');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Default intro card fields if not yet specified
  const introCardFields: ProfileFieldKey[] = profile.introCardFields || [
    'education',
    'work',
    'currentCity',
    'hometown',
    'links',
    'skills',
  ];
  const [selectedFields, setSelectedFields] = useState<ProfileFieldKey[]>(introCardFields);

  // Primary education entry
  const primaryEdu = profile.education?.find((e) => e.isCurrent) || profile.education?.[0];
  // Primary work entry
  const primaryWork = profile.work?.find((w) => w.isCurrent) || profile.work?.[0];

  const handleSaveIntro = async () => {
    await onUpdateProfile({ intro: introText.trim() });
    setIsEditingIntro(false);
  };

  const handleSaveDetails = async () => {
    await onUpdateProfile({ introCardFields: selectedFields });
    setIsDetailsModalOpen(false);
  };

  const toggleField = (field: ProfileFieldKey) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  // Helper for social icon
  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'github':
        return <Link2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'linkedin':
        return <Link2 className="w-4 h-4 text-blue-500" />;
      case 'facebook':
        return <Link2 className="w-4 h-4 text-blue-600" />;
      default:
        return <Globe className="w-4 h-4 text-neutral-500" />;
    }
  };

  // Joined date formatted
  const joinedDate = user.createdAt ? new Date(user.createdAt) : new Date();
  const joinedMonthYear = `Tháng ${joinedDate.getMonth() + 1} năm ${joinedDate.getFullYear()}`;

  const shouldShowField = (field: ProfileFieldKey, aud?: Audience) => {
    if (!introCardFields.includes(field)) return false;
    return isOwner || canViewAudience(aud);
  };

  return (
    <div className="space-y-4">
      {/* Giới thiệu Card */}
      <div className="bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 p-4 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Giới thiệu</h3>

        {/* Short Intro / Bio */}
        <div className="space-y-2">
          {isEditingIntro ? (
            <div className="space-y-2 animate-in fade-in duration-150">
              <Textarea
                value={introText}
                onChange={(e) => setIntroText(e.target.value.slice(0, 101))}
                placeholder="Thêm tiểu sử ngắn để người khác hiểu hơn về bạn..."
                rows={3}
                className="text-center text-sm"
              />
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Còn {101 - introText.length} ký tự</span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2.5"
                    onClick={() => {
                      setIntroText(profile.intro || '');
                      setIsEditingIntro(false);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-3"
                    onClick={handleSaveIntro}
                  >
                    Lưu
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {profile.intro ? (
                <p className="text-sm text-neutral-700 dark:text-neutral-300 italic whitespace-pre-wrap leading-relaxed py-1">
                  "{profile.intro}"
                </p>
              ) : isOwner ? (
                <p className="text-xs text-neutral-400 italic py-1">
                  Chưa có tiểu sử ngắn. Thêm tiểu sử để mọi người biết bạn là ai.
                </p>
              ) : null}

              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIntroText(profile.intro || '');
                    setIsEditingIntro(true);
                  }}
                  className="w-full mt-2 text-xs font-semibold h-8 bg-neutral-100 dark:bg-neutral-800 border-none hover:bg-neutral-200 dark:hover:bg-neutral-700"
                >
                  {profile.intro ? 'Chỉnh sửa tiểu sử' : 'Thêm tiểu sử'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Quick Facts List */}
        <div className="space-y-3 pt-2 text-sm text-neutral-800 dark:text-neutral-200">
          {/* Education */}
          {primaryEdu && shouldShowField('education', primaryEdu.audience) && (
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span>Học </span>
                {primaryEdu.major && <strong className="font-semibold">{primaryEdu.major}</strong>}
                <span> tại </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {primaryEdu.schoolName}
                </span>
                {primaryEdu.cohort && <span> ({primaryEdu.cohort})</span>}
              </div>
            </div>
          )}

          {/* Work */}
          {primaryWork && shouldShowField('work', primaryWork.audience) && (
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-neutral-500 dark:text-neutral-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span>{primaryWork.isCurrent ? 'Làm' : 'Từng làm'} </span>
                <strong className="font-semibold">{primaryWork.position}</strong>
                <span> tại </span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {primaryWork.company}
                </span>
              </div>
            </div>
          )}

          {/* Current City */}
          {profile.currentCity && shouldShowField('currentCity', profile.fieldAudience?.currentCity) && (
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-neutral-500 dark:text-neutral-400 shrink-0" />
              <div className="text-xs">
                <span>Sống tại </span>
                <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {profile.currentCity}
                </strong>
              </div>
            </div>
          )}

          {/* Hometown */}
          {profile.hometown && shouldShowField('hometown', profile.fieldAudience?.hometown) && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-neutral-500 dark:text-neutral-400 shrink-0" />
              <div className="text-xs">
                <span>Đến từ </span>
                <strong className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {profile.hometown}
                </strong>
              </div>
            </div>
          )}

          {/* Social Links */}
          {profile.links &&
            profile.links.length > 0 &&
            shouldShowField('links', profile.fieldAudience?.links) && (
              <div className="space-y-2">
                {profile.links.map((link) => (
                  <div key={link.id} className="flex items-center gap-3">
                    {getLinkIcon(link.type)}
                    <a
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline truncate max-w-[200px] flex items-center gap-1"
                    >
                      <span className="truncate">{link.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                    </a>
                  </div>
                ))}
              </div>
            )}

          {/* Joined SCS date */}
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-neutral-500 dark:text-neutral-400 shrink-0" />
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Tham gia SCS từ {joinedMonthYear}
            </div>
          </div>
        </div>

        {/* Edit Details Button */}
        {isOwner && (
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFields(profile.introCardFields || [
                  'education',
                  'work',
                  'currentCity',
                  'hometown',
                  'links',
                  'skills',
                ]);
                setIsDetailsModalOpen(true);
              }}
              className="w-full text-xs font-semibold h-8 bg-neutral-100 dark:bg-neutral-800 border-none hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              Chỉnh sửa chi tiết
            </Button>
          </div>
        )}
      </div>

      {/* Skills Card (if enabled and present) */}
      {introCardFields.includes('skills') &&
        profile.skills &&
        profile.skills.length > 0 &&
        (isOwner || canViewAudience(profile.fieldAudience?.skills)) && (
          <div className="bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Kỹ năng nổi bật
              </h3>
              {isOwner && onNavigateToAboutTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToAboutTab('learning')}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {profile.skills.slice(0, 8).map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium rounded-lg"
                >
                  {skill}
                </Badge>
              ))}
              {profile.skills.length > 8 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 text-neutral-500 rounded-lg cursor-pointer"
                  onClick={() => onNavigateToAboutTab && onNavigateToAboutTab('learning')}
                >
                  +{profile.skills.length - 8} khác
                </Badge>
              )}
            </div>
          </div>
        )}

      {/* Dialog: Chỉnh sửa chi tiết (Facebook Edit Details modal) */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Chỉnh sửa chi tiết</DialogTitle>
            <p className="text-xs text-neutral-500">
              Chọn những thông tin bạn muốn hiển thị nổi bật ở thẻ Giới thiệu trên trang cá nhân của bạn.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Education toggle */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <Checkbox
                id="toggle-edu"
                checked={selectedFields.includes('education')}
                onCheckedChange={() => toggleField('education')}
              />
              <div className="space-y-0.5">
                <label htmlFor="toggle-edu" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer block">
                  Học vấn
                </label>
                <p className="text-[11px] text-neutral-500">
                  {primaryEdu ? `${primaryEdu.schoolName} · ${primaryEdu.major}` : 'Chưa có thông tin'}
                </p>
              </div>
            </div>

            {/* Work toggle */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <Checkbox
                id="toggle-work"
                checked={selectedFields.includes('work')}
                onCheckedChange={() => toggleField('work')}
              />
              <div className="space-y-0.5">
                <label htmlFor="toggle-work" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer block">
                  Công việc / Thực tập
                </label>
                <p className="text-[11px] text-neutral-500">
                  {primaryWork ? `${primaryWork.position} tại ${primaryWork.company}` : 'Chưa có thông tin'}
                </p>
              </div>
            </div>

            {/* Current City toggle */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <Checkbox
                id="toggle-city"
                checked={selectedFields.includes('currentCity')}
                onCheckedChange={() => toggleField('currentCity')}
              />
              <div className="space-y-0.5">
                <label htmlFor="toggle-city" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer block">
                  Nơi sống hiện tại
                </label>
                <p className="text-[11px] text-neutral-500">{profile.currentCity || 'Chưa thiết lập'}</p>
              </div>
            </div>

            {/* Hometown toggle */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <Checkbox
                id="toggle-hometown"
                checked={selectedFields.includes('hometown')}
                onCheckedChange={() => toggleField('hometown')}
              />
              <div className="space-y-0.5">
                <label htmlFor="toggle-hometown" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer block">
                  Quê quán
                </label>
                <p className="text-[11px] text-neutral-500">{profile.hometown || 'Chưa thiết lập'}</p>
              </div>
            </div>

            {/* Links toggle */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <Checkbox
                id="toggle-links"
                checked={selectedFields.includes('links')}
                onCheckedChange={() => toggleField('links')}
              />
              <div className="space-y-0.5">
                <label htmlFor="toggle-links" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer block">
                  Liên kết mạng xã hội & Website
                </label>
                <p className="text-[11px] text-neutral-500">
                  {profile.links?.length ? `${profile.links.length} liên kết` : 'Chưa có liên kết'}
                </p>
              </div>
            </div>

            {/* Skills toggle */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700">
              <Checkbox
                id="toggle-skills"
                checked={selectedFields.includes('skills')}
                onCheckedChange={() => toggleField('skills')}
              />
              <div className="space-y-0.5">
                <label htmlFor="toggle-skills" className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 cursor-pointer block">
                  Kỹ năng chuyên môn
                </label>
                <p className="text-[11px] text-neutral-500">
                  {profile.skills?.length ? `${profile.skills.length} kỹ năng` : 'Chưa có kỹ năng'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
              Hủy
            </Button>
            <Button size="sm" onClick={handleSaveDetails}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
