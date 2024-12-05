import AetherNexusNPC from './actor-npc.mjs';

export default class AetherNexusNemeses extends AetherNexusNPC {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'AETHER_NEXUS.Actor.Nemesis',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.scheme = new fields.HTMLField();
    schema.disposition = new fields.HTMLField();
    schema.secret = new fields.HTMLField();
    schema.stratagem = new fields.HTMLField();
    schema.np = new fields.NumberField({ required: true, integer: true, initial: 0 });

    return schema;
  }

  // prepareDerivedData() {
  //   this.xp = this.cr * this.cr * 100
  // }
}
