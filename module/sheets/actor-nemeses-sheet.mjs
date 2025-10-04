import { createFoeStrikeChatMessage } from '../helpers/chat.mjs';
import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { AetherNexusActorNpcSheet } from './actor-npc-sheet.mjs';

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */
export class AetherNexusActorNemesesSheet extends AetherNexusActorNpcSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['aether-nexus', 'actor', 'npc', 'nemeses'],
    position: {
      width: 600,
      height: 600,
    },
    actions: {
      onEditImage: this._onEditImage,
      viewDoc: this._viewDoc,
      createDoc: this._createDoc,
      deleteDoc: this._deleteDoc,
      toggleEffect: this._toggleEffect,
      roll: this._onRoll,
      sendToChat: this._sendToChat,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      submitOnChange: true,
    },
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
    traits: {
      template: 'systems/aether-nexus/templates/actor/foe-traits.hbs',
      templates: ["systems/aether-nexus/templates/actor/foe-list.hbs"]
    },
    activations: {
      template: 'systems/aether-nexus/templates/actor/foe-activations.hbs',
      templates: ["systems/aether-nexus/templates/actor/foe-list.hbs"]
    },
    interactions: {
      template: 'systems/aether-nexus/templates/actor/foe-interactions.hbs',
      templates: ["systems/aether-nexus/templates/actor/foe-list.hbs"]
    },
    maneuvers: {
      template: 'systems/aether-nexus/templates/actor/foe-maneuvers.hbs',
      templates: ["systems/aether-nexus/templates/actor/foe-list.hbs"]
    },
    strikes: {
      template: 'systems/aether-nexus/templates/actor/foe-strikes.hbs',
    },
    scheme: {
      template: 'systems/aether-nexus/templates/actor/nemeses-scheme.hbs',
    },
    stratagem: {
      template: 'systems/aether-nexus/templates/actor/nemeses-stratagem.hbs',
    },
    assets: {
      template: 'systems/aether-nexus/templates/actor/nemeses-assets.hbs',
      templates: ["systems/aether-nexus/templates/actor/foe-list.hbs"]
    },
    effects: {
      template: 'systems/aether-nexus/templates/actor/effects.hbs',
    },
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'tabs', 'biography', 'traits', 'activations', 'interactions', 'maneuvers', 'strikes', 'scheme', 'stratagem', 'assets'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
  }

  /* -------------------------------------------- */

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'list':
      case 'traits':
      case 'activations':
      case 'interactions':
      case 'maneuvers':
      case 'strikes':
      case 'assets':
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
      case 'scheme':
        context.tab = context.tabs[partId];
        context.enrichedScheme = await TextEditor.enrichHTML(
          this.actor.system.scheme,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        context.enrichedDisposition = await TextEditor.enrichHTML(
          this.actor.system.disposition,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        context.enrichedSecret = await TextEditor.enrichHTML(
          this.actor.system.secret,
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
      case 'stratagem':
        context.tab = context.tabs[partId];
        context.enrichedStratagem = await TextEditor.enrichHTML(
          this.actor.system.stratagem,
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
        case 'traits':
          tab.id = 'traits';
          tab.label += 'Traits';
          break;
        case 'activations':
          tab.id = 'activations';
          tab.label += 'Activations';
          break;
        case 'interactions':
          tab.id = 'interactions';
          tab.label += 'Interactions';
          break;
        case 'maneuvers':
          tab.id = 'maneuvers';
          tab.label += 'Maneuvers';
          break;
        case 'strikes':
          tab.id = 'strikes';
          tab.label += 'Strikes';
          break;
        case 'scheme':
          tab.id = 'scheme';
          tab.label += 'Scheme';
          break;
        case 'stratagem':
          tab.id = 'stratagem';
          tab.label += 'Stratagem';
          break;
        case 'assets':
          tab.id = 'assets';
          tab.label += 'Assets';
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
    const activations = [];
    const interactions = [];
    const maneuvers = [];
    const strikes = [];
    const assets = [];

    // Iterate through items, allocating to containers
    for (let i of this.document.items) {
      if (i.system.chargeUp?.size > 0) {
        const values = Array.from(i.system.chargeUp).sort();
        let chargeUpText = "";
        let previous = -1;
        for (const element of values) {
          if (previous == -1)
            chargeUpText = `${element}`;
          else if (element == previous + 1) {
            if (chargeUpText.endsWith(`-${previous}`))
              chargeUpText = `${chargeUpText.substring(0, chargeUpText.length - 2)}-${element}`;
            else
              chargeUpText = `${chargeUpText}-${element}`;
          }
          else
            chargeUpText = `${chargeUpText}, ${element}`;
          previous = element;
        }
        i.chargeUpText = `(charge-up ${chargeUpText})`;
        let chargedSquareClass = "fa-regular";
        if (i.system.charged) {
          chargedSquareClass = "fa-solid"
        }
        i.chargedSquare = `<i class="${chargedSquareClass} fa-square"></i>`
      }
      else {
        i.chargedSquare = "";
        i.chargeUpText = "";
      }

      if (i.type === 'foeTrait') {
        traits.push(i);
        continue;
      }
      else if (i.type === 'foeStrike') {
        strikes.push(i);
        continue;
      }
      else if (i.type === 'foeAction') {
        if (i.system.actionType === 'activation') {
          activations.push(i);
          continue;
        }
        if (i.system.actionType === 'interaction') {
          interactions.push(i);
          continue;
        }
        if (i.system.actionType === 'maneuver') {
          maneuvers.push(i);
          continue;
        }
      }
      else if (i.type == 'nemesesAsset') {
        assets.push(i);
        continue;
      }
    }

    // Sort then assign
    context.traits = traits.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.activations = activations.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.interactions = interactions.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.maneuvers = maneuvers.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.strikes = strikes.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.assets = assets.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  /**************
   *
   *   ACTIONS
   *
   **************/

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
      case 'foeStrike':
        const foeStrike = this._getEmbeddedDocument(target);
        if (foeStrike) return createFoeStrikeChatMessage(this.actor, foeStrike);
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

  /**
   * CONTEXT MENU
   */

  /**
   * Creates the context menu for the items
   */
  _contextMenu(html) {
    ContextMenu.create(this, html, "div.foe-item", this._getItemContextOptions());
  }

  _getItemContextOptions() {
    return [
      {
        name: "SIDEBAR.Edit",
        icon: '<i class="fas fa-edit"></i>',
        condition: _ => this.actor.isOwner,
        callback: element => {
          const itemId = element.dataset.itemId;
          const item = this.actor.items.get(itemId);
          return item.sheet.render(true);
        },
      },
      {
        name: "SIDEBAR.Delete",
        icon: '<i class="fas fa-trash"></i>',
        condition: _ => this.actor.isOwner,
        callback: element => {
          const itemId = element.dataset.itemId;
          const item = this.actor.items.get(itemId);
          element.slideUp(200, () => this.render(false));
          item.delete();
        },
      },
    ];
  }
}
