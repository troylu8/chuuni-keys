!macro NSIS_HOOK_POSTUNINSTALL
    MessageBox MB_YESNO "Delete ~/.chuuni_identity file?$\r$\nThis file gives you permission to edit and take down charts that you've published." IDYES DeleteIdentity
    
    Goto PostUninstallEnd
    
    DeleteIdentity:
        Delete "$PROFILE\.chuuni_identity"
        MessageBox MB_OK "~/.chuuni_identity deleted!"
            
    PostUninstallEnd:

!macroend