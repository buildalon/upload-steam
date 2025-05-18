import core = require('@actions/core');
import path = require('path');
import util = require('node:util');
import fs = require('fs');
import { spawn } from 'child_process';

const STEAM_DIR = process.env.STEAM_DIR;
const STEAM_CMD = process.env.STEAM_CMD;

export async function SteamCMD(args: string[]): Promise<string> {
    let output = '';
    let errorDetected: Error | null = null;

    return new Promise<string>((resolve, reject) => {
        core.info(`[command]steamcmd ${args.join(' ')}`);
        const steamcmd = spawn('steamcmd', args, { stdio: ['ignore', 'pipe', 'pipe'] });

        steamcmd.stdout.on('data', (data: Buffer) => {
            const chunk = data.toString();
            const lines = chunk.split('\n');
            for (const line of lines) {
                const cleanLine = util.stripVTControlCharacters(line);
                if (cleanLine.trim().length > 0) {
                    core.info(cleanLine);
                    output += `${cleanLine}\n`;
                    try {
                        checkError(cleanLine);
                    } catch (error) {
                        errorDetected = error as Error;
                        steamcmd.kill();
                    }
                }
            }
        });

        steamcmd.stderr.on('data', (data: Buffer) => {
            const chunk = data.toString();
            const lines = chunk.split('\n');
            for (const line of lines) {
                const cleanLine = util.stripVTControlCharacters(line);
                if (cleanLine.trim().length > 0) {
                    core.error(cleanLine);
                    output += `${cleanLine}\n`;
                    try {
                        checkError(cleanLine);
                    } catch (error) {
                        errorDetected = error as Error;
                        steamcmd.kill();
                    }
                }
            }
        });

        steamcmd.on('close', async (code) => {
            if (errorDetected) {
                await printErrorLog();
                reject(errorDetected);
            } else if (code !== 0) {
                await printErrorLog();
                reject(new Error(`steamcmd failed with exit code ${code}`));
            } else {
                resolve(output);
            }
        });

        steamcmd.on('error', async (error) => {
            await printErrorLog();
            reject(error);
        });
    });
}

async function printErrorLog() {
    const logFile = getErrorLogPath();
    core.debug(`Printing error log: ${logFile}`);
    try {
        const fileHandle = await fs.promises.open(logFile, 'r');
        try {
            const log = await fs.promises.readFile(logFile, 'utf8');
            core.startGroup(logFile);
            core.info(log);
            core.endGroup();
        } catch {
            // Ignore error
        } finally {
            fileHandle.close();
        }
    } catch {
        // Ignore error
    }
}

function getErrorLogPath(): string {
    let root = STEAM_DIR;
    if (process.platform === 'win32') { root = STEAM_CMD; }
    return path.join(root, 'logs', 'stderr.txt');
}

function checkError(line: string): void {
    if (line.includes('Cached credentials not found.')) {
        throw new Error('Cached credentials not found.');
    }
    if (line.includes('CWorkThreadPool::~CWorkThreadPool: work processing queue not empty')) {
        throw new Error(`SteamCMD is still running or is stuck and hasn't fully shut down!`);
    }
}