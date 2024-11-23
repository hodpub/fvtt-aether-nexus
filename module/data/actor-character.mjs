import AetherNexusActorBase from './base-actor.mjs';
import { addResourceDice } from './common.mjs';

export default class AetherNexusCharacter extends AetherNexusActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'AETHER_NEXUS.Actor.Character',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    addResourceDice(schema, fields);

    schema.pronouns = new fields.StringField();
    schema.banner = new fields.StringField();
    schema.moniker = new fields.StringField();
    schema.ap = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 })

    return schema;
  }

  prepareDerivedData() {
    // Loop through ability scores, and add their modifiers to our sheet output.

  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    // if (this.abilities) {
    //   for (let [k, v] of Object.entries(this.abilities)) {
    //     data[k] = foundry.utils.deepClone(v);
    //   }
    // }

    // data.lvl = this.attributes.level.value;

    return data;
  }
}
