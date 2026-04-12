"use client";

import { useCallback, useEffect } from "react";
import { useUser } from "@/components/context/UserContext";
import { isStaff } from "@/lib/userUtils";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import MapSectionWithData from "@/components/dashboard/MapSectionWithData";
import LoadingScreen from "@/screens/LoadingScreen";
import Tutorial, { type TutorialStep } from "@/components/Tutorial";

const bellHighlightClass = "admin-dashboard-tutorial-bell-highlight";

export default function AdminDashboardScreen() {
  const { user, loading: userLoading } = useUser();
  const clearBellHighlight = useCallback(() => {
    document.body.classList.remove(bellHighlightClass);
  }, []);

  const handleTutorialStepChange = useCallback(
    (stepIndex: number) => {
      if (stepIndex === 1) {
        document.body.classList.add(bellHighlightClass);
        return;
      }

      clearBellHighlight();
    },
    [clearBellHighlight]
  );

  const handleTutorialEnd = useCallback(() => {
    clearBellHighlight();
  }, [clearBellHighlight]);

  useEffect(
    () => () => {
      clearBellHighlight();
    },
    [clearBellHighlight]
  );

  if (userLoading) {
    return <LoadingScreen />;
  }

  if (!user || !isStaff(user.type)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>You do not have access to this page.</p>
      </div>
    );
  }

  const tutorialSteps: TutorialStep[] = [
    {
      target: "body",
      title: (
        <div>
          Welcome to your <span className="text-red-primary">Dashboard!</span>
        </div>
      ),
      content: (
        <div>
          This provides an overview of your GIK program, including shipments,
          donations, and key program metrics.
        </div>
      ),
      placement: "center",
      isFixed: true,
    },
    {
      target: '[data-tutorial=\"admin-dashboard-notification-bell\"]',
      title: <div>Notifications</div>,
      content: (
        <div>
          Click the bell to view updates about donor offers, distributions, and
          new messages from your team.
        </div>
      ),
      placement: "left",
      isFixed: true,
      disableBeacon: true,
      spotlightPadding: 2,
    },
  ];

  const hasUserRead = user.isSuper || user.userRead;


  return (
    <div className="w-full">
      <Tutorial
        tutorialSteps={tutorialSteps}
        type="adminDashboard"
        repeatOnRefresh
        onStepChange={handleTutorialStepChange}
        onTutorialEnd={handleTutorialEnd}
      />
      <h1 className="text-3xl font-bold mb-8">
        {hasUserRead ? "Admin Dashboard" : "Dashboard"}
      </h1>

      {hasUserRead && <AnalyticsSection/>}

      <MapSectionWithData />
    </div>
  );
}
