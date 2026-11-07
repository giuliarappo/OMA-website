import { Route, Switch } from "wouter";
import GameCanvas from "./components/GameCanvas";
import { HUB, COSA_FACCIAMO, SALA_RITRATTI } from "./game/rooms";

function Router() {
  return (
    <Switch>
      <Route path="/" />
      <Route path="/game">{() => <GameCanvas room={HUB} />}</Route>
      <Route path="/cosa-facciamo">{() => <GameCanvas room={COSA_FACCIAMO} />}</Route>
      <Route path="/chi-siamo">{() => <GameCanvas room={SALA_RITRATTI} />}</Route>
      <Route />
    </Switch>
  );
}

export default function App() {
  return <Router />;
}