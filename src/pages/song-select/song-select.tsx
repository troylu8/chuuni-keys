import filenamify from 'filenamify';
import { ChartMetadata, Page, SongSelectParams, usePage } from "../../providers/page";
import { ReactNode, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { appLocalDataDir } from '@tauri-apps/api/path';
import MuseButton from '../../components/muse-button';


/** gap between chart view and entries */
const ENTRIES_LEFT_GAP = 200;

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
    
    
    const songViewRef = useRef<HTMLDivElement | null>(null);
    const songListRef = useRef<HTMLDivElement | null>(null);
    
    function updateEntryPositions() {
        const songView = songViewRef.current;
        const songList = songListRef.current;
        if (!songView || !songList) return;
        
        const listRect = songList.getBoundingClientRect();
        const listCenterY = (listRect.top + listRect.bottom) / 2;

        for (const entry of songList.querySelectorAll("div")) {
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
            entry.style.left = songView.getBoundingClientRect().right + ENTRIES_LEFT_GAP - deltaX + "px";
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
            <div ref={songViewRef} className="relative top-[25vh] left-[20vh] w-[50vh] h-[50vh] bg-red-600">
                
            </div>
            
            {/* song list */}
            <div
                ref={songListRef}
                onScroll={updateEntryPositions}
                className="absolute cover overflow-y-auto flex flex-col gap-6"
            >
                {/* buffer top */}
                <div className="w-[40vh] h-[40vh] shrink-0"></div>
                
                { charts && charts.map(metadata => 
                    <div
                        className="relative w-[40vh] h-[40vh] rounded-[25%] bg-blue-300 shrink-0"
                        key={metadata.id}
                        onClick={async () => {
                            const applocaldata = await appLocalDataDir();
                            setPageParams([
                                isEditing? Page.EDITOR : Page.GAME, 
                                [
                                    metadata, 
                                    `${applocaldata}\\userdata\\charts\\${metadata.id} ${filenamify(metadata.title, {replacement: '_'})}\\`
                                ]
                            ])
                        }}
                    >
                        { metadata.title }
                    </div>
                )}
                
                {/* buffer bottom */}
                <div className="w-[40vh] h-[40vh] shrink-0"></div>
            </div>
        </div>
    )
}

/** https://www.desmos.com/calculator/3zoigxxcl0 */
function distToCircle(x: number, radius: number) {
    if (x < 0 || x > radius * 2) return 0; // out of bounds
    return radius - Math.sqrt(radius * radius - (x - radius) * (x - radius));
}