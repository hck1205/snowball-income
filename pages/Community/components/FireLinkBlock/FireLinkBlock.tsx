import { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ICON } from '@/shared/styles';
import { linkHostLabel, parseLinkPayload } from '@/shared/lib/supabase';
import { youtubeEmbedUrl, youtubeVideoId } from '@/shared/lib/youtube';
import { Frame, GoLink, Player, PlayButton, Source, Thumb, Title } from './FireLinkBlock.styled';
import type { FireLinkBlockProps } from './FireLinkBlock.types';

const copy = COMMUNITY_COPY.fire;

/**
 * 상세 화면에서 **영상 링크 글**의 본체를 그린다 — 재생 · 제목 · 채널 · 원본으로 가는 버튼.
 *
 * ## 🔴 왜 상세 화면이 필요한가 (2026-08-09 사용자 신고)
 *
 * 종전에는 목록 카드가 **곧바로 유튜브로** 나갔다. 뉴스 지면이었을 때는 그것이 옳았다 —
 * 사용자가 카드를 누르는 이유가 원문을 읽기 위해서였으니까. 그런데 파이어족들은 **댓글·좋아요가
 * 목적**인 지면이라, 밖으로 먼저 내보내면 그 기능에 닿을 길이 없다.
 *
 * ## 🔴 재생은 **누른 뒤에만** 불러온다 (click-to-load)
 *
 * 표준 임베드는 **페이지가 뜨는 순간** 유튜브 스크립트를 불러오고 쿠키를 심는다 — 사용자가
 * 재생을 누르지 않아도. 그건 개인정보처리방침이 말하지 않는 제3자 추적이다.
 *
 * 그래서 처음에는 **썸네일과 재생 버튼만** 그린다. 유튜브로 나가는 요청이 **0건**이다.
 * 누르는 순간에만 iframe 을 끼우고, 그때도 `youtube-nocookie.com` 을 쓴다.
 * **클릭이 곧 동의**이고, 그 사실을 방침이 함께 적는다(privacyCopy.ts).
 *
 * ⚠ 이 셋은 한 벌이다 — facade · nocookie · 방침 문구. 하나만 빼도 화면이 방침과 어긋난다.
 * ⚠ `parseLinkPayload` 를 통과하지 못하면 **아무것도 그리지 않는다**(깨진 블록보다 없는 편이 낫다).
 */
export default function FireLinkBlock({ payload }: FireLinkBlockProps) {
  /* 🔴 기본은 **안 켜짐**. 이 값이 true 가 되기 전에는 유튜브로 아무 요청도 나가지 않는다. */
  const [isPlaying, setPlaying] = useState(false);

  const link = parseLinkPayload(payload);
  if (!link) return null;

  const videoId = youtubeVideoId(link.url);

  return (
    <Frame>
      {isPlaying && videoId ? (
        <Player>
          {/*
            ⚠ `allow` 를 최소로 둔다 — 자동재생과 전체화면만. 카메라·마이크·결제 같은 권한을
              열어 줄 이유가 없다.
          */}
          <iframe
            src={youtubeEmbedUrl(videoId)}
            title={link.title}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </Player>
      ) : link.image ? (
        <Thumb>
          {/* 🔴 우리가 저장하지 않고 유튜브 CDN 을 가리킨다 — 복제하면 저작권과 용량이 함께 문제가 된다. */}
          <img src={link.image} alt="" loading="lazy" decoding="async" />
          {videoId ? (
            <PlayButton type="button" onClick={() => setPlaying(true)} aria-label={copy.playHere}>
              <Play size={ICON.xxl} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
            </PlayButton>
          ) : null}
        </Thumb>
      ) : null}

      <Source>{linkHostLabel(link)}</Source>
      <Title>{link.title}</Title>

      {/* ⚠ 재생 전에만 안내한다 — 켜고 나면 이미 지난 이야기다. */}
      {!isPlaying && videoId ? <Source>{copy.playNotice}</Source> : null}

      {/*
        ⚠ `rel`: noopener 는 보안(새 창이 우리 창을 조작하지 못하게), nofollow·ugc 는 SEO —
          우리가 붙인 링크에 도메인 신뢰를 실어 주지 않는다.
      */}
      <GoLink href={link.url} target="_blank" rel="noopener nofollow ugc">
        <ExternalLink size={ICON.md} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
        {copy.openOriginal}
      </GoLink>
    </Frame>
  );
}
