import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { Download } from "lucide-react";

import { VideoResultProps } from "./types";

export const VideoResult = ({ videoUrl }: VideoResultProps) => {
  return (
    <Card className="bg-white/95 backdrop-blur-xl border border-slate-200/60">
      <CardHeader className="flex justify-between items-center px-6 pt-6">
        <h2 className="text-2xl font-medium text-slate-800">Video Resultante</h2>
        <Button
          size="lg"
          className="bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-2 h-10"
          onPress={() => {
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = 'color-levels.webm';
            a.click();
          }}
        >
          <Download className="w-4 h-4" />
          Descargar
        </Button>
      </CardHeader>
      <CardBody className="p-6">
        <div className="aspect-video w-full relative rounded-lg overflow-hidden bg-slate-100">
          <video 
            src={videoUrl} 
            controls 
            className="w-full h-full"
            style={{ backgroundColor: 'black' }}
          >
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      </CardBody>
    </Card>
  );
}; 