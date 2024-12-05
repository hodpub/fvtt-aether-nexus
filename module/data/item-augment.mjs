import AetherNexusItemBase from './base-item.mjs';

export default class AetherNexusAugment extends AetherNexusItemBase {
  static LOCALIZATION_PREFIXES = [
    'AETHER_NEXUS.Item.base',
    'AETHER_NEXUS.Item.Augment',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.ability1Name = new fields.StringField({ required: true });
    schema.ability1Description = new fields.HTMLField();
    schema.ability1Unlocked = new fields.BooleanField({ initial: false });
    schema.ability2Name = new fields.StringField({ required: true });
    schema.ability2Description = new fields.HTMLField();
    schema.ability2Unlocked = new fields.BooleanField({ initial: false });

    return schema;
  }
}
