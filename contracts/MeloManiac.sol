// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// Deployed at <Enter address starting with 0x> on Ropsten Network

contract MeloManiac {
    address public contractOwner;
    uint public songsCount;
    uint public usersCount;
    uint public artistsCount;
 
    struct User {
        uint userID;
        uint[] ownedSongs;
        mapping (uint => bool) ownership;
    }
 
    struct Artist {
        uint artistID;
        uint userID;
        string nickName;
        address payable artistAddress;
        uint[] uploadedSongs;
    }
 
    struct Song {
        uint artistID;
        uint songID;
        string title;
        uint releaseDate;
        uint notes;
        string songHash;
    }
 
    enum ROLE {UNREGISTERED, ARTIST, USER}
 
    mapping (uint => Artist) artistIDToArtist;
    mapping (address => uint) addressToArtistID;
    mapping (address => User) addressToUser;
    mapping (uint => Song) songIDtoSong;
    mapping (string => Song) hashToSong;

    modifier onlyUser {
        require(addressToUser[msg.sender].userID != 0, "Not a user");
        _;
    }

    modifier onlyArtist {
        require(addressToArtistID[msg.sender] != 0, "Not an artist");
        _;
    }
    
    modifier onlyNewUser {
        require(addressToUser[msg.sender].userID == 0, "User Already registered!");
        _;
    }

    modifier onlyNewArtist {
        require(addressToArtistID[msg.sender] == 0, "Artist Already registered!");
        _;
    }

    modifier onlyUniqueSong(string memory songHash) {
        require(hashToSong[songHash].songID == 0, "Can't upload duplicate");
        _;
    }

    constructor() public {
        contractOwner = msg.sender;
        songsCount = 0;
        usersCount = 0;
        artistsCount = 0;
    }
 
    function getRole() external view returns(ROLE) {
        return ((addressToArtistID[msg.sender] != 0) ? ROLE.ARTIST: (addressToUser[msg.sender].userID != 0) ? ROLE.USER: ROLE.UNREGISTERED);
    }
    
    function songIsUnique(string calldata _hash) external view returns(uint) {
        return hashToSong[_hash].songID;
    }
     
    function userRegister() public onlyNewUser {
        usersCount += 1;
        
        User memory newUser = User(usersCount, new uint[](0));
        addressToUser[msg.sender] = newUser;
    }
     
    function artistRegister(string calldata _nickName) external onlyNewArtist payable {
        require(msg.value == 0.05 ether,"Artist registration fee");
        artistsCount += 1;
        
        if (addressToUser[msg.sender].userID == 0) {
            userRegister();
        }
        
        Artist memory newArtist = Artist(artistsCount,addressToUser[msg.sender].userID, _nickName, msg.sender, new uint[](0));
        
        addressToArtistID[msg.sender] = artistsCount;
        artistIDToArtist[artistsCount] = newArtist;
    }
     
    function artistUploadSong(uint _notes, string calldata _title, string calldata songHash) external onlyArtist onlyUniqueSong(songHash) {
        songsCount += 1;
        
        Artist storage artistInstance = artistIDToArtist[addressToArtistID[msg.sender]];
        artistInstance.uploadedSongs.push(songsCount);
    
        songIDtoSong[songsCount] = Song(artistInstance.artistID, songsCount, _title, now, _notes, songHash);
        hashToSong[songHash] = songIDtoSong[songsCount];
    }
     
    function userBuySong(uint songID) external onlyUser payable {
        Song storage song = songIDtoSong[songID];
        require(song.songID != 0, "Song does not exist!");
        require(msg.value == song.notes, "Check if song notes is paid");

        User storage user = addressToUser[msg.sender];
        require(!user.ownership[songID], "Can't buy twice");
        
        user.ownedSongs.push(songID);
        user.ownership[songID] = true;
    
        artistIDToArtist[song.artistID].artistAddress.transfer(msg.value);
    }
     
    function userDetail() external view returns(uint, uint, uint[] memory) {
        return (addressToUser[msg.sender].userID, addressToArtistID[msg.sender], addressToUser[msg.sender].ownedSongs);
    }
     
    function artistDetail(uint _artistID) external view returns(string memory, uint[] memory) {
        return (artistIDToArtist[_artistID].nickName, artistIDToArtist[_artistID].uploadedSongs);
    }
     
    function songDetail(uint songID) external view returns(uint artistID, uint id, string memory title, uint notes, uint releaseDate, string memory songHash) {
        Song memory song = songIDtoSong[songID];        
        id = song.songID;
        artistID = song.artistID;
        title = song.title;
        notes = song.notes;
        releaseDate = song.releaseDate;
        songHash = song.songHash;
    }
    
    function donate(uint artistID) public payable {
        artistIDToArtist[artistID].artistAddress.transfer(msg.value);
    }
}