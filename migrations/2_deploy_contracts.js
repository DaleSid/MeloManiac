const ToDoList = artifacts.require("ToDoList");

module.exports = function (deployer) {
  deployer.deploy(ToDoList);
};
