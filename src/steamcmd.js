const exec = require('@actions/exec');
const core = require('@actions/core');
const fs = require('fs/promises');
const path = require('path');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;

async function Exec(args) {
    let output = '';
    try {
        await exec.exec('steamcmd', args,
            {
                listeners: {
                    stdout: (data) => {
                        output += data.toString();
                    },
                    stderr: (data) => {
                        output += data.toString();
                    }
                }
            });
    } catch (error) {
        const logFile = getErrorLogPath();
        core.debug(`Printing error log: ${logFile}`);
        try {
            await fs.access(logFile);
            const log = await fs.readFile(logFile, 'utf8');
            core.startGroup(logFile);
            core.info(log);
            core.endGroup();
        } catch (error) {
            // ignore
        }
        throw error;
    }
    return output;
}

module.exports = { Exec }

function getErrorLogPath() {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, 'logs', 'stderr.txt');
}