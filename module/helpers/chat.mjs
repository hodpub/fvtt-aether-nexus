export async function sendToChat(actor, target) {
  const labelText = $(target).text();
  console.log(target.dataset);
  const additional = target.dataset.tooltip;
  const content = `
<div class="aether-nexus">
  <h2>${labelText}</h2>
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