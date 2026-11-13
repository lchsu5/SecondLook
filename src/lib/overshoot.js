import { StreamClient } from '@overshoot/sdk';

const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];

export class OvershootScreenClient {
  constructor(config) {
    this.config = config;
    if (!config.apiKey) {
        console.error("OvershootScreenClient: Missing API Key");
    }

    const rawBaseUrl = import.meta.env.VITE_OVERSHOOT_API_URL || config.apiUrl || "https://cluster1.overshoot.ai/api/v0.2";
    const baseUrl = this.resolveBaseUrl(rawBaseUrl);
    console.log("[Overshoot] Initializing with API URL:", baseUrl);
    this.baseUrl = baseUrl;

    this.client = new StreamClient({
      baseUrl,
      apiKey: config.apiKey
    });
    this.mediaStream = null;
    this.processedTrack = null;
    this.processingCanvas = null;
    this.processingVideoElement = null;
    this.processingRafId = null;
    this.processingContainerEl = null;
    this.peerConnection = null;
    this.webSocket = null;
    this.streamId = null;
    this.keepaliveInterval = null;
    this.isRunning = false;
    this.wsMessageCount = 0;
  }

  resolveBaseUrl(rawBaseUrl) {
    if (typeof rawBaseUrl !== "string") return "";
    if (rawBaseUrl.startsWith("/")) {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      return `${origin}${rawBaseUrl}`;
    }
    return rawBaseUrl;
  }

  async createOcrFocusTrack(sourceStream) {
    if (this.processedTrack) return this.processedTrack;
    const sourceTrack = sourceStream?.getVideoTracks?.()?.[0];
    if (!sourceTrack) return sourceTrack;

    try {
      if (typeof sourceTrack.contentHint === "string") {
        sourceTrack.contentHint = "detail";
      }
    } catch {
    }

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = sourceStream;

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-99999px";
    container.style.top = "-99999px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.overflow = "hidden";
    container.appendChild(video);
    document.body.appendChild(container);
    this.processingContainerEl = container;

    try {
      await video.play();
    } catch {
    }

    await new Promise((resolve) => {
      const done = () => resolve();
      if (video.readyState >= 2) return done();
      video.onloadeddata = done;
      video.onloadedmetadata = done;
    });

    const waited = await new Promise((resolve) => {
      const start = Date.now();
      const tick = () => {
        const vw = video.videoWidth || 0;
        const vh = video.videoHeight || 0;
        if (vw > 0 && vh > 0) return resolve(true);
        if (Date.now() - start > 2000) return resolve(false);
        requestAnimationFrame(tick);
      };
      tick();
    });
    if (!waited) {
      console.log("[Overshoot] OCR Focus: video never started, falling back to raw track");
      return sourceTrack;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return sourceTrack;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const draw = () => {
      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;
      if (vw > 0 && vh > 0) {
        const cropRatio = 0.6;
        const cropW = vw * cropRatio;
        const cropH = vh * cropRatio;
        const cropX = (vw - cropW) / 2;
        const cropY = (vh - cropH) / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
      }
      this.processingRafId = requestAnimationFrame(draw);
    };

    this.processingVideoElement = video;
    this.processingCanvas = canvas;
    draw();

    const outStream = canvas.captureStream(30);
    const outTrack = outStream.getVideoTracks()[0];
    try {
      if (typeof outTrack.contentHint === "string") {
        outTrack.contentHint = "detail";
      }
    } catch {
    }
    this.processedTrack = outTrack;
    return outTrack;
  }

  async acquireMedia() {
    if (this.mediaStream) return this.mediaStream;

    const sourceType = this.config.sourceType || "screen";
    if (sourceType === "camera") {
      console.log("[Overshoot] Requesting Camera Media...");
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      console.log("[Overshoot] Camera Media acquired");
    } else {
      const displaySurface =
        sourceType === "window"
          ? "window"
          : sourceType === "tab"
            ? "browser"
            : "monitor";

      const displayMediaConstraints = {
        video: {
          cursor: "always",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
          displaySurface
        },
        audio: false
      };

      try {
        console.log("[Overshoot] Requesting Display Media...");
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaConstraints);
        console.log("[Overshoot] Display Media acquired");
      } catch (e) {
        console.log("[Overshoot] Retrying Display Media without displaySurface constraint...");
        this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        console.log("[Overshoot] Display Media acquired");
      }
    }

    const videoTrack = this.mediaStream.getVideoTracks()[0];
    if (!videoTrack) throw new Error("No video track available");

    // Handle stream end (user clicks "Stop sharing" in browser UI)
    videoTrack.onended = () => {
      console.log("[Overshoot] User stopped sharing");
      this.stop();
      if (this.config.onStreamEnded) {
        this.config.onStreamEnded();
      }
    };

    return this.mediaStream;
  }

  async start() {
    if (this.isRunning) throw new Error("Stream already running");
    console.log("[Overshoot] Starting stream...");

    let lastRequestBody = null;

    try {
      // 1. Acquire Media if not already present
      if (!this.mediaStream) {
        await this.acquireMedia();
      }

      const videoTrack = this.mediaStream.getVideoTracks()[0];
      if (!videoTrack) throw new Error("No video track available");

      // 2. Setup WebRTC
      console.log("[Overshoot] Creating PeerConnection...");
    const baseIceServers = this.config.iceServers || ICE_SERVERS;
    const effectiveIceServers = this.config.forceRelay
      ? baseIceServers.filter(s => {
          const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
          return urls.some(u => typeof u === 'string' && u.startsWith('turn'));
        })
      : baseIceServers;
      const peerConnection = new RTCPeerConnection({
        iceServers: effectiveIceServers,
        iceTransportPolicy: this.config.forceRelay ? "relay" : "all"
      });
      this.peerConnection = peerConnection;

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("[Overshoot] ICE candidate:", {
            type: event.candidate.type,
            protocol: event.candidate.protocol,
            address: event.candidate.address,
            port: event.candidate.port
          });
        } else {
          console.log("[Overshoot] ICE gathering complete");
        }
      };

      peerConnection.onicecandidateerror = (event) => {
        console.error("[Overshoot] ICE candidate error:", {
          errorCode: event.errorCode,
          errorText: event.errorText,
          url: event.url,
          hostCandidate: event.hostCandidate,
          port: event.port
        });
        if (this.config.onIceState) {
          this.config.onIceState({
            iceCandidateError: {
              errorCode: event.errorCode,
              errorText: event.errorText,
              url: event.url
            }
          });
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log("[Overshoot] ICE Connection State:", peerConnection.iceConnectionState);
        if (this.config.onIceState) this.config.onIceState({ iceConnectionState: peerConnection.iceConnectionState });
      };

      peerConnection.onicegatheringstatechange = () => {
        console.log("[Overshoot] ICE Gathering State:", peerConnection.iceGatheringState);
        if (this.config.onIceState) this.config.onIceState({ iceGatheringState: peerConnection.iceGatheringState });
      };

      peerConnection.onconnectionstatechange = () => {
        console.log("[Overshoot] Peer Connection State:", peerConnection.connectionState);
        if (this.config.onIceState) this.config.onIceState({ connectionState: peerConnection.connectionState });
      };

      const sendingTrack = this.config.ocrFocusEnabled ? await this.createOcrFocusTrack(this.mediaStream) : videoTrack;
      peerConnection.addTrack(sendingTrack, new MediaStream([sendingTrack]));

      const transceiver = (peerConnection.getTransceivers() || []).find(
        t => t?.sender?.track === sendingTrack
      );
      if (transceiver && typeof transceiver.setCodecPreferences === "function") {
        const caps = typeof RTCRtpSender !== "undefined" ? RTCRtpSender.getCapabilities("video") : null;
        const codecs = caps?.codecs || [];
        const h264 = codecs.filter(c => c.mimeType === "video/H264");
        if (h264.length > 0) {
          const rest = codecs.filter(c => c.mimeType !== "video/H264");
          transceiver.setCodecPreferences([...h264, ...rest]);
        }
      }

      const offer = await peerConnection.createOffer();

      // Safety check: ensure we haven't been stopped/replaced while awaiting createOffer
      if (this.peerConnection !== peerConnection) {
         throw new Error("Stream stopped or restarted during initialization");
      }

      await peerConnection.setLocalDescription(offer);

      await new Promise((resolve) => {
        if (this.peerConnection !== peerConnection) return resolve();
        if (peerConnection.iceGatheringState === "complete") return resolve();
        const timeoutId = setTimeout(resolve, 2500);
        const handler = () => {
          if (peerConnection.iceGatheringState === "complete") {
            peerConnection.removeEventListener("icegatheringstatechange", handler);
            clearTimeout(timeoutId);
            resolve();
          }
        };
        peerConnection.addEventListener("icegatheringstatechange", handler);
      });

      if (this.peerConnection !== peerConnection) {
        throw new Error("Stream stopped during initialization");
      }

      if (!peerConnection.localDescription?.sdp) {
        throw new Error("Failed to create local description");
      }

      // 3. Create Stream on Server
      console.log("[Overshoot] Creating stream on server...");
      const requestBody = {
        webrtc: {
          type: "offer",
          sdp: peerConnection.localDescription.sdp
        },
        processing: {
          sampling_ratio: this.config.ocrFocusEnabled ? 1 : 0.1,
          fps: Math.max(
            1,
            Math.min(
              120,
              Math.round(sendingTrack.getSettings?.().frameRate || sendingTrack.getSettings?.().framesPerSecond || 30)
            )
          ),
          clip_length_seconds: 1,
          delay_seconds: 1,
          ...(this.config.processing || {})
        },
        inference: {
          prompt: this.config.prompt,
          backend: "overshoot",
          model: this.config.model || "Qwen/Qwen3-VL-30B-A3B-Instruct",
          ...(this.config.inference || {})
        }
      };

      lastRequestBody = requestBody;

      const response = await this.client.createStream(requestBody);
      console.log("[Overshoot] Stream created on server:", response.stream_id);

      await this.peerConnection.setRemoteDescription(response.webrtc);
      this.streamId = response.stream_id;

      // 4. Setup WebSocket and Keepalive
      this.setupWebSocket(this.streamId);
      this.setupKeepalive(response.lease?.ttl_seconds);

      this.isRunning = true;
      return this.mediaStream;

    } catch (error) {
      const details = error && typeof error === "object" && "details" in error ? error.details : undefined;
      const requestId = error && typeof error === "object" && "requestId" in error ? error.requestId : undefined;
      const detailsText = details ? JSON.stringify(details, null, 2) : undefined;
      const requestText = lastRequestBody ? JSON.stringify(lastRequestBody, null, 2) : undefined;
      console.error(
        "[Overshoot] Error in start():",
        error,
        detailsText ? { details: detailsText } : undefined,
        requestId ? { requestId } : undefined,
        requestText ? { request: requestText } : undefined
      );
      if (error.name === 'NotAllowedError') {
         console.error("User denied screen share permissions.");
      }
      await this.cleanup(true);
      throw error;
    }
  }

  setupWebSocket(streamId) {
    this.webSocket = this.client.connectWebSocket(streamId);

    this.webSocket.onopen = () => {
      console.log("[Overshoot] WebSocket connected");
      if (this.config.onWsState) this.config.onWsState({ state: "open" });
      this.webSocket.send(JSON.stringify({ api_key: this.config.apiKey }));
    };

    this.webSocket.onmessage = (event) => {
      this.wsMessageCount += 1;
      if (this.config.onWsMessage) {
        this.config.onWsMessage({
          count: this.wsMessageCount,
          data: typeof event?.data === "string" ? event.data : null
        });
      }
      try {
        const result = JSON.parse(event.data);
        if (this.config.onResult) {
          this.config.onResult(result);
        }
      } catch (e) {
        console.error("[Overshoot] Failed to parse message:", e);
      }
    };

    this.webSocket.onerror = (e) => {
      console.error("[Overshoot] WebSocket error:", e);
      if (this.config.onWsState) this.config.onWsState({ state: "error" });
      if (this.config.onError) this.config.onError(e);
    };

    this.webSocket.onclose = (e) => {
        console.log("[Overshoot] WebSocket closed:", e.code, e.reason);
        if (this.config.onWsState) this.config.onWsState({ state: "close", code: e.code, reason: e.reason });
    }
  }

  setupKeepalive(ttlSeconds) {
    if (!ttlSeconds) return;
    const intervalMs = (ttlSeconds / 2) * 1000;

    this.keepaliveInterval = setInterval(async () => {
      try {
        if (this.streamId) {
          await this.client.renewLease(this.streamId);
        }
      } catch (e) {
        console.error("[Overshoot] Keepalive failed:", e);
      }
    }, intervalMs);
  }

  async stop(preserveMedia = false) {
    console.log("[Overshoot] Stopping stream...");
    await this.cleanup(preserveMedia);
    this.isRunning = false;
  }

  async cleanup(preserveMedia = false) {
    if (this.keepaliveInterval) clearInterval(this.keepaliveInterval);
    if (this.webSocket) this.webSocket.close();
    if (this.peerConnection) this.peerConnection.close();

    // Don't stop the media stream tracks here if we want to keep them alive for UI,
    // but typically we do stop them.
    if (this.mediaStream && !preserveMedia) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }

    if (this.processingRafId) cancelAnimationFrame(this.processingRafId);
    if (this.processedTrack) this.processedTrack.stop();
    if (this.processingVideoElement) this.processingVideoElement.srcObject = null;
    if (this.processingContainerEl) this.processingContainerEl.remove();

    this.streamId = null;
    if (!preserveMedia) {
      this.mediaStream = null;
    }
    this.processedTrack = null;
    this.processingCanvas = null;
    this.processingVideoElement = null;
    this.processingRafId = null;
    this.processingContainerEl = null;
    this.peerConnection = null;
    this.webSocket = null;
  }

  getMediaStream() {
    return this.mediaStream;
  }
}

/**
 * Pre-built prompts for common math tutoring scenarios
 */
export const MathTutorPrompts = {
  analyzeWork: `You are an expert math tutor analyzing student work in real-time.

Look at the screen and:
1. Extract all visible math problems and the student's work
2. Check if each solution is mathematically correct
3. Identify any errors in reasoning or calculation
4. Determine what concepts the student understands vs struggles with
5. Provide helpful hints (without giving away the answer)

Return your response as JSON with this structure:
{
  "problems": [
    {
      "problemNumber": 1,
      "problemText": "the equation or word problem",
      "studentWork": "what the student wrote",
      "isCorrect": true/false,
      "errors": ["list of specific errors if any"],
      "conceptsUsed": ["algebra", "distribution", etc.],
      "hint": "helpful guidance without revealing the answer",
      "nextStep": "what the student should try next"
    }
  ],
  "overallAssessment": "general feedback on student's approach and understanding"
}`,

  detectErrors: `You are a STEM tutor monitoring a student's math homework in real time.

Task:
1) Transcribe all visible handwritten math steps and text exactly as written. Treat pen strokes and handwriting as primary.
2) Identify the first incorrect step currently visible (if any).
   - STRICTLY verify algebraic expansions and simplifications.
   - If a line equates two expressions that are NOT mathematically equivalent (e.g. (x-1)^2 + 3 = x^2 + 3x + 1), mark it as an ERROR unless it is clearly a "Solve for x" problem statement.
   - If the student expands a term incorrectly (e.g. (a+b)^2 = a^2 + b^2), flag it immediately.
   - If the student simply wrote the problem statement (e.g. just "(x+3)(x+2)") without expanding it, that is NOT an error.
   - HARD RULE: If the student writes an equation that is mathematically FALSE (e.g., "(x+3)(x+2) = x^2 + 6"), mark it as ERROR_FOUND: true immediately, even if no intermediate steps are shown.
   - CRITICAL: If the student writes only the problem statement and NO work is shown (e.g., just "(x+3)(x+2)" or "Solve x+2=5" with nothing else), treat this as "no error found". Do NOT say it is incorrect because they haven't started.
   - HOWEVER, if the student writes a FINAL ANSWER without showing work, and that answer is WRONG, mark it as ERROR_FOUND: true.

3) Explain why it is incorrect (name the rule/property) and give a short hint.
4) Provide a bounding box around the incorrect work on the screen.
5) If the student's work is not yet complete or only shows a problem statement without steps, treat this as "no error found".

CRITICAL: If the student's work is CORRECT, set ERROR_FOUND: false. Do NOT use words like "incorrect", "error", "mistake", "wrong" in the EXPLANATION or HINT if the work is correct. Instead, use positive language like "valid", "correct", "accurate".

CRITICAL: If the student has only written the problem statement and no work yet, set ERROR_FOUND: false.

Output format (plain text, no JSON, no markdown fences):
ERROR_FOUND: true|false
ISSUE_TITLE: <short title or empty>
CATEGORY: <Conceptual|Procedural|Arithmetic|Uncategorized>
BBOX: [ymin, xmin, ymax, xmax] (integers 0-1000)
TRANSCRIPTION:
<transcribed text>
EXPLANATION:
<explain why wrong or why it looks correct so far>
HINT:
<short hint or empty>
<END>

If the image is blurry/blank/has no meaningful work, set ERROR_FOUND: false and set BBOX: none.
Ensure BBOX is strictly in the format [ymin, xmin, ymax, xmax].
End your response with <END> to signal completion.`,

  assessDifficulty: `Analyze the visible math problems and assess difficulty for the student.

Return JSON:
{
  "problems": [
    {
      "problemText": "the problem",
      "difficulty": "easy/medium/hard/very hard",
      "concepts": ["required concepts"],
      "estimatedTime": "how long it should take",
      "prerequisites": ["what student needs to know first"]
    }
  ],
  "recommendation": "should student attempt this now, or review prerequisites first?"
}`,

  stepByStep: `Guide the student through the problem step by step.

For the current problem visible:
1. Identify what step they're on
2. Check if that step is correct
3. If correct, suggest what to do next
4. If incorrect, point out the error and suggest a correction

Return JSON:
{
  "currentStep": "what they just did",
  "stepNumber": 1,
  "isStepCorrect": true/false,
  "feedback": "specific feedback on this step",
  "nextStep": "what to do next (without solving it for them)",
  "progressPercent": 50
}`,

  checkUnderstanding: `Evaluate the student's understanding of mathematical concepts.

  Based on their work, determine:
  - Which concepts they demonstrate mastery of
  - Which concepts they're struggling with
  - Common misconceptions evident in their work
  - Recommended topics to review

  Return JSON:
  {
    "masteredConcepts": ["list of concepts they understand well"],
    "strugglingWith": ["concepts showing confusion"],
    "misconceptions": [
      {
        "concept": "the topic",
        "misconception": "what they're doing wrong",
        "correctUnderstanding": "what they should understand"
      }
    ],
    "recommendedReview": ["topics to practice"]
  }`,

  sessionSummary: `You are a supportive math tutor. The student has just finished a practice session.
Here is a log of the problems they attempted and the errors they made (if any):

{{INTERVENTIONS_JSON}}

Based ONLY on this history (and not the current video), write a personalized summary of their performance.
1. Highlight what they did well (concepts they mastered or didn't make errors in).
2. Gently point out the main areas where they struggled (based on the errors).
3. Give 2-3 specific recommendations for what to practice next.
4. Keep the tone encouraging and positive.
5. Address the student directly ("You did great with...").

Return your response as a JSON object:
{
  "summary": "The formatted text summary (can use markdown)",
  "strengths": ["list of strengths"],
  "areasForImprovement": ["list of areas"],
  "recommendations": ["list of recommendations"]
}`
};

/**
 * Helper functions for creating math-focused streams
 */
export const MathTutorHelpers = {
  async createWorkAnalyzer(client, options = {}) {
    client.config.prompt = MathTutorPrompts.analyzeWork;
    client.config.onResult = (result) => {
        try {
          const content = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
          if (options.onAnalysis) {
            options.onAnalysis(content);
          }
        } catch (error) {
          console.error('Failed to parse analysis:', error);
          if (options.onError) {
            options.onError(error);
          }
        }
    };
    if (options.onError) client.config.onError = options.onError;

    return await client.start();
  },

  async createErrorDetector(client, options = {}) {
    client.config.prompt = MathTutorPrompts.detectErrors;
    client.config.onResult = (result) => {
        try {
          const text = typeof result.result === 'string' ? result.result : String(result.result ?? "");
          if (options.onResultText) {
            options.onResultText(text, result);
          }
        } catch (error) {
          console.error('Failed to parse error detection:', error);
        }
    };
    if (options.onError) client.config.onError = options.onError;

    return await client.start();
  },

  async createStepGuide(client, options = {}) {
    client.config.prompt = MathTutorPrompts.stepByStep;
    client.config.onResult = (result) => {
        try {
          const guidance = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
          if (options.onStepComplete) {
            options.onStepComplete(guidance);
          }
        } catch (error) {
          console.error('Failed to parse step guidance:', error);
        }
    };
    if (options.onError) client.config.onError = options.onError;

    return await client.start();
  },

  async createSessionSummarizer(client, interventions, options = {}) {
    const history = interventions.map(i => ({
        issue: i.issueTitle,
        category: i.category,
        explanation: i.explanation,
        hint: i.hint
    }));

    const prompt = MathTutorPrompts.sessionSummary.replace(
        "{{INTERVENTIONS_JSON}}",
        JSON.stringify(history, null, 2)
    );

    client.config.prompt = prompt;
    client.config.onResult = (result) => {
        try {
            const content = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
            if (options.onSummary) {
                options.onSummary(content);
            }
        } catch (error) {
            console.error('Failed to parse summary:', error);
            if (options.onError) options.onError(error);
        }
    };
    if (options.onError) client.config.onError = options.onError;

    // Stop current stream but keep media for the summary pass
    if (client.isRunning) {
        await client.stop(true);
    }

    return await client.start();
  }
};

export const overshoot = {
  createStream: async () => {
    // Legacy support
    return navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" },
      audio: false
    });
  },
  hasLiveVideoTrack: stream => {
    if (!stream) return false;
    return stream.getVideoTracks().some(track => track.readyState === "live");
  }
};
