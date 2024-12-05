import { rollAspect, rollFoeDamage } from "../helpers/rolls.mjs";

export default class AetherNexussChatMessage extends ChatMessage {
  async getHTML(...args) {
    const html = await super.getHTML();

    html.find(".foe-aspect-test").each((_, bt) => {
      bt.addEventListener("click", async (event) => {
        console.log(this);
        if (game.user.character == undefined) {
          ui.notifications.error("Select a character to roll aspect");
          return;
        }
        return rollAspect(game.user.character, event.target.dataset, false, event.target.dataset.modifier);
      });
    });

    if (!game.user.isGM) {
      html.find(".foe-damage-roll").hide();
      return html;
    }

    html.find(".foe-damage-roll").each((_, bt) => {
      bt.addEventListener("click", async (event) => { console.log(this); return rollFoeDamage(this, event.target); });
    });
    return html;
  }
}