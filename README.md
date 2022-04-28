# MeloManiac
Melomaniacs is a blockchain powered independent music buying and selling marketplace.

## To run the MeloManiac system

- Make sure your system has Ganache installed. Open Ganache and quickstart
- Make sure your browser has MetaMask extension installed
- Create a network for the local system and import Ganache accounts with their private keys

### Migrate contract and host in Local host
```bash
truffle migrate --reset
```

### Install browserify to generate bundle.js
```bash
npm install -g browserify
cd src
browserify app.js -o bundle.js
```

### Start the webserver
```bash
npm install
npm start
```