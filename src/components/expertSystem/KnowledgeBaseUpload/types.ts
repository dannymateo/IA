interface KnowledgeBaseUploadProps {
    isLoading: boolean;
    onFileUpload: (file: File) => Promise<void>;
    handleDownloadTemplate: () => void;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  }

  export type { KnowledgeBaseUploadProps };