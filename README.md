# Buildalon Upload to Steam
# Buildalon Setup SteamCmd

[![Discord](https://img.shields.io/discord/939721153688264824.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/VM9cWJ9rjH) [![marketplace](https://img.shields.io/static/v1?label=&labelColor=505050&message=Buildalon%20Actions&color=FF1E6F&logo=github-actions&logoColor=0076D6)](https://github.com/marketplace?query=buildalon)

A GitHub Action to setup the [`steamcmd`](https://developer.valvesoftware.com/wiki/SteamCMD) command alias.

## Exported Env Vars

- `STEAM_CMD` the `steamcmd` directory location.
- `STEAM_DIR` the steam install directory location.
- `STEAM_TEMP` the temp steam directory location.

## How to use

```yaml
jobs:
  validate:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ macos-latest, windows-latest, ubuntu-latest ]

    steps:
      # download and setup the steamcmd
      - uses: buildalon/setup-steamcmd@v1
      # run commands
      - run: |
          which steamcmd
          steamcmd +help +quit
```

For a full list of `steamcmd` commands see [this list](https://github.com/dgibbs64/SteamCMD-Commands-List/blob/main/steamcmd_commands.txt).


A GitHub Action for uploading an [app build](https://partner.steamgames.com/doc/sdk/uploading#4) or [workshop item](https://partner.steamgames.com/doc/features/workshop/implementation#SteamCmd) to Steam.

## How to use

This action assumes you are registered as a [partner](https://partner.steamgames.com/) with Steam.

This action also assumes some secrets to be set in your repository:

* `STEAM_USERNAME`: The username of your steamworks build account
* `STEAM_PASSWORD`: The password for the account
* `STEAM_SHARED_SECRET`: Optional, a SteamGuard shared secret ([setup steps](#shared-secret))
* `STEAM_CONFIG`: Optional, a steam account config.vdf encoded as base64 string ([setup steps](#config))
* `STEAM_SSFN`: Optional, a steam ssfn file encoded as base64 string. Optional, with `STEAM_CONFIG` setup.
* `STEAM_SSFN_NAME`: Optional, the name of the `STEAM_SSFN` file that was encoded. Required with `STEAM_SSFN`.

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
      config: ${{ secrets.STEAM_CONFIG }}
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
| `password` | The password for the account. | if `config` is not provided. |
| `totp` | A temporary one time pass code (totp) from SteamGuard. | if `shared_secret` and `config` are not provided |
| `shared_secret` |  The [shared secret](#shared-secret) from SteamGuard's two-factor authentication. | if `totp` and `config` are not provided. |
| `config` | Steam [config.vdf](#config) encoded as base64 string. | if `password`, `totp` and `shared_secret` are not provided. |
| `ssfn` | Steam SSFN file encoded as base64 string. This is an optional addition to `config`. | Optional, if `config` is provided. |
| `ssfn_name` | The name of the encoded `ssfn` file | if `ssfn` is provided. |
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

* `manifest`: The path to the resulting build manifest.

## Multi-Factor Authentication Setup

Deploying to Steam requires using Multi-Factor Authentication (MFA).
This action requires at least one of these authentication methods are set:

* `totp`: A temporary one time pass code (totp) from SteamGuard Authenticator app.
* `config`: Steam [config.vdf](#config) encoded as base64 string.
* `shared_secret`: The [shared secret](#shared-secret) from SteamGuard's two-factor authentication.

### Temporary One Time Pass Code

Can be obtained from SteamGuard Authenticator app. Usually is temporary and resets after a set amount of time.

### Config

To setup steamcmd for continuous integration, or just on a machine or VM that will get re-imaged frequently, you'll need to include the config file that contains your login token. Follow these steps so that your initial login token is properly saved:

* Download [steamworks sdk](https://partner.steamgames.com/doc/gettingstarted)
* Unzip steamworks in your desired location
* Open in explorer or finder
* Navigate to `sdk/tools/ContentBuilder/builder` (or osx/linux if on non-windows)
* Copy the path to the steamcmd executable (`steamcmd.exe` for windows, `steamcmd.sh` for osx/linux)
* In a new terminal run `<sdk>/steamcmd.exe +login <username>`
  * If prompted, enter your password and the SteamGuard totp
* Type `info`, and you should see your account listed as connected
* Type `quit`
* The folder where you ran `steamcmd` should now contain new content with config directory.
  * `<sdk>/config/config.vdf`
  * If you're unable to locate this file, it can also be located in your steam installation directory
    * windows: `C:/Program Files(x86)/Steam/config/config.vdf`
    * linux: `~/home/<user>/Steam/config/config.vdf`
    * osx: `~/Library/Application\ Support/Steam/config/config.vdf`
* Encode the file to base64 string
  * In a new `bash` terminal run `base64 <sdk>/config/config.vdf > encoded_config.txt`
* Copy the contents of the encoded text file and paste it in `STEAM_CONFIG` secret in github actions.

> [!NOTE]
> If you change your account's security settings or get a new code sent to your email, you'll need to follow these steps again.

### Shared Secret

> [!WARNING]
> Obtaining a shared secret from the SteamGuard Authenticator app is challenging and complicated.
> It is recommended to use the [config](#config) setup.
> This shared secret should not be checked into source control or shared with anyone!

> [!IMPORTANT]
> If you've already got SteamGuard setup for your account and you remove it, you'll have to wait 3 days before being able to publish a live build.

* Detailed instructions can be found [here](https://gist.github.com/mathielo/8367e464baa73941a075bae4dd5eed90)
