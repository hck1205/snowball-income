import { type ChangeEvent, type MouseEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { InputField } from '@/components';
import { Card } from '@/components';
import type { TickerCreationProps } from './TickerCreation.types';
import {
  HintText,
  ModalActions,
  ModalBackdrop,
  ModalBody,
  ModalPanel,
  ModalTitle,
  PrimaryButton,
  SecondaryButton,
  TickerChipWrap,
  TickerCreateButton,
  TickerGearButton,
  TickerGridWrap,
  TickerQuickActionButton,
  TickerQuickActionIcon,
  TickerQuickActionRow,
  TickerItemButton,
  TickerList
} from '@/pages/Main/Main.shared.styled';

export default function TickerCreation({
  tickerProfiles,
  includedTickerIds,
  onOpenCreate,
  onSaveNamedState,
  onListSavedStateNames,
  onLoadNamedState,
  onDeleteNamedState,
  onDownloadNamedStateAsJson,
  onLoadStateFromJsonText,
  onTickerClick,
  onTickerPressStart,
  onTickerPressEnd,
  onOpenEdit
}: TickerCreationProps) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [savedItems, setSavedItems] = useState<Array<{ name: string; updatedAt: number }>>([]);
  const [selectedLoadFile, setSelectedLoadFile] = useState<File | null>(null);
  const [loadError, setLoadError] = useState('');
  const [fileError, setFileError] = useState('');
  const [captureError, setCaptureError] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isLoadingJsonFile, setIsLoadingJsonFile] = useState(false);
  const [isDeletingState, setIsDeletingState] = useState(false);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadDeleteMode, setIsLoadDeleteMode] = useState(false);
  const [loadFileRecognitionError, setLoadFileRecognitionError] = useState('');
  const loadFileInputRef = useRef<HTMLInputElement | null>(null);

  const closeSaveModal = () => {
    if (isSaving) return;
    setIsSaveModalOpen(false);
  };

  const closeLoadModal = () => {
    if (isLoadingList || isLoadingState || isLoadingJsonFile || isDeletingState) return;
    setIsLoadModalOpen(false);
    setLoadError('');
    setLoadFileRecognitionError('');
    setIsLoadDeleteMode(false);
    setSelectedLoadFile(null);
  };

  const closeFileModal = () => {
    if (isLoadingList || isDownloadingFile) return;
    setIsFileModalOpen(false);
    setFileError('');
  };

  const handleBackdropClick =
    (onClose: () => void) =>
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      onClose();
    };

  const openLoadModal = async () => {
    setIsLoadModalOpen(true);
    setLoadError('');
    setIsLoadDeleteMode(false);
    setIsLoadingList(true);
    let items = await onListSavedStateNames();

    if (items.length === 0) {
      const autoSaved = await onSaveNamedState('');
      if (autoSaved.ok) {
        items = await onListSavedStateNames();
      }
    }

    setSavedItems(items);
    setIsLoadingList(false);
  };

  const openFileModal = async () => {
    setIsFileModalOpen(true);
    setFileError('');
    setIsLoadingList(true);
    let items = await onListSavedStateNames();

    if (items.length === 0) {
      const autoSaved = await onSaveNamedState('');
      if (autoSaved.ok) {
        items = await onListSavedStateNames();
      }
    }

    setSavedItems(items);
    setIsLoadingList(false);
  };

  const handleSaveSubmit = async () => {
    setIsSaving(true);
    await onSaveNamedState(saveName);
    setIsSaving(false);

    setIsSaveModalOpen(false);
    setSaveName('');
  };

  const handleLoadState = async (name: string) => {
    if (isLoadDeleteMode) return;
    setLoadError('');
    setIsLoadingState(true);
    const result = await onLoadNamedState(name);
    setIsLoadingState(false);
    if (!result.ok) {
      setLoadError(result.message);
      return;
    }
    setIsLoadModalOpen(false);
  };

  const handleDeleteNamedState = async (name: string) => {
    setLoadError('');
    setIsDeletingState(true);
    const result = await onDeleteNamedState(name);
    setIsDeletingState(false);
    if (!result.ok) {
      setLoadError(result.message);
      return;
    }

    setSavedItems((prev) => prev.filter((item) => item.name !== name));
  };

  const handleLoadFromJsonFile = async () => {
    if (!selectedLoadFile) {
      setLoadError('불러올 JSON 파일을 선택해 주세요.');
      return;
    }

    setLoadError('');
    setIsLoadingJsonFile(true);
    try {
      const jsonText = await selectedLoadFile.text();
      const result = await onLoadStateFromJsonText(jsonText);
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setIsLoadModalOpen(false);
      setSelectedLoadFile(null);
    } catch {
      setLoadError('파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingJsonFile(false);
    }
  };

  const isRecognizableLoadFile = (data: unknown) => {
    if (!data || typeof data !== 'object') return false;
    const root = data as Record<string, unknown>;
    const portfolio = root.portfolio as Record<string, unknown> | undefined;
    const investmentSettings = root.investmentSettings as Record<string, unknown> | undefined;
    if (!portfolio || !investmentSettings) return false;
    if (!Array.isArray(portfolio.tickerProfiles)) return false;
    if (!Array.isArray(portfolio.includedTickerIds)) return false;
    if (!portfolio.weightByTickerId || typeof portfolio.weightByTickerId !== 'object') return false;
    if (!portfolio.fixedByTickerId || typeof portfolio.fixedByTickerId !== 'object') return false;
    return true;
  };

  const handleLoadFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSelectedLoadFile(null);
      setLoadFileRecognitionError('');
      return;
    }

    setLoadError('');
    setIsLoadingJsonFile(true);
    try {
      const jsonText = await file.text();
      const parsed = JSON.parse(jsonText) as unknown;
      if (!isRecognizableLoadFile(parsed)) {
        setSelectedLoadFile(null);
        setLoadFileRecognitionError('인식에 실패했습니다.');
        return;
      }

      const result = await onLoadStateFromJsonText(jsonText);
      if (!result.ok) {
        setSelectedLoadFile(null);
        setLoadError(result.message);
        return;
      }

      setSelectedLoadFile(file);
      setLoadFileRecognitionError('');
      setIsLoadModalOpen(false);
      setSelectedLoadFile(null);
      event.target.value = '';
    } catch {
      setSelectedLoadFile(null);
      setLoadFileRecognitionError('인식에 실패했습니다.');
    } finally {
      setIsLoadingJsonFile(false);
    }
  };

  const openLoadFilePicker = () => {
    loadFileInputRef.current?.click();
  };

  const handleDownloadState = async (name: string) => {
    setFileError('');
    setIsDownloadingFile(true);
    const result = await onDownloadNamedStateAsJson(name);
    setIsDownloadingFile(false);
    if (!result.ok) {
      setFileError(result.message);
    }
  };

  const handleCapturePage = async () => {
    if (isCapturing) return;
    setCaptureError('');
    setIsCapturing(true);

    try {
      const docEl = document.documentElement;
      const body = document.body;
      const fullWidth = Math.max(docEl.scrollWidth, body.scrollWidth, docEl.clientWidth);
      const fullHeight = Math.max(docEl.scrollHeight, body.scrollHeight, docEl.clientHeight);
      const addCaptureSourceOnClone = (clonedDoc: Document) => {
        const captureContainer =
          (clonedDoc.getElementById('root') as HTMLElement | null) ??
          (clonedDoc.body as HTMLElement);

        const sourceTag = clonedDoc.createElement('div');
        sourceTag.textContent = `source: ${window.location.origin}`;
        sourceTag.style.position = 'absolute';
        sourceTag.style.top = '8px';
        sourceTag.style.right = '12px';
        sourceTag.style.zIndex = '2147483647';
        sourceTag.style.fontSize = '16px';
        sourceTag.style.fontWeight = '600';
        sourceTag.style.color = '#2b4a5f';
        sourceTag.style.background = 'rgba(255, 255, 255, 0.8)';
        sourceTag.style.padding = '2px 6px';
        sourceTag.style.borderRadius = '6px';
        sourceTag.style.pointerEvents = 'none';

        const previousPosition = captureContainer.style.position;
        if (!previousPosition || previousPosition === 'static') {
          captureContainer.style.position = 'relative';
        }

        captureContainer.prepend(sourceTag);
      };

      const maxCanvasEdge = 16384;
      const maxCanvasArea = 80_000_000;
      const preferredScale = Math.min(2, window.devicePixelRatio || 1);
      const edgeScale = Math.min(maxCanvasEdge / fullWidth, maxCanvasEdge / fullHeight);
      const areaScale = Math.sqrt(maxCanvasArea / Math.max(1, fullWidth * fullHeight));
      const safeScale = Math.max(0.5, Math.min(preferredScale, edgeScale, areaScale));

      const captureTargets = [document.getElementById('root'), body, docEl].filter(Boolean) as HTMLElement[];
      const captureOptions: Array<Parameters<typeof html2canvas>[1]> = [
        {
          backgroundColor: '#ffffff',
          useCORS: true,
          scale: safeScale,
          width: fullWidth,
          height: fullHeight,
          windowWidth: fullWidth,
          windowHeight: fullHeight,
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 0,
          logging: false,
          onclone: addCaptureSourceOnClone
        },
        {
          backgroundColor: '#ffffff',
          useCORS: true,
          scale: Math.min(1.5, preferredScale),
          scrollX: 0,
          scrollY: -window.scrollY,
          imageTimeout: 0,
          logging: false,
          onclone: addCaptureSourceOnClone
        },
        {
          backgroundColor: '#ffffff',
          useCORS: false,
          allowTaint: true,
          foreignObjectRendering: true,
          scale: 1,
          scrollX: 0,
          scrollY: -window.scrollY,
          imageTimeout: 0,
          logging: false,
          onclone: addCaptureSourceOnClone
        }
      ];

      let canvas: HTMLCanvasElement | null = null;
      let lastError: unknown = null;

      for (const target of captureTargets) {
        for (const options of captureOptions) {
          try {
            const nextCanvas = await html2canvas(target, options);
            if (nextCanvas.width > 0 && nextCanvas.height > 0) {
              canvas = nextCanvas;
              break;
            }
          } catch (error) {
            lastError = error;
          }
        }
        if (canvas) break;
      }

      if (!canvas) {
        throw (lastError instanceof Error ? lastError : new Error('캡처 캔버스 생성 실패'));
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((nextBlob) => {
          if (!nextBlob) {
            reject(new Error('캡처 이미지 생성 실패'));
            return;
          }
          resolve(nextBlob);
        }, 'image/png');
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `snowball-capture-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      setCaptureError(`캡처에 실패했습니다. 잠시 후 다시 시도해 주세요. (${message})`);
    } finally {
      setIsCapturing(false);
    }
  };

  const quickActions: Array<{
    key: 'save' | 'load' | 'file' | 'capture' | 'coffee';
    label: string;
    icon: JSX.Element;
  }> = [
    {
      key: 'save',
      label: 'Save',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h12l2 2v14H5z" />
          <path d="M8 4v6h8V4" />
          <path d="M9 18h6" />
        </svg>
      )
    },
    {
      key: 'load',
      label: 'Load',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4v11" />
          <path d="M8 11l4 4 4-4" />
          <path d="M5 20h14" />
        </svg>
      )
    },
    {
      key: 'file',
      label: 'File',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3h7l4 4v14H7z" />
          <path d="M14 3v4h4" />
        </svg>
      )
    },
    {
      key: 'capture',
      label: 'Capture',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 8h14v11H5z" />
          <path d="M9 8l1.2-2h3.6L15 8" />
          <circle cx="12" cy="13.5" r="3" />
        </svg>
      )
    },
    {
      key: 'coffee',
      label: 'Coffee',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 10h10v4a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
          <path d="M15 11h2a2 2 0 1 1 0 4h-2" />
          <path d="M8 6v2M11 6v2" />
        </svg>
      )
    }
  ];

  return (
    <Card>
      <TickerQuickActionRow>
        {quickActions.map((action) => (
          <TickerQuickActionButton
            key={action.key}
            type="button"
            aria-label={action.label}
            style={action.key === 'coffee' ? { display: 'none' } : undefined}
            onClick={() => {
              if (action.key === 'save') {
                setIsSaveModalOpen(true);
                return;
              }
              if (action.key === 'load') {
                void openLoadModal();
                return;
              }
              if (action.key === 'file') {
                void openFileModal();
                return;
              }
              if (action.key === 'capture') {
                void handleCapturePage();
                return;
              }
              if (action.key === 'coffee') return;
            }}
          >
            <TickerQuickActionIcon>{action.icon}</TickerQuickActionIcon>
            <span>{action.label}</span>
          </TickerQuickActionButton>
        ))}
      </TickerQuickActionRow>
      <TickerCreateButton type="button" aria-label="티커 생성 열기" onClick={onOpenCreate}>
        티커 생성
      </TickerCreateButton>
      {tickerProfiles.length === 0 ? (
        <HintText>아직 생성된 티커가 없습니다.</HintText>
      ) : (
        <TickerGridWrap>
          <TickerList>
            {tickerProfiles.map((profile) => (
              <li key={profile.id}>
                <TickerChipWrap>
                  <TickerItemButton
                    type="button"
                    data-chip="true"
                    selected={includedTickerIds.includes(profile.id)}
                    aria-label={`티커 ${profile.ticker} 선택`}
                    onClick={() => onTickerClick(profile)}
                    onMouseDown={() => onTickerPressStart(profile)}
                    onMouseUp={onTickerPressEnd}
                    onMouseLeave={onTickerPressEnd}
                    onTouchStart={() => onTickerPressStart(profile)}
                    onTouchEnd={onTickerPressEnd}
                    onTouchCancel={onTickerPressEnd}
                  >
                    {profile.ticker}
                  </TickerItemButton>
                  <TickerGearButton
                    type="button"
                    data-gear="true"
                    aria-label={`티커 ${profile.ticker} 설정`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenEdit(profile);
                    }}
                  >
                    ⚙
                  </TickerGearButton>
                </TickerChipWrap>
              </li>
            ))}
          </TickerList>
        </TickerGridWrap>
      )}
      {isSaveModalOpen ? (
        modalRoot
          ? createPortal(
              <ModalBackdrop role="dialog" aria-modal="true" aria-label="로컬 저장" onClick={handleBackdropClick(closeSaveModal)}>
                <ModalPanel>
                  <ModalTitle>로컬 저장</ModalTitle>
                  <ModalBody>
                    저장할 이름을 입력해 주세요.
                    {'\n'}
                    이름을 비워두면 현재 날짜/시간 이름으로 자동 저장됩니다.
                    {'\n'}
                    {'\n'}
                    <span style={{ fontSize: '12px' }}>
                      가이드: 이 저장은 현재 PC의 현재 브라우저에만 보관됩니다. 다른 기기/브라우저에서는 보이지 않을 수 있습니다.
                    </span>
                  </ModalBody>
                  <InputField
                    label="저장 이름"
                    type="text"
                    value={saveName}
                    onChange={(event) => setSaveName(event.target.value)}
                  />
                  <ModalActions>
                    <SecondaryButton type="button" onClick={closeSaveModal}>
                      취소
                    </SecondaryButton>
                    <PrimaryButton type="button" disabled={isSaving} onClick={handleSaveSubmit}>
                      {isSaving ? '저장 중...' : '저장'}
                    </PrimaryButton>
                  </ModalActions>
                </ModalPanel>
              </ModalBackdrop>,
              modalRoot
            )
          : null
      ) : null}
      {isLoadModalOpen ? (
        modalRoot
          ? createPortal(
              <ModalBackdrop
                role="dialog"
                aria-modal="true"
                aria-label="저장 목록 불러오기"
                onClick={handleBackdropClick(closeLoadModal)}
              >
                <ModalPanel>
                  <ModalTitle>불러오기</ModalTitle>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', marginBottom: '2px' }}>
                    <ModalBody style={{ margin: 0 }}>
                      저장된 목록에서 불러올 항목을 선택해 주세요.
                      {'\n'}
                      JSON 파일을 선택해서 불러올 수도 있습니다.
                    </ModalBody>
                    {savedItems.length > 0 ? (
                      <SecondaryButton
                        type="button"
                        onClick={() => setIsLoadDeleteMode((prev) => !prev)}
                        disabled={isLoadingState || isDeletingState}
                      >
                        {isLoadDeleteMode ? '삭제 모드 종료' : '삭제'}
                      </SecondaryButton>
                    ) : null}
                  </div>
                  {isLoadingList ? (
                    <HintText>저장 목록을 불러오는 중...</HintText>
                  ) : savedItems.length === 0 ? (
                    <HintText>저장된 항목이 없습니다.</HintText>
                  ) : (
                    <>
                      <TickerGridWrap style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        <TickerList style={{ gridTemplateColumns: '1fr' }}>
                          {savedItems.map((item) => (
                            <li key={`${item.name}-${item.updatedAt}`} style={{ display: 'flex', gap: '8px' }}>
                              <TickerItemButton
                                type="button"
                                aria-label={`${item.name} 불러오기`}
                                style={{ textAlign: 'left', flex: 1 }}
                                onClick={() => void handleLoadState(item.name)}
                              >
                                {item.name}
                              </TickerItemButton>
                              {isLoadDeleteMode ? (
                                <SecondaryButton
                                  type="button"
                                  aria-label={`${item.name} 삭제`}
                                  onClick={() => void handleDeleteNamedState(item.name)}
                                >
                                  삭제
                                </SecondaryButton>
                              ) : null}
                            </li>
                          ))}
                        </TickerList>
                      </TickerGridWrap>
                    </>
                  )}
                  {loadError ? <HintText>{loadError}</HintText> : null}
                  <ModalActions style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SecondaryButton type="button" onClick={openLoadFilePicker}>
                        {selectedLoadFile ? `파일 선택됨: ${selectedLoadFile.name}` : '파일 선택'}
                      </SecondaryButton>
                      {loadFileRecognitionError ? (
                        <span style={{ color: '#b42318', fontSize: '12px' }}>{loadFileRecognitionError}</span>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <SecondaryButton type="button" onClick={() => void handleLoadFromJsonFile()}>
                        {isLoadingJsonFile ? '파일 로드 중...' : '선택 파일 불러오기'}
                      </SecondaryButton>
                      <SecondaryButton type="button" onClick={closeLoadModal}>
                        닫기
                      </SecondaryButton>
                    </div>
                  </ModalActions>
                  <input
                    ref={loadFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    aria-label="JSON 파일 선택"
                    style={{ display: 'none' }}
                    onChange={(event) => void handleLoadFileChange(event)}
                  />
                </ModalPanel>
              </ModalBackdrop>,
              modalRoot
            )
          : null
      ) : null}
      {isFileModalOpen ? (
        modalRoot
          ? createPortal(
              <ModalBackdrop
                role="dialog"
                aria-modal="true"
                aria-label="저장 항목 파일 다운로드"
                onClick={handleBackdropClick(closeFileModal)}
              >
                <ModalPanel>
                  <ModalTitle>파일 다운로드</ModalTitle>
                  <ModalBody>
                    항목을 선택하면 Load가 가능한 파일로 다운로드 됩니다.
                    {'\n'}
                    다운로드 파일을 다시 로드하면 데이터를 확인할 수 있습니다.
                  </ModalBody>
                  {isLoadingList ? (
                    <HintText>저장 목록을 불러오는 중...</HintText>
                  ) : savedItems.length === 0 ? (
                    <HintText>저장된 항목이 없습니다.</HintText>
                  ) : (
                    <TickerGridWrap style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      <TickerList style={{ gridTemplateColumns: '1fr' }}>
                        {savedItems.map((item) => (
                          <li key={`file-${item.name}-${item.updatedAt}`}>
                            <TickerItemButton
                              type="button"
                              aria-label={`${item.name} JSON 다운로드`}
                              style={{ textAlign: 'left' }}
                              onClick={() => void handleDownloadState(item.name)}
                            >
                              {item.name}
                            </TickerItemButton>
                          </li>
                        ))}
                      </TickerList>
                    </TickerGridWrap>
                  )}
                  {fileError ? <HintText>{fileError}</HintText> : null}
                  <ModalActions>
                    <SecondaryButton type="button" onClick={closeFileModal}>
                      닫기
                    </SecondaryButton>
                  </ModalActions>
                </ModalPanel>
              </ModalBackdrop>,
              modalRoot
            )
          : null
      ) : null}
      {captureError ? <HintText style={{ marginTop: '8px' }}>{captureError}</HintText> : null}
    </Card>
  );
}
