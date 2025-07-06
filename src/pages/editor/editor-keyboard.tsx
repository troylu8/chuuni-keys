import { Tree } from "functional-red-black-tree";
import { KeyUnit } from "../../components/key-unit";
import KeyboardLayout from "../../components/keyboard-layout";
import { MuseEvent } from "../../contexts/game-manager";
import { useRef } from "react";
import bgm, { playSfx } from "../../lib/sound";
import { useBgmPos } from "../../contexts/bgm-state";
import { useSettings } from "../../contexts/settings";

const PAST_VISIBILITY_DISTANCE = 500;

type Props = Readonly<{
    events: Tree<number, MuseEvent>
    onHit: (key: string) => any
}>
export default function EditorKeyboard({ events, onHit }: Props) {
    const [{ hitringDuration },, activationDuration] = useSettings();
    const pos = useBgmPos();
    
    const nextNoteTimeRef = useRef<number | undefined>(events.begin.value?.[0]);
    
    const nextNoteTime = events.ge(pos).value?.[0];
    
    if (nextNoteTimeRef.current != nextNoteTime) {
        if (!bgm.paused) playSfx("hitsound");
        nextNoteTimeRef.current = nextNoteTime;
    }
    
    
    const visibleProgresses: Record<string, number[]> = {};
    
    // put all visible 
    events?.forEach(
        (hitTime, event) => {
            if (event[1].startsWith(":")) {
                const key = event[1].substring(1);
                const progress = (hitTime - pos) / hitringDuration;
                if (visibleProgresses[key]) {
                    visibleProgresses[key].push(progress);
                }
                else {
                    visibleProgresses[key] = [progress];
                }
            }
        },
        pos - PAST_VISIBILITY_DISTANCE, pos + activationDuration
    );
    
    return (
        <KeyboardLayout keyComponent={ key => 
            <KeyUnit 
                key={key} 
                keyCode={key} 
                label={key} 
                hitProgresses={visibleProgresses[key] ?? []} 
                onHit={() => onHit(key)}
                fadeOut
            />
        } />
    );
}