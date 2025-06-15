import { exit } from '@tauri-apps/plugin-process';
import { Page, usePage } from "../../providers/page";


export default function MainMenu() {
    const [_, setPageParams] = usePage();    
    
    return (
        <div className="absolute cover flex flex-col justify-center items-center gap-3">
            <button onClick={() => setPageParams([Page.SONG_SELECT, { isEditing: false }])}> play </button>
            <button onClick={() => setPageParams([Page.EDIT_MENU])}> edit </button>
            <button onClick={() => setPageParams([Page.SETTINGS])}> settings </button>
            <button onClick={async () => await exit(0)}> quit </button>
        </div>
    );
}