"use client";

import { useState } from "react";
import Header from "@/components/Header";
import WizardShell from "@/components/WizardShell";
import UploadStep from "@/components/UploadStep";
import ReviewStep from "@/components/ReviewStep";
import CalendarStep from "@/components/CalendarStep";
import CaseLandingPage from "@/components/CaseLandingPage";
import type { CaseData } from "@/lib/ocr";

export default function DashboardWizard() {
  const [currentStep, setCurrentStep] = useState(-1);
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

  const handleGoHome = () => {
    setCurrentStep(-1);
    setExtractedCases([]);
    setSelectedCases([]);
    setImageUrl("");
  };

  if (currentStep === -1) {
    return <CaseLandingPage onStartWizard={() => setCurrentStep(0)} />;
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <Header />
      <main className="mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-8 lg:px-8 lg:py-10">
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
              onReset={handleGoHome}
            />
          )}
        </WizardShell>
      </main>
    </div>
  );
}
