App = {
    web3Provider: null,
    loading: false,
    contracts: {},
    marketPlaceAddress: '0x8BdF477CA0a937C82d130D4d2Bd019E574cfd8D6',
    url: 'https://ropsten.infura.io/v3/62cff11104f54085984676c0008ebce0',
    tokenAddress: '0x395F487c8528A6E15CA7b483C946093a28d0c454',
    buffer: '',
    blockNumber:'',
    transactionHash:'',
    gasUsed:'',
    txReceipt: '',
    ethAddress: '',

    load: async () => {
        await App.loadWeb3()
        await App.loadContract()
        App.ipfs = window.IpfsApi({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })
        console.log(App.ipfs)
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

        // Token Contract
        // Create a JavaScript version of the smart contract
        const notesArtifact = await $.getJSON('MeloNotes.json')
        App.contracts.musicnotes = TruffleContract(notesArtifact, App.tokenAddress)
        App.contracts.musicnotes.setProvider(App.web3Provider)

        // Hydrate the smart contract with values from the blockchain
        App.musicnotes = await App.contracts.musicnotes.deployed()

        // MarketPlace Contract
        // Create a JavaScript version of the smart contract
        const meloArtifact = await $.getJSON('MeloManiac.json')
        App.contracts.musicbook = TruffleContract(meloArtifact, App.marketPlaceAddress)
        App.contracts.musicbook.setProvider(App.web3Provider)
    
        // Hydrate the smart contract with values from the blockchain
        App.musicbook = await App.contracts.musicbook.deployed()
    },

    bindEvents: async () => {
        $(document).on('click', '#register_new_user', App.registerUser);
        $(document).on('click', '#register_new_artist', function(){ var nickName = $('#nickname_artist').val(); App.registerArtist(nickName); });
        $(document).on('click', '#upload_song', function(){ 
            console.log('Inside onclick')
            const song = document.getElementById('song_file')
            // reader.readAsArrayBuffer(song.files[0])
            var songFilePath = $('#song_file').val()
            var notes_cost = $('#notes_cost').val(); 
            // console.log('Here')
            // console.log(App.buffer)
            App.uploadSong(song, songFilePath, notes_cost); 
        });
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
        $('#account_balance').html(App.balance + " Notes 🎵")

        $('#contract_owner').html(App.contractAddress)
        $('#marketplace_address').html(App.marketPlaceAddress)
        $('#token_address').html(App.tokenAddress)
        $('#no_of_users').html(App.userCount)
        $('#no_of_artists').html(App.artistCount)
        $('#no_of_songs').html(App.songCount)
        $('#current_user').html(App.account)
        $('#current_network').html(App.network)
        $('#token_balance').html(App.balance + " Notes 🎵")

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
        balance = App.musicnotes.balanceOf(App.account, {from: App.account});
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
        App.musicnotes.approve(App.marketPlaceAddress, App.balance, {from: App.account});
        await App.render();
    },

    getUserDetail: async () => {
        var values;
        values = await App.musicbook.userDetail({from: App.account});
        return values;
    },

    registerArtist: async (nickName) => {
        console.log(nickName);
        await App.musicbook.artistRegister(nickName, {from: App.account});
        App.musicnotes.approve(App.marketPlaceAddress, App.balance, {from: App.account});
        await App.render();
    },

    getArtistDetail: async (artist_id) => {
        var values;
        values = await App.musicbook.artistDetail(artist_id, {from: App.account});
        return values;
    },

    uploadSong: async (song, songFilePath, notes_cost) => {
        const notes = notes_cost;
        var songHash = ''
        const songPath = songFilePath.split("\\");
        const titleWithExtension = songPath[songPath.length - 1].split(".");
        const title = titleWithExtension[0];
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            var buffer = require('buffer');
            console.log('Require crossed')
            const buf = buffer.Buffer.from(reader.result) // Convert data into buffer
            App.ipfs.files.add(buf, (err, result) => { // Upload buffer to IPFS
                if(err) {
                    console.error("IPFS Add error: " + err)
                    return
                }
                console.log(typeof result[0].hash)
                console.log("Hash: " + result[0].hash)
                let url = `https://gateway.ipfs.io/ipfs/${result[0].hash}`
                console.log(`Url --> ${url}`)
                resultHash = String(result[0].hash)
                console.log("Inside:" + notes)
                
                App.musicbook.artistUploadSong(notes, title, resultHash, {from: App.account}).then((e, result) => {
                    $(".toast").toast("show");
                    $(".toast-body").html("Upload Successful!");
                }, (error) => {
                    var msg = error.message.toString();
                    var toStrip = "[ethjs-query] while formatting outputs from RPC ";
                    var structured = msg.substr(toStrip.length);
                    structured = structured.replace(/(^'|'$)/g, '')
                    var msgJSON = JSON.parse(structured);
                    $(".toast").toast("show");
                    $(".toast-body").html(msgJSON.value.data.message);
                });
            })
        }
        reader.readAsArrayBuffer(song.files[0]);

        console.log(title);
        console.log(notes);
    },

    constructArtistListings: async (songList) => {
        var arrayLength = songList.length;
        var finalHTMLString = "";
        for (var i = 0; i < arrayLength; i++) {
            var values = await App.getSongDetail(songList[i].toNumber());
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var releaseDate = new Date(values[4]*1000).toLocaleDateString("en-US", options)
            var audioHTMLString = "<audio controls preload=\"metadata\" style=\" width:500px;\"><source src=\"https://gateway.ipfs.io/ipfs/" + values[5] +"\" type=\"audio/mpeg\">Your browser does not support the audio element.</audio>";
            var tempHTMLString =    "<tr><td>" + values[1] + "</td>" +
                                    "<td>" + values[2] + "</td>" +
                                    "<td>" + audioHTMLString + "</td>" +
                                    "<td>" + releaseDate + "</td></tr>";
            finalHTMLString = finalHTMLString + tempHTMLString;
        }
        return finalHTMLString;
    },

    constructUserListings: async (songList) => {
        console.log('Inside User listing')
        var arrayLength = songList.length;
        var finalHTMLString = "";
        for (var i = 0; i < arrayLength; i++) {
            var values = await App.getSongDetail(songList[i]);
            var audioHTMLString = "<audio controls preload=\"metadata\" style=\" width:500px;\"><source src=\"https://gateway.ipfs.io/ipfs/" + values[5] +"\" type=\"audio/mpeg\">Your browser does not support the audio element.</audio>";

            var artistDetails = await App.getArtistDetail(values[0].toNumber());
            var artistName = artistDetails[0].toString();
            
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var releaseDate = new Date(values[4]*1000).toLocaleDateString("en-US", options)

            var tempHTMLString =    "<tr><td>" + values[1] + "</td>" +
                                    "<td>" + values[2] + "</td>" +
                                    "<td>" + artistName + "</td>" +
                                    "<td>" + audioHTMLString + "</td>" +
                                    "<td>" + releaseDate + "</td></tr>";
            finalHTMLString = finalHTMLString + tempHTMLString;
        }
        return finalHTMLString;
    },

    constructBuyerListings: async (songListLen) => {
        console.log("Inside buyer listing")
        var arrayLength = songListLen;
        var finalHTMLString = "";
        for (var i = 1; i <= arrayLength; i++) {
            var values = await App.getSongDetail(i);
            console.log('INSIDE LOOP' + i)
            console.log('Song Details:')
            console.log(values)
            var audioHTMLString = "<audio controls preload=\"metadata\" style=\" width:500px;\" ontimeupdate=\"restrict(this)\"><source src=\"https://gateway.ipfs.io/ipfs/" + values[5] +"\" type=\"audio/mpeg\">Your browser does not support the audio element.</audio> \
            <script> \
            function restrict(event) { \
              if (event.currentTime > 10) { \
                event.pause(); \
                event.currentTime = 0; \
              } \
            } \
            </script>";
            console.log('artist id is' + values[0].toNumber())
            var artistDetails = await App.getArtistDetail(values[0].toNumber());
            console.log('Artist Details:')
            console.log(artistDetails)
            var artistName = artistDetails[0].toString();
            console.log(artistName)
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            var releaseDate = new Date(values[4]*1000).toLocaleDateString("en-US", options)
            console.log('release Data is ' + releaseDate)

            var buttonString = "<button type=\"button\" class=\"btn btn-primary purchase\" id=\"" + values[1] + "\">" + values[3] + " Notes 🎵</button>";

            var tempHTMLString =    "<tr><td>" + values[1].toNumber() + "</td>" +
                                    "<td>" + values[2] + "</td>" +
                                    "<td>" + artistName + "</td>" +
                                    "<td>" + audioHTMLString + "</td>" +
                                    "<td>" + releaseDate + "</td>" + 
                                    "<td>" + buttonString + "</td></tr>";

            finalHTMLString = finalHTMLString + tempHTMLString;
        }
        return finalHTMLString;
    },

    purchaseSong: async (songID) => {
        const songDetails = await App.getSongDetail(songID);
        const cost = songDetails[3];
        const allowance = await App.getAllowance();
        if (allowance < cost.toNumber())
        {
            const extraAllowance = songDetails[3] * 2;
            App.musicnotes.approve(App.marketPlaceAddress, extraAllowance, {from: App.account})
        }
        await App.musicbook.userBuySong(songID, {from: App.account, value: cost}).then((e, result) => {
            $(".toast").toast("show");
            $(".toast-body").html("Purchase Successful!");
        }, (error) => {
            var msg = error.message.toString();
            var toStrip = "[ethjs-query] while formatting outputs from RPC ";
            var structured = msg.substr(toStrip.length);
            structured = structured.replace(/(^'|'$)/g, '')
            var msgJSON = JSON.parse(structured);
            $(".toast").toast("show");
            $(".toast-body").html(msgJSON.value.data.message);
        });
        await App.render();
    },

    getAllowance: async () => {
        var value;
        value = await App.musicnotes.allowance(App.account, App.marketPlaceAddress, {from: App.account});
        return value;
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
        