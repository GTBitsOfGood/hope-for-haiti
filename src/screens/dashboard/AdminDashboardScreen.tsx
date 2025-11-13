"use client";

import { useUser } from "@/components/context/UserContext";
import { isAdmin } from "@/lib/userUtils";
import NotificationsSection from "@/components/dashboard/NotificationsSection";
import MapSection from "@/components/dashboard/MapSection";
import DashboardWidget from "@/components/dashboard/widgets/DashboardWidget";
import {
  fetchNotifications,
  fetchAnalytics,
  fetchPartnerLocations,
} from "@/lib/dashboardApi";
import type { Notification } from "@/components/dashboard/types";
import type { DashboardWidget as WidgetType } from "@/components/dashboard/analyticsData";
import { useEffect, useState, useRef } from "react";
import ConfiguredSelect from "@/components/ConfiguredSelect";
import { DotsThreeOutline } from "@phosphor-icons/react";

const EXCLUDED_TAGS_STORAGE_KEY = "dashboard-excluded-tags";

interface TagOption {
  value: string;
  label: string;
}

export default function AdminDashboardScreen() {
  const { user, loading: userLoading } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analyticsWidgets, setAnalyticsWidgets] = useState<WidgetType[]>([]);
  const [partnerLocations, setPartnerLocations] = useState<
    { id: string; name: string; lat: number; lng: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<TagOption[]>([]);
  const [excludedTags, setExcludedTags] = useState<TagOption[]>([]);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Load excluded tags from localStorage on mount
  useEffect(() => {
    try {
      const storedTags = localStorage.getItem(EXCLUDED_TAGS_STORAGE_KEY);
      if (storedTags) {
        const parsed = JSON.parse(storedTags);
        setExcludedTags(parsed);
      }
    } catch (err) {
      console.error("Failed to load excluded tags from localStorage:", err);
    }
  }, []);

  // Close options menu when clicking outside
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
    if (userLoading || !user || !isAdmin(user.type)) {
      return;
    }

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch available tags
        const tagsResponse = await fetch("/api/users/tags");
        if (tagsResponse.ok) {
          const tags = await tagsResponse.json();
          setAvailableTags(
            tags.map((tag: string) => ({ value: tag, label: tag }))
          );
        }

        const excludeTagValues = excludedTags.map((t) => t.value);

        const [notifs, analytics, partners] = await Promise.all([
          fetchNotifications(),
          fetchAnalytics(excludeTagValues),
          fetchPartnerLocations(),
        ]);

        setNotifications(notifs);
        setAnalyticsWidgets(analytics);
        setPartnerLocations(partners);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [user, userLoading, excludedTags]);

  const handleExcludedTagsChange = (newTags: readonly TagOption[]) => {
    const tagsArray = [...newTags];
    setExcludedTags(tagsArray);
    // Save to localStorage
    try {
      localStorage.setItem(EXCLUDED_TAGS_STORAGE_KEY, JSON.stringify(tagsArray));
    } catch (err) {
      console.error("Failed to save excluded tags to localStorage:", err);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin(user.type)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>You do not have access to this page.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-primary text-white rounded-lg hover:bg-blue-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <NotificationsSection notifications={notifications} />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Analytics</h2>
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
        </div>
        <hr className="mb-6 border-gray-200" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyticsWidgets.map((widget) => (
            <DashboardWidget key={widget.id} widget={widget} />
          ))}
        </div>
      </div>

      <MapSection partners={partnerLocations} />
    </div>
  );
}
