import { Application, Container, Rectangle, Sprite, Texture } from "pixi.js";

export const HOME_BUTTON_OFF_ASSET = "/assets/tastoHOMEoff_957ab839.png";
export const HOME_BUTTON_ON_ASSET = "/assets/TastoHOMEon_310e99e4.png";
export const HOME_BUTTON_SIZE = 58;

function setSpriteTexture(sprite: Sprite, texture: Texture) {
  sprite.texture = texture;
  sprite.scale.set(
    HOME_BUTTON_SIZE / texture.width,
    HOME_BUTTON_SIZE / texture.height,
  );
}

function clearRoomReturnMarkers() {
  [
    "return-from-cura-anomala",
    "return-from-portrait-room",
    "return-from-documentation",
    "return-from-documentation-right-hole",
    "home-return-side",
    "return-to-hub",
    "return-from-hub-door",
    "hub-entry-side",
  ].forEach((key) => sessionStorage.removeItem(key));
}

export function addFixedHomeButton(
  app: Application,
  navigate: (path: string) => void,
  offTexture: Texture,
  onTexture: Texture,
) {
  const button = new Container({ label: "home-button" });
  button.scale.set(1);
  const sprite = new Sprite();
  setSpriteTexture(sprite, offTexture);
  button.addChild(sprite);
  let navigating = false;

  button.label = "home-button";
  button.eventMode = "static";
  button.cursor = "pointer";
  button.hitArea = new Rectangle(0, 0, HOME_BUTTON_SIZE, HOME_BUTTON_SIZE);
  button.zIndex = 9999;
  const activateHome = () => {
    if (navigating) return;
    navigating = true;
    setSpriteTexture(sprite, onTexture);
    clearRoomReturnMarkers();
    window.setTimeout(() => navigate("/game"), 110);
  };
  // pointerdown è intenzionale: attiva il feedback già al primo click/tap,
  // senza attendere la sequenza completa necessaria a pointertap.
  button.on("pointerdown", activateHome);
  button.on("pointertap", activateHome);

  const position = () => {
    button.position.set(Math.max(12, app.screen.width - HOME_BUTTON_SIZE - 18), 14);
    app.stage.eventMode = "static";
    app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
  };
  position();
  app.stage.sortableChildren = true;
  app.stage.addChild(button);
  return { button, sprite, position };
}
