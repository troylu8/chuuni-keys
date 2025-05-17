import EditMenu from "./components/edit-menu/edit-menu";
import Editor from "./components/editor/editor";
import Game from "./components/game/game";
import MainMenu from "./components/main-menu/main-menu";
import SongSelect from "./components/song-select/song-select";
import PageProvider, { usePage, Page } from "./providers/page";
import PlaybackProvider from "./providers/playback";
import SfxProvider from "./providers/sfx";
import UserDataProvider from "./providers/user-data";
import "./styles.css"

export default function App() {
    return (
        <UserDataProvider>
            <PageProvider>
                <PlaybackProvider>
                    <SfxProvider>
                        <Main />
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
            {page == Page.EDIT_MENU && <EditMenu />}
            {page == Page.SONG_SELECT && <SongSelect />}
            {page == Page.GAME && <Game />}
            {page == Page.EDITOR && <Editor />}
        </>
    )
}