const RollTemplate = "systems/aether-nexus/templates/chat/roll.hbs";

export async function rollAspect(actor, dataset, showDialog) {

  function _getRollInfo(html, rollType) {
    return [rollType, html[0].querySelector("#modifier").value];
  }

  let [rollType, modifier] = [0, 0];
  if (showDialog)
    [rollType, modifier] = await Dialog.wait({
      title: "Rolls",
      content: `
    <form><div class="form-group">
      <label>Modifier</label>
      <div class="form-fields">
        <input id="modifier" type="number" value="0"></input>
      </div>
    </div></form>`,
      buttons: {
        hindrance: {
          icon: `<i class="fas fa-poo-storm"></i>`,
          label: "Hindrance",
          callback: async (html) => _getRollInfo(html, -1)
        },
        normal: {
          icon: `<i class="fas fa-poo-storm"></i>`,
          label: "Normal",
          callback: async (html) => _getRollInfo(html, 0)
        },
        favor: {
          icon: `<i class="fas fa-poo-storm"></i>`,
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

  let chatData = {
    user: game.user.id,
    speaker: {
      actor: actor.id,
      token: actor.token,
      alias: actor.name
    }
  };

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
    rollResult = "Critical Success";
  }
  else if (diceRolled >= criticalFailureValue) {
    rollResult = "Critical Failure";
  }

  const templateData = {
    // type: CONST.CHAT_MESSAGE_STYLES.ROLL,
    flavor: `${rollTypeText}D20${modString} / ${target} ${dataset.aspect}`,
    user: chatData.user,
    tooltip: await roll.getTooltip(),
    total: roll.total,// isPrivate ? "?" : Math.round(roll.total * 100) / 100,
    rollResult: rollResult,// isPrivate ? "?" : rollResult.textKey,
    cssClass: success ? "success" : "failure",// rollResult.cssClass,
    // damageKey: isPrivate ? "?" : rollResult.resultKey,
    // damage: isPrivate ? null : rollResult.resultValue,
    // rollStyle: isPrivate ? null : rollResult.rollStyle,
    rolls: [roll],
    data: dataset,
    actorId: actor.id
  };
  let content = await renderTemplate(RollTemplate, templateData);
  chatData.content = content;

  console.log(roll, actor, success, chatData, templateData, content);
  await game.dice3d?.showForRoll(roll, game.user, true);
  await ChatMessage.create(chatData);

  return roll;
}