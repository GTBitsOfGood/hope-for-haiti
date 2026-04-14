import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Joyride, { 
  Step,
  CallBackProps,
  STATUS,
  EVENTS,
  ACTIONS,
} from "react-joyride";
import type { StoreHelpers } from "react-joyride";
import toast from "react-hot-toast";
import JoyrideStep from "@/components/JoyrideStep";
import { SessionUser, useUser } from "./context/UserContext";
import { useSession } from "next-auth/react";

const nameMap = {
  dashboard: "dashboardTutorial" as keyof SessionUser,
  items: "itemsTutorial" as keyof SessionUser,
  requests: "requestsTutorial" as keyof SessionUser,
  wishlists: "wishlistsTutorial" as keyof SessionUser,
};

interface TutorialProps {
  tutorialSteps: TutorialStep[];
  type: keyof typeof nameMap;
  onStepChange?: (stepIndex: number) => void;
  onTutorialEnd?: () => void;
}

export type TutorialStep = Step & {
  mobilePlacement?: Step["placement"];
  mobilePlacementBreakpoint?: number;
  hideOnMobile?: boolean;
};

type ResponsiveTutorialEntry = {
  originalIndex: number;
  step: Step;
};

const DEFAULT_MOBILE_PLACEMENT_BREAKPOINT = 1024;
const DEFAULT_TUTORIAL_TARGET_TIMEOUT = 2500;
const COMPLETION_ERROR_MESSAGE =
  "Couldn't save tutorial progress. It may appear again next time.";

const waitForTutorialTarget = async (
  selector: string,
  timeout = DEFAULT_TUTORIAL_TARGET_TIMEOUT
): Promise<boolean> => {
  const start = Date.now();

  return new Promise((resolve) => {
    const check = () => {
      const element = document.querySelector(selector);

      if (element) {
        resolve(true);
        return;
      }

      if (Date.now() - start >= timeout) {
        resolve(false);
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
};

export default function Tutorial({
  tutorialSteps,
  type,
  onStepChange,
  onTutorialEnd,
}: TutorialProps) {
  const { user } = useUser();
  const { update: updateSession } = useSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [serverTutorialCompleted, setServerTutorialCompleted] = useState<
    boolean | null
  >(null);
  const hasFinishedRef = useRef(false);
  const hasFetchedCompletionRef = useRef(false);
  const joyrideHelpersRef = useRef<StoreHelpers | null>(null);
  const refreshRafRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const originalStepIndexRef = useRef(0);
  const lastNotifiedStepIndexRef = useRef<number | null>(null);
  const tutorialField = nameMap[type];
  const sessionTutorialCompleted = Boolean(user?.[tutorialField]);
  const isTutorialCompleted =
    serverTutorialCompleted ?? sessionTutorialCompleted;

  useEffect(() => {
    const updateViewportWidth = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      setViewportWidth(Math.round(width));
    };

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth, { passive: true });
    window.addEventListener("orientationchange", updateViewportWidth, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
      window.removeEventListener("orientationchange", updateViewportWidth);
      window.visualViewport?.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  const responsiveTutorialEntries = useMemo(
    () =>
      tutorialSteps.flatMap((rawStep, originalIndex) => {
        const step = rawStep as TutorialStep;
        const {
          mobilePlacement,
          mobilePlacementBreakpoint,
          hideOnMobile,
          ...joyrideStep
        } = step;
        const shouldUseMobileOverrides =
          viewportWidth !== null &&
          viewportWidth <
            (mobilePlacementBreakpoint ?? DEFAULT_MOBILE_PLACEMENT_BREAKPOINT);

        if (shouldUseMobileOverrides && hideOnMobile) {
          return [];
        }

        const isBodyTarget = joyrideStep.target === "body";
        const shouldUseMobilePlacement =
          shouldUseMobileOverrides && Boolean(mobilePlacement);
        const shouldPreserveCenterPlacement =
          isBodyTarget || joyrideStep.placement === "center";
        const fallbackPadding =
          typeof step.spotlightPadding === "number" ? step.spotlightPadding : 8;

        return [
          {
            originalIndex,
            step: {
              ...joyrideStep,
              placement: (
                shouldUseMobilePlacement
                  ? mobilePlacement
                  : shouldPreserveCenterPlacement
                    ? joyrideStep.placement ?? "center"
                    : "auto"
              ) as Step["placement"],
              spotlightPadding: Math.min(fallbackPadding, 8),
            },
          },
        ];
      }),
    [tutorialSteps, viewportWidth]
  );
  const responsiveTutorialSteps = useMemo(
    () => responsiveTutorialEntries.map((entry) => entry.step),
    [responsiveTutorialEntries]
  );
  const responsiveTutorialEntriesRef =
    useRef<ResponsiveTutorialEntry[]>(responsiveTutorialEntries);
  const onStepChangeRef = useRef(onStepChange);
  const onTutorialEndRef = useRef(onTutorialEnd);

  const getVisibleIndexForOriginalIndex = useCallback(
    (originalIndex: number) => {
      const entries = responsiveTutorialEntriesRef.current;

      if (!entries.length) {
        return 0;
      }

      const exactIndex = entries.findIndex(
        (entry) => entry.originalIndex === originalIndex
      );

      if (exactIndex >= 0) {
        return exactIndex;
      }

      const nextIndex = entries.findIndex(
        (entry) => entry.originalIndex > originalIndex
      );

      return nextIndex >= 0 ? nextIndex : entries.length - 1;
    },
    []
  );

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    responsiveTutorialEntriesRef.current = responsiveTutorialEntries;
  }, [responsiveTutorialEntries]);

  useEffect(() => {
    onStepChangeRef.current = onStepChange;
  }, [onStepChange]);

  useEffect(() => {
    onTutorialEndRef.current = onTutorialEnd;
  }, [onTutorialEnd]);

  const notifyStepChange = useCallback((originalIndex: number) => {
    if (lastNotifiedStepIndexRef.current === originalIndex) {
      return;
    }

    lastNotifiedStepIndexRef.current = originalIndex;
    onStepChangeRef.current?.(originalIndex);
  }, []);

  const finishTutorial = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    lastNotifiedStepIndexRef.current = null;
    setRun(false);
    onTutorialEndRef.current?.();

    const userId = user?.id;
    if (!userId) return;

    void (async () => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tutorialFinished: type }),
        });

        if (!response.ok) {
          toast.error(COMPLETION_ERROR_MESSAGE);
          console.error(
            "Error updating tutorial status:",
            response.status,
            response.statusText
          );
          return;
        }

        setServerTutorialCompleted(true);
        await updateSession({
          [tutorialField]: true,
        });
      } catch (error) {
        toast.error(COMPLETION_ERROR_MESSAGE);
        console.error("Error updating tutorial status:", error);
      }
    })();
  }, [tutorialField, type, updateSession, user?.id]);

  useEffect(() => {
    hasFetchedCompletionRef.current = false;
    lastNotifiedStepIndexRef.current = null;
    setServerTutorialCompleted(null);
  }, [type, user?.id]);

  useEffect(() => {
    if (!user?.id || hasFetchedCompletionRef.current) {
      return;
    }

    hasFetchedCompletionRef.current = true;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/users/${user.id}`, {
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) {
            setServerTutorialCompleted(sessionTutorialCompleted);
          }
          return;
        }

        const payload = (await response.json()) as {
          user?: Partial<SessionUser>;
        };
        const latestValue = payload.user?.[tutorialField];

        if (!cancelled && typeof latestValue === "boolean") {
          setServerTutorialCompleted(latestValue);
          if (latestValue !== sessionTutorialCompleted) {
            await updateSession({
              [tutorialField]: latestValue,
            });
          }
          return;
        }
      } catch (error) {
        console.error("Error syncing tutorial status:", error);
      }

      if (!cancelled) {
        setServerTutorialCompleted(sessionTutorialCompleted);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionTutorialCompleted, tutorialField, updateSession, user?.id]);

  useEffect(() => {
    if (!user || isTutorialCompleted || tutorialSteps.length === 0) {
      return;
    }

    const initialOriginalIndex =
      responsiveTutorialEntriesRef.current[0]?.originalIndex ?? 0;

    hasFinishedRef.current = false;
    stepIndexRef.current = 0;
    originalStepIndexRef.current = initialOriginalIndex;
    lastNotifiedStepIndexRef.current = null;
    setStepIndex(0);
    setRun(true);
    notifyStepChange(initialOriginalIndex);
  }, [isTutorialCompleted, notifyStepChange, tutorialSteps, user]);

  useEffect(() => {
    if (!run || responsiveTutorialEntries.length === 0) {
      return;
    }

    const nextVisibleIndex = getVisibleIndexForOriginalIndex(
      originalStepIndexRef.current
    );

    if (nextVisibleIndex === stepIndexRef.current) {
      return;
    }

    const nextOriginalIndex =
      responsiveTutorialEntries[nextVisibleIndex]?.originalIndex ??
      originalStepIndexRef.current;

    stepIndexRef.current = nextVisibleIndex;
    originalStepIndexRef.current = nextOriginalIndex;
    setStepIndex(nextVisibleIndex);
    notifyStepChange(nextOriginalIndex);
  }, [
    getVisibleIndexForOriginalIndex,
    notifyStepChange,
    responsiveTutorialEntries,
    run,
  ]);

  useEffect(() => {
    if (!run) return;

    const refreshCurrentStep = () => {
      if (refreshRafRef.current != null) {
        cancelAnimationFrame(refreshRafRef.current);
      }

      refreshRafRef.current = requestAnimationFrame(() => {
        refreshRafRef.current = null;
        const helpers = joyrideHelpersRef.current;
        if (!helpers) return;

        const current = helpers.info()?.index;
        const activeIndex =
          typeof current === "number" && current >= 0 ? current : stepIndex;
        helpers.go(activeIndex);
      });
    };

    window.addEventListener("resize", refreshCurrentStep, { passive: true });
    window.addEventListener("orientationchange", refreshCurrentStep, {
      passive: true,
    });
    window.addEventListener("scroll", refreshCurrentStep, true);
    window.visualViewport?.addEventListener("resize", refreshCurrentStep);
    window.visualViewport?.addEventListener("scroll", refreshCurrentStep);

    return () => {
      window.removeEventListener("resize", refreshCurrentStep);
      window.removeEventListener("orientationchange", refreshCurrentStep);
      window.removeEventListener("scroll", refreshCurrentStep, true);
      window.visualViewport?.removeEventListener("resize", refreshCurrentStep);
      window.visualViewport?.removeEventListener("scroll", refreshCurrentStep);

      if (refreshRafRef.current != null) {
        cancelAnimationFrame(refreshRafRef.current);
        refreshRafRef.current = null;
      }
    };
  }, [run, stepIndex]);

  useEffect(() => {
    if (!run) return;

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        const helpers = joyrideHelpersRef.current;
        if (!helpers) return;
        const current = helpers.info()?.index;
        const activeIndex =
          typeof current === "number" && current >= 0 ? current : stepIndex;
        helpers.go(activeIndex);
      });

      refreshRafRef.current = raf2;
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (refreshRafRef.current != null) {
        cancelAnimationFrame(refreshRafRef.current);
        refreshRafRef.current = null;
      }
    };
  }, [run, stepIndex]);

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const currentEntries = responsiveTutorialEntriesRef.current;
    const currentSteps = currentEntries.map((entry) => entry.step);
    const { type: eventType, index, action, status } = data;
    const currentIndex =
      typeof index === "number" ? index : stepIndexRef.current;
    const lastIndex = currentSteps.length - 1;
    const isOnLastStep = currentIndex === lastIndex;
    const endedByClose = action === ACTIONS.CLOSE;
    const endedBySkip = action === ACTIONS.SKIP;
    const endedByDone =
      (status === STATUS.FINISHED && isOnLastStep) ||
      (eventType === EVENTS.STEP_AFTER &&
        action === ACTIONS.NEXT &&
        isOnLastStep);

    if (endedByClose || endedBySkip || endedByDone) {
      finishTutorial();
      return;
    }

    // Ignore terminal statuses triggered by non-user navigation edge cases.
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      return;
    }

    if (eventType === EVENTS.STEP_BEFORE) {
      if (typeof index === "number") {
        const currentOriginalIndex =
          currentEntries[index]?.originalIndex ?? index;
        originalStepIndexRef.current = currentOriginalIndex;
        notifyStepChange(currentOriginalIndex);
      }
      return;
    }

    if (
      eventType === EVENTS.STEP_AFTER ||
      eventType === EVENTS.TARGET_NOT_FOUND
    ) {
      if (action !== ACTIONS.NEXT && action !== ACTIONS.PREV) {
        return;
      }

      const nextIndex = action === ACTIONS.PREV ? currentIndex - 1 : currentIndex + 1;
      const safeNextIndex = Math.max(
        0,
        Math.min(nextIndex, currentSteps.length - 1)
      );

      const nextOriginalIndex =
        currentEntries[safeNextIndex]?.originalIndex ?? safeNextIndex;

      notifyStepChange(nextOriginalIndex);

      const nextTarget = currentSteps[safeNextIndex]?.target;
      const selector =
        typeof nextTarget === "string" && nextTarget !== "body"
          ? nextTarget
          : null;

      if (selector) {
        const targetFoundNow = !!document.querySelector(selector);
        if (!targetFoundNow) {
          await waitForTutorialTarget(selector);
        }
      }

      stepIndexRef.current = safeNextIndex;
      originalStepIndexRef.current = nextOriginalIndex;
      setStepIndex(safeNextIndex);
    }
  }, [finishTutorial, notifyStepChange]);

  if (!user || isTutorialCompleted || tutorialSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      tooltipComponent={JoyrideStep}
      getHelpers={(helpers) => {
        joyrideHelpersRef.current = helpers;
      }}
      floaterProps={{
        hideArrow: true,
        offset: 12,
        modifiers: {
          preventOverflow: {
            options: {
              boundary: "clippingParents",
              rootBoundary: "viewport",
              padding: 8,
              tether: true,
            },
          },
          flip: {
            options: {
              fallbackPlacements: ["top", "bottom", "right", "left"],
            },
          },
        },
        styles: {
          floater: {
            transition: "opacity 0s",
            maxWidth: "calc(100vw - 2rem)",
            width: "auto",
          },
          floaterWithAnimation: {
            transition: "opacity 0s, transform 0s",
            maxWidth: "calc(100vw - 2rem)",
            width: "auto",
          },
        },
      }}
      disableOverlayClose
      scrollToFirstStep
      continuous
      steps={responsiveTutorialSteps}
      run={run}
      stepIndex={stepIndex}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: "rgba(0, 0, 0, 0.55)",
        },
        overlay: {
          minHeight: "100dvh",
          width: "100%",
        },
        overlayLegacy: {
          minHeight: "100dvh",
          width: "100%",
        },
        overlayLegacyCenter: {
          minHeight: "100dvh",
          width: "100%",
        },
        spotlight: {
          borderRadius: 10,
        },
      }}
      locale={{
        back: "Back",
        close: "Done",
        last: "Done",
        next: "Next",
        skip: "Skip",
      }}
      callback={handleJoyrideCallback}
    />
  );
}
