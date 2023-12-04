import {registerMYZECHSItems, MYZECHActionItems, MYZECHManeuverItems, MYZECHReactionItems} from "./specialItems.js";
import {ModuleName, getTooltipDetails, openRollDialoge, openItemRollDialoge} from "./utils.js";
import {openNewInput} from "./popupInput.js";

Hooks.on("argonInit", (CoreHUD) => {
    const ARGON = CoreHUD.ARGON;
  
	registerMYZECHSItems();
  
	function consumeAction(type) {
		switch (type) {
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
				consumeAction("action");
				break;
		}
	}
	
	function toggleSnAdrawer() {
		ui.ARGON.components.drawer.element.querySelector(".ability-toggle").click();
	}
  
    class MYZPortraitPanel extends ARGON.PORTRAIT.PortraitPanel {
		constructor(...args) {
			super(...args);
			
			this.wasDead = {};
		}

		get description() {
			const { system } = this.actor;
			
			return `${system.role}, ${system.rank}`;
		}

		get isDead() {
			let isDead = {};
			
			Object.keys(this.actor.system.attributes).forEach(attribute => isDead[attribute] = (this.actor.system.attributes[attribute].value <= 0 && this.actor.system.attributes[attribute].max > 0));
			
			if (isDead.strength && !this.wasDead.strength) {
				if (game.settings.get(ModuleName, "AutoRollInjuries")) {
					this.rollInjuries();
				}
			}
			
			this.wasDead = isDead;
			
			return Object.values(isDead).find(value => value);
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
							text: game.i18n.localize(`MYZ.ATTRIBUTE_${key.toUpperCase()}_${this.actor.system.creatureType.toUpperCase()}`).toUpperCase().slice(0,3),
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
		
		async rollInjuries() {
			let table = await fromUuid("RollTable." + game.settings.get(ModuleName, "InjurieTable"));
			if (table) {
				table.draw({roll: true, displayChat: true});
			}
		}
	}
	
	class MYZDrawerPanel extends ARGON.DRAWER.DrawerPanel {
		constructor(...args) {
			super(...args);
		}

		get categories() {
			const attributes = {...this.actor.system.attributes};
			let skills = this.actor.items.filter(item => item.type == "skill");
			
			//sort the skills (why are they not sorted alread?)
			let skillgroups = {};
			
			for (let attribute of Object.keys(attributes)) {
				skillgroups[attribute] = skills.filter(skill => skill.system.attribute == attribute);
				
				skillgroups[attribute] = skillgroups[attribute].sort((a,b) => {
					if (a.name < b.name) {return -1}
					if (a.name > b.name) {return 1}
					return 0
				});
			}
			skills = [];
			Object.values(skillgroups).forEach(group => skills = skills.concat(group));
			
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
						label: game.i18n.localize(attributes[attribute].label + "_" + this.actor.system.creatureType.toUpperCase()),
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
							if (i < attributes[skillData.attribute].value) {
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
								label: game.i18n.localize("MYZ.ATTRIBUTES"),
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
								label: game.i18n.localize("MYZ.ATTRIBUTES"),
							},
							{
								label: game.i18n.localize("MYZ.ROLL"),
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
							label: game.i18n.localize("MYZ.SKILLS"),
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
			return `${game.i18n.localize("MYZ.ATTRIBUTES")} & ${game.i18n.localize("MYZ.SKILLS")}`;
		}
	}
  
    class MYZActionActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.ActionAction";
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
			buttons.push(new MYZButtonPanelButton({type: "ability", color: 0}));
			if (game.settings.get(ModuleName, "ShowSkills")) {
				buttons.push(new MYZSpecialActionButton(specialActions[2]));
			}
			
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
    class MYZManeuverActionPanel extends ARGON.MAIN.ActionPanel {
		constructor(...args) {
			super(...args);
		}

		get label() {
			return ModuleName+".Titles.ManeuverAction";
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
				new MYZButtonPanelButton({type: "gear", color: 1})
			];
			if (game.settings.get(ModuleName, "ShowTalents")) {
				buttons.push(new MYZButtonPanelButton({type: "talent", color: 1}));
			}
			buttons.push(new ARGON.MAIN.BUTTONS.SplitButton(new MYZSpecialActionButton(specialActions[2]), new MYZSpecialActionButton(specialActions[3])));
			
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
				new MYZSpecialActionButton(specialActions[0])
			];
			return buttons.filter(button => button.items == undefined || button.items.length);
		}
    }
	
	class MYZItemButton extends ARGON.MAIN.BUTTONS.ItemButton {
		constructor(...args) {
			super(...args);
			
			if (this.item?.type == "weapon") {
				Hooks.on("updateActor", (actor, changes, infos, sender) => {
					if (this.quantity != null) {
						if (this.actor == actor) {
							this.render();
						}
					}
				});
			}
		}

		get hasTooltip() {
			return true;
		}

		get targets() {
			return null;
		}

		async getTooltipData() {
			const tooltipData = await getTooltipDetails(this.item, this.actor.system.creatureType);
			return tooltipData;
		}

		get quantity() {
			if (game.settings.get(ModuleName, "ConsumeBullets")) {
				if (this.item?.type == "weapon") {
					if (this.item.system.category == "ranged") {
						return this.actor.system.resources.bullets.value;
					}
				}
			}
			
			return null;
		}
		
		async _onLeftClick(event) {
			var used = false;
			
			if (this.item.type == "weapon") {
				if (game.settings.get(ModuleName, "ConsumeBullets") && this.quantity) {
					const newvalue = this.actor.system.resources.bullets.value - 1;
					
					if (newvalue >= 0) {
						this.actor.update({system : {resources : {bullets : {value : newvalue}}}});
						
						used = true;
					}
				}
				else {
					used = true;
				}
				
				if (used) {
					openItemRollDialoge(this.item, this.actor);
				}
			}
			
			if (this.item.type == "gear") {
				this.item.sendToChat();
				
				used = true;
			}		
			
			if (this.item.type == "talent") {
				this.item.sendToChat();
			}

			if (this.item.type == "ability") {
				if (game.settings.get(ModuleName, "ConsumeResourcePoints")) {
					let consumeamount = 1;
					
					if (game.settings.get(ModuleName, "AskResourcePointAmount")) {
						consumeamount = await openNewInput("number", game.i18n.localize(ModuleName+"Titles.ResourceConsume"), game.i18n.localize(ModuleName+"Titles.HowmanyResources"), {defaultValue : 1});
					}
					
					const newvalue = this.actor.system.resource_points.value - consumeamount;
					
					if (newvalue >= 0) {
						this.actor.update({system : {resource_points : {value : newvalue}}});
						
						used = true;
					}
				}
				else {
					used = true;
				}
				
				if (used) {
					this.item.sendToChat();
				}
			}
			
			if (used) {
				MYZItemButton.consumeActionEconomy(this.item);
			}
		}

		static consumeActionEconomy(item) {
			let consumeID = undefined;
			
			if (item.type == "weapon") {
				consumeAction("action");
			}
			
			if (item.type == "gear") {
				consumeAction("maneuver");
			}
			
			if (item.type == "ability") {
				consumeAction(this.abilityactiontype(item));
			}
		}
		
		static abilityactiontype(item) {
			if (item.system.description.includes("(R)")) {
				return "react";
			}
			
			if (item.system.description.includes("(E)")) {
				return "";
			}
			
			return "action";
		}
	}
  
    class MYZButtonPanelButton extends ARGON.MAIN.BUTTONS.ButtonPanelButton {
		constructor({type, subtype, color}) {
			super();
			this.type = type;
			this.color = color;
			
			Hooks.on("updateActor", (actor, changes, infos, sender) => {
				if (this.quantity != null) {
					if (this.actor == actor) {
						this.render();
					}
				}
			});
		}

		get colorScheme() {
			return this.color;
		}
	
		get quantity() {
			if (this.type == "ability") {
				return this.actor.system.resource_points.value;
			}
			
			return null;
		}

		get label() {
			if (this.type == "ability") {
				return "MYZ.ABILITY_" + this.actor.system.creatureType.toUpperCase();
			}
			
			return "TYPES.Item." + this.type;
		}

		get icon() {
			switch (this.type) {
				case "gear": return "modules/enhancedcombathud/icons/svg/backpack.svg";
				case "magic": return "modules/enhancedcombathud/icons/svg/spell-book.svg";
				case "talent": return "icons/svg/book.svg";
				case "ability":
					switch(this.actor.system.creatureType) {
						case "human": return "modules/enhancedcombathud-mutant-year-zero/icons/talk.svg";
						case "mutant": return "modules/enhancedcombathud-mutant-year-zero/icons/dna1.svg";
						case "animal": return "modules/enhancedcombathud-mutant-year-zero/icons/paw.svg";
						case "robot": return "modules/enhancedcombathud-mutant-year-zero/icons/microchip.svg";
					}
			}
		}
		
		async getData() {
			const prevData = super.getData();
			
			const quantity = this.quantity;
			return {
				...prevData,
				quantity: quantity,
				hasQuantity: Number.isNumeric(quantity),
				label : this.label
			}
		}
		
		get template() {
			return `modules/${ModuleName}/templates/MYZButtonPanelButton.hbs`;
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
			const tooltipData = await getTooltipDetails(this.item, this.actor.system.creatureType);
			return tooltipData;
		}

		async _onLeftClick(event) {
			var used = true;
			
			const item = this.item;
			
			if (this.item.system.skill) {
				if (this.actor.system.creatureType == "robot") {
					openRollDialoge("skill", this.item.system.skillRobot, this.actor);
				}
				else {
					openRollDialoge("skill", this.item.system.skill, this.actor);
				}
			}
			
			console.log(this.item);
			if (this.item.flags[ModuleName]?.openskills) {
				toggleSnAdrawer();
			}
			
			if (used) {
				MYZSpecialActionButton.consumeActionEconomy(this.item);
			}
		}

		static consumeActionEconomy(item) {
			consumeAction(item.flags[ModuleName].actiontype);
		}
    }
	
	class MYZWeaponSets extends ARGON.WeaponSets {
		constructor(...args) {
			super(...args);
			
			this.lastdragID = "";
			
			Hooks.on("renderActorSheet", (sheet, html, infos) => {
				if (sheet.actor == this.actor) {
					const weaponelements = html.find(`li .roll-weapon`);
					
					weaponelements.each((i, element) => {
						element.draggable = true;
						
						let id = element.getAttribute("data-item-id");
						
						element.ondragstart = () => {
							this.lastdragID = id;
						};
						
						element.ondragend = () => {
							if (this.lastdragID == id) {
								this.lastdragID = "";
							}
						};
					})
				}
			});
		}
		
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
			let itemID;
			
			if (this.lastdragID) {
				itemID = this.lastdragID;
			}
			else {
				try {      
					event.preventDefault();
					event.stopPropagation();
					const data = JSON.parse(event.dataTransfer.getData("text/plain"));
					if(data?.type !== "weapon") return;
					itemID = data.itemId;
				} catch (error) {
					
				}
			}
			
			if (itemID) {
				const set = event.currentTarget.dataset.set;
				const slot = event.currentTarget.dataset.slot;
				const sets = this.actor.getFlag("enhancedcombathud", "weaponSets") || {};
				sets[set] = sets[set] || {};
				sets[set][slot] = itemID;

				await this.actor.setFlag("enhancedcombathud", "weaponSets", sets);
				await this.render();
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
