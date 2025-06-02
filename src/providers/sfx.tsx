import { convertFileSrc } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useRef } from "react";
import { useUserData } from "./user-data";


type PlaySfx = (sfx: string) => void;
const SfxContext = createContext<PlaySfx | null>(null);

export function useSfx() {
    return useContext(SfxContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SfxProvider({ children }: Props) {
    const userdata =  useUserData();
    
    const audioMapRef = useRef<Record<string, Howl> | null>(null);
    
    useEffect(() => {
        if (!userdata) return;
        audioMapRef.current = {
            "hitsound": new Howl({src: convertFileSrc(`${userdata.base_dir}\\sfx\\hitsound.ogg`), preload: true})
        }
    }, [userdata])
    
    
    function playSfx(sfx: string) {
        if (!userdata || !audioMapRef.current) return;
        audioMapRef.current[sfx]?.play();
    }
    
    return (
        <SfxContext.Provider value={playSfx}>
            { children }
        </SfxContext.Provider>
    );
}