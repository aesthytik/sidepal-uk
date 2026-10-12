"use client";

import { useRef } from "react";
import { confetti, playSound } from "@/lib/game/fx";
import { emit, useCalm, useGame } from "@/store/useGame";
import { Horus } from "./Horus";

/** Footer hint for the arcade easter egg. Seven quick taps unlock it on phones, where there are no arrow keys. */
export function SecretEye() {
  const calm = useCalm();
  const set = useGame((s) => s.set);
  const taps = useRef<number[]>([]);

  function tap() {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length < 7) return;
    taps.current = [];
    const on = !useGame.getState().arcade;
    set({ arcade: on });
    if (on) {
      emit({ type: "konami" });
      playSound("powerup", true);
      confetti({ calm });
    }
  }

  return (
    <div className="mt-6 flex items-center gap-3" onClickCapture={tap}>
      <Horus size={40} />
      <p className="text-xs italic">Some say the eye knows a secret code… ↑↑↓↓</p>
    </div>
  );
}
