import core = require('@actions/core');
import { SteamCMD } from './steamcmd';
import steamTotp = require('steam-totp');
import path = require('path');
import fs = require('fs');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;

export async function Login(): Promise<void> {
    const args = await getLoginArgs();
    const output = await SteamCMD(args);
    if (output.includes('Logon state: Logged In')) {
        core.info('Logged in successfully!');
    } else if (output.includes('Logon state: Logged Off')) {
        core.setFailed('Login failed!');
    } else {
        core.setFailed('Login failed! Unknown error.');
    }
}

export async function IsLoggedIn(): Promise<boolean> {
    const username = core.getInput('username', { required: true });
    const output = await SteamCMD(['+info', '-login', username, '+quit']);
    return !output.includes('Logon state: Logged Off');
}

async function getLoginArgs(): Promise<string[]> {
    let args = [];
    const username = core.getInput('username', { required: true });
    args.push('+login', username);
    const config = core.getInput('config');
    if (config) {
        const ssfn = core.getInput('ssfn');
        if (ssfn) {
            const ssfnName = core.getInput('ssfn_name', { required: true });
            const ssfnPath = getSSFNPath(ssfnName);
            core.debug(`Writing ${ssfnPath}...`);
            await fs.promises.writeFile(ssfnPath, Buffer.from(ssfn, 'base64'));
        }
        const configPath = getConfigPath();
        core.debug(`Writing ${configPath}...`);
        await fs.promises.writeFile(configPath, Buffer.from(config, 'base64'));
        await fs.promises.access(configPath, fs.constants.R_OK);
    } else {
        const password = core.getInput('password', { required: true });
        let code = core.getInput('code');
        const shared_secret = core.getInput('shared_secret');
        if (code && code.length > 0) {
            args.push(password, '+set_steam_guard_code', code);
        }
        else if (shared_secret && shared_secret.length > 0) {
            code = steamTotp.generateAuthCode(shared_secret);
            args.push(password, '+set_steam_guard_code', code);
        } else {
            args.push(password);
        }
    }
    args.push('+info', '+quit');
    return args;
}

function getConfigPath(): string {
    const root = process.platform === 'win32' ? STEAM_CMD : STEAM_DIR;
    return path.join(root, 'config', 'config.vdf');
}

function getSSFNPath(ssfnName: string): string {
    const root = process.platform === 'win32' ? STEAM_CMD : STEAM_DIR;
    return path.join(root, ssfnName);
}