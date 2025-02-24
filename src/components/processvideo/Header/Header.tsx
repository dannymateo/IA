import { Layers } from "lucide-react";
import { CardHeader } from "@nextui-org/react";

export const Header = () => {
  return (
    <CardHeader className="flex flex-col gap-4 pt-6 md:pt-8">
      <div className="flex items-center gap-2 w-full justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-100" />
          <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse delay-200" />
        </div>
        <Layers className="text-indigo-600 w-8 h-8" />
      </div>
      <div className="text-center space-y-3 pb-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] bg-clip-text text-transparent">
          Procesador de Imagen por Niveles
        </h1>
      </div>
    </CardHeader>
  );
}; 