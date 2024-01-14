var simplestorage = artifacts.require("./Oracle.sol");
var GoldToken = artifacts.require("./GoldToken.sol");
module.exports = function(deployer){
    deployer.deploy(simplestorage);
    deployer.deploy(GoldToken);
}
