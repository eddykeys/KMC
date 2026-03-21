"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProctoringConfig, ProctoringState, ProctoringViolation } from "@/types";

// ─────────────────── Types ───────────────────

type ViolationType =
  | "COPY_PASTE"
  | "TAB_SWITCH"
  | "RIGHT_CLICK"
  | "KEYBOARD_SHORTCUT"
  | "FULLSCREEN_EXIT"
  | "NO_FACE_DETECTED"
  | "MULTIPLE_FACES"
  | "LOOKING_AWAY"
  | "MINIMIZE_ATTEMPT"
  | "PRINT_SCREEN"
  | "INTERNET_OFFLINE"
  | "OTHER";

interface UseExamProctoringOptions {
  config: ProctoringConfig;
  submissionId: string;
  studentId: string;
  onAutoSubmit: () => void;
  onViolationLogged?: (violation: ProctoringViolation) => void;
  logViolationToServer: (violation: {
    type: ViolationType;
    description: string;
    submissionId: string;
    studentId: string;
    screenshotUrl?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
}

interface UseExamProctoringReturn {
  state: ProctoringState;
  enterFullscreen: () => Promise<void>;
  pauseExam: () => void;
  resumeExam: () => void;
  startWebcam: () => Promise<void>;
  stopWebcam: () => void;
  getViolationCount: () => number;
  isExamBlocked: boolean;
}

// ─────────────────── Blocked Keys ───────────────────

const BLOCKED_KEYS = new Set([
  "F12",
  "PrintScreen",
  "Meta",       // Windows key
  "ContextMenu",
]);

const BLOCKED_COMBOS: { ctrl?: boolean; shift?: boolean; alt?: boolean; key: string }[] = [
  { ctrl: true, key: "c" },
  { ctrl: true, key: "v" },
  { ctrl: true, key: "x" },
  { ctrl: true, key: "a" },
  { ctrl: true, key: "s" },
  { ctrl: true, key: "p" },
  { ctrl: true, key: "u" },
  { ctrl: true, shift: true, key: "I" }, // DevTools
  { ctrl: true, shift: true, key: "J" }, // DevTools console
  { ctrl: true, shift: true, key: "C" }, // DevTools inspect
  { ctrl: true, key: "F12" },
  { alt: true, key: "Tab" },
  { alt: true, key: "F4" },
  { ctrl: true, key: "Tab" },
  { ctrl: true, key: "w" },
  { ctrl: true, key: "t" },
  { ctrl: true, key: "n" },
  { ctrl: true, shift: true, key: "Delete" },
];

// ─────────────────── Hook ───────────────────

export function useExamProctoring(options: UseExamProctoringOptions): UseExamProctoringReturn {
  const { config, submissionId, studentId, onAutoSubmit, onViolationLogged, logViolationToServer } = options;

  // ── State ──
  const [state, setState] = useState<ProctoringState>({
    isFullscreen: false,
    isPaused: false,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    violationCount: 0,
    violations: [],
    isAutoSubmitted: false,
    webcamStream: null,
    faceDetectionActive: false,
  });

  const violationCountRef = useRef(0);
  const autoSubmittedRef = useRef(false);
  const faceDetectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const faceApiLoadedRef = useRef(false);
  const isPausedRef = useRef(false);

  // ── Record Violation ──
  const recordViolation = useCallback(
    async (type: ViolationType, description: string, metadata?: Record<string, unknown>) => {
      if (autoSubmittedRef.current || isPausedRef.current) return;

      const newCount = violationCountRef.current + 1;
      violationCountRef.current = newCount;

      const violation: ProctoringViolation = {
        type,
        description,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        violationCount: newCount,
        violations: [...prev.violations, violation],
      }));

      // Toast notification
      if (typeof window !== "undefined") {
        showViolationToast(type, description, newCount, config.maxViolations);
      }

      // Log to server
      try {
        await logViolationToServer({
          type,
          description,
          submissionId,
          studentId,
          metadata,
        });
      } catch (err) {
        console.error("Failed to log violation:", err);
      }

      onViolationLogged?.(violation);

      // Auto-submit on max violations
      if (newCount >= config.maxViolations && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        setState((prev) => ({ ...prev, isAutoSubmitted: true }));
        onAutoSubmit();
      }
    },
    [config.maxViolations, logViolationToServer, onAutoSubmit, onViolationLogged, submissionId, studentId]
  );

  // ── Fullscreen ──
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (elem as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      } else if ((elem as HTMLElement & { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
        await (elem as HTMLElement & { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
      }
      setState((prev) => ({ ...prev, isFullscreen: true }));
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
  }, []);

  // ── Pause / Resume ──
  const pauseExam = useCallback(() => {
    isPausedRef.current = true;
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeExam = useCallback(() => {
    isPausedRef.current = false;
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  // ── Webcam ──
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      setState((prev) => ({ ...prev, webcamStream: stream }));

      // Create hidden video element for face detection
      if (!videoRef.current) {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.style.position = "fixed";
        video.style.top = "-9999px";
        video.style.left = "-9999px";
        document.body.appendChild(video);
        videoRef.current = video;
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      }
    } catch (err) {
      console.error("Failed to start webcam:", err);
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (state.webcamStream) {
      state.webcamStream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.remove();
      videoRef.current = null;
    }
    if (faceDetectionIntervalRef.current) {
      clearInterval(faceDetectionIntervalRef.current);
      faceDetectionIntervalRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      webcamStream: null,
      faceDetectionActive: false,
    }));
  }, [state.webcamStream]);

  // ── face-api.js Detection ──
  const startFaceDetection = useCallback(async () => {
    if (!videoRef.current || faceDetectionIntervalRef.current) return;

    try {
      // Dynamically import face-api.js
      const faceapi = await import("face-api.js");

      if (!faceApiLoadedRef.current) {
        // Load models from public directory
        const MODEL_URL = "/models/face-api";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        faceApiLoadedRef.current = true;
      }

      setState((prev) => ({ ...prev, faceDetectionActive: true }));

      // Run detection every 3 seconds
      faceDetectionIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || isPausedRef.current || autoSubmittedRef.current) return;

        try {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true);

          if (detections.length === 0) {
            recordViolation("NO_FACE_DETECTED", "No face detected in webcam frame", {
              detectionCount: 0,
            });
          } else if (detections.length > 1) {
            recordViolation("MULTIPLE_FACES", `${detections.length} faces detected — only 1 allowed`, {
              detectionCount: detections.length,
            });
          } else {
            // Single face — check gaze direction via landmark positions
            const landmarks = detections[0].landmarks;
            const nose = landmarks.getNose();
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            if (nose.length > 0 && leftEye.length > 0 && rightEye.length > 0) {
              const noseTip = nose[3]; // tip of the nose
              const leftEyeCenter = {
                x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
                y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length,
              };
              const rightEyeCenter = {
                x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
                y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length,
              };
              const eyeMidpoint = {
                x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
                y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
              };

              // If nose tip is significantly offset from eye midpoint, user is looking away
              const horizontalOffset = Math.abs(noseTip.x - eyeMidpoint.x);
              const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
              const lookAwayThreshold = eyeDistance * 0.6;

              if (horizontalOffset > lookAwayThreshold) {
                recordViolation("LOOKING_AWAY", "Student appears to be looking away from the screen", {
                  horizontalOffset,
                  threshold: lookAwayThreshold,
                });
              }
            }
          }
        } catch (detectionError) {
          console.error("Face detection error:", detectionError);
        }
      }, 3000);
    } catch (err) {
      console.error("Failed to initialize face detection:", err);
    }
  }, [recordViolation]);

  // ── Keyboard Blocking ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPausedRef.current) return;

      // Block individual keys
      if (BLOCKED_KEYS.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        recordViolation("KEYBOARD_SHORTCUT", `Blocked key pressed: ${e.key}`);
        return;
      }

      // Block key combos
      for (const combo of BLOCKED_COMBOS) {
        const ctrlMatch = combo.ctrl ? e.ctrlKey || e.metaKey : true;
        const shiftMatch = combo.shift ? e.shiftKey : true;
        const altMatch = combo.alt ? e.altKey : true;
        const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          e.stopPropagation();

          if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
            recordViolation("COPY_PASTE", `Blocked clipboard shortcut: Ctrl+${e.key.toUpperCase()}`);
          } else {
            recordViolation("KEYBOARD_SHORTCUT", `Blocked shortcut: ${formatKeyCombo(e)}`);
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [config.isEnabled, recordViolation]);

  // ── Copy/Paste/Cut events ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const blockClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation("COPY_PASTE", `Clipboard event blocked: ${e.type}`);
    };

    document.addEventListener("copy", blockClipboard, true);
    document.addEventListener("paste", blockClipboard, true);
    document.addEventListener("cut", blockClipboard, true);

    return () => {
      document.removeEventListener("copy", blockClipboard, true);
      document.removeEventListener("paste", blockClipboard, true);
      document.removeEventListener("cut", blockClipboard, true);
    };
  }, [config.isEnabled, recordViolation]);

  // ── Right-click blocking ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation("RIGHT_CLICK", "Right-click context menu blocked");
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    return () => document.removeEventListener("contextmenu", handleContextMenu, true);
  }, [config.isEnabled, recordViolation]);

  // ── Text selection blocking ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const handleSelectStart = (e: Event) => {
      // Allow selection in input fields for answering
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener("selectstart", handleSelectStart, true);
    
    // Apply CSS to prevent selection
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    return () => {
      document.removeEventListener("selectstart", handleSelectStart, true);
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [config.isEnabled]);

  // ── Fullscreen change detection ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setState((prev) => ({ ...prev, isFullscreen }));

      if (!isFullscreen && !isPausedRef.current && !autoSubmittedRef.current) {
        recordViolation("FULLSCREEN_EXIT", "Exited fullscreen mode");

        // Force back to fullscreen after a brief delay
        setTimeout(() => {
          if (!autoSubmittedRef.current) {
            enterFullscreen();
          }
        }, 500);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [config.isEnabled, enterFullscreen, recordViolation]);

  // ── Visibility / Tab switch detection ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isPausedRef.current && !autoSubmittedRef.current) {
        recordViolation("TAB_SWITCH", "Student switched to another tab or minimized the browser");
      }
    };

    const handleBlur = () => {
      if (!isPausedRef.current && !autoSubmittedRef.current) {
        recordViolation("MINIMIZE_ATTEMPT", "Browser window lost focus (possible minimize or Alt+Tab)");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [config.isEnabled, recordViolation]);

  // ── Internet connectivity monitoring ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      if (isPausedRef.current) {
        resumeExam();
      }
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      recordViolation("INTERNET_OFFLINE", "Internet connection lost — exam paused");
      pauseExam();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [config.isEnabled, pauseExam, resumeExam, recordViolation]);

  // ── PrintScreen / Screenshot blocking ──
  useEffect(() => {
    if (!config.isEnabled) return;

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        // Clear clipboard to prevent screenshot capture
        navigator.clipboard.writeText("").catch(() => {});
        recordViolation("PRINT_SCREEN", "PrintScreen key detected — clipboard cleared");
      }
    };

    window.addEventListener("keyup", handleKeyUp, true);
    return () => window.removeEventListener("keyup", handleKeyUp, true);
  }, [config.isEnabled, recordViolation]);

  // ── Start face detection when webcam is ready ──
  useEffect(() => {
    if (config.isEnabled && config.isWebcamRequired && state.webcamStream && !state.faceDetectionActive) {
      startFaceDetection();
    }
  }, [config.isEnabled, config.isWebcamRequired, state.webcamStream, state.faceDetectionActive, startFaceDetection]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (faceDetectionIntervalRef.current) {
        clearInterval(faceDetectionIntervalRef.current);
      }
      if (videoRef.current) {
        videoRef.current.remove();
      }
    };
  }, []);

  // ── Return ──
  return {
    state,
    enterFullscreen,
    pauseExam,
    resumeExam,
    startWebcam,
    stopWebcam,
    getViolationCount: () => violationCountRef.current,
    isExamBlocked: state.isPaused || !state.isOnline || state.isAutoSubmitted,
  };
}

// ─────────────────── Helpers ───────────────────

function formatKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  if (e.metaKey) parts.push("Win");
  parts.push(e.key);
  return parts.join("+");
}

function showViolationToast(
  type: ViolationType,
  description: string,
  currentCount: number,
  maxCount: number
) {
  // Create toast notification DOM element
  const toast = document.createElement("div");
  const isWarning = currentCount >= maxCount - 1;
  const remaining = maxCount - currentCount;

  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      background: ${isWarning ? "linear-gradient(135deg, #dc2626, #b91c1c)" : "linear-gradient(135deg, #f59e0b, #d97706)"};
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    ">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">
        ⚠️ Violation Detected (${currentCount}/${maxCount})
      </div>
      <div style="font-size: 13px; opacity: 0.95;">${description}</div>
      ${remaining <= 1 ? '<div style="font-size: 12px; margin-top: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">⛔ Next violation will auto-submit your exam!</div>' : ""}
    </div>
  `;

  // Inject animation keyframes
  if (!document.getElementById("proctoring-toast-styles")) {
    const style = document.createElement("style");
    style.id = "proctoring-toast-styles";
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.5s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}
