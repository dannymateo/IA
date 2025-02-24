import { Upload, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function FileUpload({ onFileUpload, onDragOver, onDrop }: FileUploadProps) {
  return (
    <div className="w-full">
      <div
        className="relative group border-2 border-dashed 
                   border-slate-300/70 dark:border-slate-700/70 
                   rounded-2xl transition-all duration-300 ease-in-out
                   hover:border-indigo-500/70 hover:bg-indigo-50/30
                   dark:hover:border-indigo-400/70 dark:hover:bg-indigo-950/5
                   shadow-sm hover:shadow-md"
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Cargar imagen"
        />
        
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 text-center">
          <div className="mb-4 rounded-xl bg-indigo-100/80 p-3 sm:p-4 
                         dark:bg-indigo-950/20 transform transition-transform 
                         group-hover:scale-110 duration-300">
            <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-500/90 dark:text-indigo-400/90" />
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-base sm:text-lg md:text-xl font-semibold 
                         text-slate-800/90 dark:text-slate-200/90
                         transition-colors group-hover:text-indigo-600 
                         dark:group-hover:text-indigo-400">
              Sube tu imagen aquí
            </h3>
            <p className="text-xs sm:text-sm text-slate-600/90 dark:text-slate-400/90
                        max-w-xs mx-auto">
              Arrastra y suelta tu archivo o haz clic para explorar
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center 
                          gap-1 sm:gap-2 text-[10px] sm:text-xs 
                          text-slate-500/80 dark:text-slate-500/80">
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Formatos soportados:</span>
              </div>
              <span className="font-medium">PNG, JPG, GIF</span>
            </div>
          </div>
        </div>

        {/* Efecto de hover mejorado */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/5 to-purple-50/5 
                      dark:from-indigo-900/5 dark:to-purple-900/5
                      rounded-2xl opacity-0 group-hover:opacity-100 
                      transition-all duration-500 ease-in-out pointer-events-none" />
      </div>
    </div>
  );
} 