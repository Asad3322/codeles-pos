#define MyAppName "Codeles POS"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Codeles"
#define MyAppURL "https://codeles.codes"

[Setup]
AppId={{8A9C34B7-0D92-4C79-9D52-8F87A862E843}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\Codeles POS
DefaultGroupName=Codeles POS
OutputDir=output
OutputBaseFilename=CodelesPOS-Setup
SetupIconFile=staging\codeles-pos.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=admin
UninstallDisplayIcon={app}\codeles-pos.ico

[Files]
; Codeles POS application
Source: "staging\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs

; Bundled Node.js runtime
Source: "staging\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs

; Codeles POS launchers
Source: "staging\launcher\*"; DestDir: "{app}\launcher"; Flags: ignoreversion recursesubdirs createallsubdirs

; Application icon
Source: "staging\codeles-pos.ico"; DestDir: "{app}"; Flags: ignoreversion

; Temporary configuration generator
Source: "scripts\generate-config.js"; DestDir: "{tmp}"; Flags: dontcopy

; MongoDB prerequisite
; Extracted only when MongoDB installation is required
Source: "prerequisites\mongodb-windows-x86_64-8.3.2-signed.msi"; DestDir: "{tmp}"; Flags: dontcopy

; MongoDB backup and restore tools
Source: "prerequisites\mongodb-tools\mongodump.exe"; DestDir: "{app}\tools"; Flags: ignoreversion
Source: "prerequisites\mongodb-tools\mongorestore.exe"; DestDir: "{app}\tools"; Flags: ignoreversion

; Codeles POS automatic backup script
Source: "backup\CodelesPOS-Backup.ps1"; DestDir: "{app}\backup"; Flags: ignoreversion
; Codeles POS database restore script
Source: "backup\CodelesPOS-Restore.ps1"; DestDir: "{app}\backup"; Flags: ignoreversion

[Dirs]
Name: "{commonappdata}\Codeles POS"
Name: "{commonappdata}\Codeles POS\MongoDB"
Name: "{commonappdata}\Codeles POS\MongoDB\data"
Name: "{commonappdata}\Codeles POS\MongoDB\log"
Name: "{commonappdata}\Codeles POS\backups"
Name: "{commonappdata}\Codeles POS\logs"

[Icons]
; Start Codeles POS automatically when Windows starts
Name: "{commonstartup}\Codeles POS"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launcher\CodelesPOS-Hidden.vbs"""; WorkingDir: "{app}\launcher"

; Desktop launcher
Name: "{commondesktop}\Codeles POS"; Filename: "{sys}\wscript.exe"; Parameters: """{app}\launcher\CodelesPOS-Open.vbs"""; WorkingDir: "{app}\launcher"; IconFilename: "{app}\codeles-pos.ico"

[Run]
; Install MongoDB silently when the MongoDB Windows service is missing.
; Store database files outside Program Files and do not install Compass.
Filename: "{sys}\msiexec.exe"; Parameters: "/i ""{tmp}\mongodb-windows-x86_64-8.3.2-signed.msi"" /qn /norestart MONGO_SERVICE_INSTALL=1 MONGO_SERVICE_NAME=""MongoDB"" MONGO_SERVICE_ACCOUNT_TYPE=""ServiceLocalNetwork"" MONGO_DATA_PATH=""{commonappdata}\Codeles POS\MongoDB\data"" MONGO_LOG_PATH=""{commonappdata}\Codeles POS\MongoDB\log"" SHOULD_INSTALL_COMPASS=0"; Flags: runhidden waituntilterminated; Check: ShouldInstallMongoDB; BeforeInstall: ExtractMongoDBInstaller
; Create/update the automatic daily Codeles POS database backup task.
Filename: "{sys}\schtasks.exe"; Parameters: "/Create /F /SC DAILY /ST 23:00 /TN ""Codeles POS Daily Backup"" /TR ""powershell.exe -NoProfile -ExecutionPolicy Bypass -File \""{app}\backup\CodelesPOS-Backup.ps1\"""" /RU SYSTEM"; Flags: runhidden waituntilterminated

; Generate production configuration.
; Existing configuration is preserved during upgrades.
Filename: "{app}\runtime\node.exe"; Parameters: """{tmp}\generate-config.js"" ""{app}\app"""; Flags: runhidden waituntilterminated; BeforeInstall: ExtractConfigGenerator
[Code]

function IsMongoDBInstalled: Boolean;
begin
  { Detect the MongoDB Windows service }
  Result := RegKeyExists(
    HKLM64,
    'SYSTEM\CurrentControlSet\Services\MongoDB'
  );
end;
function ShouldInstallMongoDB: Boolean;
begin
  Result := not IsMongoDBInstalled;
end;


procedure ExtractMongoDBInstaller;
begin
  { Only extract MongoDB when it is not already installed }
  if not IsMongoDBInstalled then
  begin
    ExtractTemporaryFile(
      'mongodb-windows-x86_64-8.3.2-signed.msi'
    );
  end;
end;


procedure ExtractConfigGenerator;
begin
  ExtractTemporaryFile('generate-config.js');
end;