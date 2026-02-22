"use client";

import { useEffect, useState, useRef } from "react";
import DashboardWidget from "./widgets/DashboardWidget";
import AnalyticsSkeleton from "./AnalyticsSkeleton";
import { fetchAnalytics } from "@/lib/dashboardApi";
import type { DashboardWidget as WidgetType } from "./analyticsData";
import ConfiguredSelect from "@/components/ConfiguredSelect";
import { DotsThreeOutline } from "@phosphor-icons/react";
import { useApiClient } from "@/hooks/useApiClient";

const EXCLUDED_TAGS_STORAGE_KEY = "dashboard-excluded-tags";

interface TagOption {
  value: string;
  label: string;
}

interface AnalyticsSectionProps {
  /** When false, skip fetching /api/users/tags (requires userRead) and hide tag filter UI */
  hasUserRead?: boolean;
}

export default function AnalyticsSection({
  hasUserRead = true,
}: AnalyticsSectionProps) {
  const { apiClient } = useApiClient();
  const [analyticsWidgets, setAnalyticsWidgets] = useState<WidgetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [excludedTags, setExcludedTags] = useState<TagOption[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasUserRead) return;
    try {
      const storedTags = localStorage.getItem(EXCLUDED_TAGS_STORAGE_KEY);
      if (storedTags) {
        const parsed = JSON.parse(storedTags);
        setExcludedTags(parsed);
      }
    } catch {
      setError("Failed to load excluded tags from localStorage");
    }
  }, [hasUserRead]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        setShowOptionsMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        if (hasUserRead) {
          const tagsResponse = await apiClient.get<string[]>("/api/users/tags");
          setAvailableTags(
            tagsResponse.map((tag: string) => ({ value: tag, label: tag }))
          );
        }

        const excludeTagValues = hasUserRead
          ? excludedTags.map((t) => t.value)
          : [];
        const analytics = await fetchAnalytics(excludeTagValues);
        setAnalyticsWidgets(analytics);
      } catch (err) {
        console.error("Failed to load analytics:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load analytics"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [excludedTags, apiClient, hasUserRead, retryCount]);

  const handleExcludedTagsChange = (newTags: readonly TagOption[]) => {
    const tagsArray = [...newTags];
    setExcludedTags(tagsArray);
    // Save to localStorage
    try {
      localStorage.setItem(
        EXCLUDED_TAGS_STORAGE_KEY,
        JSON.stringify(tagsArray)
      );
    } catch (err) {
      console.error("Failed to save excluded tags to localStorage:", err);
    }
  };

  if (error) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
        </div>
        <hr className="mb-6 border-gray-200" />
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => {
              setError(null);
              setRetryCount((c) => c + 1);
            }}
            className="px-4 py-2 bg-blue-primary text-white rounded-lg hover:bg-blue-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
        {hasUserRead && (
          <div className="relative" ref={optionsMenuRef}>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Options"
            >
              <DotsThreeOutline size={24} weight="fill" />
            </button>
            {showOptionsMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Partner Tags
                </label>
                <ConfiguredSelect<TagOption, true>
                  isMulti
                  options={availableTags}
                  value={excludedTags}
                  onChange={(selected) =>
                    handleExcludedTagsChange(selected || [])
                  }
                  placeholder="Select tags to exclude..."
                  isClearable
                />
              </div>
            )}
          </div>
        )}
      </div>
      <hr className="mb-6 border-gray-200" />

      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyticsWidgets.map((widget) => (
            <DashboardWidget key={widget.id} widget={widget} />
          ))}
        </div>
      )}
    </div>
  );
}
