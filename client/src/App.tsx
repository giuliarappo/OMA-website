import { useEffect } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { preloadGameSounds } from "./lib/gameAudio";
import Home from "./pages/Home";
import Hub from "./pages/Hub";
import Room01 from "./pages/Room01";
import Room02 from "./pages/Room02";
import Room03 from "./pages/Room03";
import IntermediateRoom from "./pages/IntermediateRoom";
import OffertaFormativa from "./pages/OffertaFormativa";
import Game from "./pages/Game";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/game" component={Game} />
      <Route path="/hub" component={Hub} />
      <Route path="/room-01" component={Room01} />
      <Route path="/room-02" component={Room02} />
      <Route path="/room-03" component={Room03} />
      <Route path="/stanza-intermedia" component={IntermediateRoom} />
      <Route path="/offerta-formativa" component={OffertaFormativa} />
      <Route component={Home} />
    </Switch>
  );
}

export default function App() {
  useEffect(() => {
    preloadGameSounds();
  }, []);

  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}
