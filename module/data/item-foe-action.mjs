import AetherNexusItemBase from './base-item.mjs';

export default class AetherNexusFoeAction extends AetherNexusItemBase {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.actionType = new fields.StringField({ required: true });
    schema.charged = new fields.BooleanField({ initial: false });
    schema.chargeUp = new fields.SetField(new fields.NumberField({ integer: true }));

    return schema;
  }
}
