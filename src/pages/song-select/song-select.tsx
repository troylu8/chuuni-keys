import filenamify from 'filenamify';
import { ChartMetadata, Page, SongSelectParams, usePage } from "../../providers/page";
import { ReactNode, useEffect, useRef, useState } from 'react';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { appLocalDataDir } from '@tauri-apps/api/path';
import MuseButton from '../../components/muse-button';


/** https://www.desmos.com/calculator/3zoigxxcl0 */
function distToCircle(x: number, radius: number) {
    if (x < 0 || x > radius * 2) return 0; // out of bounds
    return radius - Math.sqrt(radius * radius - (x - radius) * (x - radius));
}

async function getSongFolder(id: string, title: string) {
    return `${await appLocalDataDir()}\\userdata\\charts\\${id} ${filenamify(title, {replacement: '_'})}\\`;
}

export default function SongSelect() {
    
    const [charts, setCharts] = useState<ChartMetadata[] | null>(null);
    const [[,params], setPageParams] = usePage();
    const { isEditing } = params as SongSelectParams;
    
    // smooth scrolling
    const scrollingRef = useRef(false);
    const scrollTargetRef = useRef(0);
    const songListRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const songList = songListRef.current;
        if (!songList) return;
        
        function scrollAnimation() {
            const songList = songListRef.current;
            if (!songList) return;
            
            const delta = scrollTargetRef.current - songList.scrollTop;

            // snap to target if close enough
            if (Math.abs(delta) < 1) {
                scrollingRef.current = false;
                songList.scrollTop = scrollTargetRef.current;
            } else {
                scrollingRef.current = true;
                songList.scrollTop += delta * 0.2;
                requestAnimationFrame(scrollAnimation);
            }
        }
        
        // can't use react's onWheel property bc it is passive
        function handleWheel(e: WheelEvent) {
            e.preventDefault();
            
            const songList = songListRef.current;
            if (!songList) return;
            
            // clamp new scroll pos to valid values
            scrollTargetRef.current = Math.max(0, Math.min(scrollTargetRef.current + e.deltaY, songList.scrollHeight - songList.clientHeight));
            if (!scrollingRef.current) scrollAnimation(); // if already scrolling, don't start a new scrolling frame
        }
        
        songList.addEventListener("wheel", handleWheel, { passive: false });
        return () => { songList.removeEventListener("wheel", handleWheel); }
    }, [songListRef.current]);
    
    
    const [activeChart, setActiveChart] = useState<ChartMetadata | null>(null);
    
    function updateEntryPositions() {
        const songList = songListRef.current;
        if (!songList) return;
        
        const listRect = songList.getBoundingClientRect();
        const listCenterY = (listRect.top + listRect.bottom) / 2;

        for (const entry of songList.querySelectorAll("section")) {
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
        
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(charts => {
            setCharts(charts);
            setActiveChart(charts?.[0] ?? null);
        });
        
        window.addEventListener("resize", updateEntryPositions);
        return () => { window.removeEventListener("resize", updateEntryPositions); }
    }, []);
    useEffect(updateEntryPositions, [charts]);
    
    
    
    return (
        <div className="fixed cover">
            <div className="absolute top-1 left-1 z-10">
                <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}> main menu </MuseButton>
            </div>
            
            {/* song view */}
            <div className="absolute left-1/5 -translate-x-1/2 top-1/4 w-[50vh] h-[50vh] bg-color1 rounded-[15%]">
                { activeChart && 
                    <>
                        <p className="text-[6vh]"> {activeChart.title} </p>
                        
                        {/* credits grid */}
                        <div className="grid grid-cols-2 gap-3">
                            { activeChart.credit_audio &&
                                <>
                                    <p className="text-end"> music </p>
                                    <p> { activeChart.credit_audio } </p>
                                </>
                            }
                            { activeChart.credit_img &&
                                <>
                                    <p className="text-end"> img </p>
                                    <p> { activeChart.credit_img } </p>
                                </>
                            }
                            { activeChart.credit_chart &&
                                <>
                                    <p className="text-end"> chart </p>
                                    <p> { activeChart.credit_chart } </p>
                                </>
                            }
                        </div>
                    </>
                }
            </div>
            
            {/* song list */}
            <nav
                ref={songListRef}
                onScroll={updateEntryPositions}
                className="absolute cover overflow-hidden flex flex-col gap-[10vh]"
            >
                {/* buffer top */}
                <div className="h-[20vh] shrink-0"></div>
                
                { charts && charts.map(metadata => 
                    <ChartEntry 
                        key={metadata.id}
                        metadata={metadata}
                        onClick={async () => {
                            setPageParams([
                                isEditing? Page.EDITOR : Page.GAME, 
                                [metadata, await getSongFolder(metadata.id, metadata.title)]
                            ])
                        }}
                    />
                )}
                
                {/* buffer bottom */}
                <div className="h-[20vh] shrink-0"></div>
            </nav>
        </div>
    )
}

type ChartEntryProps = Readonly<{
    metadata: ChartMetadata
    onClick: () => any
}>
function ChartEntry({ metadata, onClick }: ChartEntryProps) {
    
    const [songFolder, setSongFolder] = useState<string | null>(null);
    useEffect(() => {
        getSongFolder(metadata.id, metadata.title).then(setSongFolder);
    }, []);
    
    return (
        <section 
            className="relative shrink-0 w-fit"
            onClick={onClick}
        >            
            {/* thumbnail */}
            <div className="relative w-[25vh] h-[25vh] overflow-hidden rotate-45 rounded-[25%] z-10">
                <img 
                    src={songFolder ? convertFileSrc(songFolder + metadata.img) : ""} 
                    className='absolute cover w-full h-full scale-125 object-cover -rotate-45'
                />
            </div>
            
            {/* difficulty label */}
            <div className='
                absolute top-1/2 -translate-y-1/2 left-full -translate-x-1/2 ml-[7vh]
                w-[10vh] h-[10vh] bg-red-400 rotate-45 rounded-[25%]
                flex justify-center items-center z-20
            '>
                <div className='-rotate-45 text-[5vh]'>4.1</div>
            </div>
            
            {/* song title / producer label */}
            <header 
                style={{
                    border: "solid 5px",
                    borderImage: "linear-gradient(to right, var(--color1), rgba(0, 0, 0, 0) 80%) 100% 1"
                }}
                className='
                    absolute left-1/2 top-1/10 bottom-1/10 text-foreground text-nowrap 
                    flex flex-col justify-center pl-[27vh] w-[50vw]
                '
            >
                <p className='text-[6vh]'> {metadata.title} </p>
                <p className='text-[3vh]'> {metadata.credit_audio} </p>
            </header>
        </section>
    )
}