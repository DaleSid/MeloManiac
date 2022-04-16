App = {
    web3Provider: null,
    loading: false,
    contracts: {},
    address: '0x564E462Ce2bCF0804146EA8a9Ea63DC7A473bfDB',
    url: 'http://localhost:7545',

    load: async () => {
        await App.loadWeb3()
        await App.loadContract()
        await App.render()
        await App.bindEvents()
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
        App.contracts.musicbook = TruffleContract(meloArtifact, App.address)
        App.contracts.musicbook.setProvider(App.web3Provider)
    
        // Hydrate the smart contract with values from the blockchain
        App.musicbook = await App.contracts.musicbook.deployed()
    },

    bindEvents: async () => {
        $(document).on('click', '#register_new_user', App.registerUser);
        $(document).on('click', '#register_new_artist', function(){ var nickName = $('#nickname_artist').val(); App.registerArtist(nickName); });
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
        await App.showAndHideContent()
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

        userDetails = await App.getUserDetail();
        App.userID = userDetails[0].toNumber();
        App.artistID = userDetails[1].toNumber();
        App.userOwned = userDetails[2];

        $('#user_address').html(App.account);
        $('#user_id').html(App.userID);
        $('#songs_owned').html(App.userOwned.length);

        artistDetails = await App.getArtistDetail(App.artistID);
        App.artistName = artistDetails[0].toString();
        App.artistUploaded = artistDetails[1];
        $('#artist_address').html(App.account);
        $('#artist_id').html(App.artistID);
        $('#artist_name').html(App.artistName);
        $('#songs_uploaded').html(App.artistUploaded.length);

    
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

    populateDetails: async () => {
        var details = await App.getMeloDetails()
        App.contractAddress = details[0]
        App.userCount = details[1].toNumber()
        App.artistCount = details[2].toNumber()
        App.songCount = details[3].toNumber()
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
        role = await App.musicbook.getRole({from: App.account});
        return role;
    },

    registerUser: async () => {
        await App.musicbook.userRegister({from: App.account});
        await App.render();
    },

    getUserDetail: async () => {
        var values;
        values = await App.musicbook.userDetail({from: App.account});
        return values;
    },

    registerArtist: async (nickName) => {
        console.log(nickName);
        await App.musicbook.artistRegister(nickName, {from: App.account, value: web3.utils.toWei('0.05', 'ether')});
        await App.render();
    },

    getArtistDetail: async (artist_id) => {
        var values;
        values = await App.musicbook.artistDetail(artist_id, {from: App.account});
        return values;
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

    showAndHideContent: () => {
        console.log("Role: " + App.role)
        const user_register = $('#user_register')
        const user_access = $('#user_access')
        const artist_register = $('#artist_register')
        const artist_access = $('#artist_access')

        const user_song_privilege = $('#user_song_privilege')
        const artist_song_privilege = $('#artist_song_privilege')
        const register_song_privilege = $('#register_song_privilege')

        if (App.role == 1 && App.loading) {
            user_access.show()
            user_register.hide()
            artist_access.show()
            artist_register.hide()

            user_song_privilege.show()
            artist_song_privilege.show()
            register_song_privilege.hide()
        } else if (App.role == 2 && App.loading) {
            user_access.show()
            user_register.hide()
            artist_register.show()
            artist_access.hide()

            user_song_privilege.show()
            artist_song_privilege.hide()
            register_song_privilege.hide()
        } else if (App.role == 0 && App.loading) {
            user_register.show()
            user_access.hide()
            artist_register.show()
            artist_access.hide()

            user_song_privilege.hide()
            artist_song_privilege.hide()
            register_song_privilege.show()
        } else {
            user_register.hide()
            user_access.hide()
            artist_register.hide()
            artist_access.hide()

            user_song_privilege.hide()
            artist_song_privilege.hide()
            register_song_privilege.hide()
        }
    },

};

$(function() {
    $(window).load(function() {
      App.load();
    });
});
        