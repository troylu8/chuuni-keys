import NewChart from "./pages/new-chart/new-chart";
import Editor from "./pages/editor/editor";
import Game from "./pages/game/game";
import MainMenu from "./pages/main-menu/main-menu";
import ChartSelect from "./pages/chart-select/chart-select";
import PageProvider, { usePage, Page } from "./contexts/page";
import "./styles.css"
import Settings from "./pages/settings/settings";
import SettingsProvider from "./contexts/settings";
import { useEffect } from "react";
import bgm from "./lib/sound";
import BgmStateProvider from "./contexts/bgm-state";
import Titlebar from "./titlebar";


export default function App() {
    return (
        <SettingsProvider>
            <PageProvider>
                <BgmStateProvider>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateRows: "fit-content(100%) 1fr"
                        }}
                        className="fixed cover"
                    >
                        <Titlebar />
                        <ActivePage />
                    </div>
                </BgmStateProvider>
            </PageProvider>
        </SettingsProvider>
    );
}



function ActivePage() {
    const [[page]] = usePage();
    
    // spacebar to toggle music
    useEffect(() => {
        function toggleMusic(e: KeyboardEvent) {
            if (e.key != " ") return;
            if (page == Page.GAME || page == Page.EDITOR) return;
            if (!bgm.src) return;
            
            bgm.paused ? bgm.play() : bgm.pause();
        }
        window.addEventListener("keydown", toggleMusic);
        
        return () => window.removeEventListener("keydown", toggleMusic);
    }, [page]);
    
    return (
        // rotate-0 to create a new stacking context for items of position "fixed"
        <div className="rotate-0"> 
            {page == Page.MAIN_MENU && <MainMenu />}
            {page == Page.SETTINGS && <Settings />}
            {page == Page.NEW_CHART && <NewChart />}
            {page == Page.CHART_SELECT && <ChartSelect />}
            {page == Page.GAME && <Game />}
            {page == Page.EDITOR && <Editor />}
        </div>
    )
}


