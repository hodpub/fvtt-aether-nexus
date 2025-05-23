import { createCharacterAttackChatMessage, sendToChat } from '../helpers/chat.mjs';
import { attack } from '../helpers/combat.mjs';
import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { rollAspect, rollDamage, rollResource } from '../helpers/rolls.mjs';
import { AetherNexusBaseActorSheet } from './base-actor-sheet.mjs';

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class AetherNexusActorSheet extends AetherNexusBaseActorSheet {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['aether-nexus', 'actor', 'character'],
    position: {
      width: 1056,
      height: 816,
    },
    actions: {
      onEditImage: this._onEditImage,
      viewDoc: this._viewDoc,
      createDoc: this._createDoc,
      deleteDoc: this._deleteDoc,
      toggleEffect: this._toggleEffect,
      roll: this._onRoll,
      sendToChat: this._sendToChat,
      respite: this._respite,
      attack: this._attack,
      changeSheetSize: this._changeSheetSize,
      toggleEditPlayMode: this._toggleEditPlayMode,
      toggleShowConditions: this._toggleShowConditions,
      closeShowConditions: this._closeShowConditions,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
    window: {
      controls: [
        {
          icon: "fa-solid fa-bed",
          label: "Respite",
          action: "respite"
        },
        {
          icon: "fa-solid fa-viruses",
          label: "Show Conditions",
          action: "toggleShowConditions"
        },
        {
          icon: "fas fa-play-pause",
          label: "Toggle Edit/Play mode",
          action: "toggleEditPlayMode"
        },
        {
          icon: "fas fa-maximize",
          label: "Change Sheet Size",
          action: "changeSheetSize"
        },
        {
          icon: "control-icon fa-fw fa-solid fa-user-circle",
          label: "Prototype Token",
          action: "configurePrototypeToken"
        }
      ]
    }
  };

  /** @override */
  static PARTS = {
    header: {
      template: 'systems/aether-nexus/templates/actor/header.hbs',
    },
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    biography: {
      template: 'systems/aether-nexus/templates/actor/biography.hbs',
    },
    aspects: {
      template: 'systems/aether-nexus/templates/actor/aspects.hbs',
    },
    resources: {
      template: 'systems/aether-nexus/templates/actor/resources.hbs',
    },
    general: {
      template: 'systems/aether-nexus/templates/actor/general.hbs',
    },
    traits: {
      template: 'systems/aether-nexus/templates/actor/traits.hbs',
    },
    augments: {
      template: 'systems/aether-nexus/templates/actor/augments.hbs',
    },
    equipments: {
      template: 'systems/aether-nexus/templates/actor/equipments.hbs',
    },
    effects: {
      template: 'systems/aether-nexus/templates/actor/effects.hbs',
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['biography', 'aspects', 'resources', 'general', 'traits', 'augments', 'equipments', 'effects'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    // Output initialization
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      owner: this.document.isOwner,
      limited: this.document.limited,
      // Add the actor document.
      actor: this.actor,
      // Add the actor's data to context.data for easier access, as well as flags.
      system: this.actor.system,
      flags: this.actor.flags,
      // Adding a pointer to CONFIG.AETHER_NEXUS
      config: CONFIG.AETHER_NEXUS,
      tabs: this._getTabs(options.parts),
      // Necessary for formInput and formFields helpers
      fields: this.document.schema.fields,
      systemFields: this.document.system.schema.fields,
    };

    // Offloading context prep to a helper function
    this._prepareItems(context);

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'traits':
        context.tab = context.tabs[partId];
        break;
      case 'biography':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        break;
      case 'effects':
        context.tab = context.tabs[partId];
        // Prepare active effects
        context.effects = prepareActiveEffectCategories(
          // A generator that returns all effects stored on the actor
          // as well as any items
          this.actor.allApplicableEffects()
        );
        break;
    }
    return context;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'biography';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'AETHER_NEXUS.Actor.Tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        case 'biography':
          tab.id = 'biography';
          tab.label += 'Biography';
          break;
        case 'effects':
          tab.id = 'effects';
          tab.label += 'Effects';
          break;
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    const traits = [];
    const augments = [];
    const equipments = [];
    const qualities = [];

    // Iterate through items, allocating to containers
    for (let i of this.document.items) {
      if (i.type == "kin") {
        context.kin = i;
        continue;
      }
      else if (i.type == "frame") {
        context.frame = i;
        continue;
      }
      else if (i.type == "boon") {
        traits.push(i);
        continue;
      }
      else if (i.type == "augment") {
        augments.push(i);
        continue;
      }
      else if (i.type == "weapon" || i.type == "shield") {
        i.bonus = 0;
        equipments.push(i);
        continue;
      }
      else if (i.type == "quality") {
        qualities.push(i);
        continue;
      }
    }

    for (const equipment of equipments) {
      const currentQualities = qualities.filter(x => x.system.associated == equipment.id);
      equipment.qualities = currentQualities;

      for (const quality of currentQualities) {
        equipment.bonus += quality.system.damageBonus;
      }
    }

    // Sort then assign
    context.traits = traits.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.augments = augments;
    context.equipments = equipments;
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   * @override
   */
  _onRender(context, options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    this.#disableOverrides();
    this._checkEditPlayMode(context, options);
    // You may want to add other special handling here
    // Foundry comes with a large number of utility classes, e.g. SearchFilter
    // That you may want to implement yourself.
  }

  /**************
   *
   *   ACTIONS
   *
   **************/

  /**
   * Handle changing a Document's image.
   *
   * @this AetherNexusActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise}
   * @protected
   */
  static async _onEditImage(event, target) {
    const attr = target.dataset.edit;
    const current = foundry.utils.getProperty(this.document, attr);
    const { img } =
      this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ??
      {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.document.update({ [attr]: path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });
    return fp.browse();
  }

  /**
   * Renders an embedded document's sheet
   *
   * @this AetherNexusActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewDoc(event, target) {
    this._viewDoc(event, target);
  }

  async _viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render(true);
  }

  /**
   * Handles item deletion
   *
   * @this AetherNexusActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteDoc(event, target) {
    return this._deleteDoc(event, target);
  }

  async _deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    await doc.delete();
    if (!doc.qualities)
      return;

    for (const quality of doc.qualities) {
      const q = this.actor.items.get(quality.id);
      await q.delete();
    }
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this AetherNexusActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createDoc(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);
    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
  }

  /**
   * Determines effect parent to pass to helper
   *
   * @this AetherNexusActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /**
   * Handle clickable rolls.
   *
   * @this AetherNexusActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    const dataset = target.dataset;

    // Handle item rolls.
    switch (dataset.rollType) {
      case 'item':
        const item = this._getEmbeddedDocument(target);
        if (item) return item.roll();
      case 'aspects':
        return rollAspect(this.actor, dataset, !event.shiftKey);
      case 'damage':
        return rollDamage(this.actor, dataset, !event.shiftKey);
      case 'resources':
        return rollResource(this.actor, dataset, !event.shiftKey);
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  static async _sendToChat(event, target) {
    event.preventDefault();
    await sendToChat(this.actor, target);
  }

  static async _respite(event) {
    event.preventDefault();
    await this.actor.update({
      "system.dice.damage.value": this.actor.system.dice.damage.max,
      "system.dice.nexus.value": this.actor.system.dice.nexus.max,
      "system.dice.armor.value": this.actor.system.dice.armor.max,
      "system.energy.value": this.actor.system.energy.max,
    });
    const effects = this.actor.effects;
    for (const e of effects) {
      await e.delete();
    }
  }

  static async _changeSheetSize(event) {
    event.preventDefault();
    this.toggleControls();
    const newScale = this.position.scale == 1 ? 0.5 : 1;
    this.setPosition({
      scale: newScale,
    });
  }

  async _checkEditPlayMode(context, options) {
    if (context.system.aspects.stone == 0 ||
      context.system.aspects.flux == 0 ||
      context.system.aspects.aether == 0 ||
      context.system.aspects.hearth == 0 ||
      context.system.dice.armor.max == 0 ||
      context.system.dice.nexus.max == 0 ||
      context.system.dice.damage.max == 0 ||
      context.system.energy.max == 0
    )
      this.element.classList.add("edit-mode");
    else
      this.element.classList.remove("edit-mode");
  }

  static async _toggleEditPlayMode(event) {
    event.preventDefault();
    this.toggleControls();
    this.element.classList.toggle("edit-mode");
  }

  static async _toggleShowConditions(event) {
    event.preventDefault();
    this.toggleControls();
    this.element.classList.add("showConditions");
  }

  static async _closeShowConditions(event) {
    event.preventDefault();
    this.element.classList.remove("showConditions");
  }

  static async _attack(event, target) {
    event.preventDefault();
    const doc = this._getEmbeddedDocument(target);

    return createCharacterAttackChatMessage(this.actor, doc);
    // return attack(this.actor, doc);
  }

  /** Helper Functions */

  /**
   * Fetches the embedded document representing the containing HTML element
   *
   * @param {HTMLElement} target    The element subject to search
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
   */
  _getEmbeddedDocument(target) {
    if (typeof target.data === "function" && target.data("itemId"))
      return this.actor.items.get(target.data("itemId"));
    let docRow = target.closest('li[data-document-class]');
    if (docRow == undefined)
      docRow = target.closest('div[data-document-class]');
    if (docRow.dataset.documentClass === 'Item') {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === 'ActiveEffect') {
      const parent =
        docRow.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow?.dataset.effectId);
    } else return console.warn('Could not find document class');
  }

  /***************
   *
   * Drag and Drop
   *
   ***************/

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li');
    if ('link' in event.target.dataset) return;

    // Chained operation
    let dragData = this._getEmbeddedDocument(docRow)?.toDragData();

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) { }

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call('dropActorSheetData', actor, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case 'ActiveEffect':
        return this._onDropActiveEffect(event, data);
      case 'Actor':
        return this._onDropActor(event, data);
      case 'Item':
        return this._onDropItem(event, data);
      case 'Folder':
        return this._onDropFolder(event, data);
    }
  }

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass('ActiveEffect');
    const effect = await aeCls.fromDropData(data);
    if (!this.actor.isOwner || !effect) return false;
    if (effect.target === this.actor)
      return this._onSortActiveEffect(event, effect);
    return aeCls.create(effect, { parent: this.actor });
  }

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest('[data-effect-id]');
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      const parentId = el.dataset.parentId;
      if (
        siblingId &&
        parentId &&
        (siblingId !== effect.id || parentId !== effect.parent.id)
      )
        siblings.push(this._getEmbeddedDocument(el));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((items, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return items;
      }
      if (items[parentId]) items[parentId].push(update);
      else items[parentId] = [update];
      return items;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments('ActiveEffect', updates);
    }

    // Update on the main actor
    return this.actor.updateEmbeddedDocuments('ActiveEffect', directUpdates);
  }

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);

    // Handle item sorting within the same Actor
    if (this.actor.uuid === item.parent?.uuid)
      return this._onSortItem(event, item);

    // Create the owned item
    return this._onDropItemCreate(item, event);
  }

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== 'Item') return [];
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);
        return item;
      })
    );
    return this._onDropItemCreate(droppedItemData, event);
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    if (itemData.length == 1 && itemData[0].type == "kin")
      return this._onDropKinCreate(itemData, event);
    else if (itemData.length == 1 && itemData[0].type == "frame")
      return this._onDropFrameCreate(itemData, event);
    else if (itemData.length == 1 && itemData[0].type == "weapon")
      return this._onDropEquipmentCreate(itemData, event);
    else if (itemData.length == 1 && itemData[0].type == "shield")
      return this._onDropShieldCreate(itemData, event);
    else if (itemData.length == 1 && itemData[0].type == "augment")
      return this._onDropAugmentCreate(itemData, event);
    else if (itemData.length == 1 && itemData[0].type == "quality")
      return undefined;
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  async _onDropKinCreate(itemData, event) {
    let currentKin = this.actor.items.filter(it => it.type == "kin")[0];
    if (currentKin != undefined) {
      let confirmation = await Dialog.confirm({
        title: 'Replace Kin',
        content: `<p>This actor already has a kin. Do you want to replace it?</p>`,
      });
      if (!confirmation)
        return;

      await currentKin.delete();
    }
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  async _onDropFrameCreate(itemData, event) {
    let currentFrame = this.actor.items.filter(it => it.type == "frame")[0];
    let aspects = {
      stone: this.actor.system.aspects.stone,
      flux: this.actor.system.aspects.flux,
      aether: this.actor.system.aspects.aether,
      hearth: this.actor.system.aspects.hearth
    };
    if (currentFrame != undefined) {
      let confirmation = await Dialog.confirm({
        title: 'Replace Frame',
        content: `<p>This actor already has a Frame. Do you want to replace it?</p>`,
      });
      if (!confirmation)
        return;

      aspects.stone -= currentFrame.system.aspects.stone;
      aspects.flux -= currentFrame.system.aspects.flux;
      aspects.aether -= currentFrame.system.aspects.aether;
      aspects.hearth -= currentFrame.system.aspects.hearth;

      await currentFrame.delete();
    }
    const framesCreated = await this.actor.createEmbeddedDocuments('Item', itemData);
    const frameCreated = framesCreated[0];
    console.log(frameCreated);

    await this.actor.update({
      "system.aspects.stone": aspects.stone + frameCreated.system.aspects.stone,
      "system.aspects.flux": aspects.flux + frameCreated.system.aspects.flux,
      "system.aspects.aether": aspects.aether + frameCreated.system.aspects.aether,
      "system.aspects.hearth": aspects.hearth + frameCreated.system.aspects.hearth,
      "system.energy.value": frameCreated.system.energy.max,
      "system.energy.max": frameCreated.system.energy.max,
      "system.dice.damage.value": frameCreated.system.dice.damage.max,
      "system.dice.damage.max": frameCreated.system.dice.damage.max,
      "system.dice.nexus.value": frameCreated.system.dice.nexus.max,
      "system.dice.nexus.max": frameCreated.system.dice.nexus.max,
      "system.dice.armor.value": frameCreated.system.dice.armor.max,
      "system.dice.armor.max": frameCreated.system.dice.armor.max,
    });

    if (this.actor.img == "icons/svg/mystery-man.svg") {
      await this.actor.update({
        "img": frameCreated.img
      });
    }

    return frameCreated;
  }

  async _onDropEquipmentCreate(itemData, event) {
    return this.actor.system.createEquipment(itemData[0]);
  }

  async _onDropShieldCreate(itemData, event) {
    let shields = this.actor.items.filter(it => it.type == "shield");
    if (shields.length + 1 > this.actor.system.maxShields) {
      ui.notifications.error(`You cannot have more than ${this.actor.system.maxShields} shield(s).`);
      return null;
    }
    return await this._onDropEquipmentCreate(itemData, event);
  }

  async _onDropAugmentCreate(itemData, event) {
    const augmentsCount = this.actor.items.filter(it => it.type == "augment").length;
    if (augmentsCount == 4) {
      ui.notifications.error("You can only have maximum of four augments.");
      return;
    }

    const augment = itemData[0];
    const ability = await Dialog.wait({
      title: `Choose augment: ${augment.name}`,
      content: `
  <form class="aether-nexus"><div>

    <h2>${augment.name}</h2>
    ${augment.system.description}
    <h3>${augment.system.ability1Name}</h3>
    ${augment.system.ability1Description}
    <h3>${augment.system.ability2Name}</h3>
    ${augment.system.ability2Description}
  </div></form>`,
      buttons: {
        ability1: {
          label: augment.system.ability1Name,
          callback: _ => 1
        },
        ability2: {
          label: augment.system.ability2Name,
          callback: _ => 2
        }
      },
      default: "normal",
      // render: (html) => html[0].querySelector("#modifier").focus()
    }, { width: 400 });
    let toCreate = itemData[0].toObject();
    toCreate.system[`ability${ability}Unlocked`] = true;
    return await this.actor.createEmbeddedDocuments('Item', [toCreate]);
  }

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
   * @param {Event} event
   * @param {Item} item
   * @private
   */
  _onSortItem(event, item) {
    // Get the drag source and drop target
    const items = this.actor.items;
    const dropTarget = event.target.closest('[data-item-id]');
    if (!dropTarget) return;
    const target = items.get(dropTarget.dataset.itemId);

    // Don't sort on yourself
    if (item.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== item.id)
        siblings.push(items.get(el.dataset.itemId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(item, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.actor.updateEmbeddedDocuments('Item', updateData);
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  /********************
   *
   * Actor Override Handling
   *
   ********************/

  /**
   * Submit a document update based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {object} submitData                   Processed and validated form data to be used for a document update
   * @returns {Promise<void>}
   * @protected
   * @override
   */
  async _processSubmitData(event, form, submitData) {
    const overrides = foundry.utils.flattenObject(this.actor.overrides);
    for (let k of Object.keys(overrides)) delete submitData[k];
    await this.document.update(submitData);
  }

  /**
   * Disables inputs subject to active effects
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }

  /**
   * CONTEXT MENU
   */

  /**
   * Creates the context menu for the items
   */
  _contextMenu(html) {
    ContextMenu.create(this, html, "div.augment", this._getItemContextOptions());
    ContextMenu.create(this, html, "div.trait:not(.no-menu)", this._getItemContextOptions());
  }

  _getItemContextOptions() {
    return [
      {
        name: "SIDEBAR.Edit",
        icon: '<i class="fas fa-edit"></i>',
        condition: _ => this.actor.isOwner,
        callback: element => {
          const itemId = element.data("itemId");
          const item = this.actor.items.get(itemId);
          return item.sheet.render(true);
        },
      },
      {
        name: "SIDEBAR.Delete",
        icon: '<i class="fas fa-trash"></i>',
        condition: _ => this.actor.isOwner,
        callback: element => {
          const itemId = element.data("itemId");
          const item = this.actor.items.get(itemId);
          element.slideUp(200, () => this.render(false));
          item.delete();
        },
      },
    ];
  }
}
