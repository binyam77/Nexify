/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, ShieldCheck } from "lucide-react";
import type { GroupMember } from "../types";

interface MembersListModalProps {
  isOpen: boolean;
  members: GroupMember[];
  onClose: () => void;
}

// Title: MembersListModal — Group members ዝርዝር (admin badge ጨምሮ)
export default function MembersListModal({
  isOpen,
  members,
  onClose,
}: MembersListModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[135] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-base font-black text-gray-900">
            Members ({members.length})
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto py-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold shrink-0">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  m.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{m.name}</p>
                <p className="text-xs text-gray-400 truncate">@{m.username}</p>
              </div>
              {m.isAdmin && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}