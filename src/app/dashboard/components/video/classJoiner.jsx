"use client";

import React, { useEffect, useRef, useState } from "react";
import { DAILY_ROOM_BASE, dailyRoomUrl } from "../../../../config/env";

/**
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   provider?: 'DAILY' | 'JITSI'          // may be omitted; we infer below
 *   roomName: string
 *   token?: string | null                 // Daily uses a string token; Jitsi doesn't
 *   joinUrl?: string | null               // backend may send a full URL
 */
export default function ClassJoiner({
  open,
  onClose,
  provider,
  roomName,
  token,
  joinUrl,
}) {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    (async () => {
      try {
        const root = mountRef.current;
        if (!root) return;

        // Prefer backend URL if provided
        let url = (joinUrl || "").trim();

        // --- Infer provider when missing ---
        let effectiveProvider = provider;
        if (!effectiveProvider) {
          if (url.includes("meet.jit.si")) {
            effectiveProvider = "JITSI";
          } else if (typeof token === "string" && token.length > 0) {
            effectiveProvider = "DAILY";
          } else if (DAILY_ROOM_BASE) {
            effectiveProvider = "DAILY";
          }
        }

        if (!effectiveProvider) {
          setErr("Unknown provider (none passed and could not infer).");
          return;
        }

        if (effectiveProvider === "DAILY") {
          // Build a Daily URL if backend didn't provide one
          if (!url) {
            const base = (DAILY_ROOM_BASE || "").replace(/\/+$/, "");
            if (!base) {
              setErr(
                "Missing NEXT_PUBLIC_DAILY_ROOM_BASE and no usable Daily joinUrl."
              );
              return;
            }
            url = `${base}/${encodeURIComponent(roomName || "")}`;
          }

          if (typeof token !== "string" || token.length === 0) {
            setErr("property 'token': token should be a string for Daily.");
            return;
          }

          const Daily = await import("@daily-co/daily-js");
          const call = Daily.createFrame(root, {
            iframeStyle: {
              width: "100%",
              height: "100%",
              border: "0",
              borderRadius: "12px",
            },
            showLeaveButton: true,
          });

          frameRef.current = call;
          await call.join({ url, token });
          call.on("left-meeting", () => onClose?.());
        } else if (effectiveProvider === "JITSI") {
          if (!url) {
            url = `https://meet.jit.si/${encodeURIComponent(roomName || "")}`;
          }

          const iframe = document.createElement("iframe");
          iframe.src = url;
          iframe.allow =
            "camera; microphone; fullscreen; display-capture; autoplay; clipboard-write";
          iframe.style.width = "100%";
          iframe.style.height = "100%";
          iframe.style.border = "0";
          iframe.referrerPolicy = "no-referrer";
          root.innerHTML = "";
          root.appendChild(iframe);

          frameRef.current = {
            destroy: () => {
              try {
                root.innerHTML = "";
              } catch {}
            },
          };
        } else {
          setErr(`Unknown provider: ${String(effectiveProvider)}`);
        }
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Failed to start the call");
      }
    })();

    return () => {
      cancelled = true;
      try {
        frameRef.current?.leave?.();
        frameRef.current?.destroy?.();
      } catch {}
      frameRef.current = null;
    };
  }, [open, provider, roomName, token, joinUrl, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 p-4 grid place-items-center">
      <div className="w-full max-w-6xl h-[78vh] bg-white rounded-2xl shadow-2xl border overflow-hidden relative">
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border bg-white text-sm"
          >
            Close
          </button>
        </div>

        {err ? (
          <div className="h-full grid place-items-center p-6 text-center">
            <div>
              <div className="text-rose-600 font-semibold mb-2">Call error</div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {err}
                <pre className="mt-3 p-3 bg-slate-50 border rounded text-xs text-left max-w-xl mx-auto overflow-auto">
{JSON.stringify(
  {
    provider,
    inferredProvider:
      (!provider && (joinUrl?.includes("meet.jit.si")
        ? "JITSI"
        : typeof token === "string" && token.length > 0
        ? "DAILY"
        : DAILY_ROOM_BASE
        ? "DAILY"
        : null)) || null,
    roomName,
    tokenType: typeof token,
    hasToken: !!token,
    joinUrl,
  },
  null,
  2
)}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
}
