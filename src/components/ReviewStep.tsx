"use client";

import { useState, useEffect, useCallback } from "react";
import type { CaseData } from "@/lib/ocr";

interface ReviewStepProps {
  cases: CaseData[];
  imageUrl: string;
  onBack: () => void;
  onComplete: (selectedCases: CaseData[]) => void;
}

type EditableField = keyof Omit<CaseData, "confidence" | "previousDate">;

const EDITABLE_COLUMNS: { key: EditableField; label: string }[] = [
  { key: "caseNumber", label: "Case Number" },
  { key: "courtHall", label: "Court Hall" },
  { key: "stage", label: "Stage" },
  { key: "nextDate", label: "Next Date" },
  { key: "parties", label: "Parties" },
];

export default function ReviewStep({
  cases,
  imageUrl,
  onBack,
  onComplete,
}: ReviewStepProps) {
  const [editedCases, setEditedCases] = useState<CaseData[]>(() =>
    cases.map((c) => ({ ...c }))
  );
  const [selected, setSelected] = useState<boolean[]>(() =>
    cases.map(() => true)
  );
  const [editingCell, setEditingCell] = useState<{
    row: number;
    field: EditableField;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [imageCollapsed, setImageCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const allSelected = selected.length > 0 && selected.every(Boolean);
  const noneSelected = selected.every((s) => !s);
  const selectedCount = selected.filter(Boolean).length;

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelected(selected.map(() => false));
    } else {
      setSelected(selected.map(() => true));
    }
  }, [allSelected, selected]);

  const handleToggleRow = useCallback((index: number) => {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const startEditing = useCallback(
    (row: number, field: EditableField) => {
      setEditingCell({ row, field });
      setEditValue(editedCases[row][field]);
    },
    [editedCases]
  );

  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    setEditedCases((prev) => {
      const next = [...prev];
      next[editingCell.row] = {
        ...next[editingCell.row],
        [editingCell.field]: editValue,
      };
      return next;
    });
    setEditingCell(null);
  }, [editingCell, editValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        saveEdit();
      }
    },
    [saveEdit]
  );

  const handleComplete = useCallback(() => {
    const selectedCases = editedCases.filter((_, i) => selected[i]);
    onComplete(selectedCases);
  }, [editedCases, selected, onComplete]);

  const imagePanel = (
    <div
      data-image-panel=""
      data-collapsed={imageCollapsed ? "true" : "false"}
    >
      {isMobile && (
        <button
          onClick={() => setImageCollapsed((prev) => !prev)}
          className="w-full flex items-center justify-between p-3 bg-gray-100 rounded-lg mb-2 text-sm font-medium text-gray-700"
          aria-label={imageCollapsed ? "Show image" : "Hide image"}
        >
          <span>Uploaded Image</span>
          <span>{imageCollapsed ? "\u25bc" : "\u25b2"}</span>
        </button>
      )}
      {!imageCollapsed && (
        <div className="overflow-auto border rounded-lg bg-gray-50 p-2">
          <img
            src={imageUrl}
            alt="Uploaded ledger"
            className="max-w-full h-auto"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4`}>
        {/* Image panel */}
        <div className={isMobile ? "w-full" : "w-2/5"}>{imagePanel}</div>

        {/* Table panel */}
        <div className={isMobile ? "w-full" : "w-3/5"}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  {EDITABLE_COLUMNS.map((col) => (
                    <th key={col.key} className="p-2 border text-left">
                      {col.label}
                    </th>
                  ))}
                  <th className="p-2 border w-8"></th>
                </tr>
              </thead>
              <tbody>
                {editedCases.map((caseItem, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${
                      selected[rowIndex] ? "bg-white" : "bg-gray-50 opacity-60"
                    } hover:bg-blue-50`}
                  >
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selected[rowIndex]}
                        onChange={() => handleToggleRow(rowIndex)}
                        aria-label={`Select ${caseItem.caseNumber}`}
                      />
                    </td>
                    {EDITABLE_COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className="p-2 border cursor-pointer"
                        onClick={() => startEditing(rowIndex, col.key)}
                      >
                        {editingCell?.row === rowIndex &&
                        editingCell?.field === col.key ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleKeyDown}
                            className="w-full border rounded px-1 py-0.5"
                            autoFocus
                          />
                        ) : (
                          <span>{caseItem[col.key]}</span>
                        )}
                      </td>
                    ))}
                    <td className="p-2 border text-center">
                      {caseItem.confidence === "low" && (
                        <span title="Low confidence">\u26a0\ufe0f</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {selectedCount} of {editedCases.length} selected
          </span>
          <button
            onClick={handleComplete}
            disabled={noneSelected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
