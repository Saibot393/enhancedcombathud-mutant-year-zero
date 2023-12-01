import {ModuleName} from "./utils.js";

Hooks.once("init", () => {  // game.settings.get(cModuleName, "")
  //Settings
  //client
  game.settings.register(ModuleName, "ConsumeReourcePoints", {
	name: game.i18n.localize(ModuleName+".ConsumeReourcePoints.name"),
	hint: game.i18n.localize(ModuleName+".ConsumeReourcePoints.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
  game.settings.register(ModuleName, "ConsumeBullets", {
	name: game.i18n.localize(ModuleName+".ConsumeBullets.name"),
	hint: game.i18n.localize(ModuleName+".ConsumeBullets.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
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