import EditMenu from "./pages/edit-menu/edit-menu";
import Editor from "./pages/editor/editor";
import Game from "./pages/game/game";
import MainMenu from "./pages/main-menu/main-menu";
import SongSelect from "./pages/song-select/song-select";
import PageProvider, { usePage, Page } from "./providers/page";
import PlaybackProvider, { usePlayback } from "./providers/playback";
import "./styles.css"
import Settings from "./pages/settings/settings";
import SettingsProvider from "./providers/settings";
import { useEffect } from "react";

export default function App() {
    return (
        <SettingsProvider>
            <PageProvider>
                <PlaybackProvider>
                    <ActivePage />
                </PlaybackProvider>
            </PageProvider>
        </SettingsProvider>
    );
}

function ActivePage() {
    const [[page]] = usePage();
    const { playing, setPlaying } = usePlayback();
    
    // spacebar to toggle music
    useEffect(() => {
        function toggleMusic(e: KeyboardEvent) {
            if ((page == Page.MAIN_MENU || page == Page.SONG_SELECT) && e.key == " ") {
                setPlaying(!playing);
            }
        }
        window.addEventListener("keydown", toggleMusic);
        
        return () => window.removeEventListener("keydown", toggleMusic);
    }, [playing, page]);
    
    return (
        <>
            {page == Page.MAIN_MENU && <MainMenu />}
            {page == Page.SETTINGS && <Settings />}
            {page == Page.EDIT_MENU && <EditMenu />}
            {page == Page.SONG_SELECT && <SongSelect />}
            {page == Page.GAME && <Game />}
            {page == Page.EDITOR && <Editor />}
        </>
    )
}


