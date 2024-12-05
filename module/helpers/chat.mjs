import { getModifierString } from "./rolls.mjs";

export async function sendToChat(actor, target) {
  const [name, additional] = getText(target);
  const content = `
<div class="aether-nexus">
  <h2>${name}</h2>
  <div class="additional-description">
    ${additional}
  </div>
</div>
  `;

  const chatData = {
    user: game.user.id,
    speaker: {
      actor: actor.id,
      token: actor.token,
      alias: actor.name
    },
    content
  }

  await ChatMessage.create(chatData);
}

function getText(target) {
  const targetType = target.dataset?.targetType ?? target.tagName.toLowerCase();
  switch (targetType) {
    case "label":
      return getTextFromLabel(target);
    case "input":
      return getTextFromInput(target);
    default:
      throw new Error(`Type "${target.type}" not handled.`);
  }
}

function getTextFromLabel(target) {
  const name = $(target).text();
  const additional = target.dataset.tooltip ?? target.dataset.additional;
  return [name, additional];
}

function getTextFromInput(target) {
  const name = $(target).value();
  const additional = target.dataset?.tooltip ?? target.dataset.additional;
  return [name, additional];
}

const FoeStrikeTemplate = "systems/aether-nexus/templates/chat/foe-strike.hbs";
export async function createFoeStrikeChatMessage(actor, strike) {

  console.log(actor, strike);
  const damageModifierString = getModifierString(actor.system.damage);
  const aspectModifierString = getModifierString(actor.system.aspects[strike.system.aspect]);
  const templateData = {
    flavor: strike.name,
    additional: strike.system.description,
    user: game.user.id,
    formula: `${strike.system.damage}${damageModifierString}`,
    actorId: actor.id,
    aspect: strike.system.aspect,
    modifier: aspectModifierString,
    additionalTest: strike.system.testAspect
  };
  let content = await renderTemplate(FoeStrikeTemplate, templateData);
  const chatData = {
    user: game.user.id,
    speaker: {
      actor: actor.id,
      token: actor.token,
      alias: actor.name
    },
    content
  };

  await ChatMessage.create(chatData);
}