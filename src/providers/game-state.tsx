import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useState, createContext, useContext, useEffect } from "react";
import { usePlayback } from "./playback";
import { GameInfo, Page, usePage } from "./page";



type TogglePauseGame = () => void;
type StopGame = () => void;
const ControlsContext = createContext<[boolean, TogglePauseGame, StopGame] | null>(null);
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
    const [pageParams, setPage] = usePage();
    
    const [__, loadAudio, setAudioPlaying] = usePlayback();
    
    const [startTime, setStartTime] = useState(0);
    const [pauseTime, setPauseTime] = useState(0);
    const paused = pauseTime != 0;
    
    useEffect(() => {
        const unlisten = listen("start-chart", () => {
            setPauseTime(0);
            
            setAudioPlaying(true)
            .then(() => {
                const now = Date.now();
                console.log("setting start time", now);
                setStartTime(now);
            });
        });
        
        const gameInfo = pageParams[1] as GameInfo;
        
        loadAudio(gameInfo.audioPath);
        invoke("game_start", { chartPath: gameInfo.chartPath } );
        
        return () => { unlisten.then(unlisten => unlisten()) };
    }, []);
    
    async function togglePauseGame() {
        if (paused) {
            await invoke("game_resume");
            await setAudioPlaying(true);
            const pauseDuration = Date.now() - pauseTime;
            console.log("pause duration", pauseDuration);
            setStartTime(prev => {
                console.log("new start time", prev + pauseDuration);
                return prev + pauseDuration;
            }); // add pause duration to start time
            setPauseTime(0);
        }
        else {
            await invoke("game_pause");
            await setAudioPlaying(false);
            setPauseTime(Date.now());
        }
    }
    function stopGame() {
        invoke("game_stop");
        setPage([Page.SONG_SELECT]);
    }
    
    return (
        <ControlsContext.Provider value={[paused, togglePauseGame, stopGame]}>
            <StartTimeContext.Provider value={[startTime, setStartTime]}>
                { children }
            </StartTimeContext.Provider>
        </ControlsContext.Provider>
    );
}