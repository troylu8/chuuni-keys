import { ReactNode, useEffect, useRef, useState } from "react";
import { Bind } from "../lib/globals";

type Props = Readonly<{
    min: number
    max: number
    bind: Bind<number>
    children?: ReactNode
    thumbClassName?: string
}>
export default function Slider({ min, max, bind: [val, setter], children, thumbClassName }: Props) {
    
    const [cursorPos, setCursorPos] = useState<number | null>(null);
    const [dragging, setDragging] = useState(false);
    const container = useRef<HTMLDivElement | null>(null);
    const sliderBounds = container.current?.getBoundingClientRect();
    
    useEffect(() => {
        function handleDrag(e: MouseEvent) {
            const clampedCursorPos = Math.min(Math.max(0, e.clientX - sliderBounds!.left), sliderBounds!.width);
            setCursorPos(clampedCursorPos);
            setter((clampedCursorPos / sliderBounds!.width) * (max - min) + min);
        }
        
        if (dragging)
            window.addEventListener("mousemove", handleDrag);
        return () => { window.removeEventListener("mousemove", handleDrag); }
    }, [dragging]);
    
    function handleHover(e: React.MouseEvent) {
        if (dragging) return;
        setCursorPos(e.clientX - sliderBounds!.left);
    }
    function handleMouseLeave() {
        setCursorPos(null);
    }
        
    return (
        <div 
            ref={container}
            onMouseDown={() => setDragging(true)}
            onMouseUp={() => setDragging(false)}
            onMouseMove={handleHover}
            onMouseLeave={handleMouseLeave}
            className="w-full h-full flex items-center"
        >
            <div className="h-[2px] w-full rounded-full relative bg-foreground">
                <Thumb left={`${(val - min) / (max - min) * 100}%`} className={thumbClassName} />
                
                { cursorPos != null && !dragging &&
                    <Thumb
                        left={`${cursorPos}px`}
                        className={thumbClassName ?? "" + "bg-red-400"}
                    />
                }
                
                { children }
            </div>
        </div>
    );
}

type ThumbProps = Readonly<{
    left: string
    className?: string
}>
function Thumb({ left, className }: ThumbProps) {
    return (
        <div 
            style={{left}}
            className={`
                absolute top-1/2 -translate-y-1/2 -translate-x-1/2 
                w-[2px] h-3 rounded-full bg-foreground ${className}
            `}
        ></div>
    )
}