interface ProgressIndicatorProps {
    progress: { step: number; total: number };
    currentCluster: number | null;
  }

  export type { ProgressIndicatorProps };