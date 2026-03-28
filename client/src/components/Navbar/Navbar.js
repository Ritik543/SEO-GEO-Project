'use client';

export default function Navbar({ disabled = false }) {
  if (disabled) {
    return (
      <header className="fixed top-0 w-full z-50 bg-[#0b1326] flex justify-between items-center px-6 h-16 w-full">
        <div className="text-lg font-bold tracking-tighter text-[#c0c1ff] font-headline">CognitiveLayer</div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-8 font-['Inter'] tracking-tight text-sm font-medium">
            <span className="text-slate-400 cursor-not-allowed">Dashboard</span>
            <span className="text-[#c0c1ff] border-b-2 border-[#c0c1ff] pb-1">GEO Audit</span>
            <span className="text-slate-400 cursor-not-allowed">History</span>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-surface-container-highest px-4 py-2 rounded-lg text-xs font-label uppercase tracking-widest text-on-surface-variant hover:bg-surface-bright transition-all"
          >
            Cancel Audit
          </button>
        </div>
      </header>
    );
  }

  return (
    <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 w-full bg-[#0b1326] dark:bg-[#0b1326]">
      <div className="flex items-center gap-8">
        <span className="text-lg font-bold tracking-tighter text-[#c0c1ff]">CognitiveLayer</span>
        <div className="hidden md:flex items-center gap-6">
          <a className="font-['Inter'] tracking-tight text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="#">Dashboard</a>
          <a className="font-['Inter'] tracking-tight text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="#">GEO Audit</a>
          <a className="font-['Inter'] tracking-tight text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="#">History</a>
          <a className="font-['Inter'] tracking-tight text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors" href="#">Documentation</a>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 bg-primary-container text-on-primary-container text-sm font-medium rounded-lg hover:bg-surface-bright transition-all duration-200 active:scale-95">
          Sign In
        </button>
      </div>
    </nav>
  );
}
