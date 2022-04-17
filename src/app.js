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
        $(document).on('click', '#upload_song', function(){ var song = $('#song_file').val(); var notes_cost = $('#notes_cost').val(); App.uploadSong(song, notes_cost); });
        $(document).on('click', '.purchase', function(){ var songID = this.id; App.purchaseSong(songID); });
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

        var artistListings = await App.constructArtistListings(App.artistUploaded);
        $('#artist_listings').html(artistListings);

        var userListings = await App.constructUserListings(App.userOwned);
        $('#user_listings').html(userListings);

        var userListings = await App.constructBuyerListings(App.songCount);
        $('#buyer_listings').html(userListings);
    
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

    uploadSong: async (song, notes_cost) => {
        const notes = web3.utils.toWei(notes_cost, "ether");
        // const songHash = await App.getSongHash(song);
        const songPath = song.split("\\");
        const titleWithExtension = songPath[songPath.length - 1].split(".");
        const title = titleWithExtension[0];
        console.log(title);
        console.log(notes);
        // await App.musicbook.artistUploadSong(notes, title, songHash, {from: App.account});
        await App.render();
    },

    constructArtistListings: async (songList) => {
        var arrayLength = songList.length;
        var finalHTMLString = "";
        for (var i = 0; i < arrayLength; i++) {
            var values = await App.getSongDetail(songList[i].toNumber());
            var audioHTMLString = "<audio controls preload=\"metadata\" style=\" width:500px;\"><source src=\"https://gateway.ipfs.io/ipfs/" + values[5] +"\" type=\"audio/mpeg\">Your browser does not support the audio element.</audio>";
            var tempHTMLString =    "<tr><td>" + values[1] + "</td>" +
                                    "<td>" + values[2] + "</td>" +
                                    "<td>" + audioHTMLString + "</td>" +
                                    "<td>" + values[4] + "</td></tr>";
            finalHTMLString = finalHTMLString + tempHTMLString;
        }
        return finalHTMLString;
    },

    constructUserListings: async (songList) => {
        var arrayLength = songList.length;
        var finalHTMLString = "";
        for (var i = 0; i < arrayLength; i++) {
            var values = await App.getSongDetail(songList[i]);
            var audioHTMLString = "<audio controls preload=\"metadata\" style=\" width:500px;\"><source src=\"https://gateway.ipfs.io/ipfs/" + values[5] +"\" type=\"audio/mpeg\">Your browser does not support the audio element.</audio>";

            var artistDetails = await App.getArtistDetail(values[1].toNumber());
            var artistName = artistDetails[0].toString();
            
            var tempHTMLString =    "<tr><td>" + values[1] + "</td>" +
                                    "<td>" + values[2] + "</td>" +
                                    "<td>" + artistName + "</td>" +
                                    "<td>" + audioHTMLString + "</td>" +
                                    "<td>" + values[4] + "</td></tr>";
            finalHTMLString = finalHTMLString + tempHTMLString;
        }
        return finalHTMLString;
    },

    constructBuyerListings: async (songListLen) => {
        var arrayLength = songListLen;
        var finalHTMLString = "";
        for (var i = 1; i <= arrayLength; i++) {
            var values = await App.getSongDetail(i);
            
            var audioHTMLString = "<audio controls preload=\"metadata\" style=\" width:500px;\" ontimeupdate=\"restrict(this)\"><source src=\"https://gateway.ipfs.io/ipfs/" + values[5] +"\" type=\"audio/mpeg\">Your browser does not support the audio element.</audio> \
            <script> \
            function restrict(event) { \
              if (event.currentTime > 10) { \
                event.pause(); \
                event.currentTime = 0; \
              } \
            } \
            </script>";

            var artistDetails = await App.getArtistDetail(values[1].toNumber());
            var artistName = artistDetails[0].toString();

            var buttonString = "<button type=\"button\" class=\"btn btn-primary purchase\" id=\"" + values[1] + "\">" + web3.utils.fromWei(values[3], "ether") + " ETH</button>";

            var tempHTMLString =    "<tr><td>" + values[1].toNumber() + "</td>" +
                                    "<td>" + values[2] + "</td>" +
                                    "<td>" + artistName + "</td>" +
                                    "<td>" + audioHTMLString + "</td>" +
                                    "<td>" + values[4] + "</td>" + 
                                    "<td>" + buttonString + "</td></tr>";

            finalHTMLString = finalHTMLString + tempHTMLString;
        }
        return finalHTMLString;
    },

    purchaseSong: async (songID) => {
        const songDetails = await App.getSongDetail(songID);
        const notes = songDetails[3];
        console.log("Purchase Notes: " + notes);
        await App.musicbook.userBuySong(songID, {from: App.account, value: notes});
        await App.render();
    },

    getSongDetail: async (songID) => {
        var values;
        values = await App.musicbook.songDetail(songID, {from: App.account});
        return values;
    },

    getSongHash: async (songFile) => {
        return;
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
        