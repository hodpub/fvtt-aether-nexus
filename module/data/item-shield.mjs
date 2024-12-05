import AetherNexusEquipment from './item-equipment.mjs';

export default class AetherNexusShield extends AetherNexusEquipment {
  static LOCALIZATION_PREFIXES = [
    'AETHER_NEXUS.Item.base',
    'AETHER_NEXUS.Item.Shield',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.shieldType = new fields.StringField({ required: true });
    
    return schema;
  }
}
