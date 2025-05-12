# Buildalon Upload to Steam

[![Discord](https://img.shields.io/discord/939721153688264824.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/VM9cWJ9rjH) [![marketplace](https://img.shields.io/static/v1?label=&labelColor=505050&message=Buildalon%20Actions&color=FF1E6F&logo=github-actions&logoColor=0076D6)](https://github.com/marketplace?query=buildalon)

A GitHub Action for uploading an [app build](https://partner.steamgames.com/doc/sdk/uploading#4) or [workshop item](https://partner.steamgames.com/doc/features/workshop/implementation#SteamCmd) to Steam.

## How to use

This action assumes you are registered as a [partner](https://partner.steamgames.com/) with Steam.
This action assumes you have MFA enabled on your Steam account, and the Steam Mobile app installed on your phone.
This action also assumes some secrets to be set in your repository:

> [!IMPORTANT]
> You will be prompted to accept the login from the Steam Mobile app on your phone when the action runs the first time.
> Subsequent runs will attempt to use the cached login credentials, but may from time to time require you to accept the login again.

- `STEAM_USERNAME`: The username of your steamworks build account
- `STEAM_PASSWORD`: The password for the account

### workflow

```yaml
steps:
    # sets up the steamcmd command alias
  - uses: buildalon/setup-steamcmd@v1
    # uploads a build or workshop item to steam
  - uses: buildalon/upload-steam@v1
    id: upload
    with:
      username: ${{ secrets.STEAM_USERNAME }}
      password: ${{ secrets.STEAM_PASSWORD }}
      app_id: 1000
      description: 'Your build description here'
      content_root: '${{ github.workspace }}/Build'
      set_live: 'beta'
      depot_file_exclusions: |
        bin/tools*
        *.meta
      install_scripts: 'localization/german/german_installscript.vdf'
    # use outputs
  - run: |
      manifest="${{ steps.upload.outputs.manifest }}"
      cat $manifest
    shell: bash
```

### inputs

| Name | Description | Required |
| ---- | ----------- | -------- |
| `username` | A Steamworks [build account](https://partner.steamgames.com/doc/sdk/uploading#Build_Account) name with the "Edit App Metadata" and "Publish App Changes To Steam" permissions granted. | true |
| `password` | The password for the account. | true |
| `app_id` | The app id of the game. | if `app_build` or `workshop_item` are not provided. |
| `workshop_item_id` | The `publishedfileid`. To create a new item `app_id` must be set and `workshop_item_id` be set to 0. To update an existing item, both `app_id` and `workshop_item_id` must be set. | for workshop item uploads and if `workshop_item` is not provided. |
| `description` | Either the build description or workshop item description. If an `app_build` or `workshop_item` file is provided, this will be ignored. | false |
| `content_root` | The root folder of your game files or workshop item files, can be an absolute or relative path. If an `app_build` or `workshop_item` file is provided, this will be ignored. Defaults to `github.workspace`. | false |
| `set_live` | Beta branch name to automatically set live after successful build, none if empty. Note that the default branch can not be set live automatically. That must be done through the App Admin panel. If an `app_build` file is provided, this will be ignored. | false |
| `depot_file_exclusions` | A list of paths to exclude from the depot that will excluded mapped files again and can also contain wildcards like `?` or `*`. If `app_build` or `depots` are provided, this will be ignored. | false |
| `install_scripts` | The path(s) to a predefined install_script.vdf file(s). If `app_build` or `depots` are provided, this will be ignored. | false |
| `depots` | The path(s) to a predefined depot_build.vdf file(s). If an `app_build` file is provided, this will be ignored. Overrides `install_scripts` and `depot_file_exclusions`. | false |
| `app_build` | The path to a predefined app_build.vdf file. Overrides all other set options. | false |
| `workshop_item` | 'Optional, The path to a predefined workshop_item.vdf file. Overrides all other set options. | false |

### outputs

- `manifest`: The path to the resulting build manifest.

## Multi-Factor Authentication Setup

Deploying to Steam requires using Multi-Factor Authentication (MFA).
This action requires the user to accept the SteamGuard login from the Steam Mobile app on their phone.
