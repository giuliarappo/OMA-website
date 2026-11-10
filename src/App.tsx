import { Route, Switch } from "wouter";
import GameCanvas from "./components/GameCanvas";
import { HUB, COSA_FACCIAMO, SALA_RITRATTI, LA_CURA_ANOMALA } from "./game/rooms";

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <GameCanvas room={HUB} />}</Route>
      <Route path="/cosa-facciamo">{() => <GameCanvas room={COSA_FACCIAMO} />}</Route>
      <Route path="/chi-siamo">{() => <GameCanvas room={SALA_RITRATTI} />}</Route>
      <Route path={"/progetti/la-cura-anomala"}>{() => <GameCanvas room={LA_CURA_ANOMALA} />}</Route>
      <Route />
    </Switch>
  );
}

export default function App() {
  return <Router />;
}