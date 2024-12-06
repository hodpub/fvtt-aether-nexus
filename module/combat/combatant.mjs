export default class AetherNexusCombatant extends Combatant {
  /**
   * Get a Roll object which represents the initiative roll for this Combatant.
   * @param {string} formula        An explicit Roll formula to use for the combatant.
   * @returns {Roll}                The unevaluated Roll instance to use for the combatant.
   */
  getInitiativeRoll(formula) {
    if (this.actor.type != "character")
      return Roll.create("50");

    const aspect = Math.max(this.actor?.system.aspects.flux, this.actor?.system.aspects.aether);
    return Roll.create(`(1d20cs<${aspect})*50 + ${aspect}`);
  }
}