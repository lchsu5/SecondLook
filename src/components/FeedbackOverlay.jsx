import React, { useState, useEffect } from 'react';

const FeedbackOverlay = ({ intervention, videoRef }) => {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!intervention || !intervention.boundingBox || !videoRef.current) {
      console.log("[FeedbackOverlay] No intervention or bounding box or video ref", {
          hasIntervention: !!intervention,
          hasBBox: !!intervention?.boundingBox,
          hasVideo: !!videoRef.current
      });
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const video = videoRef.current;
      if (!video) return;

      const videoRect = video.getBoundingClientRect();
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      if (!videoWidth || !videoHeight) {
          console.log("[FeedbackOverlay] Video not ready yet (0x0)");
          return;
      }

      // Calculate the displayed dimensions of the video content within the element
      // (simulating object-contain)
      const videoRatio = videoWidth / videoHeight;
      const elementRatio = videoRect.width / videoRect.height;

      let renderWidth = videoRect.width;
      let renderHeight = videoRect.height;
      let renderLeft = 0;
      let renderTop = 0;

      if (elementRatio > videoRatio) {
        // Element is wider than video -> vertical bars (pillarbox)
        renderWidth = videoRect.height * videoRatio;
        renderLeft = (videoRect.width - renderWidth) / 2;
      } else {
        // Element is taller than video -> horizontal bars (letterbox)
        renderHeight = videoRect.width / videoRatio;
        renderTop = (videoRect.height - renderHeight) / 2;
      }

      // intervention.boundingBox is [ymin, xmin, ymax, xmax] normalized to 1000
      const [ymin, xmin, ymax, xmax] = intervention.boundingBox;

      // Map coordinates to the RENDERED video area
      const top = renderTop + (ymin / 1000) * renderHeight;
      const left = renderLeft + (xmin / 1000) * renderWidth;
      const height = ((ymax - ymin) / 1000) * renderHeight;
      const width = ((xmax - xmin) / 1000) * renderWidth;

      console.log("[FeedbackOverlay] Updated Position:", { top, left, width, height });
      setPosition({ top, left, width, height });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    // Also observe the video element for resize (though usually window resize covers it)
    const resizeObserver = new ResizeObserver(() => updatePosition());
    if (videoRef.current) {
        resizeObserver.observe(videoRef.current);
    }

    return () => {
        window.removeEventListener('resize', updatePosition);
        resizeObserver.disconnect();
    };
  }, [intervention, videoRef]);

  if (!intervention) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* If we have a bounding box, draw it */}
      {position && (
        <>
            {/* Spotlight Effect: Dim everything else using a large box-shadow */}
            <div
              className="absolute rounded-lg transition-all duration-500 ease-out"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
                height: `${position.height}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)'
              }}
            />

            {/* The Highlight Box */}
            <div
              className="absolute border-4 border-red-500 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.8)] transition-all duration-300 ease-out animate-pulse"
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
                height: `${position.height}px`,
              }}
            >
              {/* Animated Corner Indicators for extra emphasis */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-red-400 -m-1"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-red-400 -m-1"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-red-400 -m-1"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-red-400 -m-1"></div>

              {/* Label */}
              <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap flex items-center gap-2 animate-bounce">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {intervention.issueTitle || "Error Detected Here"}
              </div>
            </div>
        </>
      )}
    </div>
  );
};

export default FeedbackOverlay;
