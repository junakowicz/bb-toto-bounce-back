/*jslint node: true */
"use strict";
var fs = require('fs');
var crypto = require('crypto');
var util = require('util');
var constants = require('byteballcore/constants.js');
var conf = require('byteballcore/conf.js');
var objectHash = require('byteballcore/object_hash.js');
var desktopApp = require('byteballcore/desktop_app.js');
var db = require('byteballcore/db.js');
var eventBus = require('byteballcore/event_bus.js');
var ecdsaSig = require('byteballcore/signature.js');
var Mnemonic = require('bitcore-mnemonic');
var Bitcore = require('bitcore-lib');
var readline = require('readline');

var headless = require('headless-byteball');

var appDataDir = desktopApp.getAppDataDir();
var KEYS_FILENAME = appDataDir + '/' + (conf.KEYS_FILENAME || 'keys.json');
var wallet_id;
var xPrivKey;

var controlCommandsInfo = 'Commands: ';
controlCommandsInfo += '[balance](command:balance), [address](command:address), [pay](command:pay), ';
controlCommandsInfo += '[disclaimer](command:disclaimer), [deviceaddress](command:deviceaddress), [version](command:version)';

var normalCommandsInfo = 'Commands: [menu](command:menu),  [disclaimer](command:disclaimer), ';
normalCommandsInfo += '[credits](command:credits), [donate](command:donate), [about](command:about)';

/********************************************************/
// logging
/********************************************************/

// enable logging with timestamps
const winston = require('winston');
const tsFormat = () => (new Date()).toLocaleTimeString();
const env = process.env.NODE_ENV || 'development';

const logger = new (winston.Logger)({
	transports: [
	//   // colorize the output to the console
	//   new (winston.transports.Console)({
	// 	timestamp: tsFormat,
	// 	colorize: true,
	// 	level: 'info'
	//   }),
	  new (require('winston-daily-rotate-file'))({
		json: false,
		filename: `${conf.WINSTON_LOG_DIR}/-bot.log`,
		timestamp: tsFormat,
		datePattern: 'yyyy-MM-dd',
		prepend: true,
		level: 'verbose'  // { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5
	  })
	]
});

// add more logger if needed
//...

function setupChatEventHandlers(){
	eventBus.on('paired', function(from_address){
		console.log('paired '+from_address);
		var device = require('byteballcore/device.js');
		if(headless.isControlAddress(from_address)){
			device.sendMessageToDevice(from_address, 'text', 'Hi! Waiting for control commands: ' + controlCommandsInfo);
		}else{
			device.sendMessageToDevice(from_address, 'text', 'Hi! Waiting for commands: ' + normalCommandsInfo);
		}
	});

	eventBus.on('text', function(from_address, text){
		if (headless.isControlAddress(from_address)){
			handleControlText(from_address, text);
		}
		else{
			handleText(from_address, text);
		}
	});

	// event doesn't occur in light wallet  <- WRONG!!! That's new. Cool! :)
	eventBus.on('new_my_transactions', function(arrUnits){
		var x = 1;
	});

	// event doesn't occur in light wallet
	eventBus.on('my_transactions_became_stable', function(arrUnits){
		var x = 1;
	});

	// This is new, too.
	// After first test, occurs when a transaction becomes stable.
	// Maybe it occurs more often, too, but without reason. 
	// Nevertheless it can be used for polling.
	// arrUnits is empty when it occurs, so db needs to be looked up
	eventBus.on('maybe_new_transactions', function(arrUnits){
		var x = 1;
	});
}


/***************************************************************/
// bot code
/***************************************************************/

function handleControlText(from_address, text){
	
	var device = require('byteballcore/device.js');
	
	// log msgs for debugging
	var logText = text;
	if (text.length > 100) logText = text.substring(0, 99) + '...';
	logger.verbose(from_address + ' ' + text);

	// split text
	// this allows commands with arguments
	text = text.trim();
	var fields = text.split(/ /);
	var wordOneOrg = fields[0].trim();
	var wordOne = fields[0].trim().toLowerCase();
	var wordTwo = '';
	if (fields.length > 1) wordTwo = fields[1].trim();
	var wordThree = '';
	if (fields.length > 2) wordThree = fields[2].trim();

	switch(wordOne){

		case 'help':
		case 'cmds':
			device.sendMessageToDevice(from_address, 'text', controlCommandsInfo);
			break;

		case 'disclaimer':
			handleCmdDisclaimer(from_address);
			break;

		case 'credits':
			handleCmdCredits(from_address);
			break;

		case 'donate':
			handleCmdDonate(from_address);
			break;

		case 'about':
			handleCmdAbout(from_address);
			break;

		default:
			// I've added a pull request in headless byteball
			// if merged, callback will work
			// https://github.com/byteball/headless-byteball/pull/14
			return headless.handleText(from_address, text, function(from_address, text){
				return device.sendMessageToDevice(from_address, 'text', "unrecognized control command");
			});
	}
}	

function handleText(from_address, text){
	
	var device = require('byteballcore/device.js');
	
	// log msgs for debugging
	var logText = text;
	if (text.length > 100) logText = text.substring(0, 99) + '...';
	logger.verbose(from_address + ' ' + text);

	// split text
	// this allows commands with arguments
	text = text.trim();
	var fields = text.split(/ /);
	var wordOneOrg = fields[0].trim();
	var wordOne = fields[0].trim().toLowerCase();
	var wordTwo = '';
	if (fields.length > 1) wordTwo = fields[1].trim();
	var wordThree = '';
	if (fields.length > 2) wordThree = fields[2].trim();

	switch(wordOne){

		case 'menu':
			showMainMenu(from_address);
			break;

		case 'buy':
			handleBuyTicket(from_address, wordTwo);
			break;

		case 'help':
		case 'cmds':
			device.sendMessageToDevice(from_address, 'text', normalCommandsInfo);
			break;
	
		case 'disclaimer':
			handleCmdDisclaimer(from_address);
			break;

		case 'credits':
			handleCmdCredits(from_address);
			break;

		case 'donate':
			handleCmdDonate(from_address);
			break;

		case 'about':
			handleCmdAbout(from_address);
			break;

		default:
			return device.sendMessageToDevice(from_address, 'text', 'unknwon command; commands: ' + normalCommandsInfo);
	}
}

function showMainMenu(device_address){
	var msg = '';
	msg += '      Lotto Main Menu      \n';
	msg += '---------------------------\n';
	msg += '1 - [Buy](command:buy) ticket.\n';
	msg += '2 - Select charity.\n';
	msg += '3 - My tickets.\n';
	msg += '4 - Start own lottery.\n';

	var device = require('byteballcore/device.js');
	return device.sendMessageToDevice(device_address, 'text', msg);
}

function handleCmdCredits(device_address){
	var device = require('byteballcore/device.js');
	var msg = 'Credits go to...';
	return device.sendMessageToDevice(device_address, 'text', msg);
}

function handleCmdAbout(device_address){
	var device = require('byteballcore/device.js');
	var device = require('byteballcore/device.js');
	var msg = 'Some information...';
	return device.sendMessageToDevice(device_address, 'text', msg);
}

function handleCmdDisclaimer(device_address){
	var device = require('byteballcore/device.js');
	var msg = 'This bot was programmed with best intentions and highest accuracy. ';
	msg += 'Nevertheless, there is no warranty or guarantee as to the accuracy, timeliness, performance, '
	msg += 'completeness or suitability of the information and materials found on or offered by this bot.';
	return device.sendMessageToDevice(device_address, 'text',  msg);
}

function handleCmdDonate(device_address){
	var device = require('byteballcore/device.js');
	var msg = 'Bots need electric power. Developers need food.';
	msg += '\nIf you agree, we are happy to see your donation incoming on this address: ' + conf.donation_address;
	msg += '\nThank you very much.';
	return device.sendMessageToDevice(device_address, 'text',  msg);
}

function handleBuyTicket(device_address, ticket_count_text){

	var device = require('byteballcore/device.js');
	
	var buyCmdInfo = "Buy command:";
	buyCmdInfo += "\n[buy](command:buy): buy 1 ticket";
	buyCmdInfo += "\n[buy n](command:buy): buy n tickets";

	var ticket_count = 1;
	
	if(ticket_count_text && ticket_count_text != ''){
		ticket_count = Number.parseInt(ticket_count_text);
		if (Number.isNaN(ticket_count)) {
			return device.sendMessageToDevice(device_address, 'text', "'"+ticket_count_text+"' is not a number. \n"+buyCmdInfo);
		}
	}

	if (ticket_count<=0) {
		return device.sendMessageToDevice(device_address, 'text', ticket_count+" must be a positiv number. \n"+buyCmdInfo);
	}

	headless.issueNextMainAddress(function(address){
		const price = 1000000;
		var msg = 'You want to buy '+ticket_count+' ticket'+((ticket_count>1)?'s':'')+' .';
		msg += '\nPlease pay: ' + toFormattedBytes(price*ticket_count);
		msg += '\n['+toFormattedBytes(price*ticket_count)+'](byteball:'+address+'?amount='+price*ticket_count+')';
	
		return device.sendMessageToDevice(device_address, 'text',  msg);
	});
}

// **********************************
// helper functions
// **********************************

function toFormattedBytes(amount) {
	if(amount < 1000){
		return amount + ' bytes';
	}
	else if (amount < 1000000){
		return round((amount / 1000),1) + ' kB';
	}
	else if (amount < 1000000000){
		return round((amount / 1000000),1) + ' MB';
	}
	else{
		return round((amount / 1000000000),1) + ' GB';
	}
}

function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

if (require.main === module) setupChatEventHandlers();
