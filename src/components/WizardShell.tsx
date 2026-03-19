"use client";

import React from "react";

interface WizardShellProps {
  currentStep: number;
  onBack: () => void;
  children?: React.ReactNode;
}

const STEPS = ["Upload", "Review", "Add"] as const;

export default function WizardShell({
  currentStep,
  onBack,
  children,
}: WizardShellProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Progress bar */}
      <nav aria-label="Wizard progress" className="mb-8">
        <ol className="flex items-center justify-center gap-8">
          {STEPS.map((label, index) => {
            const isCurrent = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <li
                key={label}
                data-testid={`step-${index}`}
                className={`flex items-center gap-2 text-sm font-medium ${
                  isCurrent
                    ? "text-indigo-600"
                    : isCompleted
                      ? "text-indigo-400"
                      : "text-gray-400"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrent
                      ? "bg-indigo-600 text-white"
                      : isCompleted
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </span>
                {label}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <div>{children}</div>

      {/* Back button */}
      {currentStep > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
