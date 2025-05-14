import { useState, createContext, useContext, useRef } from "react";

type StartAudio = (src: string) => void;
type SetPlaying = (next: boolean) => void;
const PlaybackContext = createContext<[boolean, StartAudio, SetPlaying] | null>(null);

export function usePlayback() {
    return useContext(PlaybackContext)!;
}

type Props = Readonly<{
    children: React.ReactNode;
}>
export default function PlaybackProvider({ children }: Props) {
    const [playing, setPlayingInner] = useState(false);
    
    const audio = useRef(new Audio()).current;
    
    function startAudio(src: string) {
        audio.src = src;
        audio.play();
        setPlayingInner(true);
    }
    
    function setPlaying(playing: boolean) {
        if (playing) {
            audio.play();
        }
        else {
            audio.pause();
        }
        setPlayingInner(playing);
    }
    
    return (
        <PlaybackContext.Provider value={[playing, startAudio, setPlaying]}>
            { children }
        </PlaybackContext.Provider>
    );
}