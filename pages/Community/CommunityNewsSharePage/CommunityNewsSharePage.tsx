import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { useIsCommunityAdmin } from '@/jotai/community';
import { canWriteCommunityNews, COMMUNITY_COPY } from '@/shared/constants/community';
import { newsHostLabel } from '@/shared/lib/supabase';
import { CommunityTopBar, FeedEmpty } from '../components';
import { useLinkShare } from './hooks';
import {
  Actions,
  CopyrightNote,
  Field,
  FieldLabel,
  Form,
  Notice,
  Preview,
  PreviewBody,
  PreviewSource,
  PreviewSummary,
  PreviewThumb,
  PreviewTitle,
  TextArea,
  TextInput,
  UrlRow
} from './CommunityNewsSharePage.styled';

const copy = COMMUNITY_COPY.news;

/**
 * `/community/news/share` — 링크 공유.
 *
 * 🔴 **주소 한 칸에서 시작한다.** 붙여넣고 "미리 보기 가져오기"를 누르면 서버(`api/unfurl`)가
 * 제목·요약·썸네일을 뽑아 오고, 사용자는 한 줄 감상만 덧붙여 올린다. 제목부터 적게 하는 폼이면
 * 사람들이 원문을 옮겨 적기 시작한다 — 그건 이 기능이 하려는 일이 아니다(저작권).
 *
 * ⚠ 미리 보기는 실패할 수 있다(봇 차단·JS 렌더·타임아웃). 그때도 **막다른 길이 아니다** —
 *   제목 칸이 열려 있어 직접 적고 올릴 수 있다. 주소만 있으면 카드는 성립한다.
 * ⚠ 기존 글쓰기 폼(`CommunityWritePage`)을 재사용하지 않았다. 그 폼의 축은 "제목 + 본문
 *   (+시나리오 첨부)"이고 이 화면의 축은 "주소 → 가져오기 → 한 줄"이다 — 같은 폼에 모드를
 *   하나 더 만들면 두 축이 한 파일에서 서로를 가린다.
 *
 * 🔴 **운영자만 쓴다**(2026-08-08 사용자 결정). 목록에서 진입점을 지우는 것만으로는 부족하다 —
 *   `/community/news/share` 를 주소창에 직접 쳐서 들어오는 길이 남기 때문이다. 그래서 폼을
 *   그리기 전에 여기서 한 번 더 본다(목록 게이트와 **곱**이지 대체가 아니다).
 *   ⚠ 서버는 막지 않는다 — `COMMUNITY_NEWS_WRITE_ADMIN_ONLY` 주석에 그 한계와 DB 강제 방법을 적어 뒀다.
 */
export default function CommunityNewsSharePage() {
  const navigate = useNavigate();
  const isAdmin = useIsCommunityAdmin();
  const share = useLinkShare(copy);

  if (!canWriteCommunityNews(isAdmin)) {
    return (
      <>
        <CommunityTopBar />
        <section aria-label={copy.composeTitle}>
          <FeedEmpty
            title={copy.hiddenTitle}
            subtitle={copy.hiddenSubtitle}
            action={
              <Button variant="primary" onClick={() => navigate('/community/portfolio')}>
                {copy.hiddenAction}
              </Button>
            }
          />
        </section>
      </>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const id = await share.submit();
    /* 올린 글로 바로 보낸다 — 목록으로 보내면 자기 글을 다시 찾아야 한다. */
    if (id) navigate(`/community/news/${id}`);
  };

  const { preview } = share;

  return (
    <>
      <CommunityTopBar />

      <h1>{copy.composeTitle}</h1>
      <p>{copy.composeLead}</p>

      <Form onSubmit={onSubmit}>
        <Field>
          <FieldLabel>{copy.urlLabel}</FieldLabel>
          <UrlRow>
            <TextInput
              type="url"
              inputMode="url"
              value={share.url}
              placeholder={copy.urlPlaceholder}
              onChange={(event) => share.setUrl(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              loading={share.status === 'fetching'}
              onClick={share.fetchPreview}
            >
              {share.status === 'fetching' ? copy.fetching : copy.fetchAction}
            </Button>
          </UrlRow>
        </Field>

        {share.error ? <Notice role="status">{share.error}</Notice> : null}

        {preview ? (
          <>
            {/* 올라갈 모습 그대로 보여 준다 — 미리 보기가 실제와 다르면 그건 미리 보기가 아니다. */}
            <Preview>
              {preview.image ? <PreviewThumb src={preview.image} alt="" loading="lazy" decoding="async" /> : <span />}
              <PreviewBody>
                <PreviewSource>{newsHostLabel(preview)}</PreviewSource>
                <PreviewTitle>{share.title || preview.title || newsHostLabel(preview)}</PreviewTitle>
                {preview.summary ? <PreviewSummary>{preview.summary}</PreviewSummary> : null}
              </PreviewBody>
            </Preview>

            <Field>
              <FieldLabel>{copy.titleLabel}</FieldLabel>
              <TextInput
                value={share.title}
                placeholder={copy.titlePlaceholder}
                onChange={(event) => share.setTitle(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>{copy.commentLabel}</FieldLabel>
              <TextArea
                value={share.note}
                placeholder={copy.commentPlaceholder}
                onChange={(event) => share.setNote(event.target.value)}
              />
            </Field>

            {/* 🔴 지우지 마라 — 이 화면이 원문을 복제하는 곳이 아니라는 약속이다. */}
            <CopyrightNote>{copy.copyrightNote}</CopyrightNote>

            <Actions>
              <Button type="submit" variant="primary" disabled={!share.canSubmit} loading={share.status === 'submitting'}>
                {share.status === 'submitting' ? copy.submitting : copy.submit}
              </Button>
            </Actions>
          </>
        ) : null}
      </Form>
    </>
  );
}
