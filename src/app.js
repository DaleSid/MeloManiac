App = {
    web3Provider: null,
    loading: false,
    contracts: {},
    address: '0x565A08FbDFdfAD165098a2d34c3981CD219B4f0d',
    url: 'http://localhost:7545',
    buffer: '',
    blockNumber:'',
    transactionHash:'',
    gasUsed:'',
    txReceipt: '',
    ethAddress: '',

    load: async () => {
        await App.loadWeb3()
        await App.loadContract()
        App.ipfs = window.IpfsApi("ipfs.infura.io", '5001')
        console.log(App.ipfs)
        // var moduleName = 'ipfs-api';
        // define([moduleName], function(fooModule){
        //     const IPFS = require(fooModule)
        //     App.ipfs = new IPFS({ host: "ipfs.infura.io", port: 5001, protocol: "https" });
        // })
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
        $(document).on('click', '#upload_song', function(){ 
            console.log('Inside onclick')
            const song = document.getElementById('song_file')
            // reader.readAsArrayBuffer(song.files[0])
            var songFilePath = $('#song_file').val()
            var notes_cost = parseFloat($('#notes_cost').val()); 
            // console.log('Here')
            // console.log(App.buffer)
            App.uploadSong(song, songFilePath, notes_cost); 
        });
        // $("#song_file").on("change", function() {
        //     var reader = new FileReader();
        //     reader.onload = function (e) {
        //         const converted_to_buffer = buffer.Buffer(reader.result); // honestly as a web developer I do not fully appreciate the difference between buffer and arrayBuffer 
        //         App.buffer = converted_to_buffer
        //         console.log('Here')
        //         console.log(converted_to_buffer)
        //     }
        //     // reader.readAsArrayBuffer(this.files[0]);
        // })

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

    uploadSong: async (song, songFilePath, notes_cost) => {
        const notes = parseFloat(notes_cost);
        var songHash = await App.getSongHash(song);

        console.log('SongHash created')
        console.log(typeof songHash)
        console.log(songHash)
        console.log(App.ipfsHash)
        const songPath = songFilePath.split("\\");
        const titleWithExtension = songPath[songPath.length - 1].split(".");
        const title = titleWithExtension[0];
        console.log(title);
        console.log(notes);
        await App.musicbook.artistUploadSong(notes, title, songHash, {from: App.account});
    },
    // uploadSongClicked: async (event) => {
    //     console.log('inside onSubmit')
    //     const accounts = await web3.eth.getAccounts();
    //     const ethAddress= await App.musicbook.options.address;
    //     App.ethAddress = ethAddress;
    //     await ipfs.add(App.buffer, (err, ipfsHash) => {
    //         console.log(err,ipfsHash);
    //         App.ipfsHash = ipfsHash[0].hash
    //     });
    //     console.log(ipfsHash)
    // },
    getSongHash: async (songFile) => {
        // console.log(JSON.stringify(songFile))
        var resultHash = ''
        const reader = new FileReader();
        reader.onloadend = function() {
            var buffer = require('buffer');
            console.log('Require crossed')
            const buf = buffer.Buffer.from(reader.result) // Convert data into buffer
            App.ipfs.files.add(buf, (err, result) => { // Upload buffer to IPFS
            if(err) {
                console.error(err)
                return
            }
            App.ipfsHash = result[0].hash
            console.log(typeof result[0].hash)
            console.log(`Hash is --> ${App.ipfsHash}`)
            let url = `https://gateway.ipfs.io/ipfs/${result[0].hash}`
            console.log(`Url --> ${url}`)
            resultHash = String(result[0].hash)
            })
        }
        reader.readAsArrayBuffer(songFile.files[0]);
        return resultHash
        // var buffer = require('buffer');
        // console.log('Require crossed')
        // const buf = await buffer.Buffer.from(songFile);
        // App.buffer = buf
        // console.log('Buffer is')
        // console.log(buf)
        // await App.ipfs.files.add(App.buffer, (err, ipfsHash) => {
        //     if(err){
        //         console.log('Error in ipfs add')
        //         console.log(err)
        //       }
        //     console.log(err,ipfsHash)
        //     App.ipfsHash = ipfsHash[0].hash
        // });
        // onClick = async () => {
        //     try{
        //         console.log('Inside SongHash')
        //         App.blockNumber = 'Waiting...'
        //         App.gasUsed = 'Waiting...'
        //         await web3.eth.getTransactionReceipt(App.transactionHash, (err, txReceipt) => {
        //             console.log(err,txReceipt);
        //             App.txReceipt = txReceipt;
        //         });
        //         App.blockNumber = txReceipt.blockNumber
        //         App.gasUsed = txReceipt.gasUsed
        //         console.log('SongHash Worked')
        //     }
        //     catch(error){
        //         console.log(error);
        //     } //catch
        // }
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
        