const ModuleName = "enhancedcombathud-vaesen";

const ItemReplacementID = "_argonUI_";

var VaesenECHSlowItems = {};

var VaesenECHFastItems = {};

var VaesenECHReactionItems = {};

function registerVaesenECHSItems () {
	VaesenECHSlowItems = {
		groupflags : {
			actiontype : "slow"
		},
		Flee : {
			img: "modules/enhancedcombathud/icons/svg/run.svg",
			name: game.i18n.localize(ModuleName+".Titles.Flee"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Flee"),
				skill : "agility",
				vaesenattribute : "bodyControl"
			}
		},
		WPG : {
			img: "modules/enhancedcombathud/icons/svg/shield-bash.svg",
			name: game.i18n.localize(ModuleName+".Titles.WPG"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.WPG"),
				skill : "force",
				vaesenattribute : "might"
			}
		},
		Survey : {
			img: "icons/svg/eye.svg",
			name: game.i18n.localize(ModuleName+".Titles.Survey"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Survey"),
				skill : "observation",
				vaesenattribute : "bodyControl"
			}
		},
		TreatInjuries : {
			img: "icons/svg/heal.svg",
			name: game.i18n.localize(ModuleName+".Titles.TreatInjuries"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.TreatInjuries"),
				skill : "",
				vaesenattribute : "bodyControl"
			}
		}
	}
	
	switch(game.settings.get(ModuleName, "TreatType")) {
		case "physical" :
			VaesenECHSlowItems.TreatInjuries.system.skill = "medicine";
			break;
		case "mental" :
			VaesenECHSlowItems.TreatInjuries.system.skill = "inspiration";
			break;
	}
	
	VaesenECHFastItems = {
		groupflags : {
			actiontype : "fast"
		},
		DrawWeapon : {
			img: "icons/svg/sword.svg",
			name: game.i18n.localize(ModuleName+".Titles.DrawWeapon"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.DrawWeapon")
			}
		},
		Standup : {
			img: "icons/svg/up.svg",
			name: game.i18n.localize(ModuleName+".Titles.Standup"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Standup")
			}
		},
		Move : {
			img: "modules/enhancedcombathud/icons/svg/journey.svg",
			name: game.i18n.localize(ModuleName+".Titles.Move"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Move")
			}
		},
		TakeCover : {
			img: "modules/enhancedcombathud/icons/svg/armor-upgrade.svg",
			name: game.i18n.localize(ModuleName+".Titles.TakeCover"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.TakeCover")
			}
		}
	}
	
	VaesenECHReactionItems = {
		groupflags : {
			actiontype : "react"
		},
		Dodge : {
			img: "modules/enhancedcombathud/icons/svg/dodging.svg",
			name: game.i18n.localize(ModuleName+".Titles.Dodge"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Dodge"),
				skill : "agility",
				vaesenattribute : "bodyControl"
			}
		},
		Parry : {
			img: "modules/enhancedcombathud/icons/svg/crossed-swords.svg",
			name: game.i18n.localize(ModuleName+".Titles.Parry"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Parry"),
				skill : ["closeCombat", "force"],
				vaesenattribute : "might"
			}
		},
		BreakFree : {
			img: "modules/enhancedcombathud/icons/svg/mighty-force.svg",
			name: game.i18n.localize(ModuleName+".Titles.BreakFree"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.BreakFree"),
				skill : "force",
				vaesenattribute : "might"
			}
		},
		Chase : {
			img: "modules/enhancedcombathud/icons/svg/walking-boot.svg",
			name: game.i18n.localize(ModuleName+".Titles.Chase"),
			type : "base",
			system : {
				description : game.i18n.localize(ModuleName+".Descriptions.Chase"),
				skill : "agility",
				vaesenattribute : "bodyControl"
			}
		}
	}
	
	//some preparation
	for (let itemset of [VaesenECHSlowItems, VaesenECHFastItems, VaesenECHReactionItems]) {
		for (let itemkey of Object.keys(itemset)) {
			if (itemkey != "groupflags") {
				itemset[itemkey].flags = {};
				itemset[itemkey].flags[ModuleName] = {...itemset.groupflags, ...itemset[itemkey].flags[ModuleName]};
				
				let ReplacementItem = game.items.find(item => item.name == ItemReplacementID + itemkey);
				
				if (ReplacementItem) {
					itemset[itemkey].system.description = ReplacementItem.system.description;
				}
			}
		}
		
		delete itemset.groupflags;
	}
}

export {registerVaesenECHSItems, VaesenECHSlowItems, VaesenECHFastItems, VaesenECHReactionItems}