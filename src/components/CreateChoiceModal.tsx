/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Radio, Users, X } from "lucide-react";

interface CreateChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChannel: () => void;
  onSelectGroup: () => void;
}

// Title: CreateChoiceModal — "+" ተጭኖ ሲከፈት Channel/Group ምርጫ የሚያሳይ ትንሽ popup
export default function CreateChoiceModal({
  isOpen,
  onClose,
  onSelectChannel,
  onSelectGroup,
}: CreateChoiceModalProps) {
  if (!isOpen) return null;

return (
    <div
      className="fixed inset-0 bg-overlay backdrop-blur-sm z-[130] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full sm:max-w-xs rounded-2xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">Create New</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-icon-muted hover:text-icon-primary hover:bg-surface-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2">
          <button
            onClick={onSelectChannel}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-text-primary hover:bg-surface-hover hover:text-link rounded-xl transition-colors text-left"
          >
            <Radio className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div>Create Channel</div>
              <div className="text-[11px] font-medium text-text-secondary">
                Broadcast to subscribers, only you can post
              </div>
            </div>
          </button>

          <button
            onClick={onSelectGroup}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-text-primary hover:bg-surface-hover hover:text-link rounded-xl transition-colors text-left"
          >
            <Users className="w-5 h-5 text-success shrink-0" />
            <div>
              <div>Create Group</div>
              <div className="text-[11px] font-medium text-text-secondary">
                Everyone can chat together
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}