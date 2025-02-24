import { Card, CardBody, Spinner } from "@nextui-org/react";
import { Image, Cpu } from "lucide-react";

import { ProgressIndicatorProps } from "./types";

export const ProgressIndicator = ({ progress, currentCluster }: ProgressIndicatorProps) => {
  return (
    <Card className="mt-6 border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-blue-400/5 shadow-lg">
      <CardBody className="flex flex-col gap-6 items-center p-8">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Spinner 
              size="lg"
              color="primary" 
              className="opacity-75"
            />
            <Image 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-5 h-5" 
              strokeWidth={2.5}
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <p className="text-indigo-600 font-semibold text-lg flex items-center gap-2">
              Procesando imagen...
            </p>
            <p className="text-sm text-slate-600 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
              Paso {progress.step} de {progress.total}
            </p>
            {currentCluster && (
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Cpu className="text-indigo-500 w-4 h-4" />
                Aplicando K-means con {currentCluster} clusters
              </p>
            )}
          </div>
        </div>

        <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300 ease-in-out"
            style={{ 
              width: `${(progress.step / progress.total) * 100}%`
            }}
          />
        </div>
      </CardBody>
    </Card>
  );
}; 