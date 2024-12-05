import AetherNexusFoeAction from './item-foe-action.mjs';

export default class AetherNexusFoeStrike extends AetherNexusFoeAction {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // schema.slot = new fields.NumberField({ required: true, initial: 1 });
    // schema.effect = new fields.HTMLField();

    return schema;
  }
}
