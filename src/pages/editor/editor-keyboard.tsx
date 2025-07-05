import { Tree } from "functional-red-black-tree";
import { KeyUnit } from "../../components/key-unit";
import KeyboardLayout from "../../components/keyboard-layout";
import { ACTIVATION_DURATION, HITRING_DURATION, MuseEvent } from "../../providers/game-manager";
import { useRef } from "react";
import playSfx, { SFX } from "../../lib/sound";
import { usePlayback } from "../../providers/playback";

const PAST_VISIBILITY_DISTANCE = 500;

type Props = Readonly<{
    events: Tree<number, MuseEvent>
    position: number
    onHit: (key: string) => any
}>
export default function EditorKeyboard({ events, position, onHit }: Props) {
    
    const { playing } = usePlayback();
    const nextNoteTimeRef = useRef<number | undefined>(events.begin.value?.[0]);
    
    const nextNoteTime = events.ge(position).value?.[0];
    
    if (nextNoteTimeRef.current != nextNoteTime) {
        if (playing) playSfx(SFX.HITSOUND, 0.2);
        nextNoteTimeRef.current = nextNoteTime;
    }
    
    
    const visibleProgresses: Record<string, number[]> = {};
    
    // put all visible 
    events?.forEach(
        (hitTime, event) => {
            if (event[1].startsWith(":")) {
                const key = event[1].substring(1);
                const progress = (hitTime - position) / HITRING_DURATION;
                if (visibleProgresses[key]) {
                    visibleProgresses[key].push(progress);
                }
                else {
                    visibleProgresses[key] = [progress];
                }
            }
        },
        position - PAST_VISIBILITY_DISTANCE, position + ACTIVATION_DURATION
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