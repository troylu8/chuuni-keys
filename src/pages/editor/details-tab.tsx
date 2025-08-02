import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { openPath } from '@tauri-apps/plugin-opener';
import { copyFile, remove } from '@tauri-apps/plugin-fs';
import { extname, join, pictureDir } from '@tauri-apps/api/path';
import { Bind, ChartMetadata, Difficulty,  OWNER_KEY } from '../../lib/lib';
import MuseButton from '../../components/muse-button';
import { useEffect, useRef, useState } from 'react';
import { publishChart, unpublishChart, updateChart } from '../../lib/chart-listing';
import bcrypt from 'bcryptjs';
import { ChevronDown, FolderOpen, Globe, Image, Keyboard, Music, RefreshCcw, Trash2, TriangleAlert, Upload } from 'lucide-react';
import ChartListingLink from '../../components/chart-listing-link';
import LoadingSpinner from '../../components/loading-spinner';


type Props = Readonly<{
    metadata: ChartMetadata
    
    // if metadata changed but havent handleSave()'d, then the 
    // working chart folder will be different than getChartFolder(metadata)
    workingChartFolderRef: {current: string} 
    
    setMetadata: (metadata: ChartMetadata, save?: boolean, imgCacheBust?: string) => void
    handleSave: () => Promise<void>
    saved: boolean
}>
export default function DetailsTab({ metadata, workingChartFolderRef, setMetadata, handleSave, saved }: Props) {

    function bindMetadata<K extends keyof ChartMetadata>(field: K): Bind<ChartMetadata[K]> {
        return [
            metadata[field], 
            input => setMetadata({...metadata, [field]: input})
        ];
    }
    function bindMetadataOptional(field: keyof ChartMetadata): Bind<string> {
        return [
            metadata[field] as string ?? "", 
            input => {
                // set field as undefined if input is empty
                setMetadata({...metadata, [field]: input.length == 0 ? undefined : input});
            }
        ];
    }
    
    return (
        <div className='absolute top-5 bottom-0 left-0 right-0 flex justify-center overflow-auto'>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "fit-content(100%) 1fr",
                    alignItems: "center"
                }} 
                className="
                    w-[700px] max-w-[70vw]
                    h-fit gap-3 px-3 pb-20
                    [&>span]:self-center [&>span]:text-ctp-blue
                    [&_button]:text-ctp-base
                    [&>h2]:col-start-1 [&>h2]:-col-end-1 [&>h2]:text-[1.5em] mt-4
                "
            >
                <span> title </span>
                <TextInput bind={bindMetadata("title")} placeholder="enter a title.."/>
                
                <span> difficulty </span>
                <DifficultyDropdown bind={bindMetadata("difficulty")} />
                
                <span> image </span>
                <ImagePicker
                    metadata={metadata}
                    setMetadata={setMetadata}
                    workingChartFolderRef={workingChartFolderRef} 
                />
                
                <h2> credits </h2>
                <span> <Music /> &nbsp; music </span>
                <TextInput bind={bindMetadataOptional("credit_audio")} placeholder="who wrote the song?" />
                <span> <Image /> &nbsp; image </span>
                <TextInput bind={bindMetadataOptional("credit_img")} placeholder="who made the background?" />
                <span> <Keyboard /> &nbsp; chart </span>
                <TextInput bind={bindMetadataOptional("credit_chart")}  placeholder="who created this chart?"/>
                
                <h2> publish </h2>
                <div className='
                    col-start-1 -col-end-1
                    flex flex-col items-center gap-3
                '>
                    <PublishOptions 
                        chart={metadata}
                        saved={saved}
                        handleSave={handleSave}
                        updatePublishInfo={info => setMetadata({
                            ...metadata, 
                            online_id: info.online_id,
                            owner_hash: info.owner_hash
                        }, true)}
                    />
                </div>
            </div>
        </div>
    );
}

type ImagePickerProps = Readonly<{
    workingChartFolderRef: {current: string} 
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata, save?: boolean, imgCacheBust?: string) => void
}>
function ImagePicker({ workingChartFolderRef, metadata, setMetadata }: ImagePickerProps) {
    
    async function handleUploadImg() {
        
        const imgFilepath = await open({
            multiple: false,
            directory: false,
            title: "Select background image",
            filters: [{
                name: "Image",
                extensions: ["png", "jpg", "bmp", "webp", "avif", "jpeg"]
            }],
            defaultPath: await pictureDir()
        });
        if (imgFilepath == null) return;
        
        
        const newImgExt = await extname(imgFilepath)
        const oldImgExt = metadata.img_ext;
        
        await copyFile(imgFilepath, `${workingChartFolderRef.current}/img.${newImgExt}`);
        
        // delete old img if necessary (if same exts, then file will be overwritten so no need to delete)
        if (oldImgExt != undefined && oldImgExt != newImgExt) {
            await remove(`${workingChartFolderRef.current}/img.${oldImgExt}`);
        }
        setMetadata(
            { ...metadata, img_ext: newImgExt }, 
            true,                                   // save chart
            "" + Date.now()                         // image cache bust
        );
    }
    
    async function handleClearImg() {
        if (!metadata.img_ext) return;
        
        await remove(`${workingChartFolderRef.current}/img.${metadata.img_ext}`);
        setMetadata({...metadata, img_ext: undefined}, true);
        setConfirmVisible(false);
    }
    
    const [confirmVisible, setConfirmVisible] = useState(false);
    
    return (
        <div className='flex gap-5 [&>button]:text-ctp-base'>
            <MuseButton 
                className='bg-ctp-blue px-5 py-0.5'
                onClick={handleUploadImg}
            > <Upload /> &nbsp; upload </MuseButton>
            
            { metadata.img_ext != undefined &&
                <MuseButton 
                    className='bg-ctp-red '
                    onClick={() => setConfirmVisible(true)}
                > <Trash2 /> </MuseButton>
            }
            
            <MuseButton 
                className='col-start-1 -col-end-1 ml-auto bg-ctp-mauve'
                
                // use `join()` to resolve the path with the proper delimiters before opening
                onClick={() => join(workingChartFolderRef.current).then(openPath)}
            > 
                <FolderOpen /> &nbsp; open chart folder 
            </MuseButton>
            
            { confirmVisible &&
                <Modal onClose={() => setConfirmVisible(false)}>
                    <div className='p-2 [&>button]:text-ctp-base'>
                        <p> clear current background image? </p>
                        <div className='flex justify-center gap-5 mt-3'>
                            <MuseButton 
                                onClick={() => setConfirmVisible(false)}
                                className='bg-ctp-blue'
                            >
                                cancel
                            </MuseButton>
                            <MuseButton 
                                onClick={handleClearImg}
                                className='bg-ctp-red'
                            >
                                yes
                            </MuseButton>
                        </div>
                    </div>
                </Modal>
            }
        </div>
    )
}

function DifficultyDropdown({ bind: [value, setter] }: { bind: Bind<Difficulty> }) {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    
    return (
        <div
            onClick={() => setDropdownVisible(!dropdownVisible)}
            onMouseLeave={() => setDropdownVisible(false)}
            className="border-2 relative cursor-pointer rounded-sm px-1 w-30 text-center h-fit"
            style={{
                color: `var(--${value})`,
                display: "grid",
                gridTemplateColumns: "1fr fit-content(100%)"
            }}
        > 
            {value}
            
            <ChevronDown/>
            
            {/* dropdown panel */}
            { dropdownVisible && 
                <div className='absolute left-0 right-0 top-full border-2 border-ctp-mauve rounded-sm'>
                    {["easy", "normal", "hard", "fated"].map(diff => 
                        <p 
                            key={diff}
                            style={{"--diff-color": `var(--${diff})`} as React.CSSProperties} 
                            className="difficulty-dropdown-option"
                            onClick={e => {
                                e.stopPropagation();
                                setter(diff as Difficulty);
                                setDropdownVisible(false);
                            }}
                        > {diff} </p>
                    )}
                </div>
            }
        </div>
    )
}

enum PublishState { LOCAL, PUBLISHED, UNSYNCED, NOT_OWNED, UNSURE };

type PublishOptionsProps = Readonly<{
    saved: boolean
    chart: ChartMetadata
    handleSave: () => Promise<void>
    updatePublishInfo: (publishInfo: { online_id?: string, owner_hash?: string }) => any
}>
function PublishOptions({ saved, chart, handleSave, updatePublishInfo }: PublishOptionsProps) {
    
    const [publishState, setPublishState] = useState(PublishState.UNSURE);
    
    // decide publish state
    useEffect(() => {
        if (!chart.owner_hash) setPublishState(PublishState.LOCAL);
        else {
            // do intensive bcrypt work later
            setTimeout(() => {
                const ownedByMe = bcrypt.compareSync(OWNER_KEY, chart.owner_hash!);
                if (ownedByMe) {
                    const markedAsUnsynced = localStorage.getItem("unsynced." + chart.id) != null;
                    if (markedAsUnsynced)   setPublishState(PublishState.UNSYNCED);
                    else                    setPublishState(PublishState.PUBLISHED);
                }
                else setPublishState(PublishState.NOT_OWNED);
            }, 0);
        }
    }, [chart.owner_hash]);
    
    useEffect(() => {
        
        // if state changed to UNSYNCED, mark in localstorage
        if (publishState == PublishState.UNSYNCED)  
            localStorage.setItem("unsynced." + chart.id, "");
        
        // if state changed to PUBLISHED, remove localstorage mark
        else if (publishState == PublishState.PUBLISHED) 
            localStorage.removeItem("unsynced." + chart.id);
        
    }, [publishState]);
    
    
    const prevSavedRef = useRef<boolean | null>(null);
    useEffect(() => {
        
        // if going from unsaved -> saved while PUBLISHED, its now UNSYNCED
        if (prevSavedRef.current === false && saved === true) {
            setPublishState(prev => prev == PublishState.PUBLISHED ? PublishState.UNSYNCED : prev);
        }
        
        prevSavedRef.current = saved;
    }, [saved]);
    
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    
    return (
        <>
            { successMsg != null && 
                <Modal onClose={() => setSuccessMsg(null)}>
                    <div className='p-2 flex flex-col gap-2'>
                        <p> { successMsg } </p>
                        <MuseButton 
                            className='bg-ctp-blue text-ctp-base mx-auto' 
                            onClick={() => setSuccessMsg(null)}
                        > ok </MuseButton>
                    </div>
                </Modal>
            }
            
            { publishState == PublishState.UNSURE && <p> ... </p>}
            { publishState == PublishState.NOT_OWNED && 
                <>
                    <p> This chart was downloaded from the <ChartListingLink label="public chart listing" />. </p>
                    <p> You are free to make edits, but they will not affect the public copy. </p>   
                </>
            }
            { publishState == PublishState.LOCAL && 
                <>
                    <p> This chart is local to your device </p>
                    <ActionButtonAndModal
                        buttonLabel={<> <Globe /> &nbsp; publish! </>}
                        buttonClassName='bg-ctp-green'
                        prompt={<p> Upload this chart to the <ChartListingLink label="public chart listing" />? </p>}
                        onSuccess={() => setSuccessMsg('Chart published!')}
                        action={() => handleSave().then(() => publishChart(chart)).then(updatePublishInfo)}
                    />
                </>
            }
            { (publishState == PublishState.PUBLISHED || publishState == PublishState.UNSYNCED) &&
                <>
                    { publishState == PublishState.PUBLISHED ?
                        <p> This chart is published on the <ChartListingLink />. </p>
                        :
                        <p> An outdated version of this chart is published on the <ChartListingLink />. </p>
                    }
                    
                    <div className="flex gap-3 ">
                        { publishState == PublishState.UNSYNCED &&
                            <ActionButtonAndModal
                                buttonLabel={<> <RefreshCcw /> &nbsp; sync changes </>}
                                buttonClassName='bg-ctp-yellow'
                                prompt={<p> Push latest changes to the <ChartListingLink />? </p>}
                                onSuccess={() => setSuccessMsg('Chart updated!')}
                                action={async () => {
                                    await handleSave();
                                    await updateChart(chart);
                                    setPublishState(PublishState.PUBLISHED);
                                }}
                            />
                        }
                        <ActionButtonAndModal
                            buttonLabel='take down'
                            buttonClassName='bg-ctp-red'
                            prompt={
                                <p> 
                                    Delete this chart from the <ChartListingLink />? <br/> 
                                    It will remain available on your device.
                                </p>
                            }
                            onSuccess={() => setSuccessMsg('Chart taken down!')}
                            action={async () => {
                                await unpublishChart(chart);
                                updatePublishInfo({});  // remove publish info
                            }}
                        />
                    </div>
                </>
            }
        </>
    )
}



enum ActionState { MODAL_CLOSED, CONFIRMING, LOADING }

type ActionButtonAndModalProps = Readonly<{
    buttonLabel: React.ReactNode,
    buttonClassName: string,
    prompt: React.ReactNode
    action: () => Promise<void>
    onSuccess: () => any
}>
function ActionButtonAndModal({ buttonLabel, buttonClassName, prompt, action, onSuccess }: ActionButtonAndModalProps) {
    
    const [actionState, setActionState] = useState<ActionState | Error>(ActionState.MODAL_CLOSED);
    
    function handleStartAction() {
        setActionState(ActionState.LOADING);
        
        action()
            .then(() => {
                onSuccess();
                setActionState(ActionState.MODAL_CLOSED);
            })
            .catch(reason => setActionState(reason))
    }
    
    function handleClose() {
        if (actionState != ActionState.LOADING) {
            setActionState(ActionState.MODAL_CLOSED);
        }
    }
    
    return (
        <>
            <MuseButton
                className={`text-ctp-base ${buttonClassName}`}
                onClick={() => setActionState(ActionState.CONFIRMING)}
            > 
                { buttonLabel }
            </MuseButton>
            
            { actionState != ActionState.MODAL_CLOSED &&
                <Modal onClose={handleClose}>
                    <div className='flex flex-col gap-2 p-2 max-w-[300px] [&_button]:text-ctp-base'>
                        { 
                            actionState == ActionState.CONFIRMING ?
                            <>
                                { prompt }
                                <div className="flex gap-3">
                                    <MuseButton 
                                        className='bg-ctp-red'
                                        onClick={() => setActionState(ActionState.MODAL_CLOSED)}
                                    > cancel </MuseButton>
                                    <MuseButton 
                                        className='bg-ctp-blue'
                                        onClick={handleStartAction}
                                    > yes </MuseButton>
                                </div>
                            </>
                            :
                            actionState == ActionState.LOADING ?
                            <>
                                <div className='mx-auto'>
                                    <LoadingSpinner />
                                </div>
                            </>
                            :
                            <>
                                <h2 className='text-ctp-red! font-bold'> 
                                    <TriangleAlert /> &nbsp; Upload failed!
                                </h2>
                                <p className='text-ctp-red'> {actionState + ""} </p>
                                <MuseButton 
                                    className='bg-ctp-blue self-center' 
                                    onClick={handleClose}
                                > ok </MuseButton>
                            </>
                        }  
                    </div>
                </Modal>
            }
        </>
    )
}