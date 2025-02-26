interface FileUploadProps {
    onFileUpload: (file: File) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    title: string;
    formats: string[];
    formatsName: string[];
  }

  export type { FileUploadProps };