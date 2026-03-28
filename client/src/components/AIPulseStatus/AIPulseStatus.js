'use client';

import { useEffect, useRef } from 'react';

const stagesConfig = [
  { id: 'crawling', icon: 'check_circle', title: 'Crawling page', loadingTitle: 'Crawling page', fallbackSub: 'Initiating DOM parsing...' },
  { id: 'extracting', icon: 'check_circle', title: 'Extracting content', loadingTitle: 'Extracting content', fallbackSub: 'Gathering tokens...' },
  { id: 'analyzing', icon: 'sync', title: 'Analyzing SEO', loadingTitle: 'Analyzing SEO', fallbackSub: 'Using generative models...' },
  { id: 'scoring', icon: 'sync', title: 'Generating report', loadingTitle: 'Synthesizing report', fallbackSub: 'Saving results...' }
];

export default function AIPulseStatus({ messages }) {
  const logRef = useRef(null);

  // Derive current stage from the latest message
  // Stages flow: crawling -> extracting -> analyzing -> scoring -> completed/failed
  const latestMessage = messages[messages.length - 1];
  const currentStage = latestMessage?.stage || 'crawling';
  const progress = latestMessage?.progress || 0;

  const getStageStatus = (stageId) => {
    const stageIndex = stagesConfig.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return 'pending';

    const currentIndex = stagesConfig.findIndex(s => s.id === currentStage);
    if (latestMessage?.stage === 'completed') return 'completed';
    if (latestMessage?.stage === 'failed') return 'failed';

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getSubtext = (stageId) => {
    if (currentStage === stageId) return latestMessage?.message || stagesConfig.find(s=>s.id === stageId).fallbackSub;
    if (getStageStatus(stageId) === 'completed') return 'Task completed successfully.';
    return stagesConfig.find(s=>s.id === stageId).fallbackSub;
  };

  return (
    <main className="flex-grow flex items-center justify-center relative overflow-hidden pt-16 w-full min-h-[calc(100vh-64px)]">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-2xl w-full px-6 relative z-10 flex flex-col h-full py-12">
        {/* Header Area */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-display-lg">Lumen Audit v1.2</h1>
          <p className="text-on-surface-variant font-label uppercase tracking-widest text-xs">
            {currentStage === 'failed' ? 'Audit Failed' : 'Analyzing content relevance and GEO entities...'}
          </p>
        </div>

        {/* Focus Container (Glassmorphism Card) */}
        <div className="glass-card rounded-xl p-6 md:p-8 border border-outline-variant/15 ai-pulse-border mb-auto">
          <div className="space-y-8">

            {stagesConfig.map((stage, idx) => {
              const status = getStageStatus(stage.id);
              const isLast = idx === stagesConfig.length - 1;
              const subtext = getSubtext(stage.id);

              return (
                <div key={stage.id} className={`flex items-start gap-4 md:gap-6 group ${status === 'pending' ? 'opacity-50' : ''}`}>
                  <div className="relative flex flex-col items-center">
                    {/* Circle Icon */}
                    {status === 'completed' && (
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/40">
                        <span className="material-symbols-outlined text-secondary font-variation-fill">check_circle</span>
                      </div>
                    )}
                    {status === 'active' && (
                      <div className={`w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border-2 border-primary animate-pulse`}>
                        <span className="material-symbols-outlined text-primary font-variation-fill">sync</span>
                      </div>
                    )}
                    {(status === 'pending' || status === 'failed') && (
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center border border-outline-variant/30">
                        {status === 'failed' && currentStage === stage.id ? (
                           <span className="material-symbols-outlined text-error">error</span>
                        ) : (
                           <span className="material-symbols-outlined text-outline-variant">description</span>
                        )}
                      </div>
                    )}

                    {/* Connecting Line */}
                    {!isLast && (
                      <div className={`w-0.5 h-10 mt-2 ${status === 'completed' ? 'bg-secondary/30' : 'bg-surface-container-highest'}`}></div>
                    )}
                  </div>

                  <div className="pt-1 flex-grow">
                    {status === 'active' ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-headline font-bold text-lg text-primary">{stage.loadingTitle}</h3>
                          <span className="font-label text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">{progress}%</span>
                        </div>
                        <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                          <div className="bg-primary h-full shadow-[0_0_10px_rgba(192,193,255,0.5)] transition-all duration-500" style={{ width: `${progress}%`}}></div>
                        </div>
                        <p className="text-on-surface-variant text-sm mt-3 italic">{subtext}</p>
                      </>
                    ) : (
                      <>
                        <h3 className={`font-headline font-bold text-lg ${status === 'completed' ? 'text-on-surface group-hover:text-primary transition-colors' : status === 'failed' && currentStage === stage.id ? 'text-error' : 'text-on-surface-variant'}`}>
                          {stage.title}
                        </h3>
                        <p className={`text-sm mt-1 ${status === 'failed' && currentStage === stage.id ? 'text-error/80' : 'text-on-surface-variant'}`}>{subtext}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Visual Footer Texture Inside Main */}
        <div className="mt-12 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent self-center"></div>
        <div className="mt-4 text-center text-[10px] font-label text-outline-variant tracking-widest uppercase mb-12">
           Cognitive Layer Engine v4.2.0-Alpha • Worker Node Active
        </div>

      </div>
    </main>
  );
}
