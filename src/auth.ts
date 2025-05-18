import { SteamCMD } from './steamcmd';
import core = require('@actions/core');

export async function Login(): Promise<void> {
    const username = core.getInput('username', { required: true });
    const password = core.getInput('password', { required: true });
    core.info(`Please confirm the login in the Steam Mobile app on your phone!`);
    const output = await SteamCMD([
        '+login',
        username,
        password,
        '+info',
        '+quit',
    ]);
    if (output.includes('Logon state: Logged On')) {
        core.info('Logged in successfully!');
        return;
    } else if (output.includes('Logon state: Logged Off')) {
        throw new Error('Login failed!');
    } else {
        throw new Error('Login failed! Unknown error.');
    }
}

export async function IsLoggedIn(): Promise<boolean> {
    const username = core.getInput('username', { required: true });
    try {
        const output = await SteamCMD([`+login`, username, '+info', '+quit']);
        if (output.includes('Logon state: Logged Off')) {
            return false;
        } else if (output.includes('Logon state: Logged On')) {
            return true;
        }
    } catch (error) {
        return false;
    }
    return true;
}
