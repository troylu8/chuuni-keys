import { ReactNode } from "react";


const KEY_SIZE = 48;

type Props = Readonly<{
    activated?: boolean
    pressed?: boolean
    label?: ReactNode
    labelCentered?: boolean
    hitProgresses: number[]
}>
export function KeyUnit( { activated, pressed, label, labelCentered, hitProgresses }: Props ) {
    return (
        <div 
            style={{width: KEY_SIZE, height: KEY_SIZE}}
            className={`
                flex flex-col-reverse rounded-xl relative
                ${pressed? "bg-foreground text-background" : "bg-background opacity-25" }
                ${labelCentered? "items-center justify-center" : "[&>span]:ml-3"}
                ${activated && "opacity-100 transition-opacity"}
            `}
        >
            <span className="text-lg"> { label } </span>
            { hitProgresses.map((p, i) => <Hitring key={i} progress={p} />) }
        </div>
    )
}

const HITRING_MAX_GAP = 30;

type HitringProps = Readonly<{
    progress: number
}>
function Hitring({ progress }: HitringProps) {
    const gap = HITRING_MAX_GAP * Math.max(progress, 0);
    
    return (
        <>
            <div 
                className="absolute outline-foreground outline-3"
                style={{
                    top: -gap,
                    bottom: -gap,
                    left: -gap,
                    right: -gap,
                    borderRadius: (2 * gap + KEY_SIZE) * 0.25,  // total size * 0.25
                    opacity: (1 - progress) / 0.6
                }}
            ></div>
        </>
    );
}