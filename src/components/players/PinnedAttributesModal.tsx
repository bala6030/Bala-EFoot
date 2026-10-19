import React, { useState } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { ALL_ATTRIBUTES, getRoleDefaultPinnedAttributes } from '../../data/playerRepository';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import styles from './PinnedAttributesModal.module.css';

export interface PinnedAttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  position: string;
  currentPinned: string[];
  onSave: (newPinned: string[]) => void;
}

export const PinnedAttributesModal: React.FC<PinnedAttributesModalProps> = ({
  isOpen,
  onClose,
  position,
  currentPinned,
  onSave,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(currentPinned);

  if (!isOpen) return null;

  const handleToggle = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      if (selectedKeys.length >= 6) {
        return; // Max 6 pinned
      }
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const handleResetToDefaults = () => {
    const defaults = getRoleDefaultPinnedAttributes(position);
    setSelectedKeys(defaults);
  };

  const handleSave = () => {
    if (selectedKeys.length === 6) {
      onSave(selectedKeys);
      onClose();
    }
  };

  // Group attributes by category
  const categories = [
    { title: 'Attacking', cat: 'attacking' },
    { title: 'Defending', cat: 'defending' },
    { title: 'Athleticism', cat: 'athleticism' },
    { title: 'Goalkeeping', cat: 'goalkeeping' },
  ];

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pinned-modal-title"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h2 id="pinned-modal-title" className={styles.title}>
              Pin 6 Key Attributes
            </h2>
            <p className={styles.subtitle}>
              Customize the six highlight tiles displayed at the top of the card profile.
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.counterBar}>
            <span className={styles.counterText}>
              Selection: <strong>{selectedKeys.length} / 6</strong> attributes
            </span>
            <Badge variant={selectedKeys.length === 6 ? 'lime' : 'purple'} size="sm">
              {selectedKeys.length === 6 ? 'Ready to Save' : `Select ${6 - selectedKeys.length} more`}
            </Badge>
          </div>

          {categories.map((c) => {
            const attrs = ALL_ATTRIBUTES.filter((a) => a.category === c.cat);
            if (attrs.length === 0) return null;
            return (
              <div key={c.cat} className={styles.categoryGroup}>
                <span className={styles.categoryTitle}>{c.title}</span>
                <div className={styles.chipsGrid}>
                  {attrs.map((attr) => {
                    const isSelected = selectedKeys.includes(attr.key);
                    const isMaxReached = selectedKeys.length >= 6 && !isSelected;
                    return (
                      <button
                        key={attr.key}
                        type="button"
                        onClick={() => handleToggle(attr.key)}
                        disabled={isMaxReached}
                        className={`${styles.chip} ${isSelected ? styles.chipSelected : ''} ${
                          isMaxReached ? styles.chipDisabled : ''
                        }`}
                      >
                        {isSelected && <Check size={14} />}
                        <span>{attr.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={14} />}
            onClick={handleResetToDefaults}
          >
            Reset to Role Suggestions
          </Button>

          <div className={styles.footerActions}>
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={selectedKeys.length !== 6}
              onClick={handleSave}
            >
              Save Selection (6)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
