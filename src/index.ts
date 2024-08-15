const core = require('@actions/core');
const upload = require('./upload');
const auth = require('./auth');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;
const STEAM_TEMP = process.env.STEAM_TEMP;

const main = async () => {
    try {
        if (!STEAM_DIR) {
            throw new Error('STEAM_DIR is not defined.');
        }
        if (!STEAM_CMD) {
            throw new Error('STEAM_CMD is not defined.');
        }
        if (!STEAM_TEMP) {
            throw new Error('STEAM_TEMP is not defined.');
        }
        const isLoggedIn = await auth.IsLoggedIn();
        if (!isLoggedIn) {
            await auth.Login();
        }
        await upload.Run();
    } catch (error) {
        core.setFailed(error);
    }
}

main();
