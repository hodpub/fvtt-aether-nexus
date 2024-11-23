import AetherNexusItemBase from './base-item.mjs';
import { addAspects, addEnergy, addResourceDice } from './common.mjs';

export default class AetherNexusFrame extends AetherNexusItemBase {
  static LOCALIZATION_PREFIXES = [
    'AETHER_NEXUS.Item.base',
    'AETHER_NEXUS.Item.Frame',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    addAspects(schema, fields);
    addEnergy(schema, fields);
    addResourceDice(schema, fields);

    schema.frameAbility1Name = new fields.StringField({ required: true });
    schema.frameAbility1Description = new fields.HTMLField();
    schema.frameAbility2Name = new fields.StringField({ required: true });
    schema.frameAbility2Description = new fields.HTMLField();

    schema.biography = new fields.HTMLField();
    schema.frameTitle = new fields.StringField({ required: true });

    return schema;
  }
}
