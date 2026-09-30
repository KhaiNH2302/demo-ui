// features/home/feedRegistry.ts — chỉ ánh xạ, không chứa UI (03-knowledge.md § K-U.4)
import type React from 'react';
import type { FeedInsertKind } from '@/components/shared/FeedInsert';
import { clubFeed, type ClubFeedItem } from '@/features/clubs/feed';
import { programFeed, type ProgramFeedItem } from '@/features/programs/feed';
import { groupFeed, type GroupFeedItem } from '@/features/groups/feed';
import { mentoringFeed, type MentoringFeedItem } from '@/features/mentoring/feed';
import { swapFeed, type SwapFeedItem } from '@/features/swap/feed';

export type FeedInsertItemMap = {
  opportunity: ClubFeedItem;
  program: ProgramFeedItem;
  group: GroupFeedItem;
  mentoring_post: MentoringFeedItem;
  swap_match: SwapFeedItem;
};

export type HomeFeedInsertEntry = {
  [K in FeedInsertKind]: {
    id: string;
    kind: K;
    contextLabel: string;
    actionHref?: string;
    data: FeedInsertItemMap[K];
  };
}[FeedInsertKind];

export const feedRenderers = {
  opportunity: clubFeed.render,
  program: programFeed.render,
  group: groupFeed.render,
  mentoring_post: mentoringFeed.render,
  swap_match: swapFeed.render,
} satisfies {
  [K in FeedInsertKind]: (item: FeedInsertItemMap[K]) => React.ReactNode;
};

export function renderHomeFeedInsertItem(entry: HomeFeedInsertEntry): React.ReactNode {
  switch (entry.kind) {
    case 'opportunity':
      return feedRenderers.opportunity(entry.data);
    case 'program':
      return feedRenderers.program(entry.data);
    case 'group':
      return feedRenderers.group(entry.data);
    case 'mentoring_post':
      return feedRenderers.mentoring_post(entry.data);
    case 'swap_match':
      return feedRenderers.swap_match(entry.data);
  }
}
