export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-bounce" />
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
          <div className="w-3 h-3 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
        </div>
        <p className="text-slate-600 font-medium">Cargando...</p>
      </div>
    </div>
  );
} 