const chalk = require('chalk');
const columnify = require('columnify');
const { log, supportedCoins } = require('./utils');
const { generateMnemonicString } = require('./Wallet');
const selfInfo = require('../package.json');
const CW = require('./CW');

class Method {
    constructor(name, params = {}) {
        this.name = name;
        this.params = params;
    }

    async init() {
        const callMethod = {
            '_': () => {},
            'list': () => {
                log(`đ   All supported cryptos:\n`);
                let cryptos = {};
                for (const val of supportedCoins) {
                    const data = require('./coins/' + val + '.json');
                    let title = data.title || '';
                    if (title == '' || val == 'ERC') {
                        continue;
                    }
                    cryptos[chalk.blue(val)] = title;
                }
                log(columnify(cryptos, {
                    showHeaders: false,
                    columnSplitter: ' - ',
                }));
                log();
                log(`âšī¸   Use flag "-c TICKER" to select specific coin`);
            },
            'mnemonic': () => {
                log(`â¨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your randomly generated 12 words mnemonic string:')}\n`);
                log(`đ  ${generateMnemonicString()}`);
                log();
                log(chalk.greenBright('âšī¸   You can import this wallet into MetaMask, Trust Wallet and many other wallet apps'));
            },
            'version': () => {
                log(selfInfo.version);
            },
            'wallet': async () => {
                const coin = this.params.coin;
                const options = this.params.options;
                
                const cw = await new CW(coin, options).init();

                let coinFullName = (cw.row.name || coin) + (cw.wallet.format !== undefined && cw.wallet.format != '' ? ' (' + cw.wallet.format + ')' : '');

                if (cw.options.prefix && !cw.prefixFound) {
                    log(`đĸ  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support prefix yet...')}`);
                }

                if (cw.options.mnemonic != '' && cw.wallet.mnemonic == undefined) {
                    log(`đĸ  ${chalk.yellow('Sorry, ' + coinFullName + ' does not support mnemonic yet...')}`);
                }

                if (cw.wallet.error !== undefined) {
                    log(`âī¸  ${chalk.red(`Error: ${cw.wallet.error}`)}`);
                    return;
                }

                log(`â¨  ${chalk.green('Done!')} ${chalk.blueBright('Here is your brand new ' + coinFullName + ' wallet' + (cw.prefixFound ? ' with "' + cw.options.prefix + '" prefix' : '') + ':')}\n`);
                
                if (cw.wallet.addresses !== undefined) { // multiple addresses wallet
                    if (cw.wallet.privateExtendedKey) {
                        log(`đ  ${cw.wallet.privateExtendedKey}`);
                    }
                    if (cw.wallet.mnemonic) {
                        log(`đ  ${cw.wallet.mnemonic}`);
                    }

                    for (const item of cw.wallet.addresses) {
                        log();
                        if (cw.wallet.addresses.length > 1) {
                            log(`đ  ${item.index}`);
                        }
                        if (cw.prefixFound && cw.prefixFoundInWallets.includes(item.address)) {
                            const addressCutLength = cw.row.startsWith.length + cw.options.prefix.length;
                            log(`đ  ${cw.row.startsWith}${chalk.magenta(item.address.slice(cw.row.startsWith.length, addressCutLength))}${item.address.slice(addressCutLength)}`);
                        } else {
                            log(`đ  ${item.address}`);
                        }
                        log(`đ  ${item.privateKey}`);
                    }

                    if (cw.row.path !== undefined && cw.options.geek) {
                        log();
                        log(`đ   wallet address path: ${cw.row.path}'/0'/0/ID`);
                    }
                } else { // single address wallet
                    if (cw.prefixFound) {
                        const addressCutLength = cw.row.startsWith.length + cw.options.prefix.length;
                        log(`đ  ${cw.row.startsWith}${chalk.magenta(cw.wallet.address.slice(cw.row.startsWith.length, addressCutLength))}${cw.wallet.address.slice(addressCutLength)}`);
                    } else {
                        log(`đ  ${cw.wallet.address}`);
                    }
                    log(`đ  ${cw.wallet.privateKey}`);
                    if (cw.wallet.mnemonic) {
                        log(`đ  ${cw.wallet.mnemonic}`);
                    }
                }
                
                if (cw.row.formats !== undefined || cw.row.network == 'EVM' || cw.row.apps || cw.wallet.tested !== undefined) {
                    log();
                }

                if (cw.wallet.tested !== undefined) {
                    log(chalk.red('âŧī¸   This wallet generation format was not tested yet, do not use it!'));
                }

                if (cw.row.formats !== undefined && Object.keys(cw.row.formats).length > 1) {
                    let formatsString = '';
                    for (const val of Object.keys(cw.row.formats)) {
                        formatsString += chalk.blue(val) + ', ';
                    }
                    log(chalk.yellow('*ī¸âŖ   You can create different wallet formats: ' + formatsString.substring(0, formatsString.length - 2) + ' (use it with ' + chalk.white('-f') + ' flag)'));
                }

                if (cw.row.network == 'EVM' || false) {
                    log(chalk.yellow('đ  You can use this wallet in Ethereum, Binance Smart Chain, Polygon and few more networks (EVM compatible)'));
                }

                if (cw.row.apps !== undefined) {
                    let apps = {
                        "metamask": "MetaMask",
                        "tronlink": "TronLink",
                        "trustwallet": "Trust Wallet",
                        "harmony-chrome-ext": "Harmony Chrome Extension Wallet",
                        "binance-chain-wallet": "Binance Chain Wallet"
                    }
                    let appsArray = [];

                    for (let key of Object.keys(apps)) {
                        if (cw.row.apps.includes(key)) {
                            appsArray.push(apps[key]);
                        }
                    }

                    let appsString = appsArray.join(', ');
                    if (cw.row.apps || false) {
                        appsString += ' and many other wallet apps';
                    }
                    log(chalk.greenBright('âšī¸   You can import this wallet into ' + appsString));
                }
            }
        }

        return (callMethod[this.name] || callMethod['_'])();
    }
}

module.exports = Method;
