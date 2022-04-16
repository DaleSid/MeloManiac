App = {
    web3Provider: null,
    loading: false,
    contracts: {},
    address: '0x564E462Ce2bCF0804146EA8a9Ea63DC7A473bfDB',
    url: 'http://localhost:7545',

    load: async () => {
        console.log("Dale Started")
        await App.loadWeb3()
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

    loadAccount: async () => {
        var account;
        account = web3.eth.getAccounts().then( function (result) { return result[0] });
        return account;
    },

    loadBalance: async () => {
        var balance;
        balance = web3.utils.fromWei(await web3.eth.getBalance(App.account), 'ether');
        return balance;
    },

    loadNetwork: async () => {
        var network;
        network = web3.eth.net.getNetworkType((err, netId) => { return netId });
        return network;
    },

    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const meloArtifact = await $.getJSON('MeloManiac.json')
        App.contracts.musicbook = TruffleContract(meloArtifact, App.address)
        App.contracts.musicbook.setProvider(App.web3Provider)
    
        // Hydrate the smart contract with values from the blockchain
        App.musicbook = await App.contracts.musicbook.deployed()
    },

    populateDetails: async () => {
        var details = await App.getMeloDetails()
        App.contractAddress = details[0]
        App.userCount = details[1].toNumber()
        App.artistCount = details[2].toNumber()
        App.songCount = details[3].toNumber()
        console.log(App.contractAddress)
        console.log(App.userCount)
        console.log(App.artistCount)
        console.log(App.songCount)
    },

    getMeloDetails: async () => {
        var contractAddress, userCount, artistCount, songCount;
        contractAddress = await App.musicbook.contractOwner();
        userCount = await App.musicbook.usersCount();
        artistCount = await App.musicbook.artistsCount();
        songCount = await App.musicbook.songsCount();
        return [contractAddress, userCount, artistCount, songCount];
    },

    getRole: async () => {
        var role;
        role = await App.musicbook.getRole();
        return role;
    },

    render: async () => {
        // Prevent double render
        if (App.loading) {
          return
        }
    
        // Update app loading state
        App.setLoading(true)
    
        App.account = await App.loadAccount()
        App.network = await App.loadNetwork()
        App.balance = await App.loadBalance()
        await App.populateDetails()
        App.role = await App.getRole()
        // Render Account
        console.log(App.account)
        console.log(App.network)
        $('#account').html(App.account)
        $('#network').html(App.network)
        $('#account_balance').html(App.balance + " ETH")

        $('#contract_address').html(App.contractAddress)
        $('#no_of_users').html(App.userCount)
        $('#no_of_artists').html(App.artistCount)
        $('#no_of_songs').html(App.songCount)
        jQuery('#something').text(App.account + ":" + App.network)
    
        // Render Tasks
        // await App.renderTasks()
    
        // Update loading state
        App.setLoading(false)
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
        