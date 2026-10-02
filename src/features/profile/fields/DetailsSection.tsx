import React, { useState } from 'react';
import { FileText, Tag, Quote, Heart, Pencil } from 'lucide-react';
import type { Audience } from '@/types/entities';
import { AudienceSelect } from './AudienceSelect';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TagInput } from '@/components/shared/TagInput';
import { Chip } from '@/components/ui/Chip';
import { HOBBY_SUGGESTIONS } from '../profileConstants';

interface DetailsSectionProps {
  about?: string;
  otherNames?: string[];
  favoriteQuote?: string;
  hobbies?: string[];
  aboutAudience?: Audience;
  quoteAudience?: Audience;
  hobbiesAudience?: Audience;
  onChange: (data: any) => void;
  isOwner: boolean;
  canViewAudience?: (aud: Audience) => boolean;
}

export const DetailsSection: React.FC<DetailsSectionProps> = ({
  about = '',
  otherNames = [],
  favoriteQuote = '',
  hobbies = [],
  aboutAudience = 'public',
  quoteAudience = 'public',
  hobbiesAudience = 'public',
  onChange,
  isOwner,
  canViewAudience = () => true,
}) => {
  const [editingField, setEditingField] = useState<'about' | 'otherNames' | 'quote' | 'hobbies' | null>(null);

  const [tempAbout, setTempAbout] = useState(about);
  const [tempOtherNames, setTempOtherNames] = useState(otherNames.join(', '));
  const [tempQuote, setTempQuote] = useState(favoriteQuote);
  const [tempHobbies, setTempHobbies] = useState<string[]>(hobbies);

  const canShowAbout = isOwner || canViewAudience(aboutAudience);
  const canShowQuote = isOwner || canViewAudience(quoteAudience);
  const canShowHobbies = isOwner || canViewAudience(hobbiesAudience);

  const saveAbout = () => {
    onChange({ about: tempAbout, bio: tempAbout });
    setEditingField(null);
  };

  const saveOtherNames = () => {
    const names = tempOtherNames.split(',').map((n) => n.trim()).filter(Boolean);
    onChange({ otherNames: names });
    setEditingField(null);
  };

  const saveQuote = () => {
    onChange({ favoriteQuote: tempQuote });
    setEditingField(null);
  };

  const saveHobbies = () => {
    onChange({ hobbies: tempHobbies });
    setEditingField(null);
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-neutral-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Chi tiết về bạn
        </h3>
      </div>

      <div className="space-y-3">
        {/* Giới thiệu dài (About) */}
        {canShowAbout && (
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors">
            {editingField === 'about' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Giới thiệu chi tiết về bạn</span>
                  <AudienceSelect
                    value={aboutAudience}
                    onChange={(aud) => onChange({ aboutAudience: aud })}
                    showLabel
                  />
                </div>
                <Textarea
                  value={tempAbout}
                  onChange={(e) => setTempAbout(e.target.value)}
                  placeholder="Viết một đoạn giới thiệu chi tiết về quá trình học tập, phong cách làm việc, định hướng tương lai..."
                  rows={4}
                  maxLength={1000}
                  className="text-xs"
                />
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Tối đa 1000 ký tự</span>
                  <span>{tempAbout.length}/1000</span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={saveAbout}>
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900">Giới thiệu về bạn</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AudienceSelect
                      value={aboutAudience}
                      onChange={(aud) => onChange({ aboutAudience: aud })}
                      disabled={!isOwner}
                    />
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempAbout(about);
                          setEditingField('about');
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                        title="Sửa giới thiệu"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line pl-6">
                  {about || <span className="text-neutral-400 italic">Chưa có phần giới thiệu chi tiết.</span>}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Biệt danh / Tên gọi khác */}
        <div className="p-3.5 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors">
          {editingField === 'otherNames' ? (
            <div className="space-y-3">
              <span className="text-xs font-bold text-neutral-900 block">Biệt danh / Tên gọi khác</span>
              <Input
                value={tempOtherNames}
                onChange={(e) => setTempOtherNames(e.target.value)}
                placeholder="vd: An Dev, Peter Nguyen (ngăn cách bằng dấu phẩy)..."
                className="text-xs"
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={saveOtherNames}>
                  Lưu
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                  <Tag size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900">
                    {otherNames.length > 0 ? otherNames.join(', ') : <span className="text-neutral-400 font-normal">Chưa cập nhật</span>}
                  </div>
                  <div className="text-[11px] text-neutral-400">Tên gọi khác / Biệt danh</div>
                </div>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setTempOtherNames(otherNames.join(', '));
                    setEditingField('otherNames');
                  }}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                  title="Sửa biệt danh"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Câu nói yêu thích */}
        {canShowQuote && (
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors">
            {editingField === 'quote' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Câu trích dẫn yêu thích</span>
                  <AudienceSelect
                    value={quoteAudience}
                    onChange={(aud) => onChange({ quoteAudience: aud })}
                    showLabel
                  />
                </div>
                <Input
                  value={tempQuote}
                  onChange={(e) => setTempQuote(e.target.value)}
                  placeholder="vd: Stay hungry, stay foolish..."
                  className="text-xs"
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={saveQuote}>
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Quote size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 italic">
                      {favoriteQuote ? `"${favoriteQuote}"` : <span className="text-neutral-400 not-italic font-normal">Chưa cập nhật</span>}
                    </div>
                    <div className="text-[11px] text-neutral-400">Câu nói yêu thích</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <AudienceSelect
                    value={quoteAudience}
                    onChange={(aud) => onChange({ quoteAudience: aud })}
                    disabled={!isOwner}
                  />
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempQuote(favoriteQuote);
                        setEditingField('quote');
                      }}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                      title="Sửa câu trích dẫn"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sở thích (Hobbies) */}
        {canShowHobbies && (
          <div className="p-3.5 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors">
            {editingField === 'hobbies' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Sở thích cá nhân</span>
                  <AudienceSelect
                    value={hobbiesAudience}
                    onChange={(aud) => onChange({ hobbiesAudience: aud })}
                    showLabel
                  />
                </div>
                <TagInput
                  value={tempHobbies}
                  onChange={setTempHobbies}
                  suggestions={HOBBY_SUGGESTIONS}
                  placeholder="Thêm sở thích và nhấn Enter..."
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={saveHobbies}>
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart size={16} className="text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-900">Sở thích</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AudienceSelect
                      value={hobbiesAudience}
                      onChange={(aud) => onChange({ hobbiesAudience: aud })}
                      disabled={!isOwner}
                    />
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempHobbies(hobbies);
                          setEditingField('hobbies');
                        }}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                        title="Sửa sở thích"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pl-6">
                  {hobbies.length > 0 ? (
                    hobbies.map((h) => (
                      <Chip key={h} size="sm">
                        {h}
                      </Chip>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400 italic">Chưa cập nhật sở thích.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
