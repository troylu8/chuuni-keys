import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useState, createContext, useContext, useEffect } from "react";
import { usePlayback } from "./playback";
import { Page, usePage } from "./page";


type StartGame = (chartPath: string, audioPath: string) => void;
type TogglePauseGame = () => void;
type StopGame = () => void;
const ControlsContext = createContext<[boolean, StartGame, TogglePauseGame, StopGame] | null>(null);
const StartTimeContext = createContext<[number, (next: number) => void] | null>(null);

export function useGameControls() {
    return useContext(ControlsContext)!;
}
export function useAbsoluteStartTime() {
    return useContext(StartTimeContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function GameStateProvider({ children }: Props) {
    const [_, setPage] = usePage();
    
    const [__, loadAudio, setAudioPlaying] = usePlayback();
    
    const [startTime, setStartTime] = useState(0);
    const [pauseTime, setPauseTime] = useState(0);
    const paused = pauseTime != 0;
    
    useEffect(() => {
        const unlisten = listen("start-chart", e => {
            setPauseTime(0);
            setStartTime(e.payload as number);
            setAudioPlaying(true);
        });
        return () => { unlisten.then(unlisten => unlisten()) };
    }, []);
    
    function startGame(chartPath: string, audioPath: string) {
        loadAudio(audioPath);
        invoke("game_start", { filepath: chartPath } );
    }
    function togglePauseGame() {
        if (paused) {
            setAudioPlaying(true);
            invoke("game_resume");
            setPauseTime(0);
            setStartTime(startTime + Date.now() - pauseTime); // add pause duration to start time
        }
        else {
            setAudioPlaying(false);
            invoke("game_pause");
            setPauseTime(Date.now());
        }
    }
    function stopGame() {
        invoke("game_stop");
        setPage(Page.SONG_SELECT);
    }
    
    return (
        <ControlsContext.Provider value={[paused, startGame, togglePauseGame, stopGame]}>
            <StartTimeContext.Provider value={[startTime, setStartTime]}>
                { children }
            </StartTimeContext.Provider>
        </ControlsContext.Provider>
    );
}