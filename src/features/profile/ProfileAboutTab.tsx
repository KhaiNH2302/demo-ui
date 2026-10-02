import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  FileText,
  Trophy,
  Sparkles,
  Award,
  ChevronRight,
  ExternalLink,
  Plus,
  Home,
  Mail,
} from 'lucide-react';
import type {
  StudentProfile,
  User as UserType,
  Audience,
  MentorProfileSection,
} from '@/types/entities';
import { EducationSection } from './fields/EducationSection';
import { WorkSection } from './fields/WorkSection';
import { PlacesSection } from './fields/PlacesSection';
import { ContactBasicSection } from './fields/ContactBasicSection';
import { DetailsSection } from './fields/DetailsSection';
import { LifeEventsSection } from './fields/LifeEventsSection';
import { LearningSection } from './fields/LearningSection';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export type AboutSubTabKey =
  | 'overview'
  | 'education_work'
  | 'places'
  | 'contact_basic'
  | 'details'
  | 'life_events'
  | 'learning'
  | 'mentor_profile';

interface ProfileAboutTabProps {
  profile: StudentProfile;
  user: UserType;
  isOwner: boolean;
  canViewAudience: (aud?: Audience) => boolean;
  onUpdateProfile: (updates: Partial<StudentProfile>) => Promise<void> | void;
  activeSubTab?: AboutSubTabKey;
  onSubTabChange?: (tab: AboutSubTabKey) => void;
  // For mentor custom sections
  isMentor?: boolean;
  mentorSections?: MentorProfileSection[];
  onOpenAddMentorSection?: () => void;
  onOpenEditMentorSection?: (section: MentorProfileSection) => void;
  onDeleteMentorSection?: (id: string) => void;
}

export const ProfileAboutTab: React.FC<ProfileAboutTabProps> = ({
  profile,
  user,
  isOwner,
  canViewAudience,
  onUpdateProfile,
  activeSubTab: externalSubTab,
  onSubTabChange,
  isMentor = false,
  mentorSections = [],
  onOpenAddMentorSection,
  onOpenEditMentorSection,
  onDeleteMentorSection,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<AboutSubTabKey>('overview');
  const currentTab = externalSubTab || internalSubTab;

  const setTab = (key: AboutSubTabKey) => {
    if (onSubTabChange) {
      onSubTabChange(key);
    } else {
      setInternalSubTab(key);
    }
  };

  const navItems = [
    { key: 'overview' as AboutSubTabKey, label: 'Tổng quan', icon: User },
    { key: 'education_work' as AboutSubTabKey, label: 'Học vấn & Công việc', icon: GraduationCap },
    { key: 'places' as AboutSubTabKey, label: 'Nơi sống', icon: MapPin },
    { key: 'contact_basic' as AboutSubTabKey, label: 'Liên hệ & Thông tin cơ bản', icon: Phone },
    { key: 'details' as AboutSubTabKey, label: 'Chi tiết về bạn', icon: FileText },
    { key: 'life_events' as AboutSubTabKey, label: 'Cột mốc', icon: Trophy },
    { key: 'learning' as AboutSubTabKey, label: 'Học tập & Kết nối', icon: Sparkles },
    ...(isMentor
      ? [{ key: 'mentor_profile' as AboutSubTabKey, label: 'Hồ sơ Mentor', icon: Award }]
      : []),
  ];

  // Helper values for overview
  const primaryEdu = profile.education?.find((e) => e.isCurrent) || profile.education?.[0];
  const primaryWork = profile.work?.find((w) => w.isCurrent) || profile.work?.[0];

  return (
    <div className="bg-surface rounded-2xl border border-neutral-200 dark:border-neutral-700/80 shadow-sm overflow-hidden min-h-[500px]">
      {/* Mobile subtab dropdown (< 1024px) */}
      <div className="lg:hidden p-4 border-b border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/40">
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 block">
          Chọn danh mục giới thiệu
        </label>
        <Select
          value={currentTab}
          onValueChange={(val) => setTab(val as AboutSubTabKey)}
          options={navItems.map((item) => ({
            value: item.key,
            label: item.label,
          }))}
        />
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Desktop Sidebar Navigation (≥ 1024px) */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-neutral-200 dark:border-neutral-700/80 p-3 bg-neutral-50/30 dark:bg-neutral-800/20">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 px-3 py-2">
            Giới thiệu
          </h3>
          <nav className="space-y-0.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground font-semibold shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 p-5 md:p-7 min-w-0">
          {/* 1. TỔNG QUAN */}
          {currentTab === 'overview' && (
            <div className="space-y-6">
              <div className="border-b border-neutral-200 dark:border-neutral-700 pb-3">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Tổng quan hồ sơ
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Tóm tắt những thông tin cơ bản và học thuật nổi bật của bạn
                </p>
              </div>

              <div className="space-y-4">
                {/* Học vấn */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-neutral-500 block">Học vấn hiện tại</span>
                      {primaryEdu ? (
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {primaryEdu.schoolName}
                          {primaryEdu.major && (
                            <span className="font-normal text-neutral-600 dark:text-neutral-400 block text-xs mt-0.5">
                              Chuyên ngành {primaryEdu.major} {primaryEdu.cohort && `· ${primaryEdu.cohort}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">Chưa có thông tin trường học</span>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary"
                      onClick={() => setTab('education_work')}
                    >
                      {primaryEdu ? 'Chi tiết' : '+ Thêm'}
                    </Button>
                  )}
                </div>

                {/* Công việc */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-neutral-500 block">Nơi làm việc / Thực tập</span>
                      {primaryWork ? (
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {primaryWork.position} tại {primaryWork.company}
                          {primaryWork.city && (
                            <span className="font-normal text-neutral-600 dark:text-neutral-400 block text-xs mt-0.5">
                              {primaryWork.city}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">Chưa thêm nơi làm việc</span>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary"
                      onClick={() => setTab('education_work')}
                    >
                      {primaryWork ? 'Chi tiết' : '+ Thêm'}
                    </Button>
                  )}
                </div>

                {/* Nơi sống */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
                  <div className="flex items-start gap-3">
                    <Home className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-neutral-500 block">Nơi sống & Quê quán</span>
                      {profile.currentCity || profile.hometown ? (
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 space-y-0.5">
                          {profile.currentCity && <div>Sống tại {profile.currentCity}</div>}
                          {profile.hometown && (
                            <div className="text-xs font-normal text-neutral-600 dark:text-neutral-400">
                              Đến từ {profile.hometown}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">Chưa thêm nơi sống</span>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary"
                      onClick={() => setTab('places')}
                    >
                      {profile.currentCity ? 'Chi tiết' : '+ Thêm'}
                    </Button>
                  )}
                </div>

                {/* Liên hệ */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-neutral-500 block">Thông tin liên hệ</span>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {user.email}
                        {profile.contact?.phone && (
                          <span className="font-normal text-neutral-600 dark:text-neutral-400 block text-xs mt-0.5">
                            SĐT: {profile.contact.phone}
                          </span>
                        )}
                        {profile.links && profile.links.length > 0 && (
                          <span className="font-normal text-neutral-500 block text-xs mt-0.5">
                            {profile.links.length} liên kết mạng xã hội
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary"
                      onClick={() => setTab('contact_basic')}
                    >
                      Chi tiết
                    </Button>
                  )}
                </div>

                {/* Kỹ năng */}
                <div className="flex items-start justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs text-neutral-500 block">Kỹ năng & Ghép nối AI</span>
                      {profile.skills && profile.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {profile.skills.slice(0, 6).map((s) => (
                            <span
                              key={s}
                              className="text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                            >
                              {s}
                            </span>
                          ))}
                          {profile.skills.length > 6 && (
                            <span className="text-xs text-neutral-400 py-0.5">
                              +{profile.skills.length - 6} khác
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400 italic">Chưa chọn kỹ năng</span>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary"
                      onClick={() => setTab('learning')}
                    >
                      {profile.skills?.length ? 'Chi tiết' : '+ Thêm'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. HỌC VẤN & CÔNG VIỆC */}
          {currentTab === 'education_work' && (
            <div className="space-y-8">
              <WorkSection
                items={profile.work || []}
                onChange={(items) => onUpdateProfile({ work: items })}
                isOwner={isOwner}
                canViewAudience={canViewAudience}
              />

              <div className="border-t border-neutral-200 dark:border-neutral-700/80 pt-6">
                <EducationSection
                  items={profile.education || []}
                  onChange={(items) => onUpdateProfile({ education: items })}
                  isOwner={isOwner}
                  canViewAudience={canViewAudience}
                />
              </div>
            </div>
          )}

          {/* 3. NƠI TỪNG SỐNG */}
          {currentTab === 'places' && (
            <PlacesSection
              currentCity={profile.currentCity}
              hometown={profile.hometown}
              cityAudience={profile.fieldAudience?.currentCity || 'public'}
              hometownAudience={profile.fieldAudience?.hometown || 'followers'}
              onChange={(data) =>
                onUpdateProfile({
                  currentCity: data.currentCity,
                  hometown: data.hometown,
                  fieldAudience: {
                    ...profile.fieldAudience,
                    ...(data.cityAudience ? { currentCity: data.cityAudience } : {}),
                    ...(data.hometownAudience ? { hometown: data.hometownAudience } : {}),
                  },
                })
              }
              isOwner={isOwner}
              canViewAudience={canViewAudience}
            />
          )}

          {/* 4. LIÊN HỆ & THÔNG TIN CƠ BẢN */}
          {currentTab === 'contact_basic' && (
            <ContactBasicSection
              email={user.email}
              secondaryEmail={profile.contact?.secondaryEmail}
              phone={profile.contact?.phone}
              links={profile.links || []}
              gender={profile.gender}
              birthday={profile.birthday}
              birthdayAudience={profile.birthdayAudience || 'followers'}
              birthYearAudience={profile.birthYearAudience || 'only_me'}
              languages={profile.languages || []}
              contactAudience={profile.fieldAudience?.contact || 'only_me'}
              genderAudience={profile.fieldAudience?.gender || 'public'}
              onChange={(data) =>
                onUpdateProfile({
                  contact: {
                    phone: data.phone,
                    secondaryEmail: data.secondaryEmail,
                  },
                  links: data.links,
                  gender: data.gender,
                  birthday: data.birthday,
                  birthdayAudience: data.birthdayAudience,
                  birthYearAudience: data.birthYearAudience,
                  languages: data.languages,
                  fieldAudience: {
                    ...profile.fieldAudience,
                    ...(data.contactAudience ? { contact: data.contactAudience } : {}),
                    ...(data.genderAudience ? { gender: data.genderAudience } : {}),
                  },
                })
              }
              isOwner={isOwner}
              canViewAudience={canViewAudience}
            />
          )}

          {/* 5. CHI TIẾT VỀ BẠN */}
          {currentTab === 'details' && (
            <DetailsSection
              about={profile.about}
              otherNames={profile.otherNames || []}
              favoriteQuote={profile.favoriteQuote}
              hobbies={profile.hobbies || []}
              aboutAudience={profile.fieldAudience?.about || 'public'}
              quoteAudience={profile.fieldAudience?.favoriteQuote || 'public'}
              hobbiesAudience={profile.fieldAudience?.hobbies || 'public'}
              onChange={(data) =>
                onUpdateProfile({
                  about: data.about,
                  otherNames: data.otherNames,
                  favoriteQuote: data.favoriteQuote,
                  hobbies: data.hobbies,
                  fieldAudience: {
                    ...profile.fieldAudience,
                    ...(data.aboutAudience ? { about: data.aboutAudience } : {}),
                    ...(data.quoteAudience ? { favoriteQuote: data.quoteAudience } : {}),
                    ...(data.hobbiesAudience ? { hobbies: data.hobbiesAudience } : {}),
                  },
                })
              }
              isOwner={isOwner}
              canViewAudience={canViewAudience}
            />
          )}

          {/* 6. CỘT MỐC */}
          {currentTab === 'life_events' && (
            <LifeEventsSection
              items={profile.lifeEvents || []}
              onChange={(items) => onUpdateProfile({ lifeEvents: items })}
              isOwner={isOwner}
              canViewAudience={canViewAudience}
            />
          )}

          {/* 7. HỌC TẬP & KẾT NỐI (SCS) */}
          {currentTab === 'learning' && (
            <LearningSection
              skills={profile.skills || []}
              interests={profile.interests || []}
              goals={profile.goals || []}
              availability={profile.availability || []}
              privacy={profile.privacy}
              fieldAudience={profile.fieldAudience || {}}
              onUpdate={(updates) => onUpdateProfile(updates)}
              isOwner={isOwner}
              canViewAudience={canViewAudience}
            />
          )}

          {/* 8. HỒ SƠ MENTOR */}
          {currentTab === 'mentor_profile' && isMentor && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Hồ sơ Cố vấn (Mentor Profile)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Các khối thông tin giới thiệu năng lực, phương pháp hướng dẫn và thành tựu
                  </p>
                </div>
                {isOwner && onOpenAddMentorSection && (
                  <Button size="sm" onClick={onOpenAddMentorSection} leftIcon={<Plus className="w-4 h-4" />}>
                    Thêm khối thông tin
                  </Button>
                )}
              </div>

              {mentorSections.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
                  <Award className="w-10 h-10 text-neutral-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                    Chưa có khối thông tin Mentor tùy chỉnh nào
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
                    Thêm các khối như "Kinh nghiệm hướng dẫn", "Triết lý học tập", hoặc "Yêu cầu với Mentee" để sinh viên hiểu rõ hơn về bạn.
                  </p>
                  {isOwner && onOpenAddMentorSection && (
                    <Button size="sm" variant="outline" className="mt-4 text-xs" onClick={onOpenAddMentorSection}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Tạo khối đầu tiên
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorSections.map((sec) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-surface space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                          {sec.title}
                        </h4>
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            {onOpenEditMentorSection && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => onOpenEditMentorSection(sec)}
                              >
                                Sửa
                              </Button>
                            )}
                            {onDeleteMentorSection && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2 text-red-500 hover:text-red-600"
                                onClick={() => onDeleteMentorSection(sec.id)}
                              >
                                Xóa
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {typeof sec.content === 'string' && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                          {sec.content}
                        </p>
                      )}
                      {Array.isArray(sec.content) && sec.type === 'list' && (
                        <ul className="list-disc list-inside text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                          {(sec.content as string[]).map((item, idx) => (
                            <li key={idx}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                          ))}
                        </ul>
                      )}
                      {Array.isArray(sec.content) && sec.type === 'links' && (
                        <div className="flex flex-wrap gap-2">
                          {(sec.content as { label: string; url: string }[]).map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <span>{link.label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
