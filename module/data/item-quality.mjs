import AetherNexusItemBase from './base-item.mjs';

export default class AetherNexusQuality extends AetherNexusItemBase {
  static LOCALIZATION_PREFIXES = [
    'AETHER_NEXUS.Item.base',
    'AETHER_NEXUS.Item.Quality',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.equipmentType = new fields.StringField({ required: true, choices: ["weapon", "shield"], initial: "weapon" });
    schema.attackType = new fields.StringField();
    schema.weaponType = new fields.StringField();
    schema.shieldType = new fields.StringField();
    schema.associated = new fields.StringField();

    schema.slotModification = new fields.NumberField({ required: true, initial: 0 });
    schema.damageBonus = new fields.NumberField({ required: true, initial: 0 });

    return schema;
  }
}
