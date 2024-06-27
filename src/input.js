const enquirer = require("enquirer");
const readline = require("readline");


/**
 * A "press any key to continue..." prompt.
 */
class AnyKeyPrompt extends enquirer.Prompt {
    constructor(message) {
        super();
        this.message = message;
    }

    async run() {
        console.log(this.message);
        return new Promise(resolve => {
            readline.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.once('keypress', () => {
                process.stdin.setRawMode(false);
                resolve();
            });
        });
    }
}


/**
 * A "Press any key to continue..." input utility.
 * @param message The message.
 * @returns {Promise<void>} nothing (async function).
 */
async function anyKey(message) {
    await new AnyKeyPrompt(message).run();
}


module.exports = {
    anyKey
}