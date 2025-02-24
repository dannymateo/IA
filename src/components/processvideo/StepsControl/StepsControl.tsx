import { Button, Input, Slider } from "@nextui-org/react";
import { Clock, Zap, Maximize } from "lucide-react";
import { StepsControlProps } from "./types";

export const StepsControl = ({ stepsCount, setStepsCount, description }: StepsControlProps) => {
  return (
    <div className="mt-8 md:mt-10 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 md:p-6 lg:p-8 rounded-2xl border border-indigo-100/50 shadow-inner">
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Control de Pasos
            </h3>
            <p className="text-sm md:text-base text-slate-600">
              Ajusta la cantidad de niveles de color para el procesamiento
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors">
            <Input
              type="number"
              value={stepsCount.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  setStepsCount(Math.max(value, 2));
                }
              }}
              className="w-24"
              classNames={{
                input: "text-center font-medium text-indigo-600 text-lg",
                inputWrapper: "bg-transparent shadow-none hover:bg-indigo-50/30 transition-colors"
              }}
              size="sm"
              min={2}
            />
            <span className="text-sm font-medium text-slate-500">pasos</span>
          </div>
        </div>

        <div className="space-y-8">
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
              base: "max-w-full py-4",
              filler: "bg-gradient-to-r from-indigo-500 to-purple-500",
              thumb: [
                "transition-all duration-200",
                "before:bg-gradient-to-r before:from-indigo-500 before:to-purple-500",
                "after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500",
                "shadow-lg hover:shadow-xl scale-125",
                "group-data-[focused=true]:shadow-lg",
              ].join(" "),
              track: "bg-slate-200/60 h-3 rounded-full",
              mark: "hidden",
              label: "font-medium text-slate-600"
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <Button
              size="lg"
              className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 rounded-xl p-4"
              onPress={() => setStepsCount(20)}
            >
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-indigo-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700">Rápido</span>
                  <span className="text-xs text-slate-500">20 pasos</span>
                </div>
              </div>
            </Button>
            
            <Button
              size="lg"
              className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 rounded-xl p-4"
              onPress={() => setStepsCount(50)}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700">Balanceado</span>
                  <span className="text-xs text-slate-500">50 pasos</span>
                </div>
              </div>
            </Button>
            
            <Button
              size="lg"
              className="bg-white border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200 rounded-xl p-4"
              onPress={() => setStepsCount(100)}
            >
              <div className="flex items-center gap-3">
                <Maximize className="w-5 h-5 text-indigo-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-700">Detallado</span>
                  <span className="text-xs text-slate-500">100 pasos</span>
                </div>
              </div>
            </Button>
          </div>

          <p className="text-sm md:text-base text-slate-600 text-center px-4 py-2 bg-white/50 rounded-xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}; 