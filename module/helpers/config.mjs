import * as DICE from "../configs/dice.mjs";
import * as EQUIPMENT from "../configs/equipment.mjs";
import * as FOE from "../configs/foe.mjs";

export const AETHER_NEXUS = {
  FOE,
  EQUIPMENT,
  DICE
};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
AETHER_NEXUS.abilities = {
  str: 'AETHER_NEXUS.Ability.Str.long',
  dex: 'AETHER_NEXUS.Ability.Dex.long',
  con: 'AETHER_NEXUS.Ability.Con.long',
  int: 'AETHER_NEXUS.Ability.Int.long',
  wis: 'AETHER_NEXUS.Ability.Wis.long',
  cha: 'AETHER_NEXUS.Ability.Cha.long',
};

AETHER_NEXUS.abilityAbbreviations = {
  str: 'AETHER_NEXUS.Ability.Str.abbr',
  dex: 'AETHER_NEXUS.Ability.Dex.abbr',
  con: 'AETHER_NEXUS.Ability.Con.abbr',
  int: 'AETHER_NEXUS.Ability.Int.abbr',
  wis: 'AETHER_NEXUS.Ability.Wis.abbr',
  cha: 'AETHER_NEXUS.Ability.Cha.abbr',
};

AETHER_NEXUS