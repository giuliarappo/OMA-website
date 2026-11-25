import { Route, Switch } from "wouter";
import GameCanvas from "./components/GameCanvas";
import { HUB, COSA_FACCIAMO, SALA_RITRATTI, LA_CURA_ANOMALA } from "./game/rooms";
import Home from "./game/OldHomeInitialScreen";
import OffertaFormativa from "./game/rooms/contattaci";

function Router() {
  return (
    <Switch>
      <Route path="/"> <Home/> </Route>
      <Route path="/contattaci"> <OffertaFormativa/> </Route>
      <Route path="/game">{() => <GameCanvas room={HUB} />}</Route>
      <Route path="/cosa-facciamo">{() => <GameCanvas room={COSA_FACCIAMO} />}</Route>
      <Route path="/chi-siamo">{() => <GameCanvas room={SALA_RITRATTI} />}</Route>
      <Route path="/progetti/la-cura-anomala">{() => <GameCanvas room={LA_CURA_ANOMALA} />}</Route>
      
    </Switch>
  );
}

export default function App() {
  return <Router />;
}