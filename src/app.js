App = {
    web3Provider: null,
    loading: false,
    contracts: {},
    address: '',
    url: 'http://localhost:7545',

    load: async () => {
        console.log("Dale Started")
        await App.loadWeb3()
        App.account = await App.loadAccount()
        await App.loadContract()
        await App.render()
    },

    loadWeb3: async () => {
        // Is there is an injected web3 instance?
        if (typeof web3 !== 'undefined') {
            console.log("Web3 Available");
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fallback to the TestRPC
            App.web3Provider = new Web3.providers.HttpProvider(App.url);
            console.log("No Web3");
        }
        web3 = new Web3(App.web3Provider);

        ethereum.enable();
    },

    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const meloArtifact = await $.getJSON('MeloManiac.json')
        App.contracts.musicbook = TruffleContract(meloArtifact)
        App.contracts.musicbook.setProvider(App.web3Provider)
    
        // Hydrate the smart contract with values from the blockchain
        App.musicbook = await App.contracts.musicbook.deployed()
    },

    render: async () => {
        // Prevent double render
        if (App.loading) {
          return
        }
    
        // Update app loading state
        App.setLoading(true)
    
        // Render Account
        console.log(App.account)
        $('#account').html(App.account)
        jQuery('#something').text(App.account)
    
        // Render Tasks
        // await App.renderTasks()
    
        // Update loading state
        App.setLoading(false)
    },

    loadAccount: async () => {
        var account;
        account = web3.eth.getAccounts().then( function (result) { return result[0] });
        return account;
    },
    
    setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
          loader.show()
          content.hide()
        } else {
          loader.hide()
          content.show()
        }
    },

};

$(function() {
    $(window).load(function() {
      App.load();
    });
});
        