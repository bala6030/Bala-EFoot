import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  Save,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Season, SeasonDraftInput, SeasonValidationResult } from '../../types';
import {
  loadSeasonsState,
  saveSeasonDraft,
  activateSeason,
  discardDraft,
  validateSeasonDraft,
  getActiveDraft,
  clearActiveDraftPointer,
} from '../../data/seasonRepository';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import styles from './SeasonsView.module.css';

export interface SeasonsViewProps {
  onSeasonActivated?: (season: Season) => void;
}

export const SeasonsView: React.FC<SeasonsViewProps> = ({ onSeasonActivated }) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeDraftSeason, setActiveDraftSeason] = useState<Season | null>(null);

  // View state: 'list' | 'create'
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  // Guided step in create mode: 1 (Setup) | 2 (Review)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form State
  const [formId, setFormId] = useState<string>('');
  const [originalDraftId, setOriginalDraftId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [startingDivision, setStartingDivision] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');

  // Validation & Feedback state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'info' | 'warning' | 'danger';
    text: string;
  } | null>(null);

  // Reload data from repository
  const refreshData = () => {
    const state = loadSeasonsState();
    setSeasons(state.seasons);
    const draft = getActiveDraft();
    setActiveDraftSeason(draft || null);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Helper to pre-populate form with existing draft data
  const populateFormWithDraft = (draft: Season) => {
    setFormId(draft.id);
    setOriginalDraftId(draft.id);
    setStartDate(draft.startDate || new Date().toISOString().split('T')[0]);
    setStartingDivision(draft.startingDivision || 10);
    setNotes(draft.notes || '');
    setFormErrors({});
    setCurrentStep(1);
    setViewMode('create');
  };

  // Start fresh creation flow
  const handleStartNewSeason = () => {
    setFormId('');
    setOriginalDraftId(undefined);
    setStartDate(new Date().toISOString().split('T')[0]);
    setStartingDivision(10);
    setNotes('');
    setFormErrors({});
    setCurrentStep(1);
    setViewMode('create');
  };

  // Resume active draft
  const handleResumeDraft = () => {
    if (activeDraftSeason) {
      populateFormWithDraft(activeDraftSeason);
    }
  };

  // Validate form before proceeding
  const runValidation = (isActivating: boolean): SeasonValidationResult => {
    const draftInput: SeasonDraftInput = {
      id: formId,
      startDate,
      startingDivision,
      notes,
    };
    return validateSeasonDraft(draftInput, isActivating, seasons, originalDraftId);
  };

  // Save current progress as a Draft
  const handleSaveDraft = () => {
    const validation = runValidation(false);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    const res = saveSeasonDraft(
      {
        id: formId.trim() || undefined,
        startDate,
        startingDivision,
        notes: notes.trim() || undefined,
      },
      originalDraftId
    );

    if (res.success && res.season) {
      setStatusMessage({
        type: 'info',
        text: `Draft "${res.season.id}" saved successfully. You can safely close or refresh your browser.`,
      });
      setOriginalDraftId(res.season.id);
      setFormId(res.season.id);
      setFormErrors({});
      refreshData();
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to save season draft.',
      });
      if (res.validationErrors) {
        setFormErrors(res.validationErrors);
      }
    }
  };

  // Proceed from Step 1 to Step 2 (Review)
  const handleProceedToReview = () => {
    const validation = runValidation(true);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    // Auto-save draft before proceeding to review
    const res = saveSeasonDraft(
      {
        id: formId.trim(),
        startDate,
        startingDivision,
        notes: notes.trim() || undefined,
      },
      originalDraftId
    );

    if (res.success && res.season) {
      setOriginalDraftId(res.season.id);
      refreshData();
      setCurrentStep(2);
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Please correct errors before reviewing.',
      });
      if (res.validationErrors) {
        setFormErrors(res.validationErrors);
      }
    }
  };

  // Explicit Activation Confirmation
  const handleActivateSeason = () => {
    const seasonIdToActivate = originalDraftId || formId.trim();

    if (!seasonIdToActivate) {
      setStatusMessage({
        type: 'danger',
        text: 'Season identifier is missing.',
      });
      return;
    }

    const res = activateSeason(seasonIdToActivate);

    if (res.success && res.season) {
      setStatusMessage({
        type: 'success',
        text: `Season "${res.season.id}" has been activated successfully!`,
      });
      refreshData();
      setViewMode('list');
      setCurrentStep(1);
      if (onSeasonActivated) {
        onSeasonActivated(res.season);
      }
    } else {
      setStatusMessage({
        type: 'danger',
        text: res.error || 'Failed to activate season.',
      });
      if (res.validationErrors) {
        setFormErrors(res.validationErrors);
        setCurrentStep(1); // Return to edit step on error
      }
    }
  };

  // Discard draft with confirmation
  const handleDiscardDraft = (id: string) => {
    if (window.confirm(`Are you sure you want to discard draft "${id}"? This action cannot be undone.`)) {
      const res = discardDraft(id);
      if (res.success) {
        setStatusMessage({
          type: 'info',
          text: `Draft "${id}" discarded.`,
        });
        if (viewMode === 'create' && originalDraftId === id) {
          setViewMode('list');
        }
        refreshData();
      } else {
        setStatusMessage({
          type: 'danger',
          text: res.error || 'Failed to discard draft.',
        });
      }
    }
  };

  const activeSeasonCount = seasons.filter((s) => s.status === 'Active').length;

  return (
    <div className={styles.container}>
      {/* Top Header & Context Actions */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className={styles.heading}>Seasons & Phases</h1>
            {activeSeasonCount > 0 && (
              <Badge variant="lime" size="sm">
                {activeSeasonCount} Active
              </Badge>
            )}
          </div>
          <p className={styles.subheading}>
            Manage eFootball competition phases, divisions, and season records
          </p>
        </div>

        <div className={styles.actionsArea}>
          {viewMode === 'list' ? (
            <Button
              variant="primary"
              icon={<PlusCircle size={18} />}
              onClick={handleStartNewSeason}
            >
              Start New Season
            </Button>
          ) : (
            <Button
              variant="secondary"
              icon={<ArrowLeft size={18} />}
              onClick={() => {
                clearActiveDraftPointer();
                setViewMode('list');
              }}
            >
              Back to Seasons
            </Button>
          )}
        </div>
      </div>

      {/* Dynamic Status / Feedback Alert Banner */}
      {statusMessage && (
        <div
          className={`${styles.banner} ${
            statusMessage.type === 'success'
              ? styles.bannerSuccess
              : statusMessage.type === 'warning'
              ? styles.bannerWarning
              : statusMessage.type === 'danger'
              ? styles.bannerDanger
              : styles.bannerInfo
          }`}
          role="alert"
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="text-neon-lime" />
          ) : (
            <AlertCircle size={18} />
          )}
          <div className={styles.bannerContent}>{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-muted hover:text-white"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      )}

      {/* In-Progress Draft Alert Banner (List Mode) */}
      {viewMode === 'list' && activeDraftSeason && (
        <div className={`${styles.banner} ${styles.bannerInfo}`} role="status">
          <Clock size={18} className="text-neon-blue" />
          <div className={styles.bannerContent}>
            <strong>Draft in Progress:</strong> You have an uncompleted season draft (
            <em>{activeDraftSeason.id}</em>). You can resume editing or review it anytime.
          </div>
          <div className={styles.bannerActions}>
            <Button
              variant="blue"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={handleResumeDraft}
            >
              Resume Draft
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => handleDiscardDraft(activeDraftSeason.id)}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Guided Season Creation Flow */}
      {viewMode === 'create' ? (
        <Card variant="glass" padding="lg" className={styles.formCard}>
          {/* Step Progress Indicator */}
          <div className={styles.stepIndicator}>
            <div className={styles.stepPills}>
              <div
                className={`${styles.stepPill} ${
                  currentStep === 1 ? styles.stepPillActive : styles.stepPillCompleted
                }`}
              >
                <span className={styles.stepNumber}>1</span>
                <span>Season Setup</span>
              </div>
              <ArrowRight size={14} className="text-muted" />
              <div
                className={`${styles.stepPill} ${
                  currentStep === 2 ? styles.stepPillActive : ''
                }`}
              >
                <span className={styles.stepNumber}>2</span>
                <span>Review & Activation</span>
              </div>
            </div>

            <Badge variant={currentStep === 1 ? 'blue' : 'lime'} size="sm">
              {currentStep === 1 ? 'Step 1 of 2' : 'Final Step'}
            </Badge>
          </div>

          {currentStep === 1 ? (
            /* Step 1: Form Inputs */
            <div className={styles.formGrid}>
              {/* Season Identifier */}
              <div className={styles.formGroup}>
                <label htmlFor="seasonId" className={styles.label}>
                  <span>
                    Season / Phase Identifier
                    <span className={styles.requiredMark}>*</span>
                  </span>
                </label>
                <input
                  id="seasonId"
                  type="text"
                  className={`${styles.input} ${formErrors.id ? styles.inputError : ''}`}
                  placeholder="e.g. Phase 1 - Season 2024, Phase 2, Season 1"
                  value={formId}
                  onChange={(e) => {
                    setFormId(e.target.value);
                    if (formErrors.id) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.id;
                        return next;
                      });
                    }
                  }}
                  autoFocus
                />
                <span className={styles.helperText}>
                  Unique name for this competition phase. Cannot duplicate existing seasons.
                </span>
                {formErrors.id && (
                  <div className={styles.errorMessage} role="alert">
                    <AlertCircle size={14} />
                    <span>{formErrors.id}</span>
                  </div>
                )}
              </div>

              {/* Start Date & Starting Division Row */}
              <div className={styles.formRow}>
                {/* Start Date */}
                <div className={styles.formGroup}>
                  <label htmlFor="startDate" className={styles.label}>
                    <span>
                      Start Date
                      <span className={styles.requiredMark}>*</span>
                    </span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className={`${styles.input} ${
                      formErrors.startDate ? styles.inputError : ''
                    }`}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (formErrors.startDate) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.startDate;
                          return next;
                        });
                      }
                    }}
                  />
                  <span className={styles.helperText}>Date when this season begins</span>
                  {formErrors.startDate && (
                    <div className={styles.errorMessage} role="alert">
                      <AlertCircle size={14} />
                      <span>{formErrors.startDate}</span>
                    </div>
                  )}
                </div>

                {/* Starting Division */}
                <div className={styles.formGroup}>
                  <label htmlFor="startingDivision" className={styles.label}>
                    <span>
                      Starting Division
                      <span className={styles.requiredMark}>*</span>
                    </span>
                  </label>
                  <select
                    id="startingDivision"
                    className={`${styles.select} ${
                      formErrors.startingDivision ? styles.selectError : ''
                    }`}
                    value={startingDivision}
                    onChange={(e) => {
                      setStartingDivision(Number(e.target.value));
                      if (formErrors.startingDivision) {
                        setFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.startingDivision;
                          return next;
                        });
                      }
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((div) => (
                      <option key={div} value={div}>
                        Division {div}
                      </option>
                    ))}
                  </select>
                  <span className={styles.helperText}>
                    Initial eFootball division assigned at phase reset
                  </span>
                  {formErrors.startingDivision && (
                    <div className={styles.errorMessage} role="alert">
                      <AlertCircle size={14} />
                      <span>{formErrors.startingDivision}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Notes */}
              <div className={styles.formGroup}>
                <label htmlFor="notes" className={styles.label}>
                  <span>Optional Notes & Strategy</span>
                </label>
                <textarea
                  id="notes"
                  className={styles.textarea}
                  placeholder="Record tactical plans, target division, key player targets, or custom milestones..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <span className={styles.helperText}>
                  Private notes for reference during this season
                </span>
              </div>

              {/* Form Navigation Actions */}
              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setViewMode('list')}
                  >
                    Cancel
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<Save size={16} />}
                    onClick={handleSaveDraft}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    iconRight={<ArrowRight size={16} />}
                    onClick={handleProceedToReview}
                  >
                    Review Details
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Review and Activation */
            <div className={styles.formGrid}>
              <div className={styles.reviewBox}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Season / Phase Identifier</span>
                  <span className={styles.reviewValue}>{formId}</span>
                </div>

                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Start Date</span>
                  <span className={styles.reviewValue}>{startDate}</span>
                </div>

                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Starting Division</span>
                  <span className={styles.reviewValue}>Division {startingDivision}</span>
                </div>

                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Status Upon Activation</span>
                  <Badge variant="lime" size="sm">
                    Active
                  </Badge>
                </div>

                {notes && (
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Notes</span>
                    <span
                      className={styles.reviewValue}
                      style={{ fontWeight: 400, textAlign: 'left' }}
                    >
                      {notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirmation Callout */}
              <div className={styles.calloutCard}>
                <Sparkles size={20} className="text-neon-lime" style={{ flexShrink: 0 }} />
                <div className={styles.calloutText}>
                  <span className={styles.calloutHighlight}>Ready to activate:</span>{' '}
                  Confirming activation will mark this season as{' '}
                  <strong>Active</strong>. Starting baseline snapshots and division progress
                  tracking will be linked to this season.
                </div>
              </div>

              {/* Review Actions */}
              <div className={styles.formFooterActions}>
                <div className={styles.leftGroup}>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={<ArrowLeft size={16} />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Edit Details
                  </Button>
                </div>

                <div className={styles.rightGroup}>
                  <Button
                    type="button"
                    variant="outline"
                    icon={<Save size={16} />}
                    onClick={() => {
                      handleSaveDraft();
                      setViewMode('list');
                    }}
                  >
                    Keep as Draft
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    icon={<CheckCircle2 size={16} />}
                    onClick={handleActivateSeason}
                  >
                    Activate Season
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      ) : (
        /* List Mode: Saved Seasons Display */
        <>
          {seasons.length === 0 ? (
            <Card variant="glass" padding="lg">
              <EmptyState
                icon={<CalendarDays size={28} className="text-neon-blue" />}
                title="No Seasons Created Yet"
                description="Start your first eFootball season to record division campaigns, starting baselines, and performance rewards."
                action={
                  <Button
                    variant="primary"
                    icon={<PlusCircle size={18} />}
                    onClick={handleStartNewSeason}
                  >
                    Start New Season
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className={styles.seasonsGrid}>
              {seasons.map((season) => {
                const isActive = season.status === 'Active';
                const isDraft = season.status === 'Draft';
                const isClosed = season.status === 'Closed';

                return (
                  <Card
                    key={season.id}
                    variant="glass"
                    padding="md"
                    className={`${styles.seasonCard} ${
                      isActive ? styles.seasonCardActive : isDraft ? styles.seasonCardDraft : ''
                    }`}
                  >
                    <div>
                      <div className={styles.seasonHeader}>
                        <h2 className={styles.seasonTitle}>{season.id}</h2>
                        <Badge
                          variant={isActive ? 'lime' : isDraft ? 'blue' : 'purple'}
                          size="sm"
                        >
                          {season.status}
                        </Badge>
                      </div>

                      <div className={styles.seasonMetaList}>
                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <Layers size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Starting Division:
                          </span>
                          <span className={styles.metaVal}>Division {season.startingDivision}</span>
                        </div>

                        <div className={styles.metaItem}>
                          <span className={styles.metaLabel}>
                            <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Start Date:
                          </span>
                          <span className={styles.metaVal}>{season.startDate}</span>
                        </div>

                        {season.notes && (
                          <div className={styles.notesSnippet}>
                            "{season.notes}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.dateFootnote}>
                        Created {new Date(season.createdAt).toLocaleDateString()}
                      </span>

                      {isDraft ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Button
                            variant="blue"
                            size="sm"
                            onClick={() => populateFormWithDraft(season)}
                          >
                            Resume
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDiscardDraft(season.id)}
                            title="Discard Draft"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      ) : isActive ? (
                        <Badge variant="lime" size="sm">
                          Active Phase
                        </Badge>
                      ) : isClosed ? (
                        <Badge variant="purple" size="sm">
                          Closed
                        </Badge>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
