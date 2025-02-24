import { Button, Input, Slider } from "@nextui-org/react";

import { StepsControlProps } from "./types";

export const StepsControl = ({ stepsCount, setStepsCount, description }: StepsControlProps) => {
  return (
    <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100/50 shadow-inner">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Control de Pasos
            </h3>
            <p className="text-sm text-slate-600">
              Ajusta la cantidad de niveles de color para el procesamiento
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200">
            <Input
              type="number"
              value={stepsCount.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  setStepsCount(Math.max(value, 2));
                }
              }}
              className="w-20"
              classNames={{
                input: "text-center font-medium text-indigo-600",
                inputWrapper: "bg-transparent shadow-none"
              }}
              size="sm"
              min={2}
            />
            <span className="text-sm text-slate-500">pasos</span>
          </div>
        </div>

        <div className="space-y-6">
          <Slider 
            size="lg"
            step={1}
            minValue={2}
            maxValue={100}
            value={stepsCount}
            onChange={(value) => setStepsCount(value as number)}
            className="max-w-full"
            color="secondary"
            showSteps={false}
            marks={[
              {
                value: 2,
                label: "Mínimo"
              },
              {
                value: 50,
                label: "Medio"
              },
              {
                value: 100,
                label: "Alto"
              }
            ]}
            startContent={
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-indigo-600">2</span>
                <span className="text-[10px] text-slate-500">Min</span>
              </div>
            }
            endContent={
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-indigo-600">100</span>
                <span className="text-[10px] text-slate-500">Max</span>
              </div>
            }
            classNames={{
              base: "max-w-full py-2",
              filler: "bg-gradient-to-r from-indigo-500 to-purple-500",
              thumb: [
                "transition-all duration-200",
                "before:bg-gradient-to-r before:from-indigo-500 before:to-purple-500",
                "after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500",
                "shadow-lg hover:shadow-xl",
                "group-data-[focused=true]:shadow-lg",
              ].join(" "),
              track: "bg-slate-200",
              mark: "hidden",
              label: "font-medium text-slate-600"
            }}
          />

          <div className="grid grid-cols-3 gap-4">
            <Button
              size="sm"
              className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
              onPress={() => setStepsCount(20)}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-slate-700">Rápido</span>
                <span className="text-xs text-slate-500">20 pasos</span>
              </div>
            </Button>
            <Button
              size="sm"
              className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
              onPress={() => setStepsCount(50)}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-slate-700">Balanceado</span>
                <span className="text-xs text-slate-500">50 pasos</span>
              </div>
            </Button>
            <Button
              size="sm"
              className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200"
              onPress={() => setStepsCount(100)}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-slate-700">Detallado</span>
                <span className="text-xs text-slate-500">100 pasos</span>
              </div>
            </Button>
          </div>
          <p className="text-sm text-slate-600 text-center">{description}</p>
        </div>
      </div>
    </div>
  );
}; 