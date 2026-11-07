import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Game } from "../game/Game";
import type { RoomConfig } from "../game/rooms";
import { TEAM } from "../game/team";
import MemberModal from "../game/MemberModal";

type Key = "left" | "right" | "jump";

export default function GameCanvas({ room }: { room: RoomConfig }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);          // NUOVO: ponte verso i bottoni
  const [, navigate] = useLocation();
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    const game = new Game(hostRef.current!, room, navigate, (name, payload) => {
      if (name === "portrait") setMemberId(payload as string);
    });
    gameRef.current = game;
    game.init();
    return () => {
      game.destroy();
      if (gameRef.current === game) gameRef.current = null;
    };
  }, [room, navigate]);

  // Il setPointerCapture solo alla pressione: così il rilascio arriva sempre al bottone,
  // anche se il dito scivola fuori
  const press = (key: Key) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    gameRef.current?.setKey(key, true);
  };
  const release = (key: Key) => (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    gameRef.current?.setKey(key, false);
  };
  const touch = (key: Key) => ({
    onPointerDown: press(key),
    onPointerUp: release(key),
    onPointerCancel: release(key),
    onLostPointerCapture: release(key),   // rete di sicurezza: mai tasti "incastrati"
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),   // niente menu col tocco lungo
  });

  const member = TEAM.find((m) => m.id === memberId);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={hostRef} className="game-shell" />
      <div className="game-vignette" aria-hidden="true" />
      <div className="touch-controls" aria-label="Controlli touch">
        <button type="button" className="touch-button touch-left" aria-label="Sinistra" {...touch("left")}>←</button>
        <button type="button" className="touch-button touch-right" aria-label="Destra" {...touch("right")}>→</button>
        <button type="button" className="touch-button touch-jump" aria-label="Salta o entra" {...touch("jump")}>↑</button>
      </div>
      <div className="mobile-note">TOUCH MODE / HOLD TO MOVE</div>
      {member && <MemberModal member={member} onClose={() => setMemberId(null)} />}
    </div>
  );
}