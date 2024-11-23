import { addAspects, addEnergy } from "./common.mjs";

export default class AetherNexusActorBase extends foundry.abstract
  .TypeDataModel {
  static LOCALIZATION_PREFIXES = ["AETHER_NEXUS.Actor.base"];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = {};

    addAspects(schema, fields);
    addEnergy(schema, fields);

    schema.biography = new fields.HTMLField();

    return schema;
  }
}
