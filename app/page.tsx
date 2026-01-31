"use client";

import { Zap, Lock, Code, FileText, Globe, CheckCircle2, ArrowRight, Server, Activity, Box, Download, Cpu, User } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { motion } from "framer-motion";

function HeroSection() {
  return (
    <section className="relative flex items-center pt-32 px-6 overflow-hidden pb-32">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/05 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/05 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded bg-[#111] border border-[#222]">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"></span>
            <span className="text-zinc-400 text-xs font-mono">system_status: <span className="text-cyan-400">online</span></span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[1] mb-6 text-left font-sans">
            API Infrastructure <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">for Developers</span>
          </h1>
          
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mb-10 leading-relaxed text-left font-mono">
            $ access --all <br/>
            <span className="text-zinc-500">
            &gt; Instantly access 24+ premium endpoints.<br/>
            &gt; No API keys required. Open source spirit.
            </span>
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/docs"
              className="relative group inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-all overflow-hidden rounded"
            >
              <span className="relative z-10 font-mono">./start_building</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" />
            </Link>
            <Link 
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-[#333] text-white text-sm font-medium hover:bg-[#111] transition-all font-mono rounded hover:border-zinc-500"
            >
              man docs
            </Link>
          </div>
        </motion.div>

        {/* Right Side Terminal Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative lg:block hidden"
        >
          <div className="relative rounded-lg bg-[#080808] border border-[#222] shadow-2xl overflow-hidden font-mono text-xs">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0c0c0c] border-b border-[#222]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
              </div>
              <div className="text-zinc-500 opacity-50">sh — 80x24</div>
              <div className="w-12"></div>
            </div>

            {/* Terminal Content */}
            <div className="p-6 space-y-4 h-[400px] overflow-hidden relative selection:bg-cyan-500/30">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080808]/90 z-10 pointer-events-none"></div>
              
              <div className="flex gap-2">
                <span className="text-cyan-500">➜</span>
                <span className="text-indigo-400 font-bold">~</span>
                <span className="text-zinc-300">curl -X POST {siteConfig.api.baseUrl}/v2/chat</span>
              </div>
              <div className="text-zinc-500 pl-4 border-l border-[#222] ml-1">{`{ "model": "gpt-4o", "content": "Hello!" }`}</div>
              
              <div className="flex gap-2 text-cyan-400 pl-4">
                <span>✓</span>
                <span>200 OK</span>
                <span className="text-zinc-600 text-[10px] pt-0.5">45ms</span>
              </div>
               <div className="text-zinc-300 pl-4 bg-[#111]/50 p-3 rounded border border-[#222]/50 ml-4">
                {`{
  "success": true,
  "result": "Hello! How can I help you today?",
  "usage": { "tokens": 42 }
}`}
              </div>

              <div className="flex gap-2 pt-2">
                <span className="text-cyan-500">➜</span>
                <span className="text-indigo-400 font-bold">~</span>
                <span className="text-zinc-300">npm install @{siteConfig.name.toLowerCase()}/api</span>
              </div>
               <div className="text-zinc-400 pl-4">
                added 1 package in 2s
              </div>

              <div className="flex gap-2 pt-2">
                <span className="text-cyan-500">➜</span>
                <span className="text-indigo-400 font-bold">~</span>
                <span className="text-zinc-300 typing-effect">_</span>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 top-10 right-10 w-full h-full bg-cyan-500/5 rounded-3xl blur-3xl"></div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-10 border-y border-[#1f1f1f] bg-[#0a0a0a]/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">10+</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">AI Models</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">11</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Downloaders</span>
          </div>
           <div className="flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">3</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Stalkers</span>
          </div>
           <div className="flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-white mb-1">∞</span>
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Possibilities</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryShowcase() {
   const categories = [
    {
      title: "AI_Endpts",
      desc: "Access state-of-the-art LLMs including GPT-4o, Gemini, and Claude.",
      icon: <Cpu className="w-5 h-5" />,
      tag: "sys::ai_module",
      status: "ONLINE"
    },
    {
      title: "Media_DL",
      desc: "High-speed media extraction. TikTok, Instagram, Spotify supported.",
      icon: <Download className="w-5 h-5" />,
      tag: "sys::dl_module",
      status: "ACTIVE"
    },
    {
      title: "Stalk_Data",
      desc: "Retrieve public profile analytics. OSINT capabilities enabled.",
      icon: <User className="w-5 h-5" />,
      tag: "sys::osint_mod",
      status: "READY"
    }
  ];

  return (
    <section className="py-24 px-6 relative z-10 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 border-b border-zinc-800 pb-4">
           <h2 className="text-2xl font-bold text-white mb-2">
            <span className="text-cyan-500 mr-2">root@api:~/modules#</span>
            ls -la
          </h2>
          <p className="text-zinc-500 text-sm">
            Total 3 directories, 24 files
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <div key={i} className="group relative bg-black border border-zinc-800 hover:border-cyan-500/50 transition-colors p-6">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-zinc-600 group-hover:border-cyan-500 transition-colors"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-zinc-600 group-hover:border-cyan-500 transition-colors"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-zinc-600 group-hover:border-cyan-500 transition-colors"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-zinc-600 group-hover:border-cyan-500 transition-colors"></div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-cyan-500 group-hover:text-cyan-400">
                  {cat.icon}
                </div>
                <span className="text-[10px] text-zinc-500 border border-zinc-800 px-1 py-0.5 rounded group-hover:border-cyan-500/30 group-hover:text-cyan-500 transition-colors">
                  [{cat.status}]
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                ./{cat.title}
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6 border-l-2 border-zinc-800 pl-3 group-hover:border-cyan-900 transition-colors">
                {cat.desc}
              </p>
              
              <div className="text-[10px] text-zinc-600">
                <span className="text-zinc-500">type:</span> {cat.tag}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-[#1f1f1f] bg-[#050505] relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
           <h4 className="text-white font-bold text-lg mb-1">{siteConfig.name}</h4>
           <p className="text-zinc-500 text-sm">Premium REST API Collection</p>
        </div>
        <div className="flex gap-6 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
        </div>
        <div className="text-zinc-600 text-xs">
          © 2026 {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-foreground font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <HeroSection />
      <StatsSection />
      <CategoryShowcase />
      <Footer />
    </div>
  );
}
