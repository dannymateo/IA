import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { Download } from "lucide-react";

import { ResultsGridProps } from "./types";

export const ResultsGrid = ({ processedImages }: ResultsGridProps) => {
  return (
    <Card className="bg-white/95 backdrop-blur-xl border border-slate-200/60">
      <CardHeader className="flex gap-4 px-6 pt-6">
        <h2 className="text-2xl font-medium text-slate-800">Resultados</h2>
      </CardHeader>
      <CardBody className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {processedImages.map((img, index) => {
          const progress = index / (processedImages.length - 1);
          const minLog = Math.log(2);
          const maxLog = Math.log(64);
          const clusters = Math.round(Math.exp(minLog + (maxLog - minLog) * progress));

          return (
            <Card key={index} className="border border-slate-200 hover:border-indigo-400 transition-all duration-300">
              <CardHeader className="flex justify-between items-center p-4">
                <span className="text-slate-700 font-medium">
                  Clusters: {clusters}
                </span>
                <Button
                  size="sm"
                  className="bg-indigo-50 text-indigo-600"
                  onPress={() => {
                    const link = document.createElement('a');
                    link.href = img;
                    link.download = `processed_${clusters}_clusters.png`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardBody className="p-4">
                <img 
                  src={img} 
                  alt={`Processed ${clusters} clusters`} 
                  className="w-full rounded-lg" 
                />
              </CardBody>
            </Card>
          );
        })}
      </CardBody>
    </Card>
  );
}; 