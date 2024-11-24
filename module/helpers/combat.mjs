import { ATTACK_TYPE } from "../configs/equipment.mjs";
import { rollAspect } from "./rolls.mjs";

export async function attack(actor, weapon) {
  const aspect = ATTACK_TYPE[weapon.system.attackType].aspect;
  let attackRoll = await rollAspect(actor, { aspect }, true);
  return attackRoll;
}