export interface Member {
  id: string;
  name: string;
  role: string;
  bio: string;
  skills: [string, number][];
  weakness: string;
  thumb: string;   // quadrata, per la cornice nel gioco (caricata da Pixi)
  photo: string;   // a figura intera, per il modal (la carica il browser)
}

const TBD = "Scheda in preparazione.";

export const TEAM: Member[] = [
  { id: "bernardo", name: "Bernardo", role: "COMPOSITORE", bio: "Qualche tempo fa mi ritrovai davanti al computer con la sola idea di creare una musica nello stile dei videogiochi a 8-bit degli anni 80 e 90. Chiaramente c’era più di una maniera per fare quella musica, e non sapevo quale strada prendere. Ma quello che è uscito fuori era qualcosa di totalmente nuovo per me: mi sembrava un gioco in cui cambiare un solo dettaglio aveva conseguenze enormi sul tutto.",
    skills: [["VISIONE", 5], ["PRECISIONE", 4], ["CURIOSITA", 5]], weakness: "???",
    thumb: "/assets/ritratti/bernardo-esterno.jpg", photo: "/assets/ritratti/bernardo-esterno.jpg" },
  { id: "guglielmo", name: "Guglielmo", role: "MUSICISTA ELETTRONICO/SOUND DESIGN", bio: "Amo quando musica, arte e tecnologia dialogano tra loro. Una sera, In un letto di ostello di Amsterdam, decisi che mi sarei formato come ingegnere musicale. Negli ultimi anni Ho fatto esperienze nella programmazione e produzione di colonne sonore. Ma il maggiore entusiasmo l’ho avvertito nella partecipazione in progetti artistici collettivi. Adesso quello che desidero trasmettere con il mio lavoro è un effetto sociale sull’individuo.",
    skills: [["ENERGIA", 5], ["FANTASIA", 5], ["ISTINTO", 4]], weakness: "???",
    thumb: "/assets/ritratti/guglielmo-esterno.jpg", photo: "/assets/guglielmo-esterno.jpg" },
  { id: "giulia", name: "Giulia", role: "PROGRAMMATRICE",
    bio: "Ho provato varie cose nel mio percorso, dalla grafica al marketing, ma non ci ho mai visto un senso perché non si concretizzavano in nulla che mi interessasse. Poi sono arrivata alla programmazione, e ho scoperto che debuggare un codice era per me come un puzzle che avevo voglia di risolvere. Per me ha molto senso applicare il coding alle nostre istallazioni, perché sono reali, hanno un effetto sulle persone. ",
    skills: [["ANALISI", 5], ["CALMA", 4], ["INTUITO", 5]], weakness: "BISCOTTI DOPO MEZZANOTTE",
    thumb: "/assets/ritratti/giulia-esterno.jpeg", photo: "/assets/ritratti/giulia-esterno.jpeg" },
  { id: "antonio", name: "Antonio", role: "ARTISTA VISIVO",
    bio: "Quando avevo tre anni disegnavo persone usando cerchietti e salsicciotti, assillavo mio zio perché mi disegnasse Batman. A tredici anni ho iniziato a usare i software di grafica, durante il liceo ho iniziato a scattare foto e girare video. A ventinove anni ho chiuso il mio negozio che era diventato una prigione e mi sono trasferito a Firenze per studiare pittura in accademia e successivamente Nuovi Linguaggi Espressivi: così ho scoperto la potenza della performance art, l'esigenza affascinante di Emilio Vedova di portare la pittura 'fuori dal quadro', la combinazione di diverse discipline, di suoni e materiali per generare visioni che permeano lo spazio.",
    skills: [["PITTURA", 5], ["GRAFICA", 5], ["PERFORMANCE", 4]], weakness: "LATTOSIO",
    thumb: "/assets/ritratti/antonio-esterno.jpg", photo: "/assets/ritratti/antonio-interno.png" },
  { id: "leonardo", name: "Leonardo", role: "CANTAUTORE/CHITARRISTA", bio: "Mi hanno chiesto di scrivere che cosa mi abbia portato ad entrare in OMA e il mio contributo artistico al collettivo. Faccio un po' fatica a rispondere, anche solo a definirmi come artista. Di certo sono un grande appassionato di musica e di arte in generale. Mi affascina qualsiasi cosa possa parlarmi con linguaggi nuovi ma allo stesso tempo familiari. Semplici parole, suoni, immagini e oggetti possono avere significati molto potenti se disposti nel modo giusto.",
    skills: [["RICERCA", 5], ["ASCOLTO", 4], ["MEMORIA", 5]], weakness: "???",
    thumb: "/assets/ritratti/leonardo-esterno.jpg", photo: "/assets/1790625600775_cb0d2bcc.png" },
  { id: "giovanni", name: "Giovanni", role: "DIRETTORE ARTISTICO/COMPOSITORE", bio: "Il mio interesse nella multi-disciplinarità viene dal fatto che ho passato la prima parte della mia vita professionale lavorando come artista visivo e gli ultimi vent’anni come compositore. Il lavoro che faccio all’interno del collettivo è coordinare artisti di diverse discipline al fine di creare lavori interattivi. Spesso nel mezzo del processo creativo non sappiamo quello che succederà, e questa è la parte più emozionante del mio lavoro. ",
    skills: [["AGILITA", 5], ["CORAGGIO", 4], ["SILENZIO", 5]], weakness: "???",
    thumb: "/assets/ritratti/giovanni-esterno.jpg", photo: "/assets/ritratti/giovanni-interno.png" },
  { id: "lorenzo", name: "Lorenzo", role: "MENTORE", bio: TBD,
    skills: [["ESPERIENZA", 5], ["EQUILIBRIO", 5], ["GUIDA", 4]], weakness: "???",
    thumb: "/assets/ritratti/lorenzo-esterno.jpg", photo: "/assets/ritratti/lorenzo-interno.png" },
];