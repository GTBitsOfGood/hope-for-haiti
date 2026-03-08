import { useEffect, useState } from "react";
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

  const finishTutorial = () => {
    setRun(false);
    onTutorialEnd?.();

    fetch(`/api/users/${user.id}`, {
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

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      finishTutorial();
      return;
    }

    if (eventType === EVENTS.STEP_BEFORE) {
      onStepChange?.(index);
    }

    if (eventType === EVENTS.STEP_AFTER) {
      const isLastStep = index === tutorialSteps.length - 1;

      if (isLastStep && action !== ACTIONS.PREV) {
        finishTutorial();
        return;
      }

      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
      const safeNextIndex = Math.max(
        0,
        Math.min(nextIndex, tutorialSteps.length - 1)
      );

      setRun(false);
      onStepChange?.(safeNextIndex);

      const nextTarget = tutorialSteps[safeNextIndex]?.target;
      const selector =
        typeof nextTarget === "string" && nextTarget !== "body"
          ? nextTarget
          : null;

      if (selector) {
        await waitForTutorialTarget(selector, 2500);
      }

      setStepIndex(safeNextIndex);

      requestAnimationFrame(() => {
        setRun(true);
      });
    }
  };

  return (
    <Joyride
      tooltipComponent={JoyrideStep}
      floaterProps={{
        hideArrow: true,
      }}
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
