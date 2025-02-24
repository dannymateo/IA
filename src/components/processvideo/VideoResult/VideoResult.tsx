import { Card, CardHeader, CardBody, Button } from "@nextui-org/react";
import { Download, Video } from "lucide-react";

import { VideoResultProps } from "./types";

export const VideoResult = ({ videoUrl }: VideoResultProps) => {
  return (
    <Card className="bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-sm">
      <CardHeader className="flex justify-between items-center space-x-4 px-6 py-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-slate-700" />
          <h2 className="text-xl font-semibold text-slate-800">Video Resultante</h2>
        </div>
        <Button
          size="md"
          variant="flat"
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl flex items-center gap-2 px-4 transition-colors duration-200"
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
      <CardBody className="px-6 pb-6 pt-2">
        <div className="aspect-video w-full relative rounded-xl overflow-hidden bg-slate-900/95 shadow-inner">
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