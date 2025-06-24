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
    
    // load charts on mount
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(setCharts);
        
        window.addEventListener("resize", updateEntryPositions);
        return () => { window.removeEventListener("resize", updateEntryPositions); }
    }, []);
    
    
    const songListRef = useRef<HTMLDivElement | null>(null);
    
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
            
            console.log(deltaX);
            entry.style.left = listRect.width * 0.5 - deltaX + "px";
        }
    }
    
    const scrollingRef = useRef(false);
    const scrollTargetRef = useRef(0);

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
    
    useEffect(() => {
        const songList = songListRef.current;
        if (!songList) return;
        
        updateEntryPositions();
        
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
    
    return (
        <div className="fixed cover">
            <div className="absolute top-1 left-1 z-10">
                <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}> main menu </MuseButton>
            </div>
            
            {/* song view */}
            <div className="absolute left-1/4 -translate-x-1/2 top-1/4 w-[50vh] h-[50vh] bg-color1 rounded-[15%]">
                
            </div>
            
            {/* song list */}
            <nav
                ref={songListRef}
                onScroll={updateEntryPositions}
                className="absolute cover overflow-y-auto flex flex-col gap-[20vh]"
            >
                {/* buffer top */}
                <div className="w-[40vh] h-[40vh] shrink-0"></div>
                
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
                <div className="w-[40vh] h-[40vh] shrink-0"></div>
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
            <div className="relative w-[35vh] h-[35vh] overflow-hidden rotate-45 rounded-[25%]">
                <img 
                    src={songFolder ? convertFileSrc(songFolder + metadata.img) : ""} 
                    className='absolute cover w-full h-full scale-125 object-cover -rotate-45'
                />
            </div>
            
            {/* difficulty label */}
            <div className='
                absolute top-1/2 -translate-y-1/2 left-full -translate-x-1/2 ml-[10vh]
                w-[15vh] h-[15vh] bg-red-400 rotate-45 rounded-[25%]
                flex justify-center items-center
            '>
                <div className='-rotate-45 text-2xl'>4.1</div>
            </div>
        </section>
    )
}