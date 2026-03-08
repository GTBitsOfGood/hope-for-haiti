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

  useEffect(() => {
    if (!user || user[nameMap[type]] || tutorialSteps.length === 0) {
      return;
    }
    setRun(true);
    onStepChange?.(0);
  }, [user, type, tutorialSteps, onStepChange]);
  console.log(user);
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

      return;
    }

    if (eventType === EVENTS.STEP_BEFORE) {
      onStepChange?.(index);
    }

    if (eventType === EVENTS.STEP_AFTER) {
  const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
  const safeNextIndex = Math.max(0, nextIndex);

  if (safeNextIndex === 2) {
    setRun(false);
    onStepChange?.(2);

    const found = await waitForTutorialTarget(
      '[data-tutorial="filter-expanded"]'
    );

    if (found) {
      setStepIndex(2);
    }

    setRun(true);
    return;
  }

  if (safeNextIndex === 3) {
    setRun(false);
    onStepChange?.(3);

    const found = await waitForTutorialTarget(
      '[data-tutorial="individual-item"]'
    );

    if (found) {
      setStepIndex(3);
    }

    setRun(true);
    return;
  }

  if (safeNextIndex === 5) {
    setRun(false);
    onStepChange?.(5);

    const found = await waitForTutorialTarget(
      '[data-tutorial="request-expanded"]'
    );

    if (!found) {
      console.warn("Could not find request-expanded target");
      setRun(true);
      return;
    }

    setStepIndex(5);

    requestAnimationFrame(() => {
      setRun(true);
    });

    return;
  }

  onStepChange?.(safeNextIndex);
  setStepIndex(safeNextIndex);
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
