import { Page, ChartSelectParams, usePage } from "../../contexts/page";
import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ChartEntry from './chart-entry';
import ChartInfo from './chart-info';
import { ChartMetadata, flags, getChartFolder, SERVER_URL } from "../../lib/lib";
import bgm from "../../lib/sound";
import MuseButton from "../../components/muse-button";
import { ArrowLeft, EllipsisVertical, Plus, XIcon } from "lucide-react";
import { remove } from "@tauri-apps/plugin-fs";
import { useBgmState } from "../../contexts/bgm-state";


/** https://www.desmos.com/calculator/3zoigxxcl0 */
function distToCircle(x: number, radius: number) {
    if (x < 0 || x > radius * 2) return 0; // out of bounds
    return radius - Math.sqrt(radius * radius - (x - radius) * (x - radius));
}

export default function ChartSelect() {
    
    const [charts, setCharts] = useState<ChartMetadata[] | null>(null);
    const [[,params], setPageParams] = usePage();
    const activeChartId = (params as ChartSelectParams)?.activeChartId ?? flags.lastActiveChartId;
    
    
    // smooth scrolling
    const scrollingRef = useRef(false);
    const scrollTargetRef = useRef(0);
    const chartListRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const chartList = chartListRef.current;
        if (!chartList) return;
        
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
        
        // can't use react's onWheel property bc it is passive
        function handleWheel(e: WheelEvent) {
            e.preventDefault();
            
            const chartList = chartListRef.current;
            if (!chartList) return;
            
            // clamp new scroll pos to valid values
            scrollTargetRef.current = Math.max(0, Math.min(scrollTargetRef.current + e.deltaY, chartList.scrollHeight - chartList.clientHeight));
            if (!scrollingRef.current) scrollAnimation(); // if already scrolling, don't start a new scrolling frame
        }
        
        chartList.addEventListener("wheel", handleWheel, { passive: false });
        return () => { chartList.removeEventListener("wheel", handleWheel); }
    }, [chartListRef.current]);
    
    
    const [activeChart, setActiveChartInner] = useState<ChartMetadata | null>(null);
    async function setActiveChart(metadata: ChartMetadata) {
        setActiveChartInner(metadata);
        flags.lastActiveChartId = metadata.id;
        
        const activeSongSrc = `${getChartFolder(metadata)}\\audio.${metadata.audio_ext}`;
        
        // this is a different song, so play it from the preview point
        if (bgm.src != activeSongSrc) {
            bgm.src = activeSongSrc;
            bgm.pos = metadata.preview_time;
            await bgm.play();
        }
        
        // this song is active but it was paused, so resume it
        else if (bgm.paused) {
            await bgm.play();
        }
        
        // if the this song is active and playing, do nothing (let it continue playing)
    }
    
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
    
    // initialize charts
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(charts => {
            setCharts(charts);
            
            if (activeChartId != undefined) {
                const activeChart = charts.find(chart => chart.id == activeChartId);
                if (activeChart) {
                    setActiveChart(activeChart);
                }
                else {
                    fetch(SERVER_URL + "/download/" + activeChartId)
                    .then(resp => {
                        if (resp.ok) return resp.bytes();
                    })
                    .then(buffer => {
                        invoke<ChartMetadata>("unzip_chart", { buffer })
                        .then(chartMetadata => {
                            setCharts([...charts, chartMetadata]);
                            setActiveChart(chartMetadata);
                        })
                    })
                }
            }
            else setActiveChart(charts?.[0] ?? null);
        });
        
        window.addEventListener("resize", updateEntryPositions);
        return () => { window.removeEventListener("resize", updateEntryPositions); }
    }, []);
    useEffect(updateEntryPositions, [charts]);
    
    function play() {
        if (activeChart) 
            setPageParams([Page.GAME, activeChart]);
    }
    function edit() {
        if (activeChart) 
            setPageParams([Page.EDITOR, { metadata: activeChart }]);
    }
    
    function handleEntryClick(metadata: ChartMetadata) {
        if (activeChart?.id != metadata.id) setActiveChart(metadata);
        else                                play();
    }
    function handleEntryContextMenu(metadata: ChartMetadata) {
        if (activeChart?.id != metadata.id) setActiveChart(metadata);
        else                                edit();
    }
    
    async function deleteActiveChart() {
        if (!activeChart || !charts) return;
        
        // delete chart folder
        await remove(getChartFolder(activeChart), {recursive: true});
        
        // remove this active chart from charts[]
        setCharts(charts.filter(chart => chart.id != activeChart.id));
        
        // the next active chart is the chart before this one
        const i = charts.findIndex(chart => chart.id == activeChart.id);
        setActiveChart(charts[i == 0 ? 1 : i - 1]);
    }
    
    return (
        <div className="fixed cover">
            <NavigationBar />
            
            <ChartInfo metadata={activeChart} />
            
            {/* chart list */}
            <nav
                ref={chartListRef}
                onScroll={updateEntryPositions}
                className="absolute cover overflow-hidden flex flex-col gap-[10vh]"
            >
                {/* buffer top */}
                <div className="h-[20vh] shrink-0"></div>
                
                { charts && charts.map(metadata => 
                    <ChartEntry 
                        key={metadata.id}
                        metadata={metadata}
                        onClick={() => handleEntryClick(metadata)}
                        onContextMenu={() => handleEntryContextMenu(metadata)}
                        active={activeChart?.id == metadata.id}
                    />
                )}
                
                {/* buffer bottom */}
                <div className="h-[20vh] shrink-0"></div>
            </nav>
            
            <ActionsBar 
                activeSongId={activeChart?.id}
                play={play}
                edit={edit}
                deleteActiveChart={deleteActiveChart}
            />
        </div>
    )
}


function NavigationBar() {
    const [, setPageParams] = usePage();
    const { paused } =  useBgmState();
    
    return (
        <nav className="absolute top-1 left-1 z-10 flex gap-3">
            <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}>
                <ArrowLeft /> home
            </MuseButton>
            <MuseButton onClick={() => setPageParams([Page.NEW_CHART])}>
                <Plus /> new
            </MuseButton>
            <p onClick={() => bgm.paused? bgm.play() : bgm.pause()}>
                { paused? "[ music paused ]" :  "now playing.."}
            </p>
        </nav>
    )
}

enum ActionsState { DEFAULT, OPTIONS, DELETING }
type Props = Readonly<{
    activeSongId?: string
    play: () => any
    edit: () => any
    deleteActiveChart: () => any
}>
function ActionsBar({ activeSongId, play, edit, deleteActiveChart }: Props) {
    
    const [actionsState, setActionsState] = useState(ActionsState.DEFAULT);
    
    // close menu when active song changes
    useEffect(() => setActionsState(ActionsState.DEFAULT), [activeSongId]);
    
    
    return (
        <div className="
            absolute left-0 bottom-1/10 flex gap-1 ml-1 w-[35vw] z-10
            [&>*]:text-nowrap [&>*]:grow-1 [&>*]:py-0.5 [&>*]:px-3
        ">
            <MuseButton 
                onClick={() => setActionsState(actionsState == ActionsState.DEFAULT ? ActionsState.OPTIONS : ActionsState.DEFAULT)}
                className="bg-color2 grow-0! px-0.5!"
            > 
                { actionsState == ActionsState.DEFAULT ? <EllipsisVertical /> : <XIcon /> }
            </MuseButton>
            
            { actionsState == ActionsState.DEFAULT &&
                <MuseButton onClick={play} className="bg-color1!"> 
                    [ play ] 
                </MuseButton>
            }
            
            { actionsState == ActionsState.OPTIONS &&
                <>
                    <MuseButton 
                        onClick={() => setActionsState(ActionsState.DELETING)}
                        className="bg-error! grow-0!"
                    > 
                        [ delete ] 
                    </MuseButton>
                    <MuseButton onClick={edit} className="bg-color1!"> 
                        [ edit ] 
                    </MuseButton>
                </>
            }
            
            { actionsState == ActionsState.DELETING &&
                <>
                    <p> delete this chart? </p>
                    
                    <MuseButton 
                        onClick={() => setActionsState(ActionsState.DEFAULT)}
                        className="bg-color1!" 
                    > [ no ] </MuseButton>
                    
                    <MuseButton 
                        onClick={deleteActiveChart} 
                        className="bg-error!"
                    > [ yes ] </MuseButton>
                </>
            }
        </div>
    )
}
