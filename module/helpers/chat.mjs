import { ATTACK_TYPE } from "../configs/equipment.mjs";
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
    case "inputNext":
      return getTextFromNextInput(target);
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

function getTextFromNextInput(target) {
  const name = $(target).next("input")[0].value;
  const additional = target.dataset?.tooltip ?? target.dataset.additional;
  return [name, additional];
}

const FoeStrikeTemplate = "systems/aether-nexus/templates/chat/foe-strike.hbs";
export async function createFoeStrikeChatMessage(actor, strike) {

  console.log(actor, strike);
  const damageModifierString = getModifierString(actor.system.damage);
  const aspectModifier = actor.system.aspects[strike.system.aspect]
  const aspectModifierString = getModifierString(aspectModifier);
  const templateData = {
    flavor: strike.name,
    additional: strike.system.description,
    user: game.user.id,
    bonus: aspectModifier,
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

const CharacterAttackTemplate = "systems/aether-nexus/templates/chat/character-attack.hbs";
export async function createCharacterAttackChatMessage(actor, weapon) {

  console.log(actor, weapon);
  const damageModifierString = getModifierString(weapon.bonus);
  // const aspectModifier = actor.system.aspects[strike.system.aspect]
  // const aspectModifierString = getModifierString(aspectModifier);
  const aspect = ATTACK_TYPE[weapon.system.attackType].aspect;
  const templateData = {
    item: weapon,
    user: game.user.id,
    actorId: actor.id,
    aspect: aspect,
    bonus: weapon.bonus,
    bonusString: damageModifierString
  };
  let content = await renderTemplate(CharacterAttackTemplate, templateData);
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