import AetherNexusItemBase from './base-item.mjs';

export default class AetherNexusEquipment extends AetherNexusItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.slot = new fields.NumberField({ required: true, initial: 1 });
    schema.effect = new fields.HTMLField();

    return schema;
  }
}
