import { rollAspect, rollDamage, rollFoeDamage } from "../helpers/rolls.mjs";

export default class AetherNexussChatMessage extends ChatMessage {
  async getHTML(...args) {
    const html = await super.getHTML();
    console.log(this);

    html.find(".foe-aspect-test").each((_, bt) => {
      bt.addEventListener("click", async (event) => {
        const actor = game.user.character ?? game.canvas.tokens.controlled[0]?.actor;
        if (actor == undefined) {
          ui.notifications.error("Select a character to roll aspect");
          return;
        }

        return rollAspect(actor, event.target.dataset, !event.shiftKey, event.target.dataset.modifier);
      });
    });

    if (!this.isOwner) {
      html.find(".foe-damage-roll").hide();
      html.find(".character-damage-roll").hide();
      html.find(".character-aspect-test").hide();
      return html;
    }

    html.find(".foe-damage-roll").each((_, bt) => {
      bt.addEventListener("click", async (event) => { console.log(this); return rollFoeDamage(this, event.target); });
    });

    html.find(".character-damage-roll").each((_, bt) => {
      bt.addEventListener("click", async (event) => {
        const actor = game.user.character ?? game.canvas.tokens.controlled[0]?.actor;
        if (actor == undefined) {
          ui.notifications.error("Select a character to roll damage");
          return;
        }
        console.log(this);
        return rollDamage(actor, event.target.dataset, !event.shiftKey);
      });
    });

    html.find(".character-aspect-test").each((_, bt) => {
      bt.addEventListener("click", async (event) => {
        const actor = game.user.character ?? game.canvas.tokens.controlled[0]?.actor;
        if (actor == undefined) {
          ui.notifications.error("Select a character to roll aspect");
          return;
        }
        console.log(this);
        return rollAspect(actor, event.target.dataset, !event.shiftKey);
      });
    });
    return html;
  }
}