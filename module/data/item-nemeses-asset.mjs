import AetherNexusItemBase from './base-item.mjs';

export default class AetherNexusNemesesAsset extends AetherNexusItemBase {
  static LOCALIZATION_PREFIXES = [
    'AETHER_NEXUS.Item.base',
    'AETHER_NEXUS.Item.Asset',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.cost = new fields.NumberField({ required: true, integer: true, initial: 1 });

    return schema;
  }
}
