import steamcmd = require('./steamcmd');
import core = require('@actions/core');
import path = require('path');
import fs = require('fs');

const STEAM_TEMP = process.env.STEAM_TEMP;
const WORKSPACE = process.env.GITHUB_WORKSPACE;
const BUILD_OUTPUT = path.join(STEAM_TEMP, 'buildoutput');

async function Run(): Promise<void> {
    const args = await getCommandArgs();
    await steamcmd.Exec(args);
}

export { Run }

async function getCommandArgs(): Promise<string[]> {
    let args = [];
    const username = core.getInput('username', { required: true });
    args.push('+login', username);
    let appBuildPath = core.getInput('app_build');
    if (appBuildPath) {
        await fs.promises.access(appBuildPath, fs.constants.R_OK);
        args.push('+run_app_build', appBuildPath, '+quit');
        return args;
    }
    let workshopItemPath = core.getInput('workshop_item');
    if (workshopItemPath) {
        await fs.promises.access(workshopItemPath, fs.constants.R_OK);
        args.push('+workshop_build_item', workshopItemPath, '+quit');
        return args;
    }
    const appId = core.getInput('app_id', { required: true });
    const contentRoot = path.resolve(core.getInput('content_root') || WORKSPACE);
    await fs.promises.access(contentRoot, fs.constants.R_OK);
    const description = core.getInput('description');
    const workshopItemId = core.getInput('workshop_item_id');
    if (workshopItemId) {
        workshopItemPath = await generateWorkshopItemVdf(appId, workshopItemId, contentRoot, description);
        args.push('+workshop_build_item', workshopItemPath, '+quit');
        return args;
    }
    const set_live = core.getInput('set_live');
    const depot_file_exclusions = core.getInput('depot_file_exclusions');
    let depot_file_exclusions_list = undefined;
    if (depot_file_exclusions) {
        depot_file_exclusions_list = depot_file_exclusions.split('\n');
    }
    const install_scripts = core.getInput('install_scripts');
    let install_scripts_list = undefined;
    if (install_scripts) {
        install_scripts_list = install_scripts.split('\n');
    }
    const depots = core.getInput('depots');
    let depots_list = undefined;
    if (depots) {
        depots_list = depots.split('\n');
    }
    appBuildPath = await generateBuildVdf(appId, contentRoot, description, set_live, depot_file_exclusions_list, install_scripts_list, depots_list);
    args.push('+run_app_build', appBuildPath, '+quit');
    return args;
}

async function generateWorkshopItemVdf(appId: string, workshopItemId: string, contentFolder: string, description: string): Promise<string> {
    await verify_temp_dir();
    const workshopItemPath = path.join(STEAM_TEMP, 'workshop_item.vdf');
    let workshopItem = `"workshopitem"\n{\n\t"appid" "${appId}"\n\t"publishedfileid" "${workshopItemId}"\n\t"contentfolder" "${contentFolder}"\n`;
    if (description && description !== '') {
        workshopItem += `\t"description" "${description}"\n`;
    }
    workshopItem += '}';
    core.info(workshopItem);
    await fs.promises.writeFile(workshopItemPath, workshopItem);
    await fs.promises.access(workshopItemPath, fs.constants.R_OK);
    return workshopItemPath;
}

async function generateBuildVdf(appId: string, contentRoot: string, description: string, set_live: string, depot_file_exclusions_list: string[], install_scripts_list: string[], depots_list: string[]): Promise<string> {
    await verify_temp_dir();
    const appBuildPath = path.join(STEAM_TEMP, 'app_build.vdf');
    let appBuild = `"AppBuild"\n{\n`;
    appBuild += `\t"AppID" "${appId}"\n`;
    appBuild += `\t"ContentRoot" "${contentRoot}"\n`;
    appBuild += `\t"BuildOutput" "${BUILD_OUTPUT}"\n`;
    if (description && description !== '') {
        appBuild += `\t"Desc" "${description}"\n`;
    }
    if (set_live && set_live !== '') {
        appBuild += `\t"SetLive" "${set_live}"\n`;
    }
    if (depots_list) {
        appBuild += `\t"Depots"\n\t{\n`;
        let depotIndex = 1;
        depots_list.forEach(depot => {
            appBuild += `\t\t"${appId + depotIndex}" "${depot}"\n`;
            depotIndex++;
        });
        appBuild += `\t}\n`;
    } else {
        const depotId = parseInt(appId) + 1;
        appBuild += `\t"Depots"\n\t{\n`;
        appBuild += `\t\t"${depotId}"\n`;
        appBuild += `\t\t{\n`;
        appBuild += `\t\t\t"FileMapping"\n\t\t{\n`;
        appBuild += `\t\t\t\t"LocalPath" "*" // all files from content root folder\n`;
        appBuild += `\t\t\t\t"DepotPath" "." // mapped into the root of the depot\n`;
        appBuild += `\t\t\t\t"recursive" "1" // include all subfolders\n`;
        appBuild += `\t\t\t}\n`;
        appBuild += `\t\t\t"FileExclusion" "*.pdb" // don't include symbols\n`;
        appBuild += `\t\t\t"FileExclusion" "**/*_BurstDebugInformation_DoNotShip*" // don't include unity build folders\n`;
        appBuild += `\t\t\t"FileExclusion" "**/*_BackUpThisFolder_ButDontShipItWithYourGame*" // don't include unity build folders\n`;
        if (depot_file_exclusions_list) {
            depot_file_exclusions_list.forEach(exclusion => {
                appBuild += `\t\t\t"FileExclusion" "${exclusion}"\n`;
            });
        }
        if (install_scripts_list) {
            install_scripts_list.forEach(script => {
                appBuild += `\t\t\t"InstallScript" "${script}"\n`;
            });
        }
        appBuild += `\t\t}\n`;
        appBuild += `\t}\n`;
    }
    appBuild += '}';
    core.info(appBuild);
    await fs.promises.writeFile(appBuildPath, appBuild);
    await fs.promises.access(appBuildPath, fs.constants.R_OK);
    return appBuildPath;
}

async function verify_temp_dir(): Promise<void> {
    try {
        await fs.promises.access(BUILD_OUTPUT, fs.constants.R_OK);
    } catch (error) {
        await fs.promises.mkdir(BUILD_OUTPUT);
    }
}
