"use client";

import { useState } from "react";
import Header from "@/components/Header";
import WizardShell from "@/components/WizardShell";
import UploadStep from "@/components/UploadStep";
import ReviewStep from "@/components/ReviewStep";
import CalendarStep from "@/components/CalendarStep";
import type { CaseData } from "@/lib/ocr";

export default function DashboardWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [extractedCases, setExtractedCases] = useState<CaseData[]>([]);
  const [selectedCases, setSelectedCases] = useState<CaseData[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  const handleUploadComplete = (cases: CaseData[]) => {
    setExtractedCases(cases);
    setCurrentStep(1);
  };

  const handleReviewComplete = (cases: CaseData[]) => {
    setSelectedCases(cases);
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setCurrentStep(0);
    setExtractedCases([]);
    setSelectedCases([]);
    setImageUrl("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <WizardShell currentStep={currentStep} onBack={handleBack}>
          {currentStep === 0 && (
            <UploadStep onComplete={handleUploadComplete} />
          )}
          {currentStep === 1 && (
            <ReviewStep
              cases={extractedCases}
              imageUrl={imageUrl}
              onBack={handleBack}
              onComplete={handleReviewComplete}
            />
          )}
          {currentStep === 2 && (
            <CalendarStep
              selectedCases={selectedCases}
              onBack={handleBack}
              onReset={handleReset}
            />
          )}
        </WizardShell>
      </main>
    </div>
  );
}
