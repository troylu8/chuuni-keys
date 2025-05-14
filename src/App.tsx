import Game from "./components/game/game";
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
    const [page] = usePage();
    return (
        <>
            {page == Page.GAME && 
                <Game />
            }
        </>
    )
}