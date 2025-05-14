import GameStateProvider, { useGameControls } from "../../providers/game-state";
import DeltaProvider from "../../providers/delta";
import AccuracyBar from "./accuracy-bar";
import Keyboard from "./keyboard";
import PauseMenu from "./pause-menu";
import { useEffect, useRef } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export default function Game() {
    
    return (
        <GameStateProvider>
            <div className="fixed left-0 right-0 top-10 bottom-0">
                <PauseMenu />
                <DeltaProvider>
                    <Keyboard />
                    <AccuracyBar />
                </DeltaProvider>
            </div>
            <Testing />
        </GameStateProvider>
    );
}

function Testing() {
    const [_, startGame] = useGameControls();
    
    const base_dir = useRef("");
    
    useEffect(() => {
        invoke("get_all_songs")
        .then(res => {
            console.log(res);
            base_dir.current = (res as any).songs_dir;
        });
    }, []);
    
    return (
        <button onClick={() => {
            const chartPath = base_dir.current + "\\songs\\tougetsu\\chart.muse";
            const songPath = base_dir.current + "\\songs\\tougetsu\\audio.mp3";
            startGame(chartPath, songPath)   
        }}>
            play 
        </button>
    );
}