/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { ArrowLeft, Check, Search, X } from "lucide-react";
import type { SelectableUser } from "../types";

interface MemberPickerModalProps {
  isOpen: boolean;
  availableUsers: SelectableUser[];
  onClose: () => void;
  onConfirm: (selectedUsers: SelectableUser[]) => void;
  /** ስክሪኑ ሲከፈት አስቀድመው የተመረጡ (parent በ key ዳግም ሲከፍተው ብቻ ይነበባል) */
  initialSelected?: SelectableUser[];
  /** የታችኛው ቁልፍ ጽሑፍ — Create Group ፍሰት "Next"፣ Group info "Add" ሊሆን ይችላል */
  confirmLabel?: string;
}

const MAX_VISIBLE_SELECTED = 5;

function UserAvatar({ user, size }: { user: SelectableUser; size: string }) {
  return (
    <div
      className={`${size} rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold shrink-0`}
    >
      {user.photo ? (
        <img
          src={user.photo}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      ) : (
        user.name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// Title: MemberPickerModal — "Add Members" ሙሉ ስክሪን (ከ users ዝርዝር መርጦ ለመቀጠል)
// availableUsers generic ስለሆነ፣ ወደፊት real follow/follower data ብቻ ተክቶ component ራሱ አይቀየርም
export default function MemberPickerModal({
  isOpen,
  availableUsers,
  onClose,
  onConfirm,
  initialSelected,
  confirmLabel = "Next",
}: MemberPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set((initialSelected ?? []).map((u) => u.id)),
  );
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filtered = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
  );

  const selectedUsers = availableUsers.filter((u) => selectedIds.has(u.id));
  const visibleSelected = selectedUsers.slice(0, MAX_VISIBLE_SELECTED);
  const hiddenCount = selectedUsers.length - visibleSelected.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ማንንም ሳይመርጡ Next ማለት ይቻላል (ባዶ ዝርዝር ይመለሳል)
  const handleConfirm = () => {
    onConfirm(selectedUsers);
    setSelectedIds(new Set());
    setQuery("");
  };

  return (
    <div className="fixed inset-0 h-[100svh] bg-bodey-bg z-[140] flex flex-col animate-in fade-in duration-150">
      <header className="relative px-4 py-4 flex items-center shrink-0">
        <button
          onClick={onClose}
          className="relative z-10 p-1.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h3 className="absolute inset-x-0 text-center text-lg font-extrabold text-gray-900 tracking-tight pointer-events-none">
          Add Members
        </h3>
      </header>

      {/* የተመረጡ ሰዎች (✕ ለማስወገድ) */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-3 px-4 pb-3 shrink-0">
          {visibleSelected.map((u) => (
            <div key={u.id} className="relative">
              <UserAvatar user={u} size="w-12 h-12" />
              <button
                type="button"
                onClick={() => toggleSelect(u.id)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800"
                aria-label={`Remove ${u.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="w-12 h-12 rounded-full bg-blue-50 text-brand flex items-center justify-center text-sm font-bold shrink-0">
              +{hiddenCount}
            </div>
          )}
        </div>
      )}

      <div className="px-4 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2.5 bg-input border border-input-border rounded-xl text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">
            No people found.
          </p>
        ) : (
          filtered.map((u) => {
            const isSelected = selectedIds.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggleSelect(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected ? "bg-blue-50/70" : "hover:bg-gray-50"
                }`}
              >
                <UserAvatar user={u} size="w-12 h-12" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    @{u.username}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-brand border-brand"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="p-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] flex justify-end shrink-0">
        <button
          onClick={handleConfirm}
          className="px-8 py-3 bg-brand hover:bg-blue-700 text-white text-sm font-extrabold rounded-xl transition-all shadow-md"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
