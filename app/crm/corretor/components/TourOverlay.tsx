"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { TourStep } from "./tourSteps";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TourOverlay({
  steps,
  open,
  startStepId,
  onClose,
  onFinish,
}: {
  steps: TourStep[];
  open: boolean;
  startStepId?: string | null;
  onClose: () => void;
  onFinish: () => void;
}) {
  const startIndex = useMemo(() => {
    if (!startStepId) return 0;
    const idx = steps.findIndex((s) => s.id === startStepId);
    return idx >= 0 ? idx : 0;
  }, [startStepId, steps]);

  const [idx, setIdx] = useState<number>(startIndex);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // quando abre, posiciona no step
  useEffect(() => {
    if (!open) return;
    setIdx(startIndex);
  }, [open, startIndex]);

  // recalcula highlight
  useEffect(() => {
    if (!open) return;

    const step = steps[idx];
    if (!step) return;

    const el = document.querySelector(step.selector) as HTMLElement | null;

    if (!el) {
      setRect(null);
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect(r);
    };

    update();

    const onResize = () => update();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, idx, steps]);

  if (!open) return null;

  const step = steps[idx];
  const isLast = idx === steps.length - 1;

  const next = () => setIdx((v) => clamp(v + 1, 0, steps.length - 1));
  const prev = () => setIdx((v) => clamp(v - 1, 0, steps.length - 1));

  const finish = () => {
    onFinish();
  };

  // fallback caso o selector não exista ainda
  const fallback = !rect;

  const pad = 10;
  const top = rect ? rect.top - pad : 120;
  const left = rect ? rect.left - pad : 60;
  const width = rect ? rect.width + pad * 2 : 520;
  const height = rect ? rect.height + pad * 2 : 90;

  // caixa de texto posicionada abaixo do highlight (com limites)
  const boxTop = rect ? rect.bottom + 22 : 240;
  const boxLeft = rect ? rect.left : 60;

  return (
    <div className="tourRoot" role="dialog" aria-modal="true">
      {/* overlay */}
      <div className="tourOverlay" />

      {/* highlight */}
      <div
        className="tourHighlight"
        style={{
          top,
          left,
          width,
          height,
        }}
      />

      {/* card */}
      <div
        className="tourCard"
        style={{
          top: boxTop,
          left: boxLeft,
        }}
      >
        <div className="tourCardTitle">
          <i className="fa-solid fa-wand-magic-sparkles" /> {step?.title ?? "Tour"}
        </div>
        <div className="tourCardDesc">{step?.description ?? "..."}</div>

        {fallback && (
          <div className="tourWarn">
            <i className="fa-solid fa-triangle-exclamation" />
            <span>Este item ainda não está visível nesta tela. Vamos seguir.</span>
          </div>
        )}

        <div className="tourActions">
          <button className="tourBtn" onClick={onClose}>
            Pular
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="tourBtn" onClick={prev} disabled={idx === 0}>
              Voltar
            </button>
            {!isLast ? (
              <button className="tourBtnPrimary" onClick={next}>
                Próximo
              </button>
            ) : (
              <button className="tourBtnPrimary" onClick={finish}>
                Finalizar
              </button>
            )}
          </div>
        </div>

        <div className="tourStepCounter">
          {idx + 1} / {steps.length}
        </div>
      </div>

      <style jsx global>{`
        .tourRoot {
          position: fixed;
          inset: 0;
          z-index: 10040;
          pointer-events: auto;
        }
        .tourOverlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.72);
        }
        .tourHighlight {
          position: absolute;
          border-radius: 16px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.72);
          outline: 2px solid rgba(47, 224, 139, 0.45);
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(2px);
        }
        .tourCard {
          position: absolute;
          width: min(420px, calc(100vw - 30px));
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(10, 20, 35, 0.94);
          backdrop-filter: blur(14px);
          color: rgba(255, 255, 255, 0.92);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
          padding: 14px;
          transform: translateY(0);
        }
        .tourCardTitle {
          font-weight: 900;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          letter-spacing: 0.2px;
        }
        .tourCardDesc {
          margin-top: 8px;
          color: rgba(255, 255, 255, 0.76);
          line-height: 1.4;
          font-size: 13px;
        }
        .tourWarn {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          align-items: center;
          color: rgba(255, 209, 102, 0.92);
          font-weight: 800;
          font-size: 12px;
          border: 1px solid rgba(255, 209, 102, 0.18);
          background: rgba(255, 209, 102, 0.08);
          padding: 10px 12px;
          border-radius: 14px;
        }
        .tourActions {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tourBtn,
        .tourBtnPrimary {
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.92);
          font-weight: 900;
          cursor: pointer;
        }
        .tourBtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .tourBtnPrimary {
          border-color: rgba(47, 224, 139, 0.24);
          background: rgba(47, 224, 139, 0.14);
        }
        .tourStepCounter {
          margin-top: 10px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.65);
          font-weight: 800;
        }
      `}</style>
    </div>
  );
}
