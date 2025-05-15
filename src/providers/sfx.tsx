import { convertFileSrc } from "@tauri-apps/api/core";
import { createContext, useContext, useRef } from "react";
import { useUserData } from "./user-data";

type PlaySfx = (filename: string) => Promise<void> | undefined;
const SfxContext = createContext<PlaySfx | null>(null);

export function useSfx() {
    return useContext(SfxContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SfxProvider({ children }: Props) {
    const userData =  useUserData();
    
    const lastPlayed = useRef("");
    const audio = useRef(new Audio()).current;
    
    function playSfx(filename: string) {
        if (!userData) return;
        
        if (lastPlayed.current != filename) {
            audio.src = convertFileSrc(`${userData.base_dir}\\sfx\\${filename}`);
            lastPlayed.current = filename;
        }
        return audio.play();
    }
    
    return (
        <SfxContext.Provider value={playSfx}>
            { children }
        </SfxContext.Provider>
    );
}