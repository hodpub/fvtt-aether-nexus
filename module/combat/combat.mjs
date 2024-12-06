export default class AetherNexusCombat extends Combat {
  /**
   * Advance the combat to the next round
   * @returns {Promise<Combat>}
   */
  async nextRound() {
    const initiativeType = await game.settings.get("aether-nexus", "initiativeType");
    if (initiativeType == 1)
      await this.rollAllRound();
    super.nextRound();
  }

  /**
   * Roll initiative for all combatants which have not already rolled
   * @param {object} [options={}]   Additional options forwarded to the Combat.rollInitiative method
   */
  async rollAllRound(options) {
    const ids = this.combatants.reduce((ids, c) => {
      if ( c.isOwner ) ids.push(c.id);
      return ids;
    }, []);
    return this.rollInitiative(ids, options);
  }
}

export function registerCombatSettings() {
  game.settings.register("aether-nexus", "initiativeType", {
    name: "Initiative Roll Type",
    hint: "Choose which way you will use the initiative.",
    scope: "world",
    config: true,
    type: new foundry.data.fields.NumberField({
      choices: {
        0: "Roll once per combat",
        1: "Roll automatically every round"
      },
    }),
    default: 0
  });
}