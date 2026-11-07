import { useEffect } from "react";
import type { Member } from "./team.ts";

export default function MemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="member-backdrop" onClick={onClose}>
      <div className="member-panel" role="dialog" aria-modal="true" aria-label={member.name}
           onClick={(e) => e.stopPropagation()}>
        <button className="member-close" onClick={onClose} aria-label="Chiudi">×</button>
        <img className="member-photo" src={member.photo} alt={member.name} />
        <div className="member-text">
          <h2>{member.name.toUpperCase()}</h2>
          <p className="member-role">// {member.role}</p>
          <p>{member.bio}</p>
          <pre>{"SKILL\n" + member.skills
            .map(([n, v]) => `${n.padEnd(11)} ${"█".repeat(v)}${"░".repeat(5 - v)}`).join("\n")}</pre>
          <p>PUNTO DEBOLE // {member.weakness}</p>
        </div>
      </div>
    </div>
  );
}