import { SteamCMD } from './steamcmd';
import core = require('@actions/core');

export async function Login(): Promise<void> {
    const username = core.getInput('username', { required: true });
    const password = core.getInput('password', { required: true });
    const output = await SteamCMD([
        `"+login ${username} ${password}"`,
        '"+@NoPromptForPassword 1"',
        '+info',
        '+quit',
    ]);
    if (output.includes('Logon state: Logged On')) {
        core.info('Logged in successfully!');
    } else if (output.includes('Logon state: Logged Off')) {
        core.setFailed('Login failed!');
    } else {
        core.setFailed('Login failed! Unknown error.');
    }
}

export async function IsLoggedIn(): Promise<boolean> {
    const username = core.getInput('username', { required: true });
    try {
        await SteamCMD([`"+login ${username}"`, '+info', '+quit']);
    } catch (error) {
        return false;
    }
    return true;
}
