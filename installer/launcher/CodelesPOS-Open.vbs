Option Explicit

Dim WshShell, FSO, ScriptDir, StartScript
Dim Url, CurlExe, ExitCode, Attempts, MaxAttempts

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

ScriptDir = FSO.GetParentFolderName(WScript.ScriptFullName)
StartScript = FSO.BuildPath(ScriptDir, "CodelesPOS-Start.cmd")

Url = "http://127.0.0.1:3000/"
CurlExe = WshShell.ExpandEnvironmentStrings("%SystemRoot%\System32\curl.exe")

' Check whether Codeles POS is already responding.
ExitCode = WshShell.Run( _
    """" & CurlExe & """ --silent --fail --location --output NUL --max-time 2 """ & Url & """", _
    0, _
    True _
)

If ExitCode <> 0 Then

    ' POS is not running, so start it hidden.
    WshShell.Run """" & StartScript & """", 0, False

    ' Wait up to 30 seconds for the server to become available.
    MaxAttempts = 30

    For Attempts = 1 To MaxAttempts

        WScript.Sleep 1000

        ExitCode = WshShell.Run( _
            """" & CurlExe & """ --silent --fail --location --output NUL --max-time 2 """ & Url & """", _
            0, _
            True _
        )

        If ExitCode = 0 Then
            Exit For
        End If

    Next

End If

' Open the POS only after the server is responding.
If ExitCode = 0 Then
    WshShell.Run Url, 1, False
Else
    MsgBox "Codeles POS could not start. Please restart your computer or contact Codeles support.", _
           16, _
           "Codeles POS"
End If