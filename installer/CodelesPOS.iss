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
Source: "staging\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "staging\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "staging\launcher\*"; DestDir: "{app}\launcher"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "staging\codeles-pos.ico"; DestDir: "{app}"; Flags: ignoreversion

; Temporary installer helper.
; It is deleted automatically after Setup finishes.
Source: "scripts\generate-config.js"; DestDir: "{tmp}"; Flags: dontcopy

[Run]
Filename: "{app}\runtime\node.exe"; Parameters: """{tmp}\generate-config.js"" ""{app}\app"""; Flags: runhidden waituntilterminated; BeforeInstall: ExtractConfigGenerator

[Code]
procedure ExtractConfigGenerator;
begin
  ExtractTemporaryFile('generate-config.js');
end;