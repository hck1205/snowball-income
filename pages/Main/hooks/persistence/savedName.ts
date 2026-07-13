const FILE_NAME_UNSAFE_PATTERN = /[\\/:*?"<>|]/g;
const DEFAULT_DOWNLOAD_FILE_BASE_NAME = 'portfolio';

/** 저장 이름을 비웠을 때 쓰는 기본 이름(`YYYY-MM-DD HH:mm:ss`). Date를 주입받아 결정적으로 동작한다. */
export const formatSavedNameTimestamp = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

/** 파일명으로 쓸 수 없는 문자를 `_`로 바꾼다. */
export const sanitizeDownloadFileName = (name: string): string => name.trim().replace(FILE_NAME_UNSAFE_PATTERN, '_');

/** 저장 이름으로 JSON 다운로드 파일명을 만든다. */
export const buildDownloadFileName = (name: string): string =>
  `${sanitizeDownloadFileName(name) || DEFAULT_DOWNLOAD_FILE_BASE_NAME}.json`;
