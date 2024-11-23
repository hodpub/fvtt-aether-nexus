import { DICE } from "../configs/dice.mjs";

export const DATA_COMMON = {
  requiredInteger: { required: true, nullable: false, integer: true }
}

export function addAspects(schema, fields, options = {}) {
  const aspect = { ...DATA_COMMON.requiredInteger, min: 0, max: 18, initial: 0, ...options };
  schema.aspects = new fields.SchemaField({
    stone: new fields.NumberField({ ...aspect }),
    flux: new fields.NumberField({ ...aspect }),
    aether: new fields.NumberField({ ...aspect }),
    hearth: new fields.NumberField({ ...aspect }),
  });
}

export function addEnergy(schema, fields, options = {}) {
  const energy = { ...DATA_COMMON.requiredInteger, min: 0, initial: 0, ...options };
  schema.energy = new fields.SchemaField({
    value: new fields.NumberField(energy),
    max: new fields.NumberField(energy),
  });
}

export function addResourceDice(schema, fields, options = {}) {
  const diceFieldConfig = { required: true, nullable: false, initial: "0", choices: DICE.options, ...options };
  schema.dice = new fields.SchemaField({
    armor: new fields.SchemaField({
      value: new fields.StringField({ ...diceFieldConfig }),
      max: new fields.StringField({ ...diceFieldConfig }),
    }),
    nexus: new fields.SchemaField({
      value: new fields.StringField({ ...diceFieldConfig }),
      max: new fields.StringField({ ...diceFieldConfig }),
    }),
    damage: new fields.SchemaField({
      value: new fields.StringField({ ...diceFieldConfig }),
      max: new fields.StringField({ ...diceFieldConfig }),
    }),
  });
}