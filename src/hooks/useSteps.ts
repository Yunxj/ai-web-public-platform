import { useState, useCallback } from 'react';
import { AIStep, defaultSteps } from '@/config/ai-steps';

export function useSteps() {
  const [steps, setSteps] = useState<AIStep[]>(defaultSteps);

  const updateStepStatus = useCallback((
    stepId: string,
    status: 'running' | 'completed' | 'error',
    result?: string
  ) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, result } : step
    ));
  }, []);

  const resetSteps = useCallback(() => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const, result: undefined })));
  }, []);

  const markRunningStepsAsError = useCallback(() => {
    setSteps(prev => prev.map(step =>
      step.status === 'running' ? { ...step, status: 'error' as const } : step
    ));
  }, []);

  return {
    steps,
    updateStepStatus,
    resetSteps,
    markRunningStepsAsError,
  };
}
