const ModuleName = "enhancedcombathud-vaesen";

Hooks.once("init", () => {  // game.settings.get(cModuleName, "")
  //Settings
  //client
  game.settings.register(ModuleName, "TreatType", {
	name: game.i18n.localize("enhancedcombathud-vaesen.Settings.TreatType.name"),
	hint: game.i18n.localize("enhancedcombathud-vaesen.Settings.TreatType.descrp"),
	scope: "client",
	config: true,
	type: String,
	choices: {
		"physical" : game.i18n.localize("CONDITION.PHYSICAL"),
		"mental" : game.i18n.localize("CONDITION.MENTAL")
	},
	default: "physical",
	requiresReload: true
  });
  
  game.settings.register(ModuleName, "ShowTalents", {
	name: game.i18n.localize("enhancedcombathud-vaesen.Settings.ShowTalents.name"),
	hint: game.i18n.localize("enhancedcombathud-vaesen.Settings.ShowTalents.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
  game.settings.register(ModuleName, "UseDiceCircles", {
	name: game.i18n.localize("enhancedcombathud-vaesen.Settings.UseDiceCircles.name"),
	hint: game.i18n.localize("enhancedcombathud-vaesen.Settings.UseDiceCircles.descrp"),
	scope: "client",
	config: true,
	type: Boolean,
	default: false,
	requiresReload: true
  });
  
});