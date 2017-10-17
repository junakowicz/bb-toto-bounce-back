/*jslint node: true */
"use strict";

// ******************
// headless
// ******************

//exports.port = 6611;
//exports.myUrl = 'wss://mydomain.com/bb';
exports.bServeAsHub = false;
exports.bLight = true;

exports.storage = 'sqlite';

exports.hub = 'byteball.org/bb-test';   // test
//exports.hub = 'byteball.org/bb';      // prod
exports.deviceName = 'Lotto Bot';
exports.permanent_pairing_secret = '0000';     
exports.control_addresses = ['0FFOXVZL47TJDCVKJK5HCZQNNZUMIB6FL'];  // device addresses of control wallets
exports.payout_address = 'JBFM6X5B6UZWX7PUPMFJCEEMD3PNVIGO';        // byteball address where payouts will be sent to
exports.KEYS_FILENAME = 'keys.json';

exports.bIgnoreUnpairRequests = true;

// where logs are written to (absolute path).  Default is log.txt in app data directory
//exports.LOG_FILENAME = '/dev/null';
exports.WINSTON_LOG_DIR = '/var/tmp';

// consolidate unspent outputs when there are too many of them.  Value of 0 means do not try to consolidate
exports.MAX_UNSPENT_OUTPUTS = 0;
exports.CONSOLIDATION_INTERVAL = 3600*1000;

// this is for runnining RPC service only, see play/rpc_service.js
exports.rpcInterface = '127.0.0.1';
exports.rpcPort = '6332';

// ******************
// bot
// ******************

exports.donation_address = 'JBFM6X5B6UZWX7PUPMFJCEEMD3PNVIGO';  // address of botmaster

console.log('finished headless conf');
