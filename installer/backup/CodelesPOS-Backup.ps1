$ErrorActionPreference = "Stop"

# Codeles POS - Customer Database Backup

$AppRoot = Join-Path $env:ProgramFiles "Codeles POS"
$MongoDump = Join-Path $AppRoot "tools\mongodump.exe"

$DataRoot = Join-Path $env:ProgramData "Codeles POS"
$BackupRoot = Join-Path $DataRoot "backups"
$LogRoot = Join-Path $DataRoot "logs"

$MongoUri = "mongodb://127.0.0.1:27017/pos_system"

# Keep automatic backups for 30 days.
$RetentionDays = 30

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupPath = Join-Path $BackupRoot "Auto-$Timestamp"
$LogFile = Join-Path $LogRoot "backup.log"

try {
    # Ensure required directories exist.
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null

    if (!(Test-Path $MongoDump)) {
        throw "mongodump.exe was not found at $MongoDump"
    }

    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup started."

    # Create MongoDB BSON backup.
    & $MongoDump `
        --uri=$MongoUri `
        --out=$BackupPath

    if ($LASTEXITCODE -ne 0) {
        throw "mongodump failed with exit code $LASTEXITCODE."
    }

    Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup completed: $BackupPath"
    # Remove only automatic backup folders older than the retention period.
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)

Get-ChildItem -Path $BackupRoot -Directory -Filter "Auto-*" |
    Where-Object { $_.LastWriteTime -lt $CutoffDate } |
    Remove-Item -Recurse -Force

Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Backup retention cleanup completed."

    exit 0
}
catch {
    $Message = $_.Exception.Message

    try {
        New-Item -ItemType Directory -Path $LogRoot -Force | Out-Null
        Add-Content -Path $LogFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] BACKUP FAILED: $Message"
    }
    catch {
        # Avoid masking the original backup failure.
    }

    exit 1
}