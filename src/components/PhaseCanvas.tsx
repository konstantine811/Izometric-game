import { useEffect, useRef } from "react";

import Phaser from "phaser";
import { createGame } from "../game/utils/createGame";

export function PhaserCanvas() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    gameRef.current = createGame(hostRef.current);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="h-[80vh] w-full rounded-xl overflow-hidden border border-zinc-800"
    />
  );
}
