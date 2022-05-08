const MeloManiac = artifacts.require("MeloManiac");
const MeloNotes = artifacts.require("MeloNotes");

module.exports = function (deployer) {
  deployer.deploy(MeloNotes, "MeloNotes", "MNT", 2000000000000).then(function() {
    return deployer.deploy(MeloManiac, MeloNotes.address);
  });
};
