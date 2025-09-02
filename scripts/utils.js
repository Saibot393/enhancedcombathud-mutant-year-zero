const ModuleName = "enhancedcombathud-mutant-year-zero";

async function getTooltipDetails(item, actortype) {
	let title, description, itemType, creatureType, skillmodifiers, attributemodifiers, validskills, category, subtitle, range, damage, bonus, quantity, comment, requirement;
	let propertiesLabel = "MYZ.REQUIREMENT";
	let properties = [];
	let materialComponents = "";

	let details = [];
	
	if (!item || !item.system) return;

	title = item.name;
	description = item.system.description;
	itemType = item.type;
	creatureType = item.parent?.system.creatureType;
	skillmodifiers = [];
	attributemodifiers = [];
	validskills = item.system.skillKeysList;
	if (item.system.modifiers) {
		attributemodifiers = attributemodifiers.concat(Object.keys(item.system.modifiers).filter(key => item.system.modifiers[key] != 0 && !validskills.includes(key)));
		skillmodifiers = skillmodifiers.concat(Object.keys(item.system.modifiers).filter(key => item.system.modifiers[key] != 0 && validskills.includes(key)));
	}
	if (item.system.gearModifiers) {
		attributemodifiers = attributemodifiers.concat(Object.keys(item.system.gearModifiers).filter(key => item.system.gearModifiers[key] != 0 && !attributemodifiers.includes(key) && !validskills.includes(key)));
		skillmodifiers = skillmodifiers.concat(Object.keys(item.system.gearModifiers).filter(key => item.system.gearModifiers[key] != 0 && !skillmodifiers.includes(key) && validskills.includes(key)));
	}
	category = item.system.category;
	range = item.system?.range;
	damage = item.system?.damage;
	bonus = item.system?.bonus;
	quantity = item.system?.quantity;
	comment = item.system?.comment;
	requirement = item.system?.requirement;
	if (!requirement) {
		requirement = item.system?.dev_requirement;
		propertiesLabel = "MYZ.DEV_REQUIREMENT";
	}
	
	properties = [];

	subtitle = skillmodifiers.map(key => game.i18n.localize(`MYZ.SKILL_${key}`));
	subtitle = subtitle.concat(attributemodifiers.map(key => game.i18n.localize(`MYZ.ATTRIBUTE_${key.toUpperCase()}_${creatureType.toUpperCase()}`)));
	subtitle = subtitle.join("/");

	switch (itemType) {
		case "weapon":
			let skill;
			switch (category) {
				case "melee":
					switch(creatureType) {
						case "robot":
							skill = "ASSAULT";
							break;
						default:
							skill = "FIGHT";
							break;
					}
					break;
				case "ranged":
					skill = "SHOOT";
					break;
			}
			subtitle = game.i18n.localize(`MYZ.SKILL_${skill}`);
			
			details.push({
				label: "MYZ.DAMAGE",
				value: damage
			});
			details.push({
				label: "MYZ.RANGE",
				value: game.i18n.localize("MYZ." + range.toUpperCase())
			});
			break;
	}

	if (description) description = sanitize(description);
	
	if (bonus) {
		details.push({
			label: "MYZ.BONUS",
			value: bonus.value
		});
	}
	
	if (quantity != undefined && details.length < 3) {
		details.push({
			label: "MYZ.QUANTITY",
			value: quantity
		});		
	}
	
	if (requirement) {
		properties.push({ label: requirement });
	}

	return { title, description, subtitle, details, properties , propertiesLabel, footerText: comment };
}

function openRollDialoge(rollType, rollName, rollActor, rollitem = undefined) { //adapted from MYZ system code
	let rollData = {};
	
	let rollModifiers;
	
	switch (rollType) {
		case "skill":
			let skill = rollActor.items.find(item => item.type == rollType && item.system.skillKey == rollName);

			if (!skill) {
                skill = {
                    system: {
                        value: 0,
						skillKey : rollName
                    }
                };

				switch(rollName) {
					case "FIGHT":
					case "ASSAULT":
						skill.system.attribute = "strength";
						break;
					case "SHOOT":
						skill.system.attribute = "agility";
						break;
				}
			}
			
			const attribute = rollActor.system.attributes[skill.system.attribute];
			
			const diceTotals = rollActor.sheet._getRollModifiers(skill);
            diceTotals.gearDiceTotal = Math.max(0, diceTotals.gearDiceTotal);
			
			rollModifiers = rollActor.sheet._getRollModifiers(skill);
			rollModifiers.gearDiceTotal = Math.max(0, rollModifiers.gearDiceTotal);
			
            let skillName = "";
            if (skill.system.skillKey == "") {
                skillName = skill.name;
            } else {
                skillName = game.i18n.localize(`MYZ.SKILL_${skill.system.skillKey}`);
            }
			
			rollData = {
				rollName : skillName,
			
				attributeName : skill.system.attribute,
			
				base: {default:attribute.value, total: rollModifiers.baseDiceTotal, modifiers: rollModifiers.modifiersToAttributes},
                skill: {default:skill.system.value, total: rollModifiers.skillDiceTotal, modifiers: rollModifiers.modifiersToSkill},
                gear: {default:0, total: rollModifiers.gearDiceTotal, modifiers: rollModifiers.modifiersToGear},
				
				baseDefault: diceTotals.baseDiceTotal,
				skillDefault: diceTotals.skillDiceTotal,
				gearDefault: diceTotals.gearDiceTotal,
				
				applyedModifiers: null,
				
				skillItem : skill
			}
			break;	
		case "attribute":
			const attributeValue = rollActor.system.attributes[rollName].value;
			
			const attributeName = `MYZ.ATTRIBUTE_${rollName.toUpperCase()}_${rollActor.system.creatureType.toUpperCase()}`;
			
			/*
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
			*/
			rollModifiers = rollActor.sheet._getAttibuteModifiers(rollName)        
			rollModifiers.skillDiceTotal = 0;
			rollModifiers.modifiersToSkill = [];
			rollModifiers.gearDiceTotal = 0;
			rollModifiers.modifiersToGear = [];
			
			rollData = {
				rollName: attributeName, //this is confusing
				
				attributeName: rollName, //isn't it?
				
				base: {default:attributeValue, total: rollModifiers.baseDiceTotal, modifiers:rollModifiers.modifiersToAttributes},
				skill: {default:0, total: rollModifiers.skillDiceTotal, modifiers:rollModifiers.modifiersToSkill},
				gear: {default:0, total: rollModifiers.gearDiceTotal, modifiers:rollModifiers.modifiersToGear},            
				modifierDefault: 0,
				applyedModifiers: null
			}
			break;
	}
	
	if (rollitem) {
		rollModifiers.gearDiceTotal += parseInt(rollitem.system.bonus.value);
        rollModifiers.gearDiceTotal = Math.max(0, rollModifiers.gearDiceTotal);
		
		rollData.itemId = rollitem.id;
		rollData.gear = {default:0, total: rollModifiers.gearDiceTotal, modifiers: rollModifiers.modifiersToGear},
		rollData.modifierDefault = rollitem.system.skillBonus,
        rollData.artifactDefault = rollitem.system.artifactBonus || 0,
		rollData.damage = rollitem.system.damage,
		rollData.rollName = rollitem.name;
		/*
		rollData.gearDefault = Math.max(parseInt(rollitem.system.bonus.value), 0),
		rollData.modifierDefault = rollitem.system.skillBonus,
		rollData.artifactDefault = rollitem.system.artifactBonus || 0,
		rollData.damage = rollitem.system.damage,
		rollData.rollName = rollitem.name;
		*/
	}
	
	let settings = {...{
		rollName: "",
		attributeName : "",
		diceRoller: rollActor.sheet.diceRoller,
		baseDefault: 0,
		skillDefault: 0,
		gearDefault: 0,
		modifierDefault: 0,
		actor : rollActor,
		applyedModifiers: {}
	}, ...rollData}
	
	if (game.myz.RollDialog.prepareRollDialog) {
		game.myz.RollDialog.prepareRollDialog(settings);
	}
	else {
		if (game.myz.RollDialog.OpenRollDialog) {
			game.myz.RollDialog.OpenRollDialog(settings);
		}
	}
}

function openItemRollDialoge(item, actor) {
	if (item && actor) {
		let skill;
		
		switch (item.system.category) {
			case "melee":
				switch(actor.system.creatureType) {
					case "robot":
						skill = "ASSAULT";
						break;
					default:
						skill = "FIGHT";
						break;
				}
				break;
			case "ranged":
				skill = "SHOOT";
				break;
		}
		
		openRollDialoge("skill", skill, actor, item);
	}
}

function openArmorRollDialoge (actor) {
	game.myz.RollDialog.prepareRollDialog({
		rollName: game.i18n.localize("MYZ.ARMOR"),
		diceRoller: actor.sheet.diceRoller,
		gear: {default:actor.system.armorrating.value, total: actor.system.armorrating.value, modifiers: null}
		//gearDefault: actor.system.armorrating.value
    });
}

function pushRoll(actor) {
	actor.sheet.diceRoller.push({ actor: actor })
}

function sanitize(string) {
	let parser = new DOMParser();
	
	let html = parser.parseFromString(string, 'text/html');
	
	return html.body.innerText;
}

function innerHTMLselector(html, selector, innerHTML) {
	let returnElement;
	
	html.querySelectorAll(selector).forEach((element) => {if (element.innerHTML == innerHTML) returnElement = element});
	
	return returnElement;
}

async function postChatCard(actor, infos = {title : "", subtitle : "", images : [], description : "", buttons : [], whispered : false}) {
	let content = "";
	
	content = content + '<div class="myz chat-item">';
	content = content + '<div class="border">';
	
	if (infos.title) {
		content = content + `<h3> ${replacewords(infos.title, {actorname : actor.name})} </h3>`;
	}
	
	if (infos.subtitle) {
		content = content + `<h4> ${replacewords(infos.subtitle, {actorname : actor.name})} </h4>`;
	}
	
	if (infos.description) {
		content = content + `<div> ${infos.description} </div>`;
	}
	
	if (infos.images) {
		for (let image of infos.images) {
			content = content + `<img src="${image}">`;
		}
	}
	
	if (infos.buttons) {
		for (let buttonid of Object.keys(infos.buttons)) {
			content = content + `<button class="button" id="${buttonid}"'>${infos.buttons[buttonid].label}</button>`;
		}
	}
	
	let whisper = [];
	
	if (infos.whispered) {
		whisper.push(game.user.id);
	}
	
	content = content + '</div>';
	content = content + '</div>';
	
	let message = await ChatMessage.create({user: game.user.id, content : content, whisper : whisper}); //CHAT MESSAGE
	
	let messagehtml = $(document).find(`li.chat-message[data-message-id="${message.id}"]`);

	if (infos.buttons) {
		for (let buttonid of Object.keys(infos.buttons)) {
			messagehtml.find(`button#${buttonid}`)[0].onclick = infos.buttons[buttonid].onclick;
		}
	}
}

function replacewords(text, words = {}){
	let localtext = text;
	
	for (let word of Object.keys(words)) {
		localtext = localtext.replace("{" + word + "}", words[word]);
	}
		
	return localtext;
}

export { ModuleName, getTooltipDetails, openRollDialoge, openItemRollDialoge, openArmorRollDialoge, pushRoll, innerHTMLselector, postChatCard, replacewords }
