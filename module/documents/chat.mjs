import { rollAspect, rollFoeDamage } from "../helpers/rolls.mjs";

export default class AetherNexussChatMessage extends ChatMessage {
  async getHTML(...args) {
    const html = await super.getHTML();

    html.find(".foe-aspect-test").each((_, bt) => {
      bt.addEventListener("click", async (event) => {
        const actor = game.user.character ?? game.canvas.tokens.controlled[0]?.actor;
        if (actor == undefined) {
          ui.notifications.error("Select a character to roll aspect");
          return;
        }

        return rollAspect(actor, event.target.dataset, false, event.target.dataset.modifier);
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