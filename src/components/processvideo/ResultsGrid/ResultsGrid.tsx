import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { Download, Grid2X2, Image as ImageIcon } from "lucide-react";

import { ResultsGridProps } from "./types";

export const ResultsGrid = ({ processedImages }: ResultsGridProps) => {
  return (
    <Card className="bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl">
      <CardHeader className="flex items-center gap-3 px-6 pt-6">
        <Grid2X2 className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-medium text-slate-800">Resultados</h2>
      </CardHeader>
      <CardBody className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {processedImages.map((img, index) => {
          const progress = index / (processedImages.length - 1);
          const minLog = Math.log(2);
          const maxLog = Math.log(64);
          const clusters = Math.round(Math.exp(minLog + (maxLog - minLog) * progress));

          return (
            <Card 
              key={index} 
              className="border border-slate-200 hover:border-indigo-400 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md"
            >
              <CardHeader className="flex justify-between items-center p-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-700 font-medium">
                    {clusters} clusters
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg min-w-[36px]"
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
                  alt={`Imagen procesada con ${clusters} clusters`}
                  className="w-full rounded-lg object-cover hover:scale-[1.02] transition-transform duration-300" 
                />
              </CardBody>
            </Card>
          );
        })}
      </CardBody>
    </Card>
  );
}; 