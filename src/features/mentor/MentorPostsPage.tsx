import React from 'react';
import { MentoringFeedPage } from '@/features/mentoring/MentoringFeedPage';

/**
 * Mentor dùng cùng Mentoring Feed với Student.
 * Trong Mentor Center, composer luôn tự gán loại bài Offer Mentoring.
 */
export const MentorPostsPage: React.FC = () => (
  <MentoringFeedPage embedded roleOverride="mentor" />
);

export default MentorPostsPage;
