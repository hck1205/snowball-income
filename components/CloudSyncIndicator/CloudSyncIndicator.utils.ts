import { formatRelativeTime } from '@/shared/lib/community';
import type { CloudSyncState } from '@/jotai/snowball/cloud';

/**
 * 저장 상태의 색이 아닌 **의미**를 나른다 — 아이콘 형태(icon)와 문장(sentence)이 상태를 병기하고,
 * tone은 보조 강조일 뿐이다(색만으로 구분 금지, §8.3 접근성 원칙).
 */
export type CloudSyncTone = 'neutral' | 'success' | 'progress' | 'muted' | 'danger';

/** 아이콘 형태 키(색과 독립). 소비 컴포넌트가 lucide 아이콘으로 매핑한다. */
export type CloudSyncGlyph = 'device' | 'check' | 'spinner' | 'offline' | 'alert';

export type CloudSyncDescription = {
  status: CloudSyncState['status'];
  tone: CloudSyncTone;
  glyph: CloudSyncGlyph;
  /** 버튼 배지용 짧은 라벨. */
  shortLabel: string;
  /** 패널 헤더 문장(전체). */
  sentence: string;
  /** 실패 상태에서만 재시도 UI를 띄운다. */
  canRetry: boolean;
};

/**
 * 클라우드 동기화 상태 → 표시 서술. **순수 함수**(now 주입으로 결정적 테스트).
 *
 * idle은 §8.3의 4상태에 없지만 실제로 발생한다(첫 렌더 / 비로그인 skip 직후). 이 앱은 local-first라
 * "이 기기에 저장돼요"가 정직한 기본 문장이다 — 클라우드를 약속하지 않는다.
 */
export const describeCloudSyncState = (
  state: CloudSyncState,
  now: Date = new Date()
): CloudSyncDescription => {
  switch (state.status) {
    case 'saving':
      return {
        status: 'saving',
        tone: 'progress',
        glyph: 'spinner',
        shortLabel: '저장 중',
        sentence: '클라우드에 저장하는 중…',
        canRetry: false
      };
    case 'saved': {
      const savedAgo =
        state.lastSavedAt !== null ? formatRelativeTime(new Date(state.lastSavedAt).toISOString(), now) : '';
      const when = savedAgo || '방금 전';
      return {
        status: 'saved',
        tone: 'success',
        glyph: 'check',
        shortLabel: `저장됨 · ${when}`,
        sentence: `모든 변경사항이 저장됐어요 · ${when}`,
        canRetry: false
      };
    }
    case 'offline':
      return {
        status: 'offline',
        tone: 'muted',
        glyph: 'offline',
        shortLabel: '오프라인',
        sentence: '오프라인 — 이 기기에는 저장돼요. 연결되면 자동으로 올라가요.',
        canRetry: false
      };
    case 'error':
      return {
        status: 'error',
        tone: 'danger',
        glyph: 'alert',
        shortLabel: '저장 실패',
        sentence: '클라우드 저장에 실패했어요 — 이 기기에는 저장돼 있어요.',
        canRetry: true
      };
    case 'idle':
    default:
      return {
        status: 'idle',
        tone: 'neutral',
        glyph: 'device',
        shortLabel: '이 기기에 저장됨',
        sentence: '이 기기에 저장돼요. 로그인하면 다른 기기에서도 이어서 볼 수 있어요.',
        canRetry: false
      };
  }
};
