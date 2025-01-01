import { DICE } from "../configs/dice.mjs";
import { SHIELD_TYPE } from "../configs/equipment.mjs";

const RollTemplate = "systems/aether-nexus/templates/chat/roll.hbs";

async function _createRollMessage(actor, data, roll) {
  let tooltip = await roll.getTooltip();
  tooltip = tooltip.replace("d20 min", "d20 minTemp");
  tooltip = tooltip.replace("d20 max", "d20 min");
  tooltip = tooltip.replace("d20 minTemp", "d20 max");

  let templateData = {
    ...data,
    user: game.user.id,
    rolls: [roll],
    actorId: actor.id,
    tooltip: tooltip,
    total: Math.max(Math.min(roll.total, 20), 1)
  };

  console.log(templateData);
  let content = await renderTemplate(RollTemplate, templateData);

  let chatData = {
    user: game.user.id,
    speaker: {
      actor: actor.id,
      token: actor.token,
      alias: actor.name
    },
    content
  };

  await game.dice3d?.showForRoll(roll, game.user, true);
  await ChatMessage.create(chatData);
}

function _getRollInfo(html, rollType) {
  return [rollType, parseInt(html[0].querySelector("#modifier").value)];
}

async function _getModifierAndRollType(title, showDialog, modifier = 0, buttonList = ["hindrance", "favor"]) {
  if (!showDialog)
    return [0, modifier];

  let buttons = {
    normal: {
      icon: `<i class="fas fa-dice-d20"></i>`,
      label: "Normal",
      callback: async (html) => _getRollInfo(html, 0)
    }
  };

  if (buttonList.indexOf("hindrance") > -1) {
    buttons = Object.assign(
      {
        hindrance:
        {
          icon: `<i class="fas fa-dice-d20 red"></i>`,
          label: "Hindrance",
          callback: async (html) => _getRollInfo(html, -1)
        }
      }, buttons);
  }
  if (buttonList.indexOf("unarmed") > -1) {
    buttons = Object.assign(
      {
        unarmed:
        {
          icon: `<i class="fas fa-hand-fist red"></i>`,
          label: "Unarmed",
          callback: async (html) => _getRollInfo(html, -100)
        }
      }, buttons);
  }
  if (buttonList.indexOf("favor") > -1) {
    buttons["favor"] = {
      icon: `<i class="fas fa-dice-d20 green"></i>`,
      label: "Favor",
      callback: async (html) => _getRollInfo(html, 1)
    };
  }
  if (buttonList.indexOf("critical") > -1) {
    buttons["critical"] = {
      icon: `<i class="fas fa-dice-d20 green"></i>`,
      label: "Critical",
      callback: async (html) => _getRollInfo(html, 100)
    };
  }

  title = game.i18n.localize(`AETHER_NEXUS.${title}`);
  return await Dialog.wait({
    title: `Roll ${title}`,
    content: `
<form class="aether-nexus"><div class="form-group">
  <label>Modifier</label>
  <div class="form-fields">
    <input id="modifier" type="number" onfocus="this.select()" value="${modifier}"></input>
  </div>
</div></form>`,
    buttons: buttons,
    default: "normal",
    // render: (html) => html[0].querySelector("#modifier").focus()
  }, { width: 400 });
}

export function getModifierString(modifier) {
  if (!modifier)
    return "";

  if (modifier > 0)
    return ` + ${modifier}`;
  else if (modifier < 0)
    return ` - ${Math.abs(modifier)}`;

  return "";
}

export async function rollAspect(actor, dataset, showDialog, defaultModifier = 0) {
  let [rollType, modifier] = await _getModifierAndRollType(`Aspect.${dataset.aspect}`, showDialog, defaultModifier);

  let rollTypeText = "";
  let formula = "1d20";
  if (rollType == -1) {
    formula = "2d20kh";
    rollTypeText = "Hidrance ";
  }
  else if (rollType == 1) {
    formula = "2d20kl"
    rollTypeText = "Favor ";
  }
  let roll = await new Roll(`${formula} + ${modifier}`).evaluate();
  let target = actor.system.aspects[dataset.aspect];

  let success = roll.total < target;


  const modString = getModifierString(modifier);
  let rollResult = success ? "success" : "failure";
  const diceRolled = roll.terms[0].values[0];
  const criticalSuccessValue = 1; // Get from actor because of weapons that change that
  const criticalFailureValue = 20; // Get from actor

  if (diceRolled <= criticalSuccessValue) {
    rollResult = "Triumph";
  }
  else if (diceRolled >= criticalFailureValue) {
    rollResult = "Despair";
  }

  const templateData = {
    flavor: `${rollTypeText}D20${modString} / ${target} ${dataset.aspect}`,
    rollResult: rollResult,
    cssClass: success ? "success" : "failure",
  };
  await _createRollMessage(actor, templateData, roll);

  return roll;
}

async function downgradeDie(actor, maxValue, property) {
  let newDie = `d${maxValue - 2}`;
  if (newDie == "d2")
    newDie = "0";

  return newDie;
}

function getResourceModifier(actor, dataset) {
  if (dataset.dice == "armor") {
    let bonus = 0;
    let shields = actor.items.filter(it => it.type == "shield");
    for (const shield of shields) {
      bonus += SHIELD_TYPE[shield.system.shieldType].bonus;
      for (const quality of shield.qualities) {
        bonus += quality.system.damageBonus;
      }
    }
    console.log("BONUS", bonus);
    return bonus;
  }
  if (dataset.bonus != undefined)
    return dataset.bonus;

  return 0;
}

function getResourceAdditional(actor, dataset) {

  if (dataset.dice == "nexus") {
    const nexusSurge = actor.items.filter(it => it.type == "kin")[0];
    return `<h4 class="dice-total">Nexus Surge Activated<br>${nexusSurge.system.nexusSurgeName}</h4><div class="additional-description">${nexusSurge.system.nexusSurge}</div>`;

  }
  if (dataset.dice == "armor")
    return `<h4 class="dice-total">Parry Activated</h4><div class="additional-description">Gain a free melee attack or ranged attack to be used immediately.</div>`;

  return "";
}

function getDoesResourceDowngrade(dataset) {
  return dataset.dice != "damage";
}

export async function rollResource(actor, dataset, showDialog) {
  let resourceName = dataset.dice;
  if (resourceName == "catalyst")
    resourceName = "nexus";
  const die = actor.system.dice[resourceName].value;
  if (die == "0")
    return;

  const defaultModifier = getResourceModifier(actor, dataset);
  let [_, modifier] = await _getModifierAndRollType(`Resource.${dataset.dice}`, showDialog, defaultModifier, []);

  const maxValue = parseInt(die.substring(1));
  const modString = getModifierString(modifier);
  let roll = await new Roll(`1${die}+ ${modifier}`).evaluate();
  const diceRolled = roll.terms[0].values[0];
  let cssClass = "";
  let additional = "";
  let newDie = die;

  if (getDoesResourceDowngrade(dataset) && (diceRolled == 1 || diceRolled == maxValue)) {
    newDie = await downgradeDie(actor, maxValue, resourceName);
    additional = `<h4 class="dice-total">Downgrading to ${newDie}</h4>`;
  }

  if (diceRolled == 1) {
    cssClass = "failure";
  }
  else if (diceRolled == maxValue) {
    cssClass = "success";
    additional += getResourceAdditional(actor, dataset);
  }
  const templateData = {
    flavor: `${die}${modString} / ${dataset.dice} Die`,
    cssClass,
    additional
  };
  await _createRollMessage(actor, templateData, roll);
  if (newDie != die) {
    await actor.update({ [`system.dice.${resourceName}.value`]: newDie });
    if (newDie == "0" && !actor.statuses.has("severed")) {
      let status = await ActiveEffect.fromStatusEffect("severed");
      await actor.createEmbeddedDocuments("ActiveEffect", [status]);
    }
  }
  return roll;
}

export async function rollDamage(actor, dataset, showDialog) {
  const die = actor.system.dice.damage.value;
  if (die == "0")
    return;

  const defaultModifier = getResourceModifier(actor, dataset);
  let [rollType, modifier] = await _getModifierAndRollType(`Resource.damage`, showDialog, defaultModifier, ['unarmed', 'critical']);

  const maxValue = parseInt(die.substring(1));
  const modString = getModifierString(modifier);
  const multiplier = 1;
  let formula = `1${die}+ ${modifier}`;
  let rollTypeText = "";
  if (rollType == 100) {
    formula = `(${formula}) * 2`;
    rollTypeText = "CRITICAL "
  }
  else if (rollType == -100) {
    let diceIndex = DICE.options.indexOf(die) - 1;
    let newDie = DICE.options[diceIndex];
    if (newDie == "0") {
      ui.notifications.error("Cannot do unarmed attack when damage die is d4.");
      return;
    }
    formula = `1${newDie}+ ${modifier}`;
    rollTypeText = "UNARMED ";
  }
  let roll = await new Roll(formula).evaluate();
  console.log("ROLL DAMAGE", roll);
  const diceRolled = roll.dice[0].values[0];
  let cssClass = "";
  let additional = "";

  if (diceRolled == 1) {
    cssClass = "failure";
  }
  else if (diceRolled == maxValue) {
    cssClass = "success";
    additional += getResourceAdditional(actor, dataset);
  }
  const templateData = {
    flavor: `${rollTypeText}${die}${modString} / Damage Die`,
    cssClass,
    additional
  };
  await _createRollMessage(actor, templateData, roll);
  return roll;
}

export async function rollFoeDamage(chat, target) {
  const data = target.dataset;

  let roll = await new Roll(data.formula).evaluate();

  const templateData = {
    flavor: `${data.attack}<br>Damage: ${data.formula}`
  };
  const actor = {
    id: chat.speaker.actor,
  }
  await _createRollMessage(actor, templateData, roll);
  return roll;
}