import { convertFileSrc } from "@tauri-apps/api/core";
import { createContext, useContext, useRef } from "react";
import { useUserData } from "./user-data";
import Queue from "yocto-queue";

type PlaySfx = (filename: string, volume?: number) => Promise<void> | undefined;
const SfxContext = createContext<PlaySfx | null>(null);

export function useSfx() {
    return useContext(SfxContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SfxProvider({ children }: Props) {
    const userData =  useUserData();
    
    
    
    function playSfx(filename: string, volume: number = 1) {
        if (!userData) return;
        
        const audio = new Audio(convertFileSrc(`${userData.base_dir}\\sfx\\${filename}`));
        audio.volume = volume;
        audio.addEventListener("ended", () => audio.remove());
        
        return audio.play();
    }
    
    return (
        <SfxContext.Provider value={playSfx}>
            { children }
        </SfxContext.Provider>
    );
}