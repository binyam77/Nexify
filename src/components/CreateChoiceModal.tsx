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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xs rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-800">Create New</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-2">
          <button
            onClick={onSelectChannel}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-left"
          >
            <Radio className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <div>Create Channel</div>
              <div className="text-[11px] font-medium text-gray-400">
                Broadcast to subscribers, only you can post
              </div>
            </div>
          </button>

          <button
            onClick={onSelectGroup}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-left"
          >
            <Users className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div>Create Group</div>
              <div className="text-[11px] font-medium text-gray-400">
                Everyone can chat together
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}