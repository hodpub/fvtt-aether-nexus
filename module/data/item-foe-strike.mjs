import AetherNexusFoeAction from './item-foe-action.mjs';

export default class AetherNexusFoeStrike extends AetherNexusFoeAction {
  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.aspect = new fields.StringField({ required: true });
    schema.target = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 1 });
    schema.attackType = new fields.StringField({ required: true });
    schema.damage = new fields.StringField({ required: true });
    schema.testAspect = new fields.StringField();
    schema.testDescription = new fields.HTMLField();

    return schema;
  }
}
