import steamTotp = require('steam-totp');
import steamcmd = require('./steamcmd');
import core = require('@actions/core');
import path = require('path');
import fs = require('fs');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;

async function Login(): Promise<void> {
    const args = await getLoginArgs();
    await steamcmd.Exec(args);
}

async function IsLoggedIn(): Promise<boolean> {
    const args = ['+info', '+quit'];
    const output = await steamcmd.Exec(args);
    return !output.includes('Logon state: Logged Off');
}

export { Login, IsLoggedIn }

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
        if (!code) {
            const shared_secret = core.getInput('shared_secret', { required: true });
            code = steamTotp.generateAuthCode(shared_secret);
        }
        args.push(password, '+set_steam_guard_code', code);
    }
    args.push('+info', '+quit');
    return args;
}

function getConfigPath(): string {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, 'config', 'config.vdf');
}

function getSSFNPath(ssfnName: string): string {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, ssfnName);
}