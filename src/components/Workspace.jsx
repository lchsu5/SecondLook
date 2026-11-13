import React, { useState, useRef, useEffect } from 'react';
import { OvershootScreenClient, MathTutorHelpers } from '../lib/overshoot';
import InterventionCard from './InterventionCard';
import SummaryView from './SummaryView';
import { Play, Square, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

function Workspace({ onExitToHome }) {
  const [sessionActive, setSessionActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [hasLiveVideo, setHasLiveVideo] = useState(false);
  const [interventions, setInterventions] = useState([]);
  const [currentIntervention, setCurrentIntervention] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionEnded, setQuestionEnded] = useState(false);

  const videoRef = useRef(null);
  const clientRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const manualCheckRequestedRef = useRef(false);
  const feedbackLoggedRef = useRef(false);

  const stopScreenShare = async (showSummary) => {
    if (clientRef.current) {
      await clientRef.current.stop();
      clientRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setHasLiveVideo(false);
    setSessionActive(false);
    setShowSummary(showSummary);
    setCurrentIntervention(null);
    setElapsedSeconds(0);
    setIsAnalyzing(false);
    setQuestionEnded(false);
    manualCheckRequestedRef.current = false;
    feedbackLoggedRef.current = false;
  };

  const explanationsSimilar = (a, b) => {
    if (!a || !b) return false;
    const s1 = a.toLowerCase();
    const s2 = b.toLowerCase();
    if (s1 === s2) return true;
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return true;
    let same = 0;
    const minLen = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLen; i += 1) {
      if (s1[i] === s2[i]) same += 1;
    }
    const score = same / maxLen;
    return score >= 0.9;
  };

  const parseOvershootResult = (text, { allowNoError = false } = {}) => {
    const lines = String(text || '').split('\n');
    const data = {};
    let currentKey = null;

    for (const line of lines) {
      if (line.trim() === '<END>') break;
      if (line.includes(':') && /^[A-Z_]+:/.test(line)) {
        const [key, ...rest] = line.split(':');
        currentKey = key.trim();
        data[currentKey] = rest.join(':').trim();
      } else if (currentKey) {
        data[currentKey] += '\n' + line.trim();
      }
    }

    for (const key of Object.keys(data)) {
      data[key] = String(data[key]).replace(/\n?<END>\s*$/g, '').replace(/<END>/g, '').trim();
    }

    const errorFound = String(data.ERROR_FOUND || '').toLowerCase() === 'true';
    if (!errorFound && !allowNoError) return null;

    let boundingBox = null;
    if (data.BBOX && data.BBOX !== 'none') {
      try {
        boundingBox = JSON.parse(data.BBOX);
      } catch {
      }
    }

    return {
      errorFound,
      issueTitle: data.ISSUE_TITLE || (errorFound ? 'Misconception detected' : 'No issues detected'),
      explanation: data.EXPLANATION || '',
      hint: data.HINT || '',
      category: data.CATEGORY || (errorFound ? 'Uncategorized' : 'Correct'),
      boundingBox,
      incorrectSnippet: data.TRANSCRIPTION || ''
    };
  };

  const startDetector = async (client) => {
    return await MathTutorHelpers.createErrorDetector(client, {
      onResultText: (text) => {
        const isManual = manualCheckRequestedRef.current;
        if (!isManual) return;
        if (feedbackLoggedRef.current) return;

        const result = parseOvershootResult(text, { allowNoError: true });
        if (result) {
          setInterventions(prev => {
            const last = prev[0];
            if (last && explanationsSimilar(last.explanation, result.explanation)) {
              return prev;
            }

            const newIntervention = {
              id: crypto.randomUUID(),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              errorFound: result.errorFound,
              source: isManual ? 'manual_check' : 'stream',
              ...result
            };

            setCurrentIntervention(newIntervention);
            if (result.errorFound) {
              setErrorFlash(true);
              setTimeout(() => setErrorFlash(false), 400);
            }

            return [newIntervention, ...prev];
          });
        }

        feedbackLoggedRef.current = true;
        manualCheckRequestedRef.current = false;
        setIsAnalyzing(false);
      },
      onError: (err) => {
        console.error('Overshoot Error:', err);
        manualCheckRequestedRef.current = false;
        feedbackLoggedRef.current = false;
        setIsAnalyzing(false);
      }
    });
  };

  const handleStartSession = async () => {
    try {
      setQuestionEnded(false);
      feedbackLoggedRef.current = false;
      const client = new OvershootScreenClient({
        apiKey: import.meta.env.VITE_OVERSHOOT_API_KEY,
        ocrFocusEnabled: true
      });
      clientRef.current = client;

      const mediaStream = await startDetector(client);

      setStream(mediaStream);
      setHasLiveVideo(false);
      setSessionActive(true);
      setShowSummary(false);
      setInterventions([]);
      setCurrentIntervention(null);
    } catch (err) {
      console.error("Failed to start stream:", err);
      alert("Could not access screen share. Please try again.");
    }
  };

  const handleEndQuestion = async () => {
    if (!sessionActive || !stream || !clientRef.current) return;
    if (questionEnded) return;
    manualCheckRequestedRef.current = true;
    feedbackLoggedRef.current = false;
    setIsAnalyzing(true);
    setQuestionEnded(true);

    try {
      await clientRef.current.stop(true);
      await startDetector(clientRef.current);
    } catch (err) {
      manualCheckRequestedRef.current = false;
      feedbackLoggedRef.current = false;
      setIsAnalyzing(false);
      setQuestionEnded(false);
      console.error('Manual check failed:', err);
    }
  };

  const handleNextQuestion = () => {
    if (!sessionActive || !stream || !clientRef.current) return;
    setQuestionEnded(false);
    feedbackLoggedRef.current = false;
    setCurrentIntervention(null);
  };

  const handleEndSession = () => {
    stopScreenShare(true);
  };

  const handleExitToHome = () => {
    stopScreenShare(false);
    if (onExitToHome) {
      onExitToHome();
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!stream) {
      video.srcObject = null;
      setHasLiveVideo(false);
      setVideoReady(false);
      return;
    }

    video.srcObject = stream;

    const handleLoadedMetadata = () => {
      const track = stream.getVideoTracks()[0];
      const muted = track ? track.muted : false;
      const canPlay = video.readyState >= 2;
      const liveTrack = stream.getVideoTracks().some(t => t.readyState === 'live');
      if (canPlay) {
        video.play().catch(() => {});
      }
      setVideoReady(canPlay && !muted);
      setHasLiveVideo(canPlay && liveTrack && !muted);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (video.readyState >= 2) {
      handleLoadedMetadata();
    }

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [stream]);

  useEffect(() => {
    let interval = null;
    if (sessionActive) {
      interval = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionActive]);

  const formatTime = totalSeconds => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-white overflow-hidden font-sans">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-25 mix-blend-soft-light" />
      </div>

      {/* 1. Header (Fixed) */}
      <header className="flex-none h-16 border-b border-white/10 bg-slate-900/50 backdrop-blur-md z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl font-semibold italic tracking-tight text-white" style={{ fontFamily: '"Instrument Serif", serif' }}>
            SecondLook
          </div>
          {sessionActive && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
              <div className={`w-2 h-2 rounded-full ${hasLiveVideo ? 'bg-green-500' : 'bg-red-500'}`} />
              {formatTime(elapsedSeconds)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!sessionActive && (
            <button
              onClick={handleExitToHome}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
            >
              Back Home
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Body (Flex) */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {!sessionActive ? (
          // Landing View
          <div className="flex-1 flex items-center justify-center p-6">
             <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-5xl md:text-7xl italic mb-6" style={{ fontFamily: '"Instrument Serif", serif' }}>
                  Ready for your session?
                </h2>
                <div className="mt-2 space-y-3 text-base text-gray-300 font-inter">
                  <p>Choose "This tab" or "This window" when you start screen sharing.</p>
                  <p className="text-gray-400 text-sm">Keep this tab open while you write on the whiteboard.</p>
                </div>
                <button
                  onClick={handleStartSession}
                  className="mt-8 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center gap-2 mx-auto shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  <Play fill="currentColor" /> Start Session
                </button>
              </div>
          </div>
        ) : (
          // Active Split Layout
          <>
            {/* Main Content Area (Video) */}
            <main className="flex-1 relative flex flex-col bg-black/40">
               <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
                  <motion.div
                    className="relative w-full h-full flex items-center justify-center"
                    animate={errorFlash ? { x: [-4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border border-white/10 bg-black"
                    />

                    {(!videoReady || !hasLiveVideo) && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 text-sm text-gray-200">
                          Waiting for stream...
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
                      <button
                        onClick={handleEndQuestion}
                        disabled={questionEnded || isAnalyzing || !hasLiveVideo}
                        className={`px-6 py-2 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 transition-all ${
                          questionEnded || isAnalyzing || !hasLiveVideo
                            ? "bg-blue-500/40 text-white/60 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                      >
                        {isAnalyzing ? "Analyzing..." : questionEnded ? "Question Ended" : "End Question"}
                      </button>
                      {questionEnded && (
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="px-6 py-2 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 bg-emerald-600/90 hover:bg-emerald-500 text-white"
                        >
                          Next Question
                        </button>
                      )}
                      <button
                        onClick={handleEndSession}
                        className="px-6 py-2 rounded-full font-semibold text-sm shadow-lg flex items-center gap-2 bg-red-600/90 hover:bg-red-500 text-white"
                      >
                        <Square size={16} fill="currentColor" />
                        End Session
                      </button>
                    </div>

                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-white flex items-center gap-2 z-30">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          !hasLiveVideo
                            ? "bg-red-500"
                            : isAnalyzing
                            ? "bg-yellow-400 animate-pulse"
                            : "bg-green-500"
                        }`}
                      />
                      {!hasLiveVideo
                        ? "Waiting for stream..."
                        : isAnalyzing
                        ? "Analyzing..."
                        : "Ready for Question"}
                    </div>
                  </motion.div>

                  <InterventionCard
                    intervention={currentIntervention}
                    onClose={() => setCurrentIntervention(null)}
                  />
               </div>
            </main>

            {/* Sidebar (Session History) */}
            <aside className="w-80 md:w-96 flex-none border-l border-white/10 bg-slate-900/80 backdrop-blur-sm flex flex-col">
              <div className="flex-none p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                <h3 className="font-medium text-sm text-gray-200 uppercase tracking-wider">Session History</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {interventions.length === 0 ? (
                  <div className="text-center mt-20 opacity-50">
                    <p className="text-gray-400 text-sm">No interventions yet.</p>
                    <p className="text-gray-600 text-xs mt-1">Mistakes will appear here.</p>
                  </div>
                ) : (
                  interventions.map((item) => (
                    <div
                      key={item.id}
                      className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                        currentIntervention?.id === item.id
                          ? (item.errorFound === false || item.category === 'Correct'
                              ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                              : 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]')
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                      onClick={() => setCurrentIntervention(item)}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs text-gray-400 font-mono">{item.timestamp}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                           item.errorFound === false || item.category === 'Correct' ? 'text-emerald-300 bg-emerald-500/20' :
                           item.category === 'Conceptual' ? 'text-purple-300 bg-purple-500/20' :
                           item.category === 'Arithmetic' ? 'text-blue-300 bg-blue-500/20' :
                           'text-amber-300 bg-amber-500/20'
                        }`}>
                          {item.category || "Issue"}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-gray-200 mb-1 leading-tight flex items-center gap-2">
                        {item.issueTitle}
                        {currentIntervention?.id === item.id && (
                          <div
                            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                              item.errorFound === false || item.category === 'Correct'
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        )}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-inter">
                        {item.explanation}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </>
        )}
      </div>

      {showSummary && (
        <SummaryView
          interventions={interventions}
          onRestart={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}

export default Workspace;
