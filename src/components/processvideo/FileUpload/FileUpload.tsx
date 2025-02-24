import { Image as ImageIcon } from "lucide-react";
import { CardHeader, CardBody, Input, Card } from "@nextui-org/react";

import { FileUploadProps } from "./types";

export const FileUpload = ({ onFileUpload, onDragOver, onDrop }: FileUploadProps) => {
  return (
    <Card className="bg-white border border-slate-200">
      <CardHeader className="flex items-center gap-4 p-6 border-b border-slate-100">
        <div className="p-3 bg-indigo-50 rounded-lg">
          <ImageIcon className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium text-slate-800">Cargar Imagen</h2>
          <p className="text-sm text-slate-500">Sube una imagen para procesar</p>
        </div>
      </CardHeader>

      <CardBody className="p-6">
        <div 
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="w-full"
        >
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files) {
                const file = e.target.files[0];
                onFileUpload(file);
              }
            }}
            description="Arrastra y suelta tu imagen o haz clic para seleccionar"
            className="border border-dashed border-slate-200 hover:border-indigo-400 transition-all duration-200"
            classNames={{
              description: "text-slate-500 text-sm",
              input: "text-slate-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100",
              inputWrapper: "h-24 flex items-center justify-center bg-slate-50/50 cursor-pointer"
            }}
          />
        </div>
      </CardBody>
    </Card>
  );
}; 