import Joyride, {
  Step,
  CallBackProps,
  ACTIONS,
  EVENTS,
  ORIGIN,
  STATUS,
} from "react-joyride";
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
}

export default function Tutorial({ tutorialSteps, type }: TutorialProps) {
  const { user } = useUser();
  console.log(user);
  if (!user || user[nameMap[type]] || tutorialSteps.length === 0) {
    return null;
  }
  const handleJoyrideCallback = (data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tutorialFinished: type }),
      }).catch((error) => {
        console.error("Error updating tutorial status:", error);
      });
    }
  };

  return (
    <Joyride
      tooltipComponent={JoyrideStep}
      continuous
      steps={tutorialSteps}
      run={true}
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
