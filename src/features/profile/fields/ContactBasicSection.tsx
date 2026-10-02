import React, { useState } from 'react';
import { Mail, Phone, Globe, Calendar, UserCheck, Languages, Plus, Trash2, Pencil, ExternalLink } from 'lucide-react';
import type { Audience, ProfileLink } from '@/types/entities';
import { AudienceSelect } from './AudienceSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { LINK_TYPES } from '../profileConstants';

interface ContactBasicSectionProps {
  email: string;
  secondaryEmail?: string;
  phone?: string;
  links?: ProfileLink[];
  gender?: 'male' | 'female' | 'other' | 'undisclosed';
  birthday?: string; // YYYY-MM-DD
  birthdayAudience?: Audience;
  birthYearAudience?: Audience;
  languages?: string[];
  contactAudience?: Audience;
  genderAudience?: Audience;
  onChange: (data: any) => void;
  isOwner: boolean;
  canViewAudience?: (aud: Audience) => boolean;
}

export const ContactBasicSection: React.FC<ContactBasicSectionProps> = ({
  email,
  secondaryEmail = '',
  phone = '',
  links = [],
  gender = 'undisclosed',
  birthday = '2004-05-15',
  birthdayAudience = 'followers',
  birthYearAudience = 'only_me',
  languages = ['Tiếng Việt', 'Tiếng Anh'],
  contactAudience = 'only_me',
  genderAudience = 'public',
  onChange,
  isOwner,
  canViewAudience = () => true,
}) => {
  const [editingSection, setEditingSection] = useState<'contact' | 'links' | 'basic' | null>(null);

  // Temp states
  const [tempSecondaryEmail, setTempSecondaryEmail] = useState(secondaryEmail);
  const [tempPhone, setTempPhone] = useState(phone);
  const [tempGender, setTempGender] = useState(gender);
  const [tempBirthday, setTempBirthday] = useState(birthday);
  const [tempLanguages, setTempLanguages] = useState(languages.join(', '));
  const [tempLinks, setTempLinks] = useState<ProfileLink[]>(links);

  const canShowContact = isOwner || canViewAudience(contactAudience);
  const canShowGender = isOwner || canViewAudience(genderAudience);
  const canShowBirthday = isOwner || canViewAudience(birthdayAudience);
  const canShowBirthYear = isOwner || canViewAudience(birthYearAudience);

  const saveContact = () => {
    onChange({
      contact: { phone: tempPhone, secondaryEmail: tempSecondaryEmail },
    });
    setEditingSection(null);
  };

  const saveBasic = () => {
    const langs = tempLanguages.split(',').map((l) => l.trim()).filter(Boolean);
    onChange({
      gender: tempGender,
      birthday: tempBirthday,
      languages: langs,
    });
    setEditingSection(null);
  };

  const saveLinks = () => {
    onChange({ links: tempLinks });
    setEditingSection(null);
  };

  const addLink = () => {
    setTempLinks([...tempLinks, { id: `link_${Date.now()}`, type: 'github', url: '' }]);
  };

  const updateLink = (idx: number, patch: Partial<ProfileLink>) => {
    const next = [...tempLinks];
    next[idx] = { ...next[idx], ...patch };
    setTempLinks(next);
  };

  const removeLink = (idx: number) => {
    setTempLinks(tempLinks.filter((_, i) => i !== idx));
  };

  // Format birthday display according to separate privacy
  const formatBirthday = () => {
    if (!birthday) return 'Chưa cập nhật';
    const parts = birthday.split('-');
    if (parts.length < 3) return birthday;
    const [y, m, d] = parts;

    if (isOwner) {
      return `${d} tháng ${m}, ${y}`;
    }

    if (canShowBirthday && canShowBirthYear) {
      return `${d} tháng ${m}, ${y}`;
    }
    if (canShowBirthday && !canShowBirthYear) {
      return `${d} tháng ${m}`;
    }
    if (!canShowBirthday && canShowBirthYear) {
      return `Năm ${y}`;
    }
    return null;
  };

  const genderLabels = {
    male: 'Nam',
    female: 'Nữ',
    other: 'Khác',
    undisclosed: 'Không tiết lộ',
  };

  return (
    <div className="space-y-6">
      {/* 1. THÔNG TIN LIÊN HỆ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Thông tin liên hệ
          </h3>
          {isOwner && editingSection !== 'contact' && (
            <button
              type="button"
              onClick={() => {
                setTempSecondaryEmail(secondaryEmail);
                setTempPhone(phone);
                setEditingSection('contact');
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={13} /> Sửa liên hệ
            </button>
          )}
        </div>

        {editingSection === 'contact' ? (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900">Chỉnh sửa liên hệ</span>
              <AudienceSelect
                value={contactAudience}
                onChange={(aud) => onChange({ contactAudience: aud })}
                showLabel
              />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-600 font-semibold mb-1">Email trường / Đăng nhập (Mặc định)</label>
                <Input value={email} disabled className="bg-neutral-100" />
              </div>
              <div>
                <label className="block text-neutral-600 font-semibold mb-1">Email phụ / Email cá nhân</label>
                <Input
                  value={tempSecondaryEmail}
                  onChange={(e) => setTempSecondaryEmail(e.target.value)}
                  placeholder="vd: canhan@gmail.com"
                />
              </div>
              <div>
                <label className="block text-neutral-600 font-semibold mb-1">Số điện thoại</label>
                <Input
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="vd: 0912 345 678"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
              <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                Hủy
              </Button>
              <Button size="sm" onClick={saveContact}>
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Email chính */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{email}</div>
                  <div className="text-[11px] text-neutral-400">Email trường (Tài khoản)</div>
                </div>
              </div>
              <AudienceSelect value="public" disabled />
            </div>

            {/* Email phụ */}
            {(secondaryEmail || isOwner) && canShowContact && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-surface">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {secondaryEmail || <span className="text-neutral-400 font-normal">Chưa cập nhật</span>}
                    </div>
                    <div className="text-[11px] text-neutral-400">Email cá nhân</div>
                  </div>
                </div>
                <AudienceSelect value={contactAudience} disabled />
              </div>
            )}

            {/* Số điện thoại */}
            {(phone || isOwner) && canShowContact && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-surface">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {phone || <span className="text-neutral-400 font-normal">Chưa cập nhật</span>}
                    </div>
                    <div className="text-[11px] text-neutral-400">Di động</div>
                  </div>
                </div>
                <AudienceSelect value={contactAudience} disabled />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. CÁC LIÊN KẾT XÃ HỘI & PORTFOLIO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Các liên kết & Website
          </h3>
          {isOwner && editingSection !== 'links' && (
            <button
              type="button"
              onClick={() => {
                setTempLinks(links);
                setEditingSection('links');
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={13} /> Sửa liên kết
            </button>
          )}
        </div>

        {editingSection === 'links' ? (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900">Quản lý liên kết</span>
              <button
                type="button"
                onClick={addLink}
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Thêm liên kết
              </button>
            </div>

            <div className="space-y-2">
              {tempLinks.map((lnk, idx) => (
                <div key={lnk.id || idx} className="flex items-center gap-2">
                  <Select
                    value={lnk.type}
                    onValueChange={(val) => updateLink(idx, { type: val as any })}
                    options={LINK_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    className="w-32 shrink-0 text-xs"
                  />
                  <Input
                    value={lnk.url}
                    onChange={(e) => updateLink(idx, { url: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(idx)}
                    className="p-2 text-neutral-400 hover:text-tier-danger-text cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
              <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                Hủy
              </Button>
              <Button size="sm" onClick={saveLinks}>
                Lưu liên kết
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {links.length === 0 && (
              <div className="text-xs text-neutral-400 italic py-1">Chưa có liên kết xã hội nào.</div>
            )}
            {links.map((lnk, idx) => (
              <div
                key={lnk.id || idx}
                className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-surface"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Globe size={18} />
                  </div>
                  <div className="min-w-0">
                    <a
                      href={lnk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1.5 truncate"
                    >
                      <span>{lnk.url}</span>
                      <ExternalLink size={12} className="shrink-0" />
                    </a>
                    <div className="text-[11px] text-neutral-400 capitalize">{lnk.type}</div>
                  </div>
                </div>
                <AudienceSelect value="public" disabled />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. THÔNG TIN CƠ BẢN (Giới tính, Ngày sinh, Ngôn ngữ) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Thông tin cơ bản
          </h3>
          {isOwner && editingSection !== 'basic' && (
            <button
              type="button"
              onClick={() => {
                setTempGender(gender);
                setTempBirthday(birthday);
                setTempLanguages(languages.join(', '));
                setEditingSection('basic');
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={13} /> Sửa thông tin
            </button>
          )}
        </div>

        {editingSection === 'basic' ? (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 space-y-3">
            <span className="text-xs font-bold text-neutral-900 block">Chỉnh sửa thông tin cơ bản</span>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-neutral-600 font-semibold mb-1">Giới tính</label>
                  <Select
                    value={tempGender}
                    onValueChange={(val) => setTempGender(val as any)}
                    options={[
                      { value: 'male', label: 'Nam' },
                      { value: 'female', label: 'Nữ' },
                      { value: 'other', label: 'Khác' },
                      { value: 'undisclosed', label: 'Không tiết lộ' },
                    ]}
                  />
                </div>
                <div className="pt-5">
                  <AudienceSelect
                    value={genderAudience}
                    onChange={(aud) => onChange({ genderAudience: aud })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-neutral-600 font-semibold mb-1">Ngày sinh (YYYY-MM-DD)</label>
                  <Input
                    type="date"
                    value={tempBirthday}
                    onChange={(e) => setTempBirthday(e.target.value)}
                  />
                </div>
                <div className="pt-5 flex items-center gap-1.5" title="Quyền riêng tư ngày/tháng và năm sinh">
                  <span className="text-[10px] text-neutral-400">Ngày:</span>
                  <AudienceSelect
                    value={birthdayAudience}
                    onChange={(aud) => onChange({ birthdayAudience: aud })}
                  />
                  <span className="text-[10px] text-neutral-400 ml-1">Năm:</span>
                  <AudienceSelect
                    value={birthYearAudience}
                    onChange={(aud) => onChange({ birthYearAudience: aud })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">Ngôn ngữ (ngăn cách bởi dấu phẩy)</label>
                <Input
                  value={tempLanguages}
                  onChange={(e) => setTempLanguages(e.target.value)}
                  placeholder="Tiếng Việt, Tiếng Anh, Tiếng Nhật..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
              <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                Hủy
              </Button>
              <Button size="sm" onClick={saveBasic}>
                Lưu
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Giới tính */}
            {canShowGender && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-surface">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <UserCheck size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {genderLabels[gender] || 'Không tiết lộ'}
                    </div>
                    <div className="text-[11px] text-neutral-400">Giới tính</div>
                  </div>
                </div>
                <AudienceSelect value={genderAudience} disabled />
              </div>
            )}

            {/* Ngày sinh */}
            {formatBirthday() && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-surface">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{formatBirthday()}</div>
                    <div className="text-[11px] text-neutral-400">Ngày sinh</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <AudienceSelect value={birthdayAudience} disabled />
                  <AudienceSelect value={birthYearAudience} disabled />
                </div>
              </div>
            )}

            {/* Ngôn ngữ */}
            {languages.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 bg-surface">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Languages size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{languages.join(', ')}</div>
                    <div className="text-[11px] text-neutral-400">Ngôn ngữ</div>
                  </div>
                </div>
                <AudienceSelect value="public" disabled />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
