import { Link } from "wouter";
import { startBackgroundMusic } from "./lib/gameAudio";

export default function Home() {

  return (
    <main
      className="title-screen"
      aria-label="Schermata iniziale"
    >
      <div
        className="title-screen__scanlines"
        aria-hidden="true"
      />

      <div className="title-screen__content div-img_oma">

        <img
          className="title-screen__oma-image"
          src="/assets/OMA_schemata-iniziale.png"
          alt="O.M.A. — Opificio di Musica Applicata"
        />

        <div
          className="title-screen__rule"
          aria-hidden="true"
        >
          <span>◆</span>
        </div>

        <p className="title-screen__subtitle">
          Siamo un collettivo multidisciplinare che crea opere
          interattive, con il suono come punto di incontro tra
          diverse forme di espressione
        </p>

        <div className="title-screen__menu" role="menu">
          <Link
            className="title-screen__option title-screen__option--primary"
            href="/game"
            role="menuitem"
            onClick={() => startBackgroundMusic()}
          >
            <span
              className="title-screen__cursor"
              aria-hidden="true"
            >
              ▶
            </span>
            <span>GIOCA ORA</span>
          </Link>
        </div>

        <div className="title-screen__footer">
          &lt; &gt; per muoversi&nbsp;&nbsp; / &nbsp;&nbsp;barra per saltare
        </div>
      </div>
    </main>
  );
}
