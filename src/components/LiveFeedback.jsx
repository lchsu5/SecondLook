import React from 'react';
import { History, ChevronRight } from 'lucide-react';

export default function LiveFeedback({
  interventions,
  optimisticReview,
  onSelectIntervention,
  currentIntervention,
  ocrDebugEnabled,
  onToggleOcrDebug,
  latestOcr,
  ocrMessageCount,
  sessionOcrFocusEnabled,
  wsState,
  wsMessageCount,
  wsLastMessage,
  iceTelemetry,
  sessionForceTurnEnabled
}) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={18} />
            Session History
          </h2>
          <button
            type="button"
            onClick={onToggleOcrDebug}
            className={
              ocrDebugEnabled
                ? "text-xs px-2 py-1 rounded bg-gray-900 text-white"
                : "text-xs px-2 py-1 rounded bg-white text-gray-700 border border-gray-200"
            }
          >
            OCR Debug
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ocrDebugEnabled && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 text-xs font-bold text-gray-700 flex items-center justify-between">
              <span>OCR Debug</span>
              <span className="text-gray-400 font-normal">
                {latestOcr?.timestamp || ""}
              </span>
            </div>
            <div className="p-3 space-y-2">
              <div className="text-[11px] text-gray-500">
                Tip: If transcription stays empty, zoom in or enable OCR Focus.
              </div>
              <div className="text-[11px] text-gray-500 flex items-center justify-between">
                <span>Messages: {ocrMessageCount || 0}</span>
                <span>OCR Focus: {sessionOcrFocusEnabled ? "on" : "off"}</span>
              </div>
              <div className="text-[11px] text-gray-500">
                WebSocket: {wsState?.state || 'unknown'}
                {typeof wsState?.code === 'number' ? ` • ${wsState.code}` : ''}
                {wsState?.reason ? ` • ${wsState.reason}` : ''}
              </div>
              <div className="text-[11px] text-gray-500">
                ICE: {iceTelemetry?.iceConnectionState || 'unknown'}
                {iceTelemetry?.iceGatheringState ? ` • gather:${iceTelemetry.iceGatheringState}` : ''}
                {iceTelemetry?.connectionState ? ` • pc:${iceTelemetry.connectionState}` : ''}
                {` • relay:${sessionForceTurnEnabled ? 'on' : 'off'}`}
              </div>
              {iceTelemetry?.iceCandidateError && (
                <div className="text-[11px] text-red-600 whitespace-pre-wrap break-words">
                  ICE error {iceTelemetry.iceCandidateError.errorCode}: {iceTelemetry.iceCandidateError.errorText}
                  {iceTelemetry.iceCandidateError.url ? ` • ${iceTelemetry.iceCandidateError.url}` : ''}
                </div>
              )}
              <div className="text-[11px] text-gray-500">WS messages: {wsMessageCount || 0}</div>
              {wsLastMessage && (
                <pre className="text-[11px] text-gray-700 whitespace-pre-wrap break-words bg-white border border-gray-100 rounded p-2 max-h-32 overflow-auto">
                  {wsLastMessage}
                </pre>
              )}
              <div className="text-[11px] text-gray-500">
                Status: {typeof latestOcr?.ok === 'boolean' ? (latestOcr.ok ? 'ok' : 'error') : 'unknown'}
                {latestOcr?.backend ? ` • ${latestOcr.backend}` : ''}
                {latestOcr?.model ? ` • ${latestOcr.model}` : ''}
              </div>
              {latestOcr?.error && (
                <div className="text-[11px] text-red-600 whitespace-pre-wrap break-words">
                  {latestOcr.error}
                </div>
              )}
              <div className="text-[11px] text-gray-500">Transcription</div>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words bg-white border border-gray-100 rounded p-2 max-h-40 overflow-auto">
                {latestOcr?.transcription || "(no transcription yet)"}
              </pre>
              <div className="text-[11px] text-gray-500">Raw Model Output</div>
              <pre className="text-[11px] text-gray-700 whitespace-pre-wrap break-words bg-white border border-gray-100 rounded p-2 max-h-40 overflow-auto">
                {latestOcr?.raw || "(no output yet)"}
              </pre>
            </div>
          </div>
        )}

        {/* New Raw Analysis Debug Section */}
        {ocrDebugEnabled && currentIntervention?.rawAnalysis && (
           <div className="border border-gray-200 rounded-lg overflow-hidden">
             <div className="px-3 py-2 bg-gray-50 text-xs font-bold text-gray-700">
               Parsed Analysis
             </div>
             <div className="p-3">
               <pre className="text-[10px] text-gray-600 whitespace-pre-wrap break-words bg-white border border-gray-100 rounded p-2 max-h-60 overflow-auto">
                 {JSON.stringify(currentIntervention.rawAnalysis, null, 2)}
               </pre>
             </div>
           </div>
        )}

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 text-xs font-bold text-gray-700">
            Live Analysis
          </div>
          <div className="p-3 text-xs text-gray-700 space-y-2">
            {currentIntervention ? (
              <>
                <div className="font-semibold text-gray-900">
                  {currentIntervention.issueTitle || "Analysis"}
                </div>
                <div className="text-gray-500">
                  {currentIntervention.category || "Uncategorized"}
                </div>
                {currentIntervention.explanation && (
                  <div className="whitespace-pre-wrap">
                    {currentIntervention.explanation}
                  </div>
                )}
                {currentIntervention.hint && (
                  <div className="whitespace-pre-wrap text-blue-700">
                    Hint: {currentIntervention.hint}
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400">
                Start writing to receive feedback.
              </div>
            )}
          </div>
        </div>

        {optimisticReview && (
          <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
            Reviewing current step...
          </div>
        )}

        {interventions.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">
            No interventions yet.<br/>Start writing to receive feedback.
          </div>
        ) : (
          interventions.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-xs text-gray-400 mb-1">{item.timestamp}</div>
              <div className="font-medium text-gray-800 text-sm mb-2">
                {item.issueTitle || item.description}
              </div>
              <div
                className="text-xs text-blue-600 flex items-center gap-1 cursor-pointer"
                onClick={() => onSelectIntervention && onSelectIntervention(item.id)}
              >
                View Detail <ChevronRight size={12} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
