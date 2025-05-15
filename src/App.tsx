import Game from "./components/game/game";
import MainMenu from "./components/main-menu/main-menu";
import SongSelect from "./components/song-select/song-select";
import PageProvider, { usePage, Page } from "./providers/page";
import PlaybackProvider from "./providers/playback";
import "./styles.css"

export default function App() {
    return (
        <PageProvider>
            <PlaybackProvider>
                <Main />
            </PlaybackProvider>
        </PageProvider>
    );
}

function Main() {
    const [[page]] = usePage();
    return (
        <>
            {page == Page.MAIN_MENU && <MainMenu />}
            {page == Page.SONG_SELECT && <SongSelect />}
            {page == Page.GAME && <Game />}
        </>
    )
}