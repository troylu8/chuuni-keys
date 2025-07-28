import { Page, ChartSelectParams, usePage } from "../../contexts/page";
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import ChartInfo from './chart-info';
import { ChartMetadata, compareDifficulty, flags, getChartFolder } from "../../lib/lib";
import bgm from "../../lib/sound";
import MuseButton from "../../components/muse-button";
import { ArrowLeft, EllipsisVertical, Plus, TriangleAlert, XIcon } from "lucide-react";
import { remove } from "@tauri-apps/plugin-fs";
import ChartList from "./chart-list";
import Modal from "../../components/modal";
import NowPlaying from "../../components/now-playing";
import ChartListingLink from "../../components/chart-listing-link";
import { downloadChart } from "../../lib/chart-listing";
import LoadingSpinner from "../../components/loading-spinner";
import Leaderboard from "./leaderboard";

/** sorts by difficulty first, then title */
function sortCharts(charts: ChartMetadata[]) {
    charts.sort((a, b) => {
        const diff = compareDifficulty(a, b);
        return diff == 0 ? a.title.localeCompare(b.title) : diff;
    });
}


enum DownloadingState { NONE, ALREADY_EXISTS, DOWNLOADING }

export default function ChartSelect() {
    
    const [charts, _setCharts] = useState<ChartMetadata[] | null>(null);
    function setCharts(setter: (prev: ChartMetadata[] | null) => ChartMetadata[] | null) {
        _setCharts(prev => {
            const next = setter(prev);
            if (next)
                sortCharts(next);
            return next;
        });
    }
    const [[,params], setPageParams] = usePage();
    
    
    const [activeChart, setActiveChartInner] = useState<ChartMetadata | null>(null);
    async function setActiveChart(metadata: ChartMetadata | null) {
        setActiveChartInner(metadata);
        flags.lastActiveChartId = metadata?.id;
        
        if (metadata == null)
            return bgm.clear();
        
        const activeSongSrc = `${getChartFolder(metadata)}\\audio.${metadata.audio_ext}`;
        
        // this is a different song, so play it from the preview point
        if (bgm.src != activeSongSrc) {
            bgm.load(activeSongSrc, metadata);
            bgm.pos = metadata.preview_time;
            await bgm.play();
        }
        
        // this song is active but it was paused, so resume it
        else if (bgm.paused) {
            await bgm.play();
        }
        
        // if the this song is active and playing, do nothing (let it continue playing)
    }
    
    const [downloadingState, setDownloadingState] = useState<DownloadingState | Error>(DownloadingState.NONE);
    function downloadFromParam() {
        const online_id = (params as ChartSelectParams)!.activeChartId!;
        
        setDownloadingState(DownloadingState.DOWNLOADING);
                    
        downloadChart(online_id)
        .then(chartMetadata => {
            setCharts(prev => [...(prev ?? []), chartMetadata]);
            setActiveChart(chartMetadata);
            setDownloadingState(DownloadingState.NONE);
        })
        .catch(err => setDownloadingState(err))
    }
    
    // load charts
    useEffect(() => {
        invoke<ChartMetadata[]>("get_all_charts").then(charts => {
            setCharts(() => charts);
            
            const initialChartId = (params as ChartSelectParams)?.activeChartId;
            if (initialChartId) {
                const initialChart = charts.find(chart => chart.id == initialChartId);
                
                if (initialChart) 
                    return setActiveChart(initialChart);
                
                // try to download it
                else {
                    
                    // see if this chart is already downloaded
                    const existingChart = charts.find(chart => chart.online_id == initialChartId);
                    if (existingChart) {
                        setActiveChart(existingChart);
                        setDownloadingState(DownloadingState.ALREADY_EXISTS);
                    }
                    else 
                        downloadFromParam();
                    
                }
            }
            
            if (flags.lastActiveChartId) {
                const lastChart = charts.find(chart => chart.id == flags.lastActiveChartId);
                if (lastChart) return setActiveChart(lastChart);
            }
            
            setActiveChart(charts?.[0] ?? null);
        });
    }, [params]);
    
    
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
        
        // remove unsynced mark
        localStorage.removeItem("unsynced." + activeChart.id);
        
        // remove this active chart from charts[]
        setCharts(() => charts.filter(chart => chart.id != activeChart.id));
        
        if (charts.length == 1) 
            setActiveChart(null); // this was the last chart
        
        else {
            // the next active chart is the chart before this one
            const i = charts.findIndex(chart => chart.id == activeChart.id);
            setActiveChart(charts[i == 0 ? 1 : i - 1]);
        }
        
    }
    
    // keybinds
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!activeChart || !charts) return;
            
            if (e.key == "Enter") {
                if (e.shiftKey) edit();
                else            play();
            }
            
            else if (e.key == "ArrowUp") {
                const i = charts.findIndex(chart => chart.id == activeChart.id);
                if (i != 0) 
                    setActiveChart(charts[i - 1]);
            }
            else if (e.key == "ArrowDown") {
                const i = charts.findIndex(chart => chart.id == activeChart.id);
                if (i != charts.length - 1)
                    setActiveChart(charts[i + 1]);
            }
            
            else if (e.key == "Escape") {
                setPageParams([Page.MAIN_MENU]);
            }
        }
        
        window.addEventListener("keydown", handleKeyDown);
        return () => { window.removeEventListener("keydown", handleKeyDown); }
    }, [activeChart, charts]);
    
    const [scoresVisible, setScoresVisible] = useState(false);
    
    return (
        <div className="fixed cover bg-ctp-base">
            <NowPlaying />
            <NavigationBar />
            
            <DownloadingModal 
                downloadingState={downloadingState}
                onDownloadAnotherCopy={downloadFromParam}
                
                // can only close if not downloading
                onClose={() => setDownloadingState(prev => prev === DownloadingState.DOWNLOADING ? prev : DownloadingState.NONE)}
            />
            
            { charts == null &&
                <div className="absolute left-1/2 top-1/2 -translate-1/2">
                    <LoadingSpinner />
                </div>
            }
            
            
            { charts && charts.length == 0 &&
                <div className="absolute left-1/2 top-1/2 -translate-1/2 flex flex-col items-center justify-center">
                    <h3 className="text-ctp-flamingo font-mono mb-5"> [ No charts installed ] </h3>
                    <p> download some from the <ChartListingLink /> </p>
                    <p>
                        or
                        <MuseButton 
                            onClick={() => setPageParams([Page.NEW_CHART])}
                            className="text-ctp-mauve"
                        >
                            create your own
                        </MuseButton>
                    </p>
                </div>
            }
            
            { charts && charts.length != 0 &&
                <>
                    <ChartInfo metadata={activeChart} />
                    
                    { scoresVisible && activeChart ?
                        <Leaderboard 
                            chart={activeChart} 
                            onClose={() => setScoresVisible(false)} 
                        />
                        :
                        <ChartList
                            charts={charts}
                            activeChartId={activeChart?.id}
                            onEntryClick={handleEntryClick}
                            onEntryContextMenu={handleEntryContextMenu}
                        />
                    }
                    
                    <ActionsBar 
                        activeSongId={activeChart?.id}
                        play={play}
                        edit={edit}
                        deleteActiveChart={deleteActiveChart}
                        scoresVisible={scoresVisible}
                        setScoresVisible={setScoresVisible}
                    />
                </>
            }
        </div>
    )
}

type DownloadingModalProps = Readonly<{
    downloadingState: DownloadingState | Error
    onDownloadAnotherCopy: () => any
    onClose: () => any
}>
function DownloadingModal({ downloadingState, onDownloadAnotherCopy, onClose }: DownloadingModalProps) {
    return downloadingState != DownloadingState.NONE && (
        <Modal onClose={onClose}>
            <div className="flex flex-col p-2 gap-2 [&_button]:text-ctp-base">
                
                { downloadingState == DownloadingState.ALREADY_EXISTS &&
                    <>
                        <h2> This chart is already installed. </h2>
                        <div className="flex justify-center gap-2">
                            <MuseButton 
                                className='bg-ctp-red'
                                onClick={onClose}
                            > cancel </MuseButton>
                            <MuseButton 
                                className='bg-ctp-blue' 
                                onClick={onDownloadAnotherCopy}
                            > download another copy </MuseButton>
                        </div>
                    </>
                }
                
                { downloadingState == DownloadingState.DOWNLOADING && <LoadingSpinner /> }
                
                { downloadingState instanceof Error &&
                    <>
                        <h2 className='text-ctp-red! font-bold'> 
                            <TriangleAlert /> &nbsp; Download failed!
                        </h2>
                        <p className='text-ctp-red'> {downloadingState.message} </p>
                        <MuseButton 
                            className='bg-ctp-blue self-center' 
                            onClick={onClose}
                        > ok </MuseButton>
                    </>
                }
            </div>
        </Modal>
    )
}

function NavigationBar() {
    const [, setPageParams] = usePage();
    
    return (
        <nav className="absolute top-1 left-1 z-10 flex gap-3 text-ctp-mauve">
            <MuseButton onClick={() => setPageParams([Page.MAIN_MENU])}>
                <ArrowLeft /> quit
            </MuseButton>
            <MuseButton onClick={() => setPageParams([Page.NEW_CHART])}>
                <Plus /> new
            </MuseButton>
        </nav>
    )
}

enum ActionsState { DEFAULT, OPTIONS, DELETING, SCORES_VISIBLE }
type Props = Readonly<{
    activeSongId?: string
    play: () => any
    edit: () => any
    deleteActiveChart: () => any
    scoresVisible: boolean,
    setScoresVisible: (visible: boolean) => void
}>
function ActionsBar({ activeSongId, play, edit, deleteActiveChart, scoresVisible, setScoresVisible }: Props) {
    
    const [actionsState, setActionsState] = useState(ActionsState.DEFAULT);
    
    // close menu when active song changes
    useEffect(() => setActionsState(ActionsState.DEFAULT), [activeSongId]);
    
    useEffect(() => {
        setActionsState(scoresVisible ? ActionsState.SCORES_VISIBLE : ActionsState.DEFAULT);
    }, [scoresVisible]);
    
    return (
        <div className="
            absolute left-0 bottom-1/10 flex gap-1 ml-1 w-[35vw] z-10
            [&>*]:text-nowrap [&>*]:grow-1 [&>*]:py-0.5 [&>*]:px-3 text-ctp-base
            [&>*]:outline-[0.5vh] [&>*]:outline-ctp-base [&>button]:font-mono
        ">
            <MuseButton 
                onClick={() => setActionsState(actionsState == ActionsState.DEFAULT ? ActionsState.OPTIONS : ActionsState.DEFAULT)}
                className="bg-ctp-blue grow-0! px-0.5! "
            > 
                { actionsState == ActionsState.DEFAULT ? <EllipsisVertical /> : <XIcon /> }
            </MuseButton>
            
            { actionsState == ActionsState.DEFAULT &&
                <MuseButton onClick={play} className="bg-ctp-green"> 
                    [ play ] 
                </MuseButton>
            }
            { (actionsState == ActionsState.OPTIONS || actionsState == ActionsState.DELETING) &&
                <>
                    <MuseButton 
                        onClick={() => setActionsState(ActionsState.DELETING)}
                        className="bg-ctp-red grow-0!"
                    > 
                        [ delete ] 
                    </MuseButton>
                    <MuseButton 
                        onClick={() => setScoresVisible(true)}
                        className="bg-ctp-green grow-0!"
                    > 
                        [ scores ] 
                    </MuseButton>
                    <MuseButton onClick={edit} className="bg-ctp-blue"> 
                        [ edit ] 
                    </MuseButton>
                </>
            }
            { actionsState == ActionsState.SCORES_VISIBLE && 
                <MuseButton onClick={() => setScoresVisible(false)} className="bg-ctp-red">
                    [ close scores ]
                </MuseButton>
            }
            
            { actionsState == ActionsState.DELETING &&
                <Modal onClose={() => setActionsState(ActionsState.OPTIONS)}>
                    <div className="p-2 flex flex-col text-ctp-text">
                        <p> delete this chart? </p>
                        <p> this can't be undone! </p>
                        <div className="text-ctp-base flex gap-2 justify-center">
                            <MuseButton 
                                className="bg-ctp-blue"
                                onClick={() => setActionsState(ActionsState.OPTIONS)}
                            > cancel </MuseButton>
                            <MuseButton 
                                className="bg-ctp-red"
                                onClick={deleteActiveChart}
                            > delete </MuseButton>
                        </div>
                    </div>
                </Modal>
            }
        </div>
    )
}
