import { useEffect, useMemo, useRef, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS, EVENTS, ACTIONS } from "react-joyride";
import type { StoreHelpers } from "react-joyride";
import JoyrideStep from "@/components/JoyrideStep";
import { SessionUser, useUser } from "./context/UserContext";

const nameMap = {
  dashboard: "dashboardTutorial" as keyof SessionUser,
  items: "itemsTutorial" as keyof SessionUser,
  requests: "requestsTutorial" as keyof SessionUser,
  wishlists: "wishlistsTutorial" as keyof SessionUser,
};

interface TutorialProps {
  tutorialSteps: Step[];
  type: keyof typeof nameMap;
  onStepChange?: (stepIndex: number) => void;
  onTutorialEnd?: () => void;
}

export default function Tutorial({ tutorialSteps, type, onStepChange, onTutorialEnd, }: TutorialProps) {
  const { user } = useUser();
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);
  const hasFinishedRef = useRef(false);
  const joyrideHelpersRef = useRef<StoreHelpers | null>(null);
  const refreshRafRef = useRef<number | null>(null);

  const responsiveTutorialSteps = useMemo(
    () =>
      tutorialSteps.map((step) => {
        const isBodyTarget = step.target === "body";
        const fallbackPadding =
          typeof step.spotlightPadding === "number" ? step.spotlightPadding : 8;

        return {
          ...step,
          placement: (isBodyTarget ? step.placement ?? "center" : "auto") as Step["placement"],
          spotlightPadding: Math.min(fallbackPadding, 8),
        };
      }),
    [tutorialSteps]
  );

  const finishTutorial = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setRun(false);
    onTutorialEnd?.();

    const userId = user?.id;
    if (!userId) return;

    fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tutorialFinished: type }),
    }).catch((error) => {
      console.error("Error updating tutorial status:", error);
    });
  };

  useEffect(() => {
    if (!user || user[nameMap[type]] || tutorialSteps.length === 0) {
      return;
    }
    hasFinishedRef.current = false;
    setStepIndex(0);
    setRun(true);
    onStepChange?.(0);
  }, [user, type, tutorialSteps, onStepChange]);

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

  if (!user || user[nameMap[type]] || tutorialSteps.length === 0) {
    return null;
  }

  const waitForTutorialTarget = async (
    selector: string,
    timeout = 2000
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

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { type: eventType, index, action, status } = data;
    const currentIndex = typeof index === "number" ? index : stepIndex;
    const lastIndex = responsiveTutorialSteps.length - 1;
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
        onStepChange?.(index);
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
        Math.min(nextIndex, responsiveTutorialSteps.length - 1)
      );

      onStepChange?.(safeNextIndex);

      const nextTarget = responsiveTutorialSteps[safeNextIndex]?.target;
      const selector =
        typeof nextTarget === "string" && nextTarget !== "body"
          ? nextTarget
          : null;

      if (selector) {
        const targetFoundNow = !!document.querySelector(selector);
        if (!targetFoundNow) {
          await waitForTutorialTarget(selector, 2500);
        }
      }

      setStepIndex(safeNextIndex);
    }
  };

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
      disableOverlayClose={false}
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
        close: "Done", // used in non-continuous mode or some configs
        last: "Done", // 👈 this is the one you care about
        next: "Next",
        skip: "Skip",
      }}
      callback={handleJoyrideCallback}
    />
  );
}
