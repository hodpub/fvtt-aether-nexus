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
    total: roll.total
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

export async function rollAspect(actor, dataset, showDialog) {

  function _getRollInfo(html, rollType) {
    return [rollType, html[0].querySelector("#modifier").value];
  }

  let [rollType, modifier] = [0, 0];
  if (showDialog)
    [rollType, modifier] = await Dialog.wait({
      title: "Rolls",
      content: `
    <form class="aether-nexus"><div class="form-group">
      <label>Modifier</label>
      <div class="form-fields">
        <input id="modifier" type="number" value="0"></input>
      </div>
    </div></form>`,
      buttons: {
        hindrance: {
          icon: `<i class="fas fa-dice-d20 red"></i>`,
          label: "Hindrance",
          callback: async (html) => _getRollInfo(html, -1)
        },
        normal: {
          icon: `<i class="fas fa-dice-d20"></i>`,
          label: "Normal",
          callback: async (html) => _getRollInfo(html, 0)
        },
        favor: {
          icon: `<i class="fas fa-dice-d20 green"></i>`,
          label: "Favor",
          callback: async (html) => _getRollInfo(html, 1)
        },
      },
      default: "normal",
      render: (html) => html[0].querySelector("#modifier").focus()
    }, { width: 400 });

  let mod = parseInt(modifier);
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
  let roll = await new Roll(`${formula} + ${mod}`).evaluate();
  let target = actor.system.aspects[dataset.aspect];

  let success = roll.total < target;

  let modString = "";
  if (mod && mod > 0)
    modString = ` + ${mod}`;
  else if (mod && mod < 0)
    modString = ` - ${Math.abs(mod)}`;

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
  //TODO: armor can have modifier (shield)
  return 0;
}

function getResourceAdditional(actor, dataset) {

  if (dataset.dice == "nexus")
    //TODO: copy the Nexus Surge to additional
    return `<h4 class="dice-total">Nexus Surge Activated</h4><div class="additional-description">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus eu lorem tincidunt, ultrices metus at, malesuada libero. Mauris a justo mi. </div>`;

  if (dataset.dice == "armor")
    return `<h4 class="dice-total">Parry Activated</h4><div class="additional-description">Gain a free melee attack or ranged attack to be used immediately.</div>`;

  return "";
}

function getDoesResourceDowngrade(dataset) {
  return dataset.dice != "damage";
}

export async function rollResource(actor, dataset) {
  const die = actor.system.dice[dataset.dice].value;
  if (die == "0")
    return;

  const maxValue = parseInt(die.substring(1));
  const modifier = getResourceModifier(actor, dataset);
  let roll = await new Roll(`1${die}+ ${modifier}`).evaluate();
  const diceRolled = roll.terms[0].values[0];
  let cssClass = "";
  let additional = "";
  let newDie = die;

  if (getDoesResourceDowngrade(dataset) && (diceRolled == 1 || diceRolled == maxValue)) {
    newDie = await downgradeDie(actor, maxValue, dataset.dice);
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
    flavor: `${die} / ${dataset.dice} Die`,
    cssClass,
    additional
  };
  await _createRollMessage(actor, templateData, roll);
  if (newDie != die)
    await actor.update({ [`system.dice.${dataset.dice}.value`]: newDie });
  return roll;
}