import type { CSSProperties } from "react";
import { Link, useLocation } from "wouter";


const programs = [
  {
    title: "Laboratorio di composizione",
    audience: "MUSICA / IMMAGINE / NARRAZIONE",
    meta: "6 SETTIMANE · 36 ORE · 599 €",
    text: "Un percorso pratico per sviluppare idee, materiali e linguaggi da applicare a immagini, animazioni e progetti audiovisivi, lavorando insieme a musicisti e creativi.",
    href: "https://opificiodimusicapplicata.com/collettivo-acustico/",
  },
  {
    title: "Sound design applicato",
    audience: "SUONO / TECNOLOGIA / COMUNICAZIONE",
    meta: "5 SETTIMANE · 30 ORE · 499 €",
    text: "Editing, voiceover, home recording e strumenti digitali per dare forma a un progetto, dal primo appunto alla realizzazione di un’esperienza coerente.",
    href: "https://opificiodimusicapplicata.com/tecniche-audio-per-la-comunicazione/",
  },
  {
    title: "Performance e collettivo",
    audience: "PRATICA / SCENA / COLLABORAZIONE",
    meta: "5 SETTIMANE · 30 ORE · 499 €",
    text: "Un laboratorio per compositori, videomaker e sound designer che unisce teoria, pratica e confronto per costruire progetti da condividere con il pubblico.",
    href: "https://opificiodimusicapplicata.com/suoni-sul-set/",
  },
];

const subjects = [
  "Composizione per colonne sonore",
  "Analisi musicale",
  "Arrangiamento e orchestrazione",
  "Programmazione VST instruments",
  "Modificazione di strumenti tradizionali",
  "Rumoristica / Foley art",
  "Sound design",
  "Tecniche di post-produzione audio",
  "Presa diretta",
];

export default function OffertaFormativa() {

  const [, navigate] = useLocation();
  
  const backdropStyle = {
    "--offer-bg": "url('/assets/offer-bg_5d3274ec.jpg')",
    "--offer-bg-mobile": "url('/assets/offer-bg-mobile_7c21efa4.jpg')",
  } as CSSProperties;

  const handleSideClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;           // click su un elemento interno
    if (event.clientX >= event.currentTarget.clientWidth) return; // click sulla scrollbar
    if (window.innerWidth <= 760) return;                        // su mobile le bande sono troppo strette
    navigate("/game");
  };

  return (
    <main className="offer-page" onClick={handleSideClick}>
      <div className="offer-page__backdrop" style={backdropStyle} aria-hidden="true" />
      <header className="offer-nav">
        <Link href="/" className="offer-nav__logo" aria-label="Torna a Monochrome Platform"><img src="/assets/LogoOMA_0fd0a3ac.jpg" alt="Logo OMA" /></Link>
        <nav className="offer-nav__links" aria-label="Navigazione principale">
          <a href="#chi-siamo">CHI SIAMO</a>
          <a href="#offerta-formativa">OFFERTA FORMATIVA</a>
          <a href="#metodo">METODO</a>
          <a href="#contatti">CONTATTI</a>
        </nav>
        <Link href="/game" className="offer-nav__game">TORNA AL GIOCO <span>↗</span></Link>
      </header>

     <section className="offer-hero" id="chi-siamo">
        <div className="offer-hero__copy">
          <h1>OPIFICIO<br />DI MUSICA<br />APPLICATA</h1>
          <p className="offer-hero__intro">Siamo un collettivo multisciplinare che crea opere interattive, con il suono come punto di incontro tra diverse forme di espressione</p>

        </div>
        <div className="offer-hero__stamp"><img src="/assets/LogoOMA_0fd0a3ac.jpg" alt="Logo OMA" /></div>
      </section>

      <div className="offer-content">
        

        

        

        
        

        <section className="offer-section offer-section--contact" id="contatti">
          <p className="offer-kicker">06 / CONTATTI</p>
          <a className="offer-cta offer-cta--dark" href="#offerta-formativa">Vuoi dare un'occhiata ai nostri corsi prima di scriverci?<span>↗</span></a>
          <h3 className="offer-contact-copy">I nostri contatti:</h3>
          <div className="offer-contact-grid">
            <div><span>WHATSAPP</span><a href="tel:+393494640511">+39 349 464 0511</a></div>
            <div><span>EMAIL</span><a href="mailto:segreteria@opificiodimusicapplicata.com">segreteria@opificiodimusicapplicata.com</a></div>
            <div><span>INDIRIZZO</span><p>Fondazione The Square<br />Via Domenico Cirillo, 1/a<br />50132 — Firenze (FI)</p></div>
          </div>
          <a className="offer-cta offer-cta--dark" href="mailto:segreteria@opificiodimusicapplicata.com">Richiedi informazioni<span>↗</span></a>
        </section>
        <section className="offer-section offer-section--community">
          <div className="offer-section__heading">
            <span className="offer-index">05</span>
            <h2>ENTRA NEL<br /><em>COLLETTIVO</em></h2>
          </div>
          <div className="offer-section__body">
            <p className="offer-lead">Compositori, sound designer, musicisti e persone curiose: il progetto cresce insieme.</p>
            <p>Il senso di comunità è fondamentale. L’Opificio è uno spazio di scambio in cui diverse realtà creative si incontrano, si confrontano e costruiscono progetti da presentare al pubblico.</p>
          </div>
        </section>

        <section className="offer-section offer-section--intro" id="offerta-formativa">
          <div className="offer-section__heading">
            <span className="offer-index">01</span>
            <h2>I NOSTRI<br /><em>CORSI</em></h2>
          </div>
          <div className="offer-section__body">
      
            
            
            <div className="offer-subjects">
              <p className="offer-subjects__label">COSTRUISCI IL TUO PERCORSO INDIVIDUALE</p>
            </div>
          </div>
        </section>

      </div>
      <footer className="offer-footer"><span>OMA / OPIFICIO DI MUSICA APPLICATA</span><span>MONOCHROME PLATFORM / 2026</span></footer>
    </main>
  );
}
