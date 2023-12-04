import {ModuleName} from "./utils.js";

Hooks.once("init", () => {  // game.settings.get(cModuleName, "")
  //Settings
  //world
  game.settings.register(ModuleName, "InjurieTable", {
	name: game.i18n.localize(ModuleName+".Settings.InjurieTable.name"),
	hint: game.i18n.localize(ModuleName+".Settings.InjurieTable.descrp"),
	scope: "world",
	config: true,
	type: String,
	default: ""
  });
  
  game.settings.register(ModuleName, "MMissfireTable", {
	name: game.i18n.localize(ModuleName+".Settings.MMissfireTable.name"),
	hint: game.i18n.localize(ModuleName+".Settings.MMissfireTable.descrp"),
	scope: "world",
	config: true,
	type: String,
	default: ""
  });
  
  //client
  game.settings.register(ModuleName, "AutoRollInjuries", {
	name: game.i18n.localize(ModuleName+".Settings.AutoRollInjuries.name"),
	hint: game.i18n.localize(ModuleName+".Settings.AutoRollInjuries.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: false
  });
  
  game.settings.register(ModuleName, "ConsumeResourcePoints", {
	name: game.i18n.localize(ModuleName+".Settings.ConsumeResourcePoints.name"),
	hint: game.i18n.localize(ModuleName+".Settings.ConsumeResourcePoints.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: false
  });
  
  game.settings.register(ModuleName, "AutoRollMMissfires", {
	name: game.i18n.localize(ModuleName+".Settings.AutoRollMMissfires.name"),
	hint: game.i18n.localize(ModuleName+".Settings.AutoRollMMissfires.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: false
  });
  
  game.settings.register(ModuleName, "AskResourcePointAmount", {
	name: game.i18n.localize(ModuleName+".Settings.AskResourcePointAmount.name"),
	hint: game.i18n.localize(ModuleName+".Settings.AskResourcePointAmount.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: false
  }); 
 
  game.settings.register(ModuleName, "ConsumeBullets", {
	name: game.i18n.localize(ModuleName+".Settings.ConsumeBullets.name"),
	hint: game.i18n.localize(ModuleName+".Settings.ConsumeBullets.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: false
  });
  
  game.settings.register(ModuleName, "ShowTalents", {
	name: game.i18n.localize(ModuleName+".Settings.ShowTalents.name"),
	hint: game.i18n.localize(ModuleName+".Settings.ShowTalents.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
  game.settings.register(ModuleName, "ShowSkills", {
	name: game.i18n.localize(ModuleName+".Settings.ShowSkills.name"),
	hint: game.i18n.localize(ModuleName+".Settings.ShowSkills.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
  game.settings.register(ModuleName, "UseDiceCircles", {
	name: game.i18n.localize(ModuleName+".Settings.UseDiceCircles.name"),
	hint: game.i18n.localize(ModuleName+".Settings.UseDiceCircles.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
});