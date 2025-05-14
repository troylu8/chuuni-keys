import { listen } from "@tauri-apps/api/event";
import { useState, createContext, useContext, useEffect } from "react";


const StartTimeContext = createContext(0);

export function useAbsoluteStartTime() {
    return useContext(StartTimeContext);
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function StartTimeProvider({ children }: Props) {
    const [startTime, setStartTime] = useState(0);
    
    useEffect(() => {
        const unlisten = listen("start-chart", e => {
            setStartTime(e.payload as number);
            console.log("start time", e.payload as number);
        });
        
        return () => { unlisten.then(unlisten => unlisten()) };
    }, []);
    
    return (
        <StartTimeContext.Provider value={startTime}>
            { children }
        </StartTimeContext.Provider>
    );
}