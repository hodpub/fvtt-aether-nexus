// Import document classes.
import { AetherNexusActor } from './documents/actor.mjs';
import { AetherNexusItem } from './documents/item.mjs';
// Import sheet classes.
import { AetherNexusActorSheet } from './sheets/actor-sheet.mjs';
import { AetherNexusItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { AETHER_NEXUS } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';
import { STATUS_EFFECTS } from './configs/statusEffects.mjs';
import registerHandlebarsHelpers from './helpers/handlebars.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.aethersNexus = {
  documents: {
    AetherNexusActor,
    AetherNexusItem,
  },
  applications: {
    AetherNexusActorSheet,
    AetherNexusItemSheet,
  },
  utils: {
    rollItemMacro,
  },
  models,
};

Hooks.once('init', function () {
  // Add custom constants for configuration.
  CONFIG.AETHER_NEXUS = AETHER_NEXUS;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20 + @abilities.dex.mod',
    decimals: 2,
  };

  CONFIG.statusEffects = STATUS_EFFECTS;

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = AetherNexusActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Character/NPC as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    character: models.AetherNexusCharacter,
    npc: models.AetherNexusNPC,
  };
  CONFIG.Item.documentClass = AetherNexusItem;
  CONFIG.Item.dataModels = {
    gear: models.AetherNexusGear,
    feature: models.AetherNexusFeature,
    spell: models.AetherNexusSpell,
    kin: models.AetherNexusKin,
    frame: models.AetherNexusFrame,
    boon: models.AetherNexusBoon,
    augment: models.AetherNexusAugment,
    weapon: models.AetherNexusWeapon,
    shield: models.AetherNexusShield,
    foeTrait: models.AetherNexusFoeTrait,
    foeAction: models.AetherNexusFoeAction,
    forStrike: models.AetherNexusFoeStrike,
  };

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('aether-nexus', AetherNexusActorSheet, {
    makeDefault: true,
    label: 'AETHER_NEXUS.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('aether-nexus', AetherNexusItemSheet, {
    makeDefault: true,
    label: 'AETHER_NEXUS.SheetLabels.Item',
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

registerHandlebarsHelpers();

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createDocMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.aethernexus.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'aether-nexus.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
