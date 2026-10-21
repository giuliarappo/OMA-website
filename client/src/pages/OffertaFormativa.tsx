import type { CSSProperties } from "react";
import { Link } from "wouter";

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
  const backdropStyle = {
    "--offer-bg": "url('/assets/offer-bg_5d3274ec.jpg')",
    "--offer-bg-mobile": "url('/assets/offer-bg-mobile_7c21efa4.jpg')",
  } as CSSProperties;

  return (
    <main className="offer-page">
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
          <p className="offer-kicker">OPIFICIO / 001 / FORMAZIONE</p>
          <h1>OPIFICIO<br />DI MUSICA<br />APPLICATA</h1>
          <p className="offer-hero__intro">Un luogo per imparare facendo, ascoltare insieme e trasformare la curiosità in pratica.</p>
          <a className="offer-cta" href="#offerta-formativa">ESPLORA L’OFFERTA <span>↓</span></a>
        </div>
        <div className="offer-hero__stamp"><img src="/assets/LogoOMA_0fd0a3ac.jpg" alt="Logo OMA" /><span>EST. 2025</span></div>
      </section>

      <div className="offer-content">
        <section className="offer-section offer-section--intro" id="offerta-formativa">
          <div className="offer-section__heading">
            <span className="offer-index">01</span>
            <h2>FORMARE<br /><em>IL SUONO</em></h2>
          </div>
          <div className="offer-section__body">
            <p className="offer-lead">L’OMA è un laboratorio aperto dove musica, immagini e tecnologia si incontrano.</p>
            <p>Puoi scegliere di studiare con noi seguendo lezioni individuali, partecipando ai nostri laboratori di gruppo oppure entrando a far parte del nostro collettivo.</p>
            <p>L’Opificio fa parte dell’offerta formativa di Serious Game Film Academy e accoglie le sue lezioni negli spazi di Fondazione The Square a Firenze.</p>
            <div className="offer-subjects">
              <p className="offer-subjects__label">COSTRUISCI IL TUO PERCORSO INDIVIDUALE</p>
              <ul>{subjects.map((subject) => <li key={subject}>{subject}</li>)}</ul>
            </div>
          </div>
        </section>

        <section className="offer-section" id="metodo">
          <div className="offer-section__heading">
            <span className="offer-index">02</span>
            <h2>ARTIGIANI<br /><em>DEL FARE</em></h2>
          </div>
          <div className="offer-section__body offer-method">
            <p className="offer-lead">Impariamo facendo, con le orecchie, le mani e lo sguardo.</p>
            <p>La fase digitale è una fondamentale implementazione del lavoro, ma la vera ossatura del risultato nasce dall’esplorazione dei materiali, dal corretto utilizzo degli strumenti e dal dialogo tra persone, immagini e idee.</p>
            <div className="offer-method__quote">“La tecnica diventa viva quando incontra la curiosità.”</div>
          </div>
        </section>

        <section className="offer-section offer-section--programs">
          <div className="offer-section__heading">
            <span className="offer-index">03</span>
            <h2>PERCORSI<br /><em>APPLICATI</em></h2>
          </div>
          <div className="offer-programs">
            {programs.map((program, index) => (
              <article className="offer-program" key={program.title}>
                <span className="offer-program__number">0{index + 1}</span>
                <h3>{program.title}</h3>
                <p className="offer-program__audience">{program.audience}</p>
                <p>{program.text}</p>
                <p className="offer-program__meta">{program.meta}</p>
                <a className="offer-program__arrow" href={program.href} target="_blank" rel="noreferrer" aria-label={`Scopri ${program.title}`}>↗</a>
              </article>
            ))}
          </div>
        </section>

        <section className="offer-section offer-section--data">
          <div className="offer-section__heading">
            <span className="offer-index">04</span>
            <h2>UNA MAPPA<br /><em>IN MOVIMENTO</em></h2>
          </div>
          <div className="offer-data-grid">
            <div className="offer-image-placeholder offer-image-placeholder--wide"><span>STUDIO / MATERIALI / ASCOLTO</span></div>
            <div className="offer-chart-card">
              <p className="offer-chart-card__label">MAPPA VISIVA DELLE ESPERIENZE</p>
              <div className="offer-pie" aria-label="Schema visivo delle esperienze: studio, laboratorio e collettivo"><span /></div>
              <ul className="offer-legend">
                <li><i className="legend-a" /> STUDIO <b>45%</b></li>
                <li><i className="legend-b" /> LABORATORIO <b>25%</b></li>
                <li><i className="legend-c" /> COLLETTIVO <b>30%</b></li>
              </ul>
              <p className="offer-chart-card__note">Una visualizzazione del modo in cui teoria, pratica e comunità si incontrano nei percorsi.</p>
            </div>
            <div className="offer-image-placeholder"><span>FOLEY / 001</span></div>
            <div className="offer-image-placeholder"><span>SET / 002</span></div>
          </div>
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

        <section className="offer-section offer-section--contact" id="contatti">
          <p className="offer-kicker">06 / CONTATTI</p>
          <h2>PORTA LA TUA<br /><em>IDEA.</em></h2>
          <p className="offer-contact-copy">Per informazioni e iscrizioni scrivi alla segreteria o passa a trovarci alla Fondazione The Square.</p>
          <div className="offer-contact-grid">
            <div><span>WHATSAPP</span><a href="tel:+393494640511">+39 349 464 0511</a></div>
            <div><span>EMAIL</span><a href="mailto:segreteria@opificiodimusicapplicata.com">segreteria@opificiodimusicapplicata.com</a></div>
            <div><span>INDIRIZZO</span><p>Fondazione The Square<br />Via Domenico Cirillo, 1/a<br />50132 — Firenze (FI)</p></div>
          </div>
          <a className="offer-cta offer-cta--dark" href="mailto:segreteria@opificiodimusicapplicata.com">RICHIEDI INFORMAZIONI <span>↗</span></a>
        </section>
      </div>
      <footer className="offer-footer"><span>OMA / OPIFICIO DI MUSICA APPLICATA</span><span>MONOCHROME PLATFORM / 2026</span></footer>
    </main>
  );
}
