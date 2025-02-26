import { Card, CardBody } from "@nextui-org/react";
import { XCircle } from "lucide-react";

import { ErrorDisplayProps } from "./types";

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-pink-400/5 backdrop-blur-2xl 
      shadow-lg overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
      <CardBody className="flex gap-4 items-center p-6 md:p-8">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-red-400 font-medium">{error}</p>
      </CardBody>
    </Card>
  );
} 