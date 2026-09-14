Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
StartScript = FSO.BuildPath(ScriptDir, "CodelesPOS-Start.cmd")

WshShell.Run """" & StartScript & """", 0, False
