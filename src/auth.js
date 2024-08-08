const core = require('@actions/core');
const fs = require('fs/promises');
const path = require('path');
const steamTotp = require('steam-totp');
const steamcmd = require('./steamcmd');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;

async function Login() {
    const args = await getLoginArgs();
    await steamcmd.Exec(args);
}

async function IsLoggedIn() {
    const args = ['+info', '+quit'];
    const output = await steamcmd.Exec(args);
    return !output.includes('Logon state: Logged Off');
}

module.exports = { Login, IsLoggedIn }

async function getLoginArgs() {
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
            await fs.writeFile(ssfnPath, Buffer.from(ssfn, 'base64'));
        }
        const configPath = getConfigPath();
        core.debug(`Writing ${configPath}...`);
        await fs.writeFile(configPath, Buffer.from(config, 'base64'));
        await fs.access(configPath, fs.constants.R_OK);
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

function getConfigPath() {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, 'config', 'config.vdf');
}

function getSSFNPath(ssfnName) {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, ssfnName);
}