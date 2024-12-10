import AetherNexusActorBase from './base-actor.mjs';

export default class AetherNexusNPC extends AetherNexusActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'AETHER_NEXUS.Actor.NPC',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.aspects.fields.stone.min = -10;
    schema.aspects.fields.flux.min = -10;
    schema.aspects.fields.aether.min = -10;
    schema.aspects.fields.hearth.min = -10;

    schema.damage = new fields.NumberField({ required: true, integer: true, initial: 0 });
    schema.threat = new fields.StringField({ required: true, initial: "minor" });

    return schema;
  }

  // prepareDerivedData() {
  //   this.xp = this.cr * this.cr * 100
  // }
}
