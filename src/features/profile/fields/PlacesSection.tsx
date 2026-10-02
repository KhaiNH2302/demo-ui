import React, { useState } from 'react';
import { Home, MapPin, Pencil } from 'lucide-react';
import type { Audience } from '@/types/entities';
import { AudienceSelect } from './AudienceSelect';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PROVINCES } from '../profileConstants';

interface PlacesSectionProps {
  currentCity?: string;
  hometown?: string;
  cityAudience?: Audience;
  hometownAudience?: Audience;
  onChange: (data: {
    currentCity?: string;
    hometown?: string;
    cityAudience?: Audience;
    hometownAudience?: Audience;
  }) => void;
  isOwner: boolean;
  canViewAudience?: (aud: Audience) => boolean;
}

export const PlacesSection: React.FC<PlacesSectionProps> = ({
  currentCity = 'Hà Nội',
  hometown = 'Nam Định',
  cityAudience = 'public',
  hometownAudience = 'followers',
  onChange,
  isOwner,
  canViewAudience = () => true,
}) => {
  const [editingField, setEditingField] = useState<'city' | 'hometown' | null>(null);
  const [tempCity, setTempCity] = useState(currentCity);
  const [tempHometown, setTempHometown] = useState(hometown);

  const canShowCity = isOwner || canViewAudience(cityAudience);
  const canShowHometown = isOwner || canViewAudience(hometownAudience);

  const saveCity = () => {
    onChange({ currentCity: tempCity });
    setEditingField(null);
  };

  const saveHometown = () => {
    onChange({ hometown: tempHometown });
    setEditingField(null);
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b border-neutral-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Nơi từng sống
        </h3>
      </div>

      <div className="space-y-3">
        {/* Tỉnh/thành hiện tại */}
        {canShowCity && (
          <div className="p-3 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors">
            {editingField === 'city' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Chỉnh sửa Tỉnh/Thành hiện tại</span>
                  <AudienceSelect
                    value={cityAudience}
                    onChange={(aud) => onChange({ cityAudience: aud })}
                    showLabel
                  />
                </div>
                <Select
                  value={tempCity}
                  onValueChange={setTempCity}
                  options={PROVINCES.map((p) => ({ value: p, label: p }))}
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={saveCity}>
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Home size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-900">
                      Sống tại <strong className="font-semibold text-neutral-900">{currentCity || 'Chưa cập nhật'}</strong>
                    </div>
                    <div className="text-[11px] text-neutral-400">Thành phố hiện tại</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <AudienceSelect
                    value={cityAudience}
                    onChange={(aud) => onChange({ cityAudience: aud })}
                    disabled={!isOwner}
                  />
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempCity(currentCity);
                        setEditingField('city');
                      }}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      title="Sửa thành phố hiện tại"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quê quán */}
        {canShowHometown && (
          <div className="p-3 rounded-lg border border-neutral-200 bg-surface hover:border-neutral-300 transition-colors">
            {editingField === 'hometown' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">Chỉnh sửa Quê quán</span>
                  <AudienceSelect
                    value={hometownAudience}
                    onChange={(aud) => onChange({ hometownAudience: aud })}
                    showLabel
                  />
                </div>
                <Select
                  value={tempHometown}
                  onValueChange={setTempHometown}
                  options={PROVINCES.map((p) => ({ value: p, label: p }))}
                />
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                  <Button size="sm" variant="outline" onClick={() => setEditingField(null)}>
                    Hủy
                  </Button>
                  <Button size="sm" onClick={saveHometown}>
                    Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-900">
                      Đến từ <strong className="font-semibold text-neutral-900">{hometown || 'Chưa cập nhật'}</strong>
                    </div>
                    <div className="text-[11px] text-neutral-400">Quê quán</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <AudienceSelect
                    value={hometownAudience}
                    onChange={(aud) => onChange({ hometownAudience: aud })}
                    disabled={!isOwner}
                  />
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setTempHometown(hometown);
                        setEditingField('hometown');
                      }}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                      title="Sửa quê quán"
                    >
                      <Pencil size={14} />
                    </button>
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
