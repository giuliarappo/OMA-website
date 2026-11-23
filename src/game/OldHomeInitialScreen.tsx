import { useState } from "react";

export default function Home() {
  const [showOffer, setShowOffer] = useState(false);

  return (
    <main className="title-screen" aria-label="Schermata iniziale">
      <div className="title-screen__scanlines" aria-hidden="true" />
      <div className="title-screen__content">
        <div className="title-screen__eyebrow">A PIXEL ART EXPLORATION</div>
        <h1 className="title-screen__title">MONOCHROME<br />PLATFORM</h1>
        <div className="title-screen__rule" aria-hidden="true"><span>◆</span></div>
        <p className="title-screen__subtitle">SECTOR 01 / UNMAPPED</p>

        <div className="title-screen__menu" role="menu">
          <button className="title-screen__option title-screen__option--primary" type="button" >
            <span className="title-screen__cursor" aria-hidden="true">▶</span>
            <span>GIOCA ORA</span>
          </button>
          <button className="title-screen__option" type="button" onClick={() => setShowOffer(true)}>
            <span className="title-screen__cursor" aria-hidden="true">◆</span>
            <span>NON HAI TEMPO DI GIOCARE?<br /><strong>GUARDA LA NOSTRA OFFERTA FORMATIVA</strong></span>
          </button>
        </div>

        <div className="title-screen__footer">ARROW KEYS TO MOVE&nbsp;&nbsp; / &nbsp;&nbsp;SPACE TO JUMP</div>
      </div>

      {showOffer && (
        <div className="title-screen__notice" role="dialog" aria-modal="true" aria-label="Offerta formativa">
          <div className="title-screen__notice-card">
            <button className="title-screen__close" type="button" aria-label="Chiudi" onClick={() => setShowOffer(false)}>×</button>
            <div className="title-screen__notice-label">OFFERTA FORMATIVA</div>
            <p>Il collegamento alla nostra offerta formativa sarà disponibile qui.</p>
            <button className="title-screen__back" type="button" onClick={() => setShowOffer(false)}>INDIETRO</button>
          </div>
        </div>
      )}
    </main>
  );
}
