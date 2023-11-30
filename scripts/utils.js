const ModuleName = "enhancedcombathud-vaesen";

async function getTooltipDetails(item, actortype) {
	let title, description, effect, itemType, skill, vaesenattribute, category, subtitle, range, damage, bonus, bonusType;
	let propertiesLabel;
	let properties = [];
	let materialComponents = "";

	let details = [];
	
	if (!item || !item.system) return;

	title = item.name;
	description = item.system.description;
	effect = item.system.effect
	itemType = item.type;
	skill = item.system.skill;
	vaesenattribute = item.system.vaesenattribute;
	category = item.system.category;
	range = item.system?.range;
	damage = item.system?.damage;
	bonus = item.system?.bonus;
	bonusType = item.system?.bonusType;
	
	if (bonusType == "none") {
		bonusType = undefined;
	}
	
	properties = [];
	materialComponents = "";

	switch (itemType) {
		case "base":
			switch (actortype) {
				case "player" :
				case "npc" :
					if (!(skill instanceof Array)) {
						skill = [skill];
					}
				
					subtitle = skill.map(key => game.i18n.localize(CONFIG.vaesen.skills[key])).join("/");
					break;
				case "vaesen" : 
					if (vaesenattribute) {
						subtitle = game.i18n.localize("ATTRIBUTE." + vaesenattribute.toUpperCase());
						
						if (vaesenattribute == "bodyControl") {
							subtitle = game.i18n.localize("ATTRIBUTE." + "BODY_CONTROL");
						}
					}
					break;
			}
			break;
		case "weapon":
			subtitle = game.i18n.localize(CONFIG.vaesen.skills[skill]);
			details.push({
				label: "ATTACK.DAMAGE",
				value: damage
			});
			details.push({
				label: "ATTACK.RANGE",
				value: range
			});
			break;
		case "magic":
			subtitle = game.i18n.localize("MAGIC." + category.toUpperCase());
			break;
		case "gear":
		case "talent":
			if (!(skill instanceof Array)) {
				skill = [skill];
			}
		
			subtitle = skill.map(key => game.i18n.localize(CONFIG.vaesen.skills[key])).join("/");
			break;
	}

	if (description) description = await TextEditor.enrichHTML(description);
	
	if (bonus) {
		details.push({
			label: "CONDITION.BONUS",
			value: bonus
		});
	}
	
	if (effect) {
		propertiesLabel = "GEAR.EFFECT";
		properties.push({ label: effect });
	}
	
	console.log(item);
	console.log(bonusType);
	if (bonusType) {
		propertiesLabel = "BONUS_TYPE.HEADER";
		
		switch (bonusType) {
			case "ignoreConditionSkill":
				bonusType = "IGNORE_CONDITIONS_SKILL";
				break;
			case "ignoreConditionPhysical":
				bonusType = "IGNORE_CONDITIONS_PHYSICAL"; 
				break;
			case "ignoreConditionMental":
				bonusType = "IGNORE_CONDITIONS_MENTAL";
				break;
		}
		
		properties.push({ label: "BONUS_TYPE." + bonusType.toUpperCase() });
	}
	
	console.log(propertiesLabel, properties);

	return { title, description, subtitle, details, properties , propertiesLabel, footerText: materialComponents };
}

function openRollDialoge(rollType, rollName, rollActor) { //adapted from MYZ system code
	let rollData = {};
	
	let applyedModifiersInfo;
	
	switch (rollType) {
		case "skill":
			const skill = rollActor.items.find(item => item.type == rollType && item.system.skillKey == rollName);
			
			const diceTotals = rollActor.sheet._getRollModifiers(skill);
            diceTotals.gearDiceTotal = Math.max(0, diceTotals.gearDiceTotal);
			
			applyedModifiersInfo = rollActor.sheet._getModifiersInfo(diceTotals);
			
            let skillName = "";
            if (skill.system.skillKey == "") {
                skillName = skill.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.system.skillKey}`);
            }
			
			rollData = {
				rollName : skillName,
			
				attributeName : skill.system.attribute,
			
				baseDefault: diceTotals.baseDiceTotal,
				skillDefault: diceTotals.skillDiceTotal,
				gearDefault: diceTotals.gearDiceTotal,
				
				applyedModifiers: applyedModifiersInfo,
				
				skillItem : skill
			}
			break;	
		case "attribute":
			const attributeValue = rollActor.system.attributes[rollName].value;
			
			const attributeName = `MYZ.ATTRIBUTE_${rollName.toUpperCase()}_${rollActor.system.creatureType.toUpperCase()}`;
			
			const items = rollActor.items.filter(item => item.system.modifiers != undefined);
			const modifierItems = items.filter(item => item.system.modifiers[rollName] != 0);
			let attributeModifiers = [];
			const baseDiceModifier = modifierItems.reduce(function (modifier, item) {
				attributeModifiers.push({ 'type': item.type, 'name': item.name, 'value': item.system.modifiers[rollName] })
				return modifier + item.system.modifiers[rollName];
			}, 0);
			
			let baseDiceTotal = parseInt(attributeValue) + parseInt(baseDiceModifier)
			if(baseDiceTotal<0) baseDiceTotal = 0;
			
			applyedModifiersInfo = rollActor.sheet._getModifiersInfo({
				skillDiceTotal: 0,
				baseDiceTotal: baseDiceTotal,
				gearDiceTotal: 0,
				modifiersToSkill: [],
				modifiersToAttributes: attributeModifiers,
				modifiersToGear: []
			});
			
			rollData = {
				rollName: attributeName, //this is confusing
				
				attributeName: rollName, //isn't it?
				
				baseDefault: baseDiceTotal,
				applyedModifiers: applyedModifiersInfo
			}
			break;
	}
	
	game.myz.RollDialog.prepareRollDialog({...{
		rollName: "",
		attributeName : "",
		diceRoller: rollActor.sheet.diceRoller,
		baseDefault: 0,
		skillDefault: 0,
		gearDefault: 0,
		modifierDefault: 0,
		actor : rollActor,
		applyedModifiers: {}
	}, ...rollData});
}


export { getTooltipDetails, openRollDialoge }

/*
    _onRollAttribute(event) {
        event.preventDefault();
        const attName = $(event.currentTarget).data("attribute");
        const attVal = this.actor.system.attributes[attName].value;
        let rollName = `MYZ.ATTRIBUTE_${attName.toUpperCase()}_${this.actor.system.creatureType.toUpperCase()}`;

        const itmMap = this.actor.items.filter(itm => itm.system.modifiers != undefined)
        const itemsThatModifyAttribute = itmMap.filter(i => i.system.modifiers[attName] != 0)
        let modifiersToAttributes = []
        const baseDiceModifier = itemsThatModifyAttribute.reduce(function (acc, obj) {
            modifiersToAttributes.push({ 'type': obj.type, 'name': obj.name, 'value': obj.system.modifiers[attName] })
            return acc + obj.system.modifiers[attName];
        }, 0);
        let baseDiceTotal = parseInt(attVal) + parseInt(baseDiceModifier)
        if(baseDiceTotal<0) baseDiceTotal = 0;

        const applyedModifiersInfo = this._getModifiersInfo({
            skillDiceTotal: 0,
            baseDiceTotal: baseDiceTotal,
            gearDiceTotal: 0,
            modifiersToSkill: [],
            modifiersToAttributes: modifiersToAttributes,
            modifiersToGear: []
        })

        RollDialog.prepareRollDialog({
            rollName: rollName,
            attributeName: attName,
            diceRoller: this.diceRoller,
            baseDefault: baseDiceTotal,
            skillDefault: 0,
            gearDefault: 0,
            modifierDefault: 0,
            applyedModifiers: applyedModifiersInfo
        });
    }
	
*/

/*
    _onRollSkill(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const itemId = $(element).data("item-id");
        if (itemId) {
            //FIND OWNED SKILL ITEM AND CREARE ROLL DIALOG
            const skill = this.actor.items.find((element) => element.id == itemId);
            const attName = skill.system.attribute;
            // Apply any modifiers from items or crits
            const diceTotals = this._getRollModifiers(skill);
            diceTotals.gearDiceTotal = Math.max(0, diceTotals.gearDiceTotal)

            // SEE IF WE CAN USE SKILL KEY TO TRANSLATE THE NAME
            let skillName = "";
            if (skill.system.skillKey == "") {
                skillName = skill.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.system.skillKey}`);
            }

            const applyedModifiersInfo = this._getModifiersInfo(diceTotals);
            //console.warn(applyedModifiersInfo)

            RollDialog.prepareRollDialog({
                rollName: skillName,
                attributeName: attName,
                diceRoller: this.diceRoller,
                baseDefault: diceTotals.baseDiceTotal,
                skillDefault: diceTotals.skillDiceTotal,
                gearDefault: diceTotals.gearDiceTotal,
                modifierDefault: 0,
                applyedModifiers: applyedModifiersInfo,
                actor: this.actor,
                skillItem: skill
            });
        }
    }
	
	*/