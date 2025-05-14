import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useState, createContext, useContext, useEffect } from "react";
import { usePlayback } from "./playback";


type StartGame = (filepath: string) => void;
type TogglePauseGame = () => void;
type StopGame = () => void;
const ControlsContext = createContext<[boolean, StartGame, TogglePauseGame, StopGame] | null>(null);
const StartTimeContext = createContext<[number, (next: number) => void] | null>(null);

export function useControls() {
    return useContext(ControlsContext)!;
}
export function useAbsoluteStartTime() {
    return useContext(StartTimeContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function GameStateProvider({ children }: Props) {
    const [_, startAudio, setAudioPlaying] = usePlayback();
    
    const [startTime, setStartTime] = useState(0);
    const [pauseTime, setPauseTime] = useState(0);
    const paused = pauseTime != 0;
    
    useEffect(() => {
        const unlisten = listen("start-chart", e => {
            const [startTime, audioFilepath] = e.payload as [number, string];
            
            setPauseTime(0);
            setStartTime(startTime);
            startAudio(audioFilepath);
        });
        
        return () => { unlisten.then(unlisten => unlisten()) };
    }, []);
    
    function startGame(filepath: string) {
        invoke("load_chart", { filepath } );
    }
    function togglePauseGame() {
        if (paused) {
            setAudioPlaying(true);
            invoke("resume");
            setPauseTime(0);
            setStartTime(startTime + Date.now() - pauseTime); // add pause duration to start time
        }
        else {
            setAudioPlaying(false);
            invoke("pause");
            setPauseTime(Date.now());
        }
    }
    function stopGame() {
        
    }
    
    return (
        <ControlsContext.Provider value={[paused, startGame, togglePauseGame, stopGame]}>
            <StartTimeContext.Provider value={[startTime, setStartTime]}>
                { children }
            </StartTimeContext.Provider>
        </ControlsContext.Provider>
    );
}