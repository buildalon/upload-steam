import core = require('@actions/core');
import upload = require('./upload');
import auth = require('./auth');

const main = async () => {
    try {
        if (!process.env.STEAM_DIR) {
            throw new Error('STEAM_DIR is not defined.');
        }
        if (!process.env.STEAM_CMD) {
            throw new Error('STEAM_CMD is not defined.');
        }
        if (!process.env.STEAM_TEMP) {
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
