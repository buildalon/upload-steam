import core = require('@actions/core');
import { exec } from '@actions/exec';
import path = require('path');
import fs = require('fs');

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;

export async function SteamCMD(args: string[]): Promise<string> {
    let output = '';
    try {
        const exitCode = await exec('steamcmd', args, {
            listeners: {
                stdline: (line) => {
                    output += line;
                    if (line.includes('Cached credentials not found.')) {
                        throw new Error('Cached credentials not found.');
                    }
                },
                errline: (line) => {
                    output += `\x1b[31m${line}\x1b[0m`;
                    if (output.includes('Cached credentials not found.')) {
                        throw new Error('Cached credentials not found.');
                    }
                }
            },
            ignoreReturnCode: true,
        });
        if (exitCode !== 0) {
            throw new Error(`steamcmd failed with exit code ${exitCode}`);
        }
    } catch (error) {
        const logFile = getErrorLogPath();
        core.debug(`Printing error log: ${logFile}`);
        try {
            const fileHandle = await fs.promises.open(logFile, 'r');
            try {
                const log = await fs.promises.readFile(logFile, 'utf8');
                core.startGroup(logFile);
                core.info(log);
                core.endGroup();
            } catch (error) {
                // Ignore error
            } finally {
                fileHandle.close();
            }
        } catch (error) {
            // Ignore error
        }
        throw error;
    }
    return output;
}

function getErrorLogPath(): string {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, 'logs', 'stderr.txt');
}