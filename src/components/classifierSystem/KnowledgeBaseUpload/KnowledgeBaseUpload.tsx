import { FileUpload } from "@/components/fileUpload";
import { Card, CardHeader, CardBody, Button, Spinner } from "@nextui-org/react";
import { FileSpreadsheet, Download } from "lucide-react";

import { KnowledgeBaseUploadProps } from "./types";

export function KnowledgeBaseUpload({
  isLoading,
  onFileUpload,
  handleDownloadTemplate,
  handleDragOver,
  handleDrop
}: KnowledgeBaseUploadProps) {
  return (
    <Card className="bg-white border border-slate-200">
      <CardHeader className="flex items-center gap-4 p-6 border-b border-slate-100">
        <div className="p-3 bg-indigo-50 rounded-lg">
          <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-medium text-slate-800">Base de Datos</h2>
          <p className="text-sm text-slate-500">Carga tu archivo CSV o Excel</p>
        </div>
        <Button
          onPress={handleDownloadTemplate}
          className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-2 rounded-xl
            hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 
            shadow-lg hover:shadow-indigo-500/30 group flex items-center gap-2"
          size="sm"
        >
          <span className="text-sm font-medium">Descargar Plantilla</span>
          <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" />
        </Button>
      </CardHeader>
      <CardBody className="p-6 flex flex-col gap-4 justify-center items-center rounded-lg">
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="w-full"
        >

          <FileUpload
            title="Arrastra y suelta tu archivo CSV o Excel aquí"
            formats={["text/csv", "application/vnd.ms-excel", 
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]}
            formatsName={["CSV", "XLS", "XLSX"]}
            onFileUpload={onFileUpload}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>
        
        {isLoading && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
            <Spinner size="sm" color="primary" />
            <span className="text-sm text-indigo-600">Procesando archivo...</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
} 