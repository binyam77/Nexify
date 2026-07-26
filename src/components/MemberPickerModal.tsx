/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { X, Check, Search } from "lucide-react";
import type { SelectableUser } from "../types";

interface MemberPickerModalProps {
  isOpen: boolean;
  availableUsers: SelectableUser[];
  onClose: () => void;
  onConfirm: (selectedUsers: SelectableUser[]) => void;
}

// Title: MemberPickerModal — Group ፈጣሪ ካለው users ዝርዝር መርጦ members መጨመሪያ
// availableUsers prop generic ስለሆነ፣ ወደፊት real follow/follower data ብቻ ተክቶ component ራሱ አይቀየርም
export default function MemberPickerModal({
  isOpen,
  availableUsers,
  onClose,
  onConfirm,
}: MemberPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const filtered = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()),
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = availableUsers.filter((u) => selectedIds.has(u.id));
    onConfirm(selected);
    setSelectedIds(new Set());
    setQuery("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
            Add Members
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
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
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {u.photo ? (
                      <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                    ) : (
                      u.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-3.5 border-t border-gray-100 shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold rounded-xl transition-all"
          >
            Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""} & Continue
          </button>
        </div>
      </div>
    </div>
  );
}