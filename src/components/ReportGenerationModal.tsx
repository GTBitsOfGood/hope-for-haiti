"use client";

import React, { useState } from "react";
import { X } from "@phosphor-icons/react";
import { CgSpinner } from "react-icons/cg";

type ReportType = "shipment-partner" | "donor-category";
type ModalStep = "select-report" | "select-filters";

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportType: ReportType, filters: ReportFilters) => Promise<void>;
}

export interface ReportFilters {
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
  shipmentId?: string;
  donorName?: string;
}

export default function ReportGenerationModal({
  isOpen,
  onClose,
  onSubmit,
}: ReportGenerationModalProps) {
  const [step, setStep] = useState<ModalStep>("select-report");
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [donorName, setDonorName] = useState("");

  const handleReportSelect = (reportType: ReportType) => {
    setSelectedReportType(reportType);
    setStep("select-filters");
  };

  const handleBackToReportSelect = () => {
    setStep("select-report");
    setSelectedReportType(null);
    resetFilters();
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setShipmentId("");
    setDonorName("");
  };

  const handleSubmit = async () => {
    if (!selectedReportType) return;

    setIsSubmitting(true);
    try {
      const filters: ReportFilters = {
        reportType: selectedReportType,
      };

      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      if (selectedReportType === "shipment-partner" && shipmentId) {
        filters.shipmentId = shipmentId;
      }

      if (selectedReportType === "donor-category" && donorName) {
        filters.donorName = donorName;
      }

      await onSubmit(selectedReportType, filters);
      
      // Reset and close
      resetFilters();
      setStep("select-report");
      setSelectedReportType(null);
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetFilters();
    setStep("select-report");
    setSelectedReportType(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6">
      <div className="relative mx-auto flex max-h-[calc(100dvh-3rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white text-gray-primary shadow-lg">
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 px-6 py-5 pr-14">
          <h2 className="text-xl font-semibold leading-7">Generate Reports</h2>
          <p className="mt-1 text-sm text-gray-500">
            {step === "select-report"
              ? "Select a report type to generate"
              : "Apply filters and generate your report"}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === "select-report" && (
            <div className="space-y-3">
              <button
                onClick={() => handleReportSelect("shipment-partner")}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-primary hover:bg-blue-50 transition-all"
              >
                <h3 className="font-semibold text-gray-900">
                  Shipment & Partner Summary
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Financial breakdown of what was sent to specific recipients. Group by shipment, recipient, and category.
                </p>
              </button>

              <button
                onClick={() => handleReportSelect("donor-category")}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-primary hover:bg-blue-50 transition-all"
              >
                <h3 className="font-semibold text-gray-900">
                  Donor & Category Summary
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Impact report showing total contributions from donors over a time period. Group by donor and category.
                </p>
              </button>
            </div>
          )}

          {step === "select-filters" && selectedReportType === "shipment-partner" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipment ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., SH-101"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary disabled:bg-gray-100"
                />
              </div>
            </div>
          )}

          {step === "select-filters" && selectedReportType === "donor-category" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  onChange={(e) => setEndDate(e.target.value)}
                  value={endDate}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donor Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Direct Relief"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-primary disabled:bg-gray-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex shrink-0 justify-between gap-4 border-t border-gray-200 bg-white px-6 py-4">
          <button
            onClick={
              step === "select-report" ? onClose : handleBackToReportSelect
            }
            disabled={isSubmitting}
            className="rounded-md border-2 border-red-primary bg-white px-4 py-2 font-semibold text-red-primary hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === "select-report" ? "Cancel" : "Back"}
          </button>
          {step === "select-filters" && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-md bg-red-primary px-4 py-2 font-semibold text-white hover:bg-red-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <CgSpinner className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Generating..." : "Generate Report"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
