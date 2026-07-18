/**
 * OG 공유 카드 서버 유틸 배럴 (트랙 F).
 *
 * - metaHtml       : OG 메타 content 치환(순수, Edge/Node 공용) — middleware + api/share-html 공유.
 * - shareKey       : DB 공유 key 형식 판별(순수) — middleware rewrite 게이트 + api 조회 게이트.
 * - sharedSnapshotRest : 서버 전용 get_shared_snapshot REST 조회(process.env) — api/og + api/share-html 공유.
 */
export * from './metaHtml';
export * from './shareKey';
export * from './sharedSnapshotRest';
