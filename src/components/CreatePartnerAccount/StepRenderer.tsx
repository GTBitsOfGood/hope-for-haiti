import React from "react";

interface StepConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
}

interface StepRendererProps {
  currentStep: number;
  steps: StepConfig[];
  commonProps: Record<string, unknown>;
}

export default function StepRenderer({ 
  currentStep, 
  steps, 
  commonProps 
}: StepRendererProps) {
  const stepConfig = steps[currentStep - 1];
  
  if (!stepConfig) {
    return null;
  }

  const StepComponent = stepConfig.component;
  const allProps = { ...commonProps, ...stepConfig.props };

  return <StepComponent {...allProps} />;
}
