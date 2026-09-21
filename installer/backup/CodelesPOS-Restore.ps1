param(
    [Parameter(Mandatory = $true)]
    [string]$BackupPath
)

$ErrorActionPreference = "Stop"

# Codeles POS - Database Restore

$AppRoot = Join-Path $env:ProgramFiles "Codeles POS"
$MongoRestore = Join-Path $AppRoot "tools\mongorestore.exe"

$DataRoot = Join-Path $env:ProgramData "Codeles POS"
$BackupRoot = Join-Path $DataRoot "backups"
$LogRoot = Join-Path $DataRoot "logs"
$LogFile = Join-Path $LogRoot "restore.log"

$MongoUri = "mongodb://127.0.0.1:27017/pos_system"

try {
    New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null

    if (!(Test-Path $MongoRestore)) {
        throw "mongorestore.exe was not found at $MongoRestore"
    }

    if (!(Test-Path $BackupPath -PathType Container)) {
        throw "Backup folder does not exist: $BackupPath"
    }

    $ResolvedBackupRoot = (Resolve-Path $BackupRoot).Path.TrimEnd('\')
    $ResolvedBackupPath = (Resolve-Path $BackupPath).Path.TrimEnd('\')

    # Only allow restores from the Codeles POS backup directory.
    if (!$ResolvedBackupPath.StartsWith(
        $ResolvedBackupRoot + "\",
        [System.StringComparison]::OrdinalIgnoreCase
    )) {
        throw "Restore is only allowed from the Codeles POS backup directory."
    }

    $DatabaseBackupPath = Join-Path $ResolvedBackupPath "pos_system"

    if (!(Test-Path $DatabaseBackupPath -PathType Container)) {
        throw "The selected backup does not contain the pos_system database."
    }

    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restore started from: $ResolvedBackupPath"

    # Restore the selected backup and replace the existing collection data.
    & $MongoRestore `
        --uri=$MongoUri `
        --drop `
        $DatabaseBackupPath

    if ($LASTEXITCODE -ne 0) {
        throw "mongorestore failed with exit code $LASTEXITCODE."
    }

    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Restore completed successfully."

    exit 0
}
catch {
    $Message = $_.Exception.Message

    try {
        New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
        Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] RESTORE FAILED: $Message"
    }
    catch {
        # Avoid masking the original restore failure.
    }

    Write-Error $Message
    exit 1
}