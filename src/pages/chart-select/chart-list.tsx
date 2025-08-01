import { convertFileSrc } from "@tauri-apps/api/core";
import { ChartMetadata, getChartFolder, resetAnimation, RESOURCE_DIR } from "../../lib/lib";
import { useRef, useEffect } from "react";
import { useOnBeat } from "../../lib/sound";


/** https://www.desmos.com/calculator/3zoigxxcl0 */
function distToCircle(x: number, radius: number) {
    if (x < 0 || x > radius * 2) return 0; // out of bounds
    return radius - Math.sqrt(radius * radius - (x - radius) * (x - radius));
}

type Props = Readonly<{
    charts: ChartMetadata[]
    activeChartId?: string
    onEntryClick: (metadata: ChartMetadata) => any
    onEntryContextMenu: (metadata: ChartMetadata) => any
}>
export default function ChartList({ charts, activeChartId, onEntryClick, onEntryContextMenu }: Props) {
    
    const scrollingRef = useRef(false);
    const scrollTargetRef = useRef(0);
    const chartListRef = useRef<HTMLDivElement | null>(null);
    
    function scrollAnimation() {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
        const delta = scrollTargetRef.current - chartList.scrollTop;

        // snap to target if close enough
        if (Math.abs(delta) < 1) {
            scrollingRef.current = false;
            chartList.scrollTop = scrollTargetRef.current;
        } else {
            scrollingRef.current = true;
            chartList.scrollTop += delta * 0.2;
            requestAnimationFrame(scrollAnimation);
        }
    }
    
    function startScrollAnimation(target: number) {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
        // clamp new scroll pos to valid values
        scrollTargetRef.current = Math.max(0, Math.min(target, chartList.scrollHeight - chartList.clientHeight));
        
        // start a new scrolling frame if animation isnt playing already
        if (!scrollingRef.current) scrollAnimation(); 
    }
    
    // handle mouse scroll
    useEffect(() => {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
        // can't use react's onWheel property bc it is passive
        function handleWheel(e: WheelEvent) {
            e.preventDefault();
            startScrollAnimation(scrollTargetRef.current + e.deltaY);
        }
        
        chartList.addEventListener("wheel", handleWheel, { passive: false });
        return () => { chartList.removeEventListener("wheel", handleWheel); }
    }, []);
    
    
    function scrollToChart(id: string, instant?: boolean) {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
        const entryRect = document.getElementById(id)!.getBoundingClientRect();
        const entryCenterY = (entryRect.top + entryRect.bottom) / 2;
        const listRect = chartList.getBoundingClientRect();
        
        const scrollTarget = chartList.scrollTop - listRect.top + entryCenterY - listRect.height / 2;
        if (instant) {
            chartList.scrollTo({top: scrollTarget, behavior: "instant"});
            scrollTargetRef.current = scrollTarget;
        }
        else
            startScrollAnimation(scrollTarget);
        
    }
    
    const shouldInstantScroll = useRef(true);
    useEffect(() => {
        if (!activeChartId) 
            shouldInstantScroll.current = true;
        else {
            scrollToChart(activeChartId, shouldInstantScroll.current);
            shouldInstantScroll.current = false;
        }
    }, [activeChartId]);
    
    
    function updateEntryPositions() {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
        const listRect = chartList.getBoundingClientRect();
        const listCenterY = (listRect.top + listRect.bottom) / 2;

        for (const entry of chartList.querySelectorAll("section")) {
            const entryRect = entry.getBoundingClientRect();

            // ignore entries that are out of sight
            if (entryRect.bottom < listRect.top || entryRect.top > listRect.bottom) continue;

            let deltaX;

            // if box is above center
            if (entryRect.bottom < listCenterY) {
                deltaX = distToCircle(listRect.bottom - entryRect.bottom, listRect.height / 2);
            }

            // if box is below center
            else if (entryRect.top > listCenterY) {
                deltaX = distToCircle(listRect.bottom - entryRect.top, listRect.height / 2);
            }

            // if box straddles center
            else deltaX = 0;
            
            // entries 45% from the left of the screen at the closest
            entry.style.left = listRect.width * 0.45 - deltaX + "px"; 
        }
    }
    // update entry positions on charts changed or window resize
    useEffect(updateEntryPositions, [charts]);
    useEffect(() => {
        window.addEventListener("resize", updateEntryPositions);
        return () => { window.removeEventListener("resize", updateEntryPositions); }
    }, []);
    
    return (
        <nav
            ref={chartListRef}
            onScroll={updateEntryPositions}
            className="absolute cover overflow-hidden flex flex-col gap-[10vh]"
        >
            {/* buffer top */}
            <div className="h-[20vh] shrink-0"></div>
            
            { charts.map(metadata => 
                <ChartEntry 
                    key={metadata.id}
                    metadata={metadata}
                    onClick={() => onEntryClick(metadata)}
                    onContextMenu={() => onEntryContextMenu(metadata)}
                    active={activeChartId == metadata.id}
                />
            )}
            
            {/* buffer bottom */}
            <div className="h-[20vh] shrink-0"></div>
        </nav>
    )
}

type ChartEntryProps = Readonly<{
    metadata: ChartMetadata
    onClick: () => any
    onContextMenu: () => any
    active: boolean
}>
function ChartEntry({ metadata, onClick, onContextMenu, active }: ChartEntryProps) {
    
    const titleTextRef = useRef<HTMLParagraphElement | null>(null);
    const pulseBorderRef = useRef<HTMLDivElement | null>(null);
    
    const beatDuration = useOnBeat(() => {
        if (titleTextRef.current)
            resetAnimation(titleTextRef.current);
        if (pulseBorderRef.current)
            resetAnimation(pulseBorderRef.current);
    });
    
    return (
        <section 
            id={metadata.id}
            className="relative shrink-0 w-fit"
            onClick={onClick}
            onContextMenu={onContextMenu}
        >            
            {/* thumbnail */}
            <div className="relative w-[25vh] h-[25vh] rotate-45  z-10">
                <div className="absolute cover overflow-hidden rounded-[25%]">
                    <img 
                        src={convertFileSrc(metadata.img_ext ? `${getChartFolder(metadata)}/img.${metadata.img_ext}` : RESOURCE_DIR + "/default-bg.png")}
                        className='absolute cover w-full h-full scale-125 object-cover -rotate-45'
                    />
                </div>
                { active &&
                    <>
                        <div className="absolute -left-2 -right-2 -top-2 -bottom-2 rounded-[25%] outline-8 outline-ctp-red">
                            <div 
                                ref={pulseBorderRef} 
                                style={{animationDuration: beatDuration ? beatDuration * 0.7 + "ms" : ""}}
                                className="anim-pulse absolute rounded-[25%] outline-8 outline-ctp-red">
                            </div>
                        </div>
                    </>
                }
            </div>
            
            {/* difficulty label */}
            <div 
                style={{backgroundColor: `var(--${metadata.difficulty})`}}
                className='
                    absolute top-1/2 -translate-y-1/2 left-full -translate-x-1/2 ml-[7vh]
                    w-[10vh] h-[10vh] rotate-45 rounded-[25%]
                    flex justify-center items-center z-10
                '
            >
                <p className="-rotate-45 text-ctp-base text-[3.5vh] font-mono"> 
                    { 
                        metadata.difficulty.length > 5 ?
                            metadata.difficulty.substring(0, 4) + "." : 
                            metadata.difficulty 
                    } 
                </p>
            </div>
            
            {/* song title / producer label */}
            <header 
                
                style={{
                    borderStyle: "solid",
                    borderWidth: active ? "5px" : "2px",
                    borderImage: `linear-gradient(to right, ${active ? "var(--color-ctp-red)" : "var(--color-ctp-mauve)"} 80%, rgba(0, 0, 0, 0) 90%) 100% 1`,
                }}
                className='
                    absolute left-1/2 top-1/10 bottom-1/10 text-nowrap 
                    flex flex-col justify-center pl-[27vh] w-[50vw] 
                '
            >
                <h2 
                    ref={titleTextRef}
                    style={{animationDuration: beatDuration ? beatDuration + "ms" : ""}}
                    className={`
                        ${active && "anim-flash "}
                        text-[6vh] ${active ? "text-ctp-red!" : "text-ctp-mauve!"}
                    `}
                > {metadata.title} </h2>
                <p className='text-[3vh]'> {metadata.credit_audio} </p>
            </header>
        </section>
    )
}