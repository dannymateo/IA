"use client";
import { Brain, Github, Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 shadow-lg z-50">
      <div className="max-w-md mx-auto px-6 py-2">
        <div className="flex justify-around items-center">
          <Link 
            href="/expertSystem" 
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${
              pathname === '/expertSystem' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
            }`}
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Sistema Experto</span>
          </Link>

          <Link 
            href="/imagesLayers" 
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${
              pathname === '/imagesLayers' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
            }`}
          >
            <Layers className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Procesador de imagenes</span>
          </Link>

          {/* <Link 
            href="/diabetes" 
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-300 ${
              pathname === '/diabetes' 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50'
            }`}
          >
            <Brain className="w-6 h-6" />
            <span className="text-xs font-medium text-center">Sistema Experto</span>
          </Link> */}
        </div>
      </div>
      <footer className="w-full text-black py-3">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3 text-base font-medium">
            <span>Desarrollado por Danny Hernández</span>
            <a 
              href="https://github.com/dannymateo/IA.git"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-blue-600 transition-colors"
            >
              <Github size={24} />
            </a>
          </div>
        </footer>      
    </div>
  );
} 