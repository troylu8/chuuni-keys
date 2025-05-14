import { invoke } from "@tauri-apps/api/core";
import { useState, createContext, useContext } from "react";
import { useAbsoluteStartTime } from "./start-time";


const PausedContext = createContext<[boolean, () => void] | null>(null);

export function usePaused() {
    return useContext(PausedContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PausedProvider({ children }: Props) {
    const [pauseTime, setPauseTime] = useState(0);
    const [startTime, setStartTime] = useAbsoluteStartTime();
    
    function togglePaused() {
        
        // it was unpaused
        if (pauseTime == 0) {
            invoke("pause");
            setPauseTime(Date.now());
        }
        
        // it was paused
        else {
            invoke("resume");
            setPauseTime(0);
            setStartTime(startTime + Date.now() - pauseTime); // add pause duration to start time
        }
    }
    
    return (
        <PausedContext.Provider value={[pauseTime != 0, togglePaused]}>
            { children }
        </PausedContext.Provider>
    );
}