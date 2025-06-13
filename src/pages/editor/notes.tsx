import { Tree } from "functional-red-black-tree";
import { KeyUnit } from "../../components/key-unit";
import KeyboardLayout from "../../components/keyboard-layout";
import { ACTIVATION_DURATION, HITRING_DURATION, MuseEvent } from "../../providers/game-manager";
import { useRef } from "react";
import playSfx, { SFX } from "../../lib/sfx";
import { usePlayback } from "../../providers/playback";
import { MISS_THRESHOLD } from "../../providers/score";

type Props = Readonly<{
    events: Tree<number, MuseEvent>
    position: number
}>
export default function Notes({ events, position }: Props) {
    
    const { playing } = usePlayback();
    const nextNoteTimeRef = useRef<number | undefined>(events.begin.value?.[0]);
    
    const nextNoteTime = events.ge(position).value?.[0];
    
    if (nextNoteTimeRef.current != nextNoteTime) {
        if (playing) playSfx(SFX.HITSOUND, 0.2);
        nextNoteTimeRef.current = nextNoteTime;
    }
    
    
    const visibleProgresses: Record<string, number[]> = {};
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
        position - MISS_THRESHOLD, position + ACTIVATION_DURATION
    );
    
    return (
        <KeyboardLayout keyComponent={ key => 
            <KeyUnit key={key} keyCode={key} label={key} hitProgresses={visibleProgresses[key] ?? []} />
        } />
    );
}