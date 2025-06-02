import { convertFileSrc } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useRef } from "react";
import { appLocalDataDir } from "@tauri-apps/api/path";


type PlaySfx = (sfx: string) => void;
const SfxContext = createContext<PlaySfx | null>(null);

export function useSfx() {
    return useContext(SfxContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SfxProvider({ children }: Props) {
    
    const audioMapRef = useRef<Record<string, Howl> | null>(null);
    
    useEffect(() => {
        appLocalDataDir().then(applocaldata => {
            audioMapRef.current = {
                "hitsound": new Howl({src: convertFileSrc(`${applocaldata}\\userdata\\sfx\\hitsound.ogg`), preload: true})
            }
        });
    }, [])
    
    
    function playSfx(sfx: string) {
        if (!audioMapRef.current) return;
        audioMapRef.current[sfx]?.play();
    }
    
    return (
        <SfxContext.Provider value={playSfx}>
            { children }
        </SfxContext.Provider>
    );
}