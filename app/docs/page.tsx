"use client";

import { ChevronRight, ExternalLink, Terminal, ArrowUpRight, ChevronDown, Search, CheckCircle2, Menu, X, Home, BookOpen, Download, Zap, Image, Music, Video, Globe, User, Code, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCategories, getPluginsByCategory, Plugin } from "@/lib";
import { siteConfig } from "@/lib/site";
import "@/lib/plugins";

const categoryIcons: Record<string, React.ReactNode> = {
  download: <Download className="w-4 h-4 text-cyan-400" />,
  ai: <Zap className="w-4 h-4 text-indigo-400" />,
  stalker: <User className="w-4 h-4 text-purple-400" />,
  image: <Image className="w-4 h-4 text-pink-400" />,
  music: <Music className="w-4 h-4 text-emerald-400" />,
  video: <Video className="w-4 h-4 text-blue-400" />,
  tools: <Globe className="w-4 h-4 text-zinc-400" />,
};

function SidebarContent({ activeCategory, onSelectCategory, mobile = false }: { activeCategory: string; onSelectCategory: (cat: string) => void, mobile?: boolean }) {
  const categories = getCategories();

  return (
    <div className={`flex flex-col h-full bg-[#050505] ${mobile ? '' : 'border-r border-zinc-800'}`}>
      {/* Brand */}
      <div className="p-6 pb-6 flex items-center gap-3 border-b border-zinc-900/50">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-white" />
        </div>
        <div>
           <h1 className="text-white font-bold text-sm tracking-wide">Developer API</h1>
           <span className="text-[10px] text-zinc-500 font-mono">v2.0.0-beta</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide font-mono">
        {/* Main Links */}
        <div className="space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-md text-xs transition-colors group">
            <Home className="w-3.5 h-3.5 group-hover:text-cyan-400 transition-colors" />
            ~/home
          </Link>
          <div 
            onClick={() => onSelectCategory("Documentation")}
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all border ${
              activeCategory === "Documentation" 
                ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400" 
                : "border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50"
            }`}
          >
            <span className="flex items-center gap-3 text-xs">
              <BookOpen className={`w-3.5 h-3.5 ${activeCategory === "Documentation" ? "text-cyan-400" : "text-zinc-500"}`} />
              ~/docs
            </span>
            {activeCategory === "Documentation" && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="px-3 mb-3 text-[10px] font-bold text-zinc-600 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
            Modules
          </h3>
          <div className="space-y-0.5 border-l border-zinc-800 ml-3 pl-3">
            {categories.map((cat: string) => (
              <div 
                key={cat} 
                onClick={() => onSelectCategory(cat)}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs transition-all group cursor-pointer ${
                  activeCategory === cat 
                    ? "text-white bg-zinc-900 border-l-2 border-cyan-500 -ml-[13px]" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 -ml-[1px]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                   {categoryIcons[cat] || <Globe className="w-3.5 h-3.5 text-zinc-600" />}
                   {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </span>
                {activeCategory === cat && <ChevronRight className="w-3 h-3 text-cyan-500" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-900/30 rounded p-3 border border-zinc-800/50">
          <div className="flex items-center gap-3 mb-2">
             <div className="p-1.5 rounded bg-indigo-500/10 border border-indigo-500/20">
               <ExternalLink className="w-3 h-3 text-indigo-400" />
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white">Need Help?</span>
                <span className="text-[9px] text-zinc-500">Contact Support</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchTerminal({ value, onChange, category }: { value: string; onChange: (val: string) => void; category: string }) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative mb-6 group">
      {/* Gradient Border Glow */}
      <div className={`absolute -inset-[1px] bg-gradient-to-r from-cyan-500/40 via-indigo-500/20 to-cyan-500/40 rounded-xl transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}></div>
      
      <div className="relative rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a] border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-[0_0_6px_rgba(255,95,86,0.5)]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_rgba(255,189,46,0.5)]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-[0_0_6px_rgba(39,201,63,0.5)]"></div>
            </div>
            <div className="h-3 w-px bg-zinc-800"></div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">search</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              module:{category}
            </span>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="px-4 py-4 flex items-center gap-3 bg-[#050505]">
          <div className={`transition-all duration-200 ${isFocused ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'text-cyan-600'}`}>
            <span className="font-mono text-lg font-bold">❯</span>
          </div>
          <input 
            type="text" 
            placeholder="filter_endpoints..." 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-700 w-full font-mono text-sm tracking-wide"
          />
          {value && (
            <button 
              onClick={() => onChange('')}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Status Bar */}
        <div className="px-4 py-1.5 bg-[#0a0a0a] border-t border-zinc-900 flex items-center justify-between">
          <span className="text-[9px] font-mono text-zinc-700">
            <span className="text-emerald-600">●</span> ready
          </span>
          <span className="text-[9px] font-mono text-zinc-700">
            /{category.toLowerCase()}/*
          </span>
        </div>
      </div>
    </div>
  );
}

// Terminal Window for Documentation View
function TerminalWindow() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden mb-6 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#0f0f0f] to-[#0a0a0a] border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-[0_0_6px_rgba(255,95,86,0.5)]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-[0_0_6px_rgba(255,189,46,0.5)]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-[0_0_6px_rgba(39,201,63,0.5)]"></div>
          </div>
          <div className="h-3 w-px bg-zinc-800"></div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">terminal</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-600">bash — 80×24</span>
      </div>
      <div className="p-5 font-mono text-sm bg-[#050505]">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">root@api</span>
          <span className="text-zinc-600">:</span>
          <span className="text-cyan-400 font-bold">~</span>
          <span className="text-zinc-400">$</span>
          <span className="text-white ml-1">cd</span>
          <span className="text-cyan-300">/docs</span>
          <span className="w-2 h-4 bg-emerald-400 animate-pulse ml-1"></span>
        </div>
      </div>
    </div>
  );
}

  /* ... inside EndpointItem component ... */
  /* NO CHANGES NEEDED IN ENDPOINT ITEM LOGIC, ONLY STYLING UPDATES INCLUDED BELOW */
  /* We will update the EndpointItem return to use responsive classes */
  
interface EndpointItemProps {
  title: string;
  tags: string[];
  responseType: "json" | "image" | "audio" | "video";
  path: string;
  method: "GET" | "POST";
  parameters: Array<{
    name: string;
    required: boolean;
    description: string;
    type: string;
    defaultValue?: string;
    options?: string[];
  }>;
}

function EndpointItem({ title, tags, responseType = "image", path, method, parameters }: EndpointItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExecuted, setIsExecuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    parameters.forEach(p => {
      initial[p.name] = p.defaultValue || "";
    });
    return initial;
  });

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const selectOption = (name: string, value: string) => {
    setParamValues(prev => ({ ...prev, [name]: value }));
    setOpenDropdowns(prev => ({ ...prev, [name]: false }));
  };

  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [mediaUrl, setMediaUrl] = useState<string>("");

  const syntaxHighlight = (json: string) => {
    // VS Code Dark Theme Colors
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "text-[#b5cea8]"; // number (light green)
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = "text-[#9cdcfe]"; // key (light blue)
          } else {
            cls = "text-[#ce9178]"; // string (orange/brown)
          }
        } else if (/true|false/.test(match)) {
          cls = "text-[#569cd6]"; // boolean (blue)
        } else if (/null/.test(match)) {
          cls = "text-[#569cd6]"; // null (blue)
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  const getMediaFromResponse = (response: unknown): string => {
    if (!response || typeof response !== "object") return "";
    const res = response as Record<string, unknown>;
    
    // Smart URL detection - search recursively for media URLs
    const findUrl = (obj: unknown, depth = 0): string => {
      if (depth > 5 || !obj) return "";
      if (typeof obj === "string" && obj.startsWith("http")) {
        // Check if it's a media URL
        const mediaExts = [".mp4", ".mp3", ".wav", ".ogg", ".webm", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
        const isMediaUrl = mediaExts.some(ext => obj.toLowerCase().includes(ext)) || 
                          obj.includes("download") || obj.includes("media") || obj.includes("cdn");
        if (isMediaUrl) return obj;
      }
      if (typeof obj === "object") {
        // Priority fields for downloaders
        const priorityFields = [
          "url", "downloadUrl", "download_url", "mediaUrl", "media_url",
          "video", "videoUrl", "video_url", "hdUrl", "hd_url",
          "audio", "audioUrl", "audio_url", "musicUrl", "music_url",
          "image", "imageUrl", "image_url", "cover", "thumbnail",
          "mp4", "mp3", "link", "src", "source", "file", "fileUrl"
        ];
        const record = obj as Record<string, unknown>;
        for (const field of priorityFields) {
          if (record[field] && typeof record[field] === "string") {
            const url = record[field] as string;
            if (url.startsWith("http")) return url;
          }
        }
        // Recursive search
        for (const key of Object.keys(record)) {
          const found = findUrl(record[key], depth + 1);
          if (found) return found;
        }
      }
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const found = findUrl(item, depth + 1);
          if (found) return found;
        }
      }
      return "";
    };
    
    return findUrl(res.result) || findUrl(res);
  };

  const handleExecute = async () => {
    const hasRequiredEmpty = parameters.some(p => p.required && !paramValues[p.name]);
    if (hasRequiredEmpty) {
      setIsError(true);
      setErrorMessage("ERR_MISSING_ARGS");
      setIsExecuted(true);
      setApiResponse(null);
      return;
    }
    
    setIsError(false);
    setErrorMessage("");
    setIsExecuted(true);
    setIsLoading(true);
    setApiResponse(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(paramValues).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const apiUrl = `${path}?${queryParams.toString()}`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        setIsError(true);
        setErrorMessage(data.error || `HTTP_${response.status}`);
        setApiResponse(data);
        setMediaUrl("");
      } else {
        setApiResponse(data);
        setMediaUrl(getMediaFromResponse(data));
      }
    } catch (err) {
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : "ERR_CONNECTION_FAILED");
      setApiResponse(null);
      setMediaUrl("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setIsExecuted(false);
    setIsError(false);
    setErrorMessage("");
    setApiResponse(null);
    setMediaUrl("");
  };

  const buildCurlCommand = () => {
    const baseUrl = `${siteConfig.api.baseUrl}${path}`;
    const queryParams = Object.entries(paramValues)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
    return queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  };


  return (
    <div className="mb-4 rounded-lg border border-zinc-800 bg-[#0a0a0a] overflow-hidden font-mono relative group/card">
      {/* Corner Brackets - Cyberpunk Style */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-white/30 rounded-tl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-white/30 rounded-tr pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-white/30 rounded-bl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-white/30 rounded-br pointer-events-none"></div>
      {/* Header: Title + Tags Below */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors select-none"
      >
        <div className="flex items-center gap-3 mb-2">
          <ChevronRight className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${isOpen ? "rotate-90 text-cyan-500" : ""}`} />
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1.5 ${
            method === 'GET' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${method === 'GET' ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`}></span>
            {method}
          </span>
          <h3 className="text-sm font-bold text-zinc-200">{title}</h3>
        </div>
        
        {/* Tags Below Title */}
        <div className="flex flex-wrap gap-2 pl-7">
          {tags.map((tag) => (
            <span 
              key={tag} 
              className="px-2.5 py-0.5 rounded border border-zinc-800 bg-zinc-900/50 text-[10px] font-medium text-zinc-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-zinc-800/50">
              
              {/* Method Section - SS2 Style */}
              <div className="py-4 border-b border-zinc-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Method</span>
                </div>
                <div className="flex border-b border-zinc-800">
                  <button className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    method === 'GET' 
                      ? 'border-cyan-500 text-cyan-400' 
                      : 'border-transparent text-zinc-600 hover:text-zinc-400'
                  }`}>
                    GET
                  </button>
                  <button className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${
                    method === 'POST'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-zinc-600 hover:text-zinc-400'
                  }`}>
                    POST
                  </button>
                </div>
                
                {/* Response Codes */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Response Codes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] font-bold text-emerald-400">200</span>
                      <span className="text-[9px] text-emerald-400/70">Success</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-yellow-500/10 border border-yellow-500/20">
                      <span className="text-[10px] font-bold text-yellow-400">400</span>
                      <span className="text-[9px] text-yellow-400/70">Bad Request</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-orange-500/10 border border-orange-500/20">
                      <span className="text-[10px] font-bold text-orange-400">401</span>
                      <span className="text-[9px] text-orange-400/70">Unauthorized</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-red-500/10 border border-red-500/20">
                      <span className="text-[10px] font-bold text-red-400">404</span>
                      <span className="text-[9px] text-red-400/70">Not Found</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] font-bold text-rose-400">500</span>
                      <span className="text-[9px] text-rose-400/70">Server Error</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parameters Section - SS2 Style */}
              <div className="py-4">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Parameters</span>
                </div>
                
                <div className="rounded-lg border border-zinc-800 bg-[#050505] p-4">
                  {parameters.length === 0 ? (
                    <div className="text-zinc-600 text-xs">No parameters required.</div>
                  ) : (
                    <div className="space-y-5">
                      {parameters.map((param) => (
                        <div key={param.name}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-zinc-300">{param.name}</span>
                            {param.required && <span className="text-red-500 text-xs">*</span>}
                          </div>
                          {param.description && (
                            <p className="text-[10px] text-zinc-600 mb-2">{param.description}</p>
                          )}
                          
                          {param.type === "select" && param.options ? (
                            <div className="relative">
                              <button 
                                onClick={() => toggleDropdown(param.name)}
                                className="w-full flex items-center justify-between bg-[#0a0a0a] border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-400 hover:border-zinc-700 transition-colors"
                              >
                                {paramValues[param.name] || param.defaultValue || param.options[0]}
                                <ChevronDown className="w-3 h-3 text-zinc-600" />
                              </button>
                              {openDropdowns[param.name] && (
                                <div className="absolute z-10 w-full mt-1 bg-[#0a0a0a] border border-zinc-800 rounded shadow-xl overflow-hidden">
                                  {param.options.map(opt => (
                                    <div 
                                      key={opt}
                                      onClick={() => selectOption(param.name, opt)}
                                      className="px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-cyan-400 cursor-pointer"
                                    >
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <input 
                              type="text"
                              value={paramValues[param.name] || ""}
                              onChange={(e) => setParamValues(prev => ({ ...prev, [param.name]: e.target.value }))}
                              placeholder={param.defaultValue || "Enter value..."}
                              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-300 outline-none focus:border-cyan-600 transition-colors placeholder-zinc-700"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* cURL Command Terminal */}
              <div className="py-4 border-b border-zinc-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">cURL Command</span>
                </div>
                
                <div className="rounded-lg border border-zinc-800 bg-[#050505] overflow-hidden">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-3 py-2 bg-[#0a0a0a] border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#ff5f56]"></div>
                        <div className="w-2 h-2 rounded-full bg-[#ffbd2e]"></div>
                        <div className="w-2 h-2 rounded-full bg-[#27c93f]"></div>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-600 ml-2">Shell</span>
                    </div>
                    <button 
                      onClick={() => navigator.clipboard.writeText(`curl -X ${method} "${buildCurlCommand()}"`)}
                      className="text-[9px] font-mono text-zinc-600 hover:text-cyan-400 transition-colors"
                    >
                      copy
                    </button>
                  </div>
                  
                  {/* Command Content */}
                  <div className="p-4 font-mono text-xs overflow-x-auto">
                    <div className="flex items-start gap-2">
                      <span className="text-cyan-400 select-none">→</span>
                      <span className="text-zinc-500 select-none">~</span>
                      <div className="flex-1">
                        <span className="text-cyan-400">curl</span>
                        <span className="text-zinc-500"> -X </span>
                        <span className={method === 'GET' ? 'text-emerald-400' : 'text-indigo-400'}>{method}</span>
                        <span className="text-zinc-500"> "</span>
                        <span className="text-yellow-300 break-all">{buildCurlCommand()}</span>
                        <span className="text-zinc-500">"</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 py-4">
                <button
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="w-3 h-3 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin"></span>
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  Execute
                </button>
              </div>

              {/* Results */}
              <AnimatePresence>
                {isExecuted && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="mt-4 rounded-lg border border-zinc-800 bg-[#050505] overflow-hidden">
                      {/* Terminal Header */}
                      <div className="px-3 py-2 bg-[#0a0a0a] border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
                          </div>
                          <span className="text-[10px] text-zinc-500 ml-2">response</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold ${isError ? "text-red-500" : "text-emerald-500"}`}>
                            {isError ? "ERROR" : "200 OK"}
                          </span>
                          <button onClick={handleClear} className="text-[10px] text-zinc-600 hover:text-zinc-400">
                            clear
                          </button>
                        </div>
                      </div>

                      {/* Result Body */}
                      <div className="p-4 max-h-[400px] overflow-y-auto text-xs">
                        {isLoading ? (
                          <div className="space-y-1 text-zinc-500">
                            <div><span className="text-cyan-500">$</span> connecting...</div>
                            <div className="animate-pulse"><span className="text-cyan-500">$</span> awaiting response...</div>
                          </div>
                        ) : (
                          <>
                            {responseType === "json" || isError || !mediaUrl ? (
                              <>
                                {isError && (
                                  <div className="mb-4 p-3 rounded border border-red-500/30 bg-red-500/5">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-red-500 font-bold">⚠ FATAL</span>
                                      <span className="text-red-400 text-[10px] font-mono">{errorMessage}</span>
                                    </div>
                                    <div className="text-red-400/60 text-[10px] font-mono">
                                      $ process terminated with error
                                    </div>
                                  </div>
                                )}
                                <pre className="text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                                  <code dangerouslySetInnerHTML={{ 
                                    __html: apiResponse 
                                      ? syntaxHighlight(JSON.stringify(apiResponse, null, 2)) 
                                      : '<span class="text-zinc-600">null</span>' 
                                  }} />
                                </pre>
                              </>
                            ) : (
                              <div className="space-y-3">
                                <div className="text-emerald-500 mb-2">$ media received</div>
                                <div className="rounded border border-zinc-800 bg-black p-2 inline-block">
                                  {responseType === "image" && <img src={mediaUrl} className="max-h-[300px] rounded" alt="Result" />}
                                  {responseType === "audio" && <audio controls src={mediaUrl} className="w-[300px]" />}
                                  {responseType === "video" && <video controls src={mediaUrl} className="max-h-[300px] rounded" />}
                                </div>
                                <div className="text-[10px] text-zinc-600">
                                  <span className="text-zinc-500">src:</span> {mediaUrl}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Overview Content (Documentation)
function DocumentationView() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <TerminalWindow />
      
      {/* Example Request Card */}
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0f0f0f]">
           <div>
             <h2 className="text-sm font-bold text-white mb-0.5">Example Request</h2>
             <p className="text-[10px] text-zinc-500 font-mono">/text.gen/brave-chat</p>
           </div>
           <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-900/20 text-cyan-400 border border-cyan-800/30">POST</span>
        </div>

        <div className="p-0">
          <div className="flex items-center gap-6 px-6 border-b border-zinc-800 bg-[#0a0a0a]">
            <button className="relative py-3 text-xs font-bold text-white">
              cURL Verification
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-500"></div>
            </button>
            <button className="py-3 text-xs font-medium text-zinc-600 hover:text-zinc-400 transition-colors">Parameters</button>
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
               <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
            </div>
          </div>

          <div className="p-6 bg-[#050505]">
            <div className="font-mono text-[11px] leading-6">
              <div className="flex gap-2 text-zinc-500 select-none mb-2 border-b border-zinc-800 pb-2">
                <span>$</span>
                <span>bash execution_test.sh</span>
              </div>
              <pre className="overflow-x-auto">
                <code>
                  <span className="text-cyan-400">curl</span> <span className="text-zinc-500">-X</span> <span className="text-white">POST</span> <span className="text-zinc-500">"</span><span className="text-green-400">{siteConfig.api.baseUrl}/text.gen/brave-chat</span><span className="text-zinc-500">" \</span>
                  {"\n"}
                  <span className="text-zinc-500">  -H "</span><span className="text-yellow-200">Content-Type: application/json</span><span className="text-zinc-500">" \</span>
                  {"\n"}
                  <span className="text-zinc-500">  -d '</span><span className="text-white">{"{"}</span>
                  {"\n"}
                  <span className="text-purple-400">     "text"</span><span className="text-zinc-500">: </span><span className="text-green-300">"Hi! How are you?"</span>
                  {"\n"}
                  <span className="text-white">    {"}"}</span><span className="text-zinc-500">'</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Response Format Card */}
      <div className="rounded-xl border border-zinc-800 bg-[#0a0a0a] overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-[#0f0f0f]">
           <h2 className="text-sm font-bold text-white mb-0.5">Response Format</h2>
           <p className="text-[10px] text-zinc-500 font-mono">Standard JSON Structure</p>
        </div>
        <div className="bg-[#050505] p-6 font-mono text-[11px]">
          <pre className="leading-relaxed">
            <code>
              <span className="text-zinc-500">{"{"}</span>
              {"\n"}
              <span className="text-purple-400">  "success"</span><span className="text-zinc-500">: </span><span className="text-cyan-400">true</span><span className="text-zinc-500">,</span>
              {"\n"}
              <span className="text-purple-400">  "result"</span><span className="text-zinc-500">: </span><span className="text-zinc-500">{"{"} ... {"}"}</span><span className="text-zinc-500">,</span>
              {"\n"}
              <span className="text-purple-400">  "timestamp"</span><span className="text-zinc-500">: </span><span className="text-green-300">"2026-01-01T16:39:23.146Z"</span>
              {"\n"}
              <span className="text-zinc-500">{"}"}</span>
            </code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryListView({ categorySlug }: { categorySlug: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const plugins = getPluginsByCategory(categorySlug);

  if (plugins.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="rounded-xl border border-[#262626] bg-[#0f0f0f] p-8 text-center">
          <p className="text-zinc-500 font-mono text-sm">No endpoints in this category</p>
        </div>
      </motion.div>
    );
  }

  const filteredPlugins = plugins.filter((plugin: Plugin) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    const titleMatch = plugin.endpoint.title.toLowerCase().includes(query);
    const tagMatch = plugin.endpoint.tags.some((tag: string) => tag.toLowerCase().includes(query));
    const pathMatch = plugin.endpoint.path.toLowerCase().includes(query);
    return titleMatch || tagMatch || pathMatch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <SearchTerminal value={searchQuery} onChange={setSearchQuery} category={categorySlug} />
      <div className="rounded-xl border border-[#262626] bg-[#0f0f0f] overflow-hidden">
        {filteredPlugins.length > 0 ? (
          filteredPlugins.map((plugin: Plugin, index: number) => (
            <EndpointItem 
              key={index} 
              title={plugin.endpoint.title} 
              tags={plugin.endpoint.tags} 
              responseType={plugin.endpoint.responseType}
              path={plugin.endpoint.path}
              method={plugin.endpoint.method}
              parameters={plugin.endpoint.parameters}
            />
          ))
        ) : (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-lg border border-zinc-800 bg-[#080808]">
              <Search className="w-5 h-5 text-zinc-600" />
              <div className="text-left">
                <p className="text-zinc-400 font-mono text-sm">No results for <span className="text-cyan-400">"{searchQuery}"</span></p>
                <p className="text-zinc-600 font-mono text-xs mt-1">Try a different search term</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Page Component
export default function DocsPage() {
  const [activeCategory, setActiveCategory] = useState("Documentation");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-foreground font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border-b border-[#1f1f1f] sticky top-0 z-40">
        <h1 className="text-white font-bold text-base tracking-wide">{siteConfig.brand.tagline}</h1>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-zinc-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 border-r border-[#1f1f1f] z-30">
        <SidebarContent activeCategory={activeCategory} onSelectCategory={setActiveCategory} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-[#0a0a0a] z-[51] lg:hidden border-r border-[#1f1f1f]"
            >
              <div className="absolute top-4 right-4">
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <SidebarContent 
                activeCategory={activeCategory} 
                onSelectCategory={(cat) => {
                  setActiveCategory(cat);
                  setIsMobileMenuOpen(false);
                }} 
                mobile 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <main className="lg:pl-64 w-full transition-all duration-300">
        <div className="relative min-h-screen flex items-start justify-center">
          <div className="absolute inset-0 z-0 bg-bento-grid opacity-[0.05] pointer-events-none"></div>

          <div className="relative z-10 w-full max-w-2xl px-8 py-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {activeCategory === "Documentation" ? (
                  <DocumentationView />
                ) : (
                  <CategoryListView categorySlug={activeCategory} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
