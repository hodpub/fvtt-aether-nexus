import { DATA_COMMON } from "./common.mjs";

export default class AetherNexusActorBase extends foundry.abstract
  .TypeDataModel {
  static LOCALIZATION_PREFIXES = ["AETHER_NEXUS.Actor.base"];

  static defineSchema() {
    const fields = foundry.data.fields;

    const schema = {};

    const aspect = { ...DATA_COMMON.requiredInteger, min: 0, max: 18, initial: 0 };
    schema.aspects = new fields.SchemaField({
      stone: new fields.NumberField({ ...aspect }),
      flux: new fields.NumberField({ ...aspect }),
      aether: new fields.NumberField({ ...aspect }),
      hearth: new fields.NumberField({ ...aspect }),
    });

    schema.energy = new fields.SchemaField({
      value: new fields.NumberField({
        ...DATA_COMMON.requiredInteger,
        min: 0,
        initial: 0
      }),
      max: new fields.NumberField({
        ...DATA_COMMON.requiredInteger,
        min: 0,
        initial: 0
      }),
    });

    // schema.health = new fields.SchemaField({
    //   value: new fields.NumberField({
    //     ...requiredInteger,
    //     initial: 10,
    //     min: 0,
    //   }),
    //   max: new fields.NumberField({ ...requiredInteger, initial: 10 }),
    // });
    // schema.power = new fields.SchemaField({
    //   value: new fields.NumberField({ ...requiredInteger, initial: 5, min: 0 }),
    //   max: new fields.NumberField({ ...requiredInteger, initial: 5 }),
    // });
    schema.biography = new fields.HTMLField();

    return schema;
  }
}
