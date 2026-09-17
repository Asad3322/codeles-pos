Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
StartScript = FSO.BuildPath(ScriptDir, "CodelesPOS-Start.cmd")

WshShell.Run """" & StartScript & """", 0, False
WScript.Sleep 3000
WshShell.Run "http://127.0.0.1:3000/", 1, False
