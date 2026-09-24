import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Stepper } from '@/components/ui/Stepper';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/shared/FormField';
import { TagInput } from '@/components/shared/TagInput';
import { ScheduleInput } from '@/components/shared/ScheduleInput';
import { apiClient } from '@/lib/apiClient';
import type { ScheduleSlot } from '@/types/entities';

const steps = [
  { label: 'Thông tin cá nhân' },
  { label: 'Kỹ năng & Mục tiêu' },
  { label: 'Khung giờ rảnh' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);
  const [interests, setInterests] = useState<string[]>(['Lập trình Web', 'Trí tuệ nhân tạo']);
  const [goals, setGoals] = useState<string[]>(['Tìm đối tác đổi lớp', 'Tìm nhóm làm đồ án']);
  const [availability, setAvailability] = useState<ScheduleSlot[]>([
    { day: 'Mon', start: '18:00', end: '21:00' },
    { day: 'Sat', start: '08:00', end: '12:00' },
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('scs_onboarding_skipped', 'true');
    navigate('/');
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await apiClient.put('/profile/me', {
        bio,
        skills,
        interests,
        goals,
        availability,
        privacy: { swapMatching: true, groupMatching: true, mentoringMatching: true },
      });
      localStorage.setItem('scs_onboarding_completed', 'true');
      navigate('/');
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-neutral-900">Thiết lập hồ sơ sinh viên</CardTitle>
          <CardDescription>
            Điền các thông tin cơ bản giúp hệ thống AI gợi ý đối tác đổi lớp, nhóm học tập và Mentor phù hợp nhất
          </CardDescription>
          <div className="pt-6 pb-2">
            <Stepper steps={steps} current={currentStep} />
          </div>
        </CardHeader>

        <CardContent className="py-4">
          {currentStep === 0 && (
            <div className="space-y-4">
              <FormField label="Giới thiệu bản thân (Bio)" helperText="Chia sẻ đôi nét về tính cách, chuyên ngành và phong cách làm việc của bạn">
                <Textarea
                  placeholder="vd: Sinh viên K16 ngành Kỹ thuật phần mềm, thích tìm hiểu React, Node.js..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </FormField>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-5">
              <FormField label="Kỹ năng chuyên môn / Thế mạnh" helperText="Nhấn Enter để thêm từng kỹ năng">
                <TagInput
                  value={skills}
                  onChange={setSkills}
                  suggestions={['React', 'TypeScript', 'Java', 'Spring Boot', 'Python', 'Algorithms', 'UI/UX']}
                />
              </FormField>

              <FormField label="Sở thích & Lĩnh vực quan tâm">
                <TagInput
                  value={interests}
                  onChange={setInterests}
                  suggestions={['Web Development', 'Machine Learning', 'Game Development', 'Tiếng Anh', 'Bóng đá']}
                />
              </FormField>

              <FormField label="Mục tiêu tham gia hệ thống">
                <TagInput
                  value={goals}
                  onChange={setGoals}
                  suggestions={['Đổi lớp học phần', 'Tìm nhóm làm đồ án', 'Tìm Mentor hướng dẫn', 'Tham gia CLB']}
                />
              </FormField>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <FormField
                label="Khung giờ rảnh tự khai"
                helperText="Hệ thống AI sẽ dùng lịch này để tính điểm tương thích khi đổi lớp hoặc ghép nhóm"
              >
                <ScheduleInput value={availability} onChange={setAvailability} />
              </FormField>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-between border-t border-neutral-100 pt-4">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-neutral-400 hover:text-neutral-700">
            Bỏ qua
          </Button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev}>
                Quay lại
              </Button>
            )}
            <Button size="sm" onClick={handleNext} loading={loading}>
              {currentStep === 2 ? 'Hoàn tất' : 'Tiếp tục'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
