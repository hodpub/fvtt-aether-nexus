import AetherNexusActorBase from './base-actor.mjs';
import { addResourceDice } from './common.mjs';

export default class AetherNexusCharacter extends AetherNexusActorBase {
  static LOCALIZATION_PREFIXES = [
    ...super.LOCALIZATION_PREFIXES,
    'AETHER_NEXUS.Actor.Character',
  ];

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    addResourceDice(schema, fields);

    schema.pronouns = new fields.StringField();
    schema.banner = new fields.StringField();
    schema.moniker = new fields.StringField();
    schema.ap = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 });
    schema.slots = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 2 });
    schema.maxShields = new fields.NumberField({ required: true, nullable: false, integer: true, initial: 1 });

    return schema;
  }

  prepareDerivedData() {
    // Loop through ability scores, and add their modifiers to our sheet output.

  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    // if (this.abilities) {
    //   for (let [k, v] of Object.entries(this.abilities)) {
    //     data[k] = foundry.utils.deepClone(v);
    //   }
    // }

    // data.lvl = this.attributes.level.value;

    return data;
  }

  async createEquipment(itemData) {
    let usedSlots = 0;
    const currentSlot = itemData.system.slot || itemData.system.slotModification;

    const actor = this.parent;
    let equipments = actor.items.filter(it => it.type == "weapon" || it.type == "shield");
    for (const e of equipments) {
      usedSlots += e.system.slot;
    }
    let qualities = actor.items.filter(it => it.type == "quality");
    for (const quality of qualities) {
      usedSlots += quality.system.slotModification;
    }
    console.log(usedSlots, actor.system.slots, itemData);
    if (usedSlots + currentSlot > actor.system.slots) {
      ui.notifications.error("You don't have enough slots to store this equipment.");
      return null;
    }
    return await actor.createEmbeddedDocuments('Item', [itemData]);
  }
}
