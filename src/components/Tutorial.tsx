import { useEffect, useRef, useState } from "react";
import Joyride, { Step, CallBackProps, STATUS, EVENTS, ACTIONS } from "react-joyride";
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
    const lastIndex = tutorialSteps.length - 1;
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
        Math.min(nextIndex, tutorialSteps.length - 1)
      );

      onStepChange?.(safeNextIndex);

      const nextTarget = tutorialSteps[safeNextIndex]?.target;
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
      floaterProps={{
        hideArrow: true,
        styles: {
          floater: {
            transition: "opacity 0s",
          },
          floaterWithAnimation: {
            transition: "opacity 0s, transform 0s",
          },
        },
      }}
      disableOverlayClose={false}
      continuous
      steps={tutorialSteps}
      run={run}
      stepIndex={stepIndex}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: "rgba(0, 0, 0, 0.55)",
        },
        spotlight: {
          borderRadius: 12,
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
