import { memo, type ChangeEvent, type MouseEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card, InputField } from '@/components';
import { getTickerDisplayName } from '@/shared/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { TickerCreationProps } from './TickerCreation.types';
import { capturePage } from './capturePage';
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

function TickerCreationComponent({
  topContent,
  tickerProfiles,
  includedTickerIds,
  onOpenCreate,
  onSaveNamedState,
  onListSavedStateNames,
  onLoadNamedState,
  onDeleteNamedState,
  onDownloadNamedStateAsJson,
  onLoadStateFromJsonText,
  onCreateShareLink,
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
  const [loadError, setLoadError] = useState('');
  const [fileError, setFileError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [captureError, setCaptureError] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [isLoadingJsonFile, setIsLoadingJsonFile] = useState(false);
  const [isDeletingState, setIsDeletingState] = useState(false);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareResultMessage, setShareResultMessage] = useState('');
  const [shareToastMessage, setShareToastMessage] = useState('');
  const [isLoadDeleteMode, setIsLoadDeleteMode] = useState(false);
  const [loadFileRecognitionError, setLoadFileRecognitionError] = useState('');
  const loadFileInputRef = useRef<HTMLInputElement | null>(null);
  const saveModalTitleId = useId();
  const loadModalTitleId = useId();
  const fileModalTitleId = useId();

  const closeSaveModal = useCallback(() => {
    if (isSaving) return;
    setIsSaveModalOpen(false);
    setSaveError('');
  }, [isSaving]);

  const closeLoadModal = useCallback(() => {
    if (isLoadingList || isLoadingState || isLoadingJsonFile || isDeletingState) return;
    setIsLoadModalOpen(false);
    setLoadError('');
    setLoadFileRecognitionError('');
    setIsLoadDeleteMode(false);
    if (loadFileInputRef.current) {
      loadFileInputRef.current.value = '';
    }
  }, [isDeletingState, isLoadingJsonFile, isLoadingList, isLoadingState]);

  const closeFileModal = useCallback(() => {
    if (isLoadingList || isDownloadingFile) return;
    setIsFileModalOpen(false);
    setFileError('');
  }, [isDownloadingFile, isLoadingList]);

  const handleBackdropClick = useCallback(
    (onClose: () => void) =>
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      onClose();
    },
    []
  );

  useEffect(() => {
    if (!isSaveModalOpen && !isLoadModalOpen && !isFileModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isSaveModalOpen) {
        closeSaveModal();
        return;
      }
      if (isLoadModalOpen) {
        closeLoadModal();
        return;
      }
      if (isFileModalOpen) {
        closeFileModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeFileModal, closeLoadModal, closeSaveModal, isFileModalOpen, isLoadModalOpen, isSaveModalOpen]);

  useEffect(() => {
    if (!isSaveModalOpen) return;
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'save_modal'
    });
  }, [isSaveModalOpen]);

  useEffect(() => {
    if (!isLoadModalOpen) return;
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'load_modal'
    });
  }, [isLoadModalOpen]);

  useEffect(() => {
    if (!isFileModalOpen) return;
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'file_modal'
    });
  }, [isFileModalOpen]);

  useEffect(() => {
    if (!shareToastMessage) return;
    const timer = window.setTimeout(() => {
      setShareToastMessage('');
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [shareToastMessage]);

  const openLoadModal = async () => {
    setIsLoadModalOpen(true);
    setLoadError('');
    setLoadFileRecognitionError('');
    setIsLoadDeleteMode(false);
    setIsLoadingList(true);
    try {
      let items = await onListSavedStateNames();

      if (items.length === 0) {
        const autoSaved = await onSaveNamedState('');
        if (autoSaved.ok) {
          items = await onListSavedStateNames();
        }
      }

      setSavedItems(items);
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'open_load_modal'
      });
      setLoadError('저장 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const openFileModal = async () => {
    setIsFileModalOpen(true);
    setFileError('');
    setIsLoadingList(true);
    try {
      let items = await onListSavedStateNames();

      if (items.length === 0) {
        const autoSaved = await onSaveNamedState('');
        if (autoSaved.ok) {
          items = await onListSavedStateNames();
        }
      }

      setSavedItems(items);
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'open_file_modal'
      });
      setFileError('저장 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSaveSubmit = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await onSaveNamedState(saveName);
      setIsSaveModalOpen(false);
      setSaveName('');
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'save_named_state'
      });
      setSaveError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadState = async (name: string) => {
    if (isLoadDeleteMode) return;
    setLoadError('');
    setIsLoadingState(true);
    try {
      const result = await onLoadNamedState(name);
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }
      setIsLoadModalOpen(false);
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'load_named_state',
        source: 'saved_list'
      });
      setLoadError('불러오기에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleDeleteNamedState = async (name: string) => {
    setLoadError('');
    setIsDeletingState(true);
    try {
      const result = await onDeleteNamedState(name);
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }

      setSavedItems((prev) => prev.filter((item) => item.name !== name));
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'delete_named_state'
      });
      setLoadError('삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDeletingState(false);
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
      setLoadFileRecognitionError('');
      return;
    }

    setLoadError('');
    setIsLoadingJsonFile(true);
    try {
      const jsonText = await file.text();
      const parsed = JSON.parse(jsonText) as unknown;
      if (!isRecognizableLoadFile(parsed)) {
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'load_state_from_json',
          reason: 'unrecognized_schema'
        });
        setLoadFileRecognitionError('인식에 실패했습니다.');
        event.target.value = '';
        return;
      }

      const result = await onLoadStateFromJsonText(jsonText);
      if (!result.ok) {
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'load_state_from_json',
          reason: 'invalid_payload'
        });
        setLoadError(result.message);
        event.target.value = '';
        return;
      }

      setLoadFileRecognitionError('');
      setIsLoadModalOpen(false);
      event.target.value = '';
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'load_state_from_json',
        reason: 'parse_error'
      });
      setLoadFileRecognitionError('인식에 실패했습니다.');
      event.target.value = '';
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
    try {
      const result = await onDownloadNamedStateAsJson(name);
      if (!result.ok) {
        setFileError(result.message);
      }
    } catch {
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'download_named_state_json'
      });
      setFileError('다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsDownloadingFile(false);
    }
  };

  const handleCapturePage = async () => {
    if (isCapturing) return;
    setCaptureError('');
    setIsCapturing(true);

    try {
      await capturePage();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'capture_page'
      });
      setCaptureError(`캡처에 실패했습니다. 잠시 후 다시 시도해 주세요. (${message})`);
    } finally {
      setIsCapturing(false);
    }
  };

  const quickActions: Array<{
    key: 'save' | 'load' | 'file' | 'share' | 'capture' | 'coffee';
    label: string;
    icon: JSX.Element;
  }> = useMemo(
    () => [
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
        key: 'share',
        label: 'Share',
        icon: (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="M8.3 10.9 15.7 6.1" />
            <path d="M8.3 13.1 15.7 17.9" />
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
    ],
    []
  );

  const handleShareLink = useCallback(async () => {
    if (isSharing) return;
    setShareResultMessage('');
    setIsSharing(true);
    try {
      const result = await onCreateShareLink();
      if (!result.ok) {
        setShareResultMessage(result.message);
        return;
      }
      if (result.copied) {
        setShareResultMessage('');
        setShareToastMessage('공유 링크를 클립보드에 복사했습니다.');
      } else {
        setShareResultMessage(`공유 링크: ${result.url}`);
      }
    } catch {
      setShareResultMessage('공유 링크 생성에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, onCreateShareLink]);

  const handleQuickAction = useCallback(
    (key: 'save' | 'load' | 'file' | 'share' | 'capture' | 'coffee') => {
      trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
        cta_name: `quick_action_${key}`,
        placement: 'ticker_creation_quick_actions'
      });
      if (key === 'save') {
        setIsSaveModalOpen(true);
        setSaveError('');
        return;
      }
      if (key === 'load') {
        void openLoadModal();
        return;
      }
      if (key === 'file') {
        void openFileModal();
        return;
      }
      if (key === 'share') {
        void handleShareLink();
        return;
      }
      if (key === 'capture') {
        void handleCapturePage();
      }
    },
    [openFileModal, openLoadModal, handleCapturePage, handleShareLink]
  );

  return (
    <Card>
      {topContent}
      <TickerQuickActionRow>
        {quickActions.map((action) => (
          <TickerQuickActionButton
            key={action.key}
            type="button"
            aria-label={action.label}
            style={action.key === 'coffee' ? { display: 'none' } : undefined}
            disabled={action.key === 'capture' ? isCapturing : action.key === 'share' ? isSharing : false}
            onClick={() => handleQuickAction(action.key)}
          >
            <TickerQuickActionIcon>{action.icon}</TickerQuickActionIcon>
            <span>{action.label}</span>
          </TickerQuickActionButton>
        ))}
      </TickerQuickActionRow>
      {shareToastMessage && modalRoot
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              style={{
                position: 'fixed',
                top: '14px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1200,
                background: '#1f3341',
                color: '#fff',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 8px 18px rgba(10, 24, 36, 0.28)'
              }}
            >
              {shareToastMessage}
            </div>,
            modalRoot
          )
        : null}
      {shareResultMessage ? <HintText>{shareResultMessage}</HintText> : null}
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
                    aria-pressed={includedTickerIds.includes(profile.id)}
                    aria-label={`티커 ${getTickerDisplayName(profile.ticker, profile.name)} 선택`}
                    onClick={() => onTickerClick(profile)}
                    onKeyDown={(event) => {
                      if (event.key !== 'F2') return;
                      event.preventDefault();
                      onOpenEdit(profile);
                    }}
                    onMouseDown={() => onTickerPressStart(profile)}
                    onMouseUp={onTickerPressEnd}
                    onMouseLeave={onTickerPressEnd}
                    onTouchStart={() => onTickerPressStart(profile)}
                    onTouchEnd={onTickerPressEnd}
                    onTouchCancel={onTickerPressEnd}
                  >
                    {getTickerDisplayName(profile.ticker, profile.name)}
                  </TickerItemButton>
                  <TickerGearButton
                    type="button"
                    data-gear="true"
                    aria-label={`티커 ${getTickerDisplayName(profile.ticker, profile.name)} 설정`}
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
              <ModalBackdrop role="dialog" aria-modal="true" aria-labelledby={saveModalTitleId} onClick={handleBackdropClick(closeSaveModal)}>
                <ModalPanel aria-busy={isSaving}>
                  <ModalTitle id={saveModalTitleId}>로컬 저장</ModalTitle>
                  <ModalBody>
                    저장할 이름을 입력해 주세요.
                    {'\n'}
                    이름을 비워두면 현재 날짜/시간 이름으로 자동 저장됩니다.
                    {'\n'}
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '12px' }}>
                      가이드: 이 저장은 현재 PC의 현재 브라우저에만 보관됩니다. 다른 기기/브라우저에서는 보이지 않을 수 있습니다.
                    </span>
                  </ModalBody>
                  <InputField
                    label="저장 이름"
                    type="text"
                    value={saveName}
                    onChange={(event) => setSaveName(event.target.value)}
                  />
                  {saveError ? <HintText>{saveError}</HintText> : null}
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
                aria-labelledby={loadModalTitleId}
                onClick={handleBackdropClick(closeLoadModal)}
              >
                <ModalPanel aria-busy={isLoadingList || isLoadingState || isLoadingJsonFile || isDeletingState}>
                  <ModalTitle id={loadModalTitleId}>불러오기</ModalTitle>
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
                        {isLoadingJsonFile ? '파일 확인 중...' : '파일 선택'}
                      </SecondaryButton>
                      {loadFileRecognitionError ? (
                        <span style={{ color: '#b42318', fontSize: '12px' }}>{loadFileRecognitionError}</span>
                      ) : null}
                    </div>
                    <SecondaryButton type="button" onClick={closeLoadModal}>
                      닫기
                    </SecondaryButton>
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
                aria-labelledby={fileModalTitleId}
                onClick={handleBackdropClick(closeFileModal)}
              >
                <ModalPanel aria-busy={isLoadingList || isDownloadingFile}>
                  <ModalTitle id={fileModalTitleId}>파일 다운로드</ModalTitle>
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

const TickerCreation = memo(TickerCreationComponent);

export default TickerCreation;
