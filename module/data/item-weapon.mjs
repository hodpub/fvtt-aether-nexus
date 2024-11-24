import AetherNexusEquipment from './item-equipment.mjs';

export default class AetherNexusWeapon extends AetherNexusEquipment {
  static LOCALIZATION_PREFIXES = [
    'AETHER_NEXUS.Item.base',
    'AETHER_NEXUS.Item.Weapon',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.attackType = new fields.StringField({ required: true });
    schema.weaponType = new fields.StringField({ required: true });
    
    return schema;
  }
}
