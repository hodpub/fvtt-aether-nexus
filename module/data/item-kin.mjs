import AetherNexusItemBase from './base-item.mjs';

export default class AetherNexusKin extends AetherNexusItemBase {
  static LOCALIZATION_PREFIXES = [
    'AETHER_NEXUS.Item.base',
    'AETHER_NEXUS.Item.Kin',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.uniqueTrait = new fields.HTMLField();
    schema.nexusSurge = new fields.HTMLField();

    return schema;
  }
}
