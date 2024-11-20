import AetherNexusActorBase from './base-actor.mjs';

export default class AetherNexusCharacter extends AetherNexusActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'AETHER_NEXUS.Actor.Character',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    const diceFieldConfig = { required: true, nullable: false, initial: "0", choices: ["0", "d4", "d6", "d8", "d10", "d12"] };
    schema.dice = new fields.SchemaField({
      armor: new fields.SchemaField({
        value: new fields.StringField({ ...diceFieldConfig }),
        max: new fields.StringField({ ...diceFieldConfig }),
      }),
      nexus: new fields.SchemaField({
        value: new fields.StringField({ ...diceFieldConfig }),
        max: new fields.StringField({ ...diceFieldConfig }),
      }),
      damage: new fields.SchemaField({
        value: new fields.StringField({ ...diceFieldConfig }),
        max: new fields.StringField({ ...diceFieldConfig }),
      }),
    });

    schema.pronouns = new fields.StringField();
    schema.banner = new fields.StringField();
    schema.moniker = new fields.StringField();

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
