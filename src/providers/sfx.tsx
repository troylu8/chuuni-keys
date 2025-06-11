import { convertFileSrc } from "@tauri-apps/api/core";
import { createContext, useContext, useEffect, useRef } from "react";
import { appLocalDataDir, BaseDirectory } from "@tauri-apps/api/path";
import { readFile } from "@tauri-apps/plugin-fs";

export enum SFX { HITSOUND }

type PlaySfx = (sfx: SFX) => void;
const SfxContext = createContext<PlaySfx | null>(null);


export function useSfx() {
    return useContext(SfxContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function SfxProvider({ children }: Props) {
    
    const audioContext = useRef(new AudioContext()).current;
    const audioBuffersRef = useRef<Map<SFX, AudioBuffer> | null>();
    
    useEffect(() => {
        async function getAudioBuffer(path: string) {
            const bytes = await readFile(path, {baseDir: BaseDirectory.AppLocalData});
            return await audioContext.decodeAudioData(bytes.buffer);
        }
        
        (async () => {
            audioBuffersRef.current = new Map([
                [SFX.HITSOUND, await getAudioBuffer("userdata\\sfx\\hitsound.ogg")]
            ]);
        })();
        
    }, []);
    
    
    function playSfx(sfx: SFX) {
        if (!audioBuffersRef.current) return;
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffersRef.current.get(sfx)!;
        source.connect(audioContext.destination);
        source.start();
    }
    
    return (
        <SfxContext.Provider value={playSfx}>
            { children }
        </SfxContext.Provider>
    );
}