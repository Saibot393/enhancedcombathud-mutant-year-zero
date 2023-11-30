import {registerMYZECHSItems, MYZECHActionItems, MYZECHManeuverItems, MYZECHReactionItems} from "./specialItems.js";
import {ModuleName, getTooltipDetails, openRollDialoge, openItemRollDialoge} from "./utils.js";

Hooks.on("argonInit", (CoreHUD) => {
    const ARGON = CoreHUD.ARGON;
  
	registerMYZECHSItems();
  
    class MYZPortraitPanel extends ARGON.PORTRAIT.PortraitPanel {
		constructor(...args) {
			super(...args);
		}

		get description() {
			const { system } = this.actor;
			
			return `${system.role}, ${system.rank}`;
		}

		get isDead() {
			return Object.values(this.actor.system.attributes).find(attribute => attribute.value <= 0);
		}

		async getStatBlocks() {
			let ActiveArmor;
			
			if (this.actor.system.armorrating.value > 0) {
				ActiveArmor = this.actor.system.armorrating;			
			}
			
			let Blocks = [];
			
			if (ActiveArmor) {
				Blocks.push([
					{
						text: game.i18n.localize(ActiveArmor.label),
					},
					{
						text: ActiveArmor.value,
						color: "var(--ech-movement-baseMovement-background)",
					},
				]);
			}
			
			return Blocks;
		}
		
		async getsideStatBlocks() {
			let attributes = this.actor.system.attributes;
			
			let Blocks = {left : [], right : []};
			
			for (let key of Object.keys(attributes)) {
				if (attributes[key].value < attributes[key].max || key == "strength") {
					let position = "";
					
					switch(key) {
						case "agility" :
						case "strength":
							position = "left";
							break;
						case "empathy" :
						case "wits":
							position = "right";
							break;
					}
					
					Blocks[position].unshift([
						{
							text: game.i18n.localize(`MYZ.ATTRIBUTE_${key.toUpperCase()}_${this.actor.type.toUpperCase()}`).toUpperCase().slice(0,3),
						},
						{
							text: attributes[key].value,
						},
						{
							text: "/",
						},
						{
							text: attributes[key].max
						}
					]);
				}
			}
			
			return Blocks;
		}
		
		async getConditionIcons() {
			let Icons = [];
			
			let rot = this.actor.system.rot;
			
			for (let i = 0; i < (rot.value + rot.permanent); i++) {
				let permanent = i < rot.permanent;
				
				let description = rot.label;
				
				if (permanent) {
					description = "MYZ.PERMA_ROT";
				}
				
				Icons.push({img : "systems/mutant-year-zero/ui/dice-base-1.png", description : description, key : "rot", click : () => {}, border : permanent});
			}
						
			return Icons;
		}
		
		async _renderInner(data) {
			await super._renderInner(data);
			
			const statBlocks = await this.getsideStatBlocks();
			for (const position of ["left", "right"]) {
				const sb = document.createElement("div");
				
				sb.style = `position : absolute;${position} : 0px`;
				
				for (const block of statBlocks[position]) {
					const sidesb = document.createElement("div");
					sidesb.classList.add("portrait-stat-block");
					for (const stat of block) {
						if (!stat.position) {
							const span = document.createElement("span");
							span.innerText = stat.text;
							span.style.color = stat.color;
							sidesb.appendChild(span);
						}
					}
					sb.appendChild(sidesb);
				}
				this.element.appendChild(sb);
			}
			
			const ConditionIcons = await this.getConditionIcons();
			
			if (ConditionIcons.length) {
				const IconsBar = document.createElement("div");
				//SideIconsBar.classList.add("");
				IconsBar.setAttribute("style", `position:absolute;right:0;display:flex;flex-direction:column;align-self:center`);
				for (const Icon of ConditionIcons) {
					const IconImage =  document.createElement("img");
					//IconImage.classList.add("rot-button roll-rot rollable");
					IconImage.setAttribute("src", Icon.img);
					IconImage.style.width = "25px";
					IconImage.style.borderWidth = "0px";
					if (Icon.border) {
						IconImage.style.borderWidth = "3px";
						IconImage.style.color = "var(--ech-portrait-base-border)";
					}
					IconImage.onclick = () => {Icon.click()};
					IconImage.setAttribute("data-tooltip", Icon.description);
					
					IconsBar.appendChild(IconImage);
				}
				
				this.element.appendChild(IconsBar);
			}
					
			this.element.querySelector(".player-buttons").style.right = "0%";
		}
	}
	
	class MYZDrawerPanel extends ARGON.DRAWER.DrawerPanel {
		constructor(...args) {
			super(...args);
		}

		get categories() {
			const attributes = {...this.actor.system.attributes};
			const skills = this.actor.items.filter(item => item.type == "skill");
			
			/*
			var allowedattributes = [];
			
			switch (this.actor.type) {
				case "player":
					allowedattributes = Object.keys(attributes).filter(key => key != "magic");
					break;
				default:
					allowedattributes = Object.keys(attributes);
					break;
			}
			
			for (let key of Object.keys(attributes)) {
				if (!allowedattributes.includes(key)) {
					delete attributes[key];
				}
			}*/
			
			let maxAttribute = Math.max(...Object.values(attributes).map(content => content.value));

			const attributesButtons = Object.keys(attributes).map((attribute) => {
				const attributeData = attributes[attribute];
				
				let valueLabel = attributeData.value;
				
				if (game.settings.get(ModuleName, "UseDiceCircles")) {
					valueLabel = "";
					
					valueLabel = valueLabel + `<div style="display:flex">`;
					
					valueLabel = valueLabel + "</div>";
					
					valueLabel = valueLabel + `<div style="display:flex">`;
					
					for (let i = 0; i < attributeData.value; i++) {
						valueLabel = valueLabel + `<i class="fa-regular fa-circle"></i>`;
					}
					
					valueLabel = valueLabel + "</div>";
				}
				
				return new ARGON.DRAWER.DrawerButton([
					{
						label: game.i18n.localize(attributes[attribute].label + "_" + this.actor.type.toUpperCase()),
						onClick: () => {openRollDialoge("attribute", attribute, this.actor)}
					},
					{
						label: valueLabel,
						onClick: () => {openRollDialoge("attribute", attribute, this.actor)},
						style: "display: flex; justify-content: flex-end;"
					}
				]);
			});
			
			let skillsButtons = [];
			
			if (skills) {
				skillsButtons = skills.map((skill) => {
					const skillData = skill.system;
					
					let valueLabel = `${skillData.value}<span style="margin: 0 1rem; filter: brightness(0.8)">(+${attributes[skillData.attribute].value})</span>`;
					
					
					if (game.settings.get(ModuleName, "UseDiceCircles")) {
						valueLabel = "";
						
						valueLabel = valueLabel + `<div style="display:flex">`;
						
						for (let i = 0; i < skillData.value; i++) {
							valueLabel = valueLabel + `<i class="fa-solid fa-circle"></i>`;
						}
						
						valueLabel = valueLabel + "</div>";
						
						valueLabel = valueLabel + `<div style="display:flex">`;
						
						for (let i = 0; i < maxAttribute; i++) {
							if (i < attributes[skills[skill].attribute].value) {
								valueLabel = valueLabel + `<i class="fa-regular fa-circle"></i>`;
							}
							else {
								valueLabel = valueLabel + `<i class="fa-regular fa-circle" style="visibility:hidden"></i>`;
							}
						}
						
						valueLabel = valueLabel + "</div>";
					}
					
					return new ARGON.DRAWER.DrawerButton([
						{
							label: game.i18n.localize("MYZ.SKILL_" + skillData.skillKey),
							onClick: () => {openRollDialoge("skill", skillData.skillKey, this.actor)}
						},
						{
							label: valueLabel,
							onClick: () => {openRollDialoge("skill", skillData.skillKey, this.actor)},
							style: "display: flex; justify-content: flex-end;"
						},
					]);
				});
			}

			let returncategories = [];

			if (attributesButtons.length) {
				if (!game.settings.get(ModuleName, "UseDiceCircles")) {
					returncategories.push({
						gridCols: "7fr 2fr 2fr",
						captions: [
							{
								label: game.i18n.localize("HEADER.ATTRIBUTES"),
							},
							{
								label: "", //looks nicer
							},
							{
								label: game.i18n.localize("ROLL.ROLL"),
							},
						],
						buttons: attributesButtons
					});
				}
				else {
					returncategories.push({
						gridCols: "7fr 2fr",
						captions: [
							{
								label: game.i18n.localize("HEADER.ATTRIBUTES"),
							},
							{
								label: game.i18n.localize("ROLL.ROLL"),
							},
						],
						buttons: attributesButtons
					});
				}
			}
			
			if (skillsButtons.length) {
				returncategories.push({
					gridCols: "7fr 2fr",
					captions: [
						{
							label: game.i18n.localize("HEADER.SKILLS"),
						},
						{
							label: "",
						}
					],
					buttons: skillsButtons,
				});
			}
			
			return returncategories;
		}

		get title() {
			return `${game.i18n.localize("HEADER.ATTRIBUTES")} & ${game.i18n.localize("HEADER.SKILLS")}`;
		}
	}
  
    class MYZActionActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.SlowAction";
		}
		
		get maxActions() {
            return 1;
        }
		
		get currentActions() {
			return this.isActionUsed ? 0 : 1;
		}
		
		_onNewRound(combat) {
			this.isActionUsed = false;
			this.updateActionUse();
		}
		
		async _getButtons() {
			const specialActions = Object.values(MYZECHActionItems);

			let buttons = [];
			
			buttons.push(new MYZItemButton({ item: null, isWeaponSet: true, isPrimary: true }));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new MYZSpecialActionButton(specialActions[0]), new MYZSpecialActionButton(specialActions[1])));
			buttons.push(new MYZButtonPanelButton({type: "gear", color: 0}));
			buttons.push(new MYZButtonPanelButton({type: "talent", color: 0}));
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new MYZSpecialActionButton(specialActions[2]), new MYZSpecialActionButton(specialActions[3])));
			
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
    class MYZManeuverActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.FastAction";
		}
		
		get maxActions() {
            return 1;
        }
		
		get currentActions() {
			return this.isActionUsed ? 0 : 1;
		}
		
		_onNewRound(combat) {
			this.isActionUsed = false;
			this.updateActionUse();
		}
		
		async _getButtons() {
			const specialActions = Object.values(MYZECHManeuverItems);

			const buttons = [
			  new ARGON.MAIN.BUTTONS.SplitButton(new MYZSpecialActionButton(specialActions[0]), new MYZSpecialActionButton(specialActions[1])),
			  new ARGON.MAIN.BUTTONS.SplitButton(new MYZSpecialActionButton(specialActions[2]), new MYZSpecialActionButton(specialActions[3]))
			];
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
    class MYZReactionActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.ReAction";
		}
		
		async _getButtons() {
			const specialActions = Object.values(MYZECHReactionItems);

			const buttons = [
			  new ARGON.MAIN.BUTTONS.SplitButton(new MYZSpecialActionButton(specialActions[0]), new MYZSpecialActionButton(specialActions[1])),
			  new ARGON.MAIN.BUTTONS.SplitButton(new MYZSpecialActionButton(specialActions[2]), new MYZSpecialActionButton(specialActions[3]))
			];
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
	class MYZItemButton extends ARGON.MAIN.BUTTONS.ItemButton {
		constructor(...args) {
			super(...args);
		}

		get hasTooltip() {
			return true;
		}

		get targets() {
			return null;
		}

		async getTooltipData() {
			const tooltipData = await getTooltipDetails(this.item, this.actor.type);
			return tooltipData;
		}

		async _onLeftClick(event) {
			var used = false;
			
			if (this.item.type == "weapon") {
				openItemRollDialoge(this.item, this.actor);
				//this.actor.sheet.rollWeapon(this.item.id);
				
				used = true;
			}
			
			if (this.item.type == "attack") {
				const testName = this.item.name;
				let bonus = this.actor.sheet.computeInfoFromConditions();
				let attribute = this.actor.system.attribute[this.item.system.attribute];

				let info = [
				  { name: game.i18n.localize(attribute.label + "_ROLL"), value: attribute.value },
				  bonus
				];

				prepareRollNewDialog(this.actor.sheet, testName, info, this.item.system.damage, null, null);
				
				used = true;
			}
			
			if (this.item.type == "gear" || this.item.type == "magic" || this.item.type == "talent") {
				this.item.sendToChat();
			}			
			
			if (used) {
				MYZItemButton.consumeActionEconomy(this.item);
			}
		}

		static consumeActionEconomy(item) {
			if (item.type == "weapon" || item.type == "attack") {
				ui.ARGON.components.main[0].isActionUsed = true;
				ui.ARGON.components.main[0].updateActionUse();
			}
		}

		async render(...args) {
			await super.render(...args);
			if (this.item?.system.consumableType === "ammo") {
				const weapons = this.actor.items.filter((item) => item.system.consume?.target === this.item.id);
				ui.ARGON.updateItemButtons(weapons);
			}
		}
	}
  
    class MYZButtonPanelButton extends ARGON.MAIN.BUTTONS.ButtonPanelButton {
		constructor({type, subtype, color}) {
			super();
			this.type = type;
			this.subtype = subtype;
			this.color = color;
		}

		get colorScheme() {
			return this.color;
		}
	
		get quantity() {
			console.log(this.type);
			if (this.type == "talent") {
				console.log(this.actor.system.resource_points.value);
				return this.actor.system.resource_points.value;
			}
			
			return null;
		}

		get label() {
			switch (this.type) {
				case "gear": return "GEAR.NAME";
				case "magic": return "MAGIC.NAME";
				case "talent": return "TALENT.NAME";
			}
		}

		get icon() {
			switch (this.type) {
				case "gear": return "modules/enhancedcombathud/icons/svg/backpack.svg";
				case "magic": return "modules/enhancedcombathud/icons/svg/spell-book.svg";
				case "talent": return "icons/svg/book.svg";
			}
		}
		
		async _renderInner() {
			await super._renderInner();
			const quantity = this.quantity;
			if(Number.isNumeric(quantity)) {
				this.element.classList.add("has-count");
				this.element.dataset.itemCount = quantity;
				this.element.style.filter = quantity === 0 ? "grayscale(1)" : null;
			}
		}
  
		async _getPanel() {
			return new ARGON.MAIN.BUTTON_PANELS.ButtonPanel({buttons: this.actor.items.filter(item => item.type == this.type).map(item => new MYZItemButton({item}))});
		}
    }
	
	class MYZSpecialActionButton extends ARGON.MAIN.BUTTONS.ActionButton {
        constructor(specialItem) {
			super();
			this.item = new CONFIG.Item.documentClass(specialItem, {
				parent: this.actor,
			});
		}

		get label() {
			return this.item.name;
		}

		get icon() {
			return this.item.img;
		}

		get hasTooltip() {
			return true;
		}
		

		get colorScheme() {
			switch (this.item?.flags[ModuleName]?.actiontype) {
				case "action":
					return 0;
					break;
				case "maneuver":
					return 1;
					break;
				case "react":
					return 3;
					break;
			}
			return 0;
		}

		async getTooltipData() {
			const tooltipData = await getTooltipDetails(this.item, this.actor.type);
			return tooltipData;
		}

		async _onLeftClick(event) {
			var used = true;
			
			const item = this.item;
			
			switch(this.actor.type) {
				case "player" :
				case "npc" :
					let skill = item.system.skill;
					
					if (skill instanceof Array) {
						const activeSet = await ui.ARGON.components.weaponSets?.getactiveSet();
						
						if (activeSet?.primary?.system.skill) {
							skill = skill.find(key => key == activeSet.primary.system.skill);
						}
						
						if (skill instanceof Array) {
							skill = undefined;
						}
					}
					
					if (skill) {
						this.actor.sheet.rollSkill(skill);
					}
					break;
				case "MYZ" : 
					let attribute = item.system.MYZattribute;
					
					if (attribute) {
						this.actor.sheet.rollAttribute(attribute);
					}
					break;					
			}
			
			if (used) {
				MYZSpecialActionButton.consumeActionEconomy(this.item);
			}
		}

		static consumeActionEconomy(item) {
			switch (item.flags[ModuleName].actiontype) {
				case "action":
					ui.ARGON.components.main[0].isActionUsed = true;
					ui.ARGON.components.main[0].updateActionUse();
					break;
				case "maneuver":
					if (ui.ARGON.components.main[1].isActionUsed) {
						ui.ARGON.components.main[0].isActionUsed = true;
						ui.ARGON.components.main[0].updateActionUse();
					}
					else {
						ui.ARGON.components.main[1].isActionUsed = true;
						ui.ARGON.components.main[1].updateActionUse()
					}
					break;
				case "react":
					if (ui.ARGON.components.main[1].isActionUsed) {
						ui.ARGON.components.main[0].isActionUsed = true;
						ui.ARGON.components.main[0].updateActionUse()
					}
					else {
						ui.ARGON.components.main[1].isActionUsed = true;
						ui.ARGON.components.main[1].updateActionUse()
					}
					break;
			}
		}
    }
	
	class MYZWeaponSets extends ARGON.WeaponSets {
		async getDefaultSets() {
			let attacks = this.actor.items.filter((item) => item.type === "weapon");
			
			return {
				1: {
					primary: attacks[0]?.id ?? null,
					secondary: null,
				},
				2: {
					primary: attacks[1]?.id ?? null,
					secondary: null,
				},
				3: {
					primary: attacks[2]?.id ?? null,
					secondary: null,
				},
			};
		}

		async _onSetChange({sets, active}) {
			const updates = [];
			const activeSet = sets[active];
			const activeItems = Object.values(activeSet).filter((item) => item);
			const inactiveSets = Object.values(sets).filter((set) => set !== activeSet);
			const inactiveItems = inactiveSets.flatMap((set) => Object.values(set)).filter((item) => item);
			activeItems.forEach((item) => {
				if(!item.system?.equipped) updates.push({_id: item.id, "system.equipped": true});
			});
			inactiveItems.forEach((item) => {
				if(item.system?.equipped) updates.push({_id: item.id, "system.equipped": false});
			});
			return await this.actor.updateEmbeddedDocuments("Item", updates);
		}

		async _getSets() { //overwrite because slots.primary/secondary contains id, not uuid
			const sets = mergeObject(await this.getDefaultSets(), deepClone(this.actor.getFlag("enhancedcombathud", "weaponSets") || {}));

			for (const [set, slots] of Object.entries(sets)) {
				slots.primary = slots.primary ? await this.actor.items.get(slots.primary) : null;
				slots.secondary = null;
			}
			return sets;
		}
		
		async _onDrop(event) {
			console.log(event);
			
			try {      
				event.preventDefault();
				event.stopPropagation();
				const data = JSON.parse(event.dataTransfer.getData("text/plain"));
				if(data?.type !== "weapon") return;
				const set = event.currentTarget.dataset.set;
				const slot = event.currentTarget.dataset.slot;
				const sets = this.actor.getFlag("enhancedcombathud", "weaponSets") || {};
				sets[set] = sets[set] || {};
				sets[set][slot] = data.itemId;

				await this.actor.setFlag("enhancedcombathud", "weaponSets", sets);
				await this.render();
			} catch (error) {
				
			}
		}
		
		get template() {
			return `modules/${ModuleName}/templates/MYZWeaponSets.hbs`;
		}
		
		async getactiveSet() {
			const sets = await this._getSets();
			return sets[this.actor.getFlag("enhancedcombathud", "activeWeaponSet")];
		}
    }
  
    /*
    class MYZEquipmentButton extends ARGON.MAIN.BUTTONS.EquipmentButton {
		constructor(...args) {
			super(...args);
		}
    }
	*/
  
    CoreHUD.definePortraitPanel(MYZPortraitPanel);
    CoreHUD.defineDrawerPanel(MYZDrawerPanel);
    CoreHUD.defineMainPanels([
		MYZActionActionPanel,
		MYZManeuverActionPanel,
		MYZReactionActionPanel,
		ARGON.PREFAB.PassTurnPanel
    ]);  
	CoreHUD.defineMovementHud(null);
    CoreHUD.defineWeaponSets(MYZWeaponSets);
	CoreHUD.defineSupportedActorTypes(["human", "mutant", "npc", "robot", "vehicle", "animal", "ark"]);
});
