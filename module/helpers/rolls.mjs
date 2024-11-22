const RollTemplate = "systems/aether-nexus/templates/chat/roll.hbs";

export async function rollAspect(actor, dataset) {
  let mod = -2;
  let roll = await new Roll(`1d20 + ${mod}`).evaluate();
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

  const templateData = {
    // type: CONST.CHAT_MESSAGE_STYLES.ROLL,
    flavor: `D20${modString} / ${target} ${dataset.aspect}`,
    user: chatData.user,
    tooltip: await roll.getTooltip(),
    total: roll.total,// isPrivate ? "?" : Math.round(roll.total * 100) / 100,
    rollResult: success ? "success" : "failure",// isPrivate ? "?" : rollResult.textKey,
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