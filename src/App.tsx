import React from "react";
import ReactDOM from "react-dom/client";
import EditMenu from "./pages/edit-menu/edit-menu";
import Editor from "./pages/editor/editor";
import Game from "./pages/game/game";
import MainMenu from "./pages/main-menu/main-menu";
import SongSelect from "./pages/song-select/song-select";
import PageProvider, { usePage, Page } from "./providers/page";
import PlaybackProvider from "./providers/playback";
import SfxProvider from "./providers/sfx";
import UserDataProvider from "./providers/user-data";
import "./styles.css"
import Settings from "./pages/settings/settings";
import SettingsProvider from "./providers/settings";

function App() {
    return (
        <UserDataProvider>
            <PageProvider>
                <PlaybackProvider>
                    <SfxProvider>
                        <SettingsProvider>
                            <Main />
                        </SettingsProvider>
                    </SfxProvider>
                </PlaybackProvider>
            </PageProvider>
        </UserDataProvider>
    );
}

function Main() {
    const [[page]] = usePage();
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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);