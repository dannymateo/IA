import { Card, CardBody, Spinner } from "@nextui-org/react";

import { ProgressIndicatorProps } from "./types";

export const ProgressIndicator = ({ progress, currentCluster }: ProgressIndicatorProps) => {
  return (
    <Card className="mt-4 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-blue-400/5">
      <CardBody className="flex flex-col gap-4 items-center p-6">
        <div className="flex items-center gap-4">
          <Spinner color="primary" />
          <div className="flex flex-col">
            <p className="text-indigo-600 font-medium">
              Procesando imagen...
            </p>
            <p className="text-sm text-slate-600">
              Paso {progress.step} de {progress.total}
            </p>
            {currentCluster && (
              <p className="text-sm text-slate-600">
                Aplicando K-means con {currentCluster} clusters
              </p>
            )}
          </div>
        </div>
        <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ 
              width: `${(progress.step / progress.total) * 100}%`
            }}
          />
        </div>
      </CardBody>
    </Card>
  );
}; 