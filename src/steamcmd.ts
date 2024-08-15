import core = require('@actions/core');
import exec = require('@actions/exec');
import path = require('path');
import fs = require('fs');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;

async function Exec(args: string[]): Promise<string> {
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
        const fileHandle = await fs.promises.open(logFile, 'r');
        try {
            const log = await fs.promises.readFile(logFile, 'utf8');
            core.startGroup(logFile);
            core.info(log);
            core.endGroup();
        } catch (error) {
            // ignore
        } finally {
            fileHandle.close();
        }
        throw error;
    }
    return output;
}

export { Exec }

function getErrorLogPath(): string {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, 'logs', 'stderr.txt');
}