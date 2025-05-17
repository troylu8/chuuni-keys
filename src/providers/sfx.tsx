import { convertFileSrc } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useRef } from "react";
import { useUserData } from "./user-data";

type AudioMap = Record<string, HTMLAudioElement>; 

type PlaySfx = (sfx: string) => Promise<void> | undefined;
const SfxContext = createContext<PlaySfx | null>(null);

export function useSfx() {
    return useContext(SfxContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SfxProvider({ children }: Props) {
    const userdata =  useUserData();
    
    const audioMapRef = useRef<AudioMap>({});
    
    useEffect(() => {
        if (!userdata) return;
        audioMapRef.current = {
            "hitsound": new Audio(convertFileSrc(`${userdata.base_dir}\\sfx\\hitsound.ogg`))
        }
    }, [userdata])
    
    
    function playSfx(sfx: string) {
        if (!userdata) return;
        return audioMapRef.current[sfx]?.play();
    }
    
    return (
        <SfxContext.Provider value={playSfx}>
            { children }
        </SfxContext.Provider>
    );
}