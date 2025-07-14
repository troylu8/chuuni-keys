import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { openPath } from '@tauri-apps/plugin-opener';
import { copyFile, remove } from '@tauri-apps/plugin-fs';
import { extname, pictureDir } from '@tauri-apps/api/path';
import { Bind, ChartMetadata, Difficulty,  OWNER_KEY } from '../../lib/lib';
import MuseButton from '../../components/muse-button';
import { useEffect, useState } from 'react';
import { publishChart, unpublishChart, updateChart } from '../../lib/publish';
import bcrypt from 'bcryptjs';
import { ChevronDown, FolderOpen, Globe, Image, Keyboard, Music, RefreshCcw, Trash2, TriangleAlert, Upload } from 'lucide-react';
import ExternalUrl from '../../components/external-url';
import LoadingSpinner from '../../components/loading-spinner';


type Props = Readonly<{
    metadata: ChartMetadata
    
    // if metadata changed but havent handleSave()'d, then the 
    // working chart folder will be different than getChartFolder(metadata)
    workingChartFolderRef: {current: string} 
    
    setMetadata: (metadata: ChartMetadata, save?: boolean, imgCacheBust?: string) => void
    handleSave: () => Promise<void>
}>
export default function DetailsTab({ metadata, workingChartFolderRef, handleSave, setMetadata }: Props) {

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
        <div className='absolute top-5 bottom-0 left-0 right-0 flex justify-center'>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "fit-content(100%) 1fr",
                    alignItems: "center"
                }} 
                className="
                    w-[700px] max-w-[70vw]
                    overflow-auto gap-3 px-3 pb-20
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
                
                <MuseButton 
                    className='col-start-1 -col-end-1 mx-auto bg-ctp-mauve'
                    onClick={() => openPath(workingChartFolderRef.current)}
                > 
                    <FolderOpen /> &nbsp; open chart folder 
                </MuseButton>
                
                <h2> online </h2>
                <div className='col-start-1 -col-end-1 mx-auto'>
                    <PublishOptions 
                        chart={metadata} 
                        save={handleSave}
                        updatePublishInfo={publishInfo => setMetadata({...metadata, ...publishInfo}, true)}
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
                extensions: ["png", "jpg", "bmp", "webp", "avif"]
            }],
            defaultPath: await pictureDir()
        });
        if (imgFilepath == null) return;
        
        
        const newImgExt = await extname(imgFilepath)
        const oldImgExt = metadata.img_ext;
        
        await copyFile(imgFilepath, `${workingChartFolderRef.current}\\img.${newImgExt}`);
        
        // delete old img if necessary (if same exts, then file will be overwritten so no need to delete)
        if (oldImgExt != undefined && oldImgExt != newImgExt) {
            await remove(`${workingChartFolderRef.current}\\img.${oldImgExt}`);
        }
        setMetadata(
            { ...metadata, img_ext: newImgExt }, 
            true,                                   // save chart
            "" + Date.now()                         // image cache bust
        );
    }
    
    async function handleClearImg() {
        if (!metadata.img_ext) return;
        
        await remove(`${workingChartFolderRef.current}\\img.${metadata.img_ext}`);
        setMetadata({...metadata, img_ext: undefined}, true);
    }
    
    const [confirmVisible, setConfirmVisible] = useState(false);
    
    return (
        <div className='flex gap-5'>
            <MuseButton 
                className='bg-ctp-blue text-ctp-base px-5 py-0.5'
                onClick={handleUploadImg}
            > <Upload /> &nbsp; upload </MuseButton>
            <MuseButton 
                className='bg-ctp-red text-ctp-base'
                onClick={() => setConfirmVisible(true)}
            > <Trash2 /> </MuseButton>
            
            { confirmVisible &&
                <Modal onClose={() => setConfirmVisible(false)}>
                    <div className='p-2'>
                        <p> clear current background image? </p>
                        <div className='flex justify-center gap-5 mt-3'>
                            <MuseButton 
                                onClick={() => setConfirmVisible(false)}
                                className='bg-ctp-blue outline-btn'
                            >
                                cancel
                            </MuseButton>
                            <MuseButton 
                                onClick={handleClearImg}
                                className='bg-ctp-red outline-btn'
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

enum PublishState { LOCAL, PUBLISHED, NOT_OWNED, UNSURE };

type PublishOptionsProps = Readonly<{
    chart: ChartMetadata
    save: () => Promise<void>
    updatePublishInfo: (publishInfo: { online_id?: string, owner_hash?: string }) => any
}>
function PublishOptions({ chart, save, updatePublishInfo }: PublishOptionsProps) {
    
    const [publishState, setPublishState] = useState(PublishState.UNSURE);
    useEffect(() => {
        if (!chart.owner_hash) setPublishState(PublishState.LOCAL);
        else {
            bcrypt.compare(OWNER_KEY, chart.owner_hash)
            .then(matches => 
                setPublishState(matches ? PublishState.PUBLISHED : PublishState.NOT_OWNED)
            );
        }
    }, [chart.owner_hash]);
    
    const unsynced = localStorage.getItem("unsynced." + chart.id) != null;
    
    return (
        <>
            { publishState == PublishState.UNSURE &&
                <MuseButton className='self-center col-start-1 -col-end-1 bg-ctp-base'> 
                    ...
                </MuseButton>
            }
            { publishState == PublishState.NOT_OWNED && 
                <p>you don't have permission to publish this map</p>
                <MuseButton className='self-center col-start-1 -col-end-1 bg-ctp-base'> 
                    
                </MuseButton>
            }
            
            { publishState == PublishState.LOCAL &&
                <ActionButtonAndModal
                    buttonLabel={<> <Globe /> &nbsp; publish! </>}
                    buttonClassName='bg-ctp-green'
                    prompt={<p> Upload this chart to the <br /> <ExternalUrl url="https://www.example.com/" label="public chart listing" />? </p>}
                    successLabel='chart published!'
                    action={() => save().then(() => publishChart(chart)).then(updatePublishInfo)}
                />
            }
            
            { publishState == PublishState.PUBLISHED &&
                <div className="flex gap-3 ">
                    { unsynced &&
                        <ActionButtonAndModal
                            buttonLabel={<> <RefreshCcw /> &nbsp; update this chart </>}
                            buttonClassName='bg-ctp-yellow'
                            prompt="update this chart?"
                            successLabel='chart updated!'
                            action={
                                () => save().then(() => updateChart(chart))
                                .then(() => localStorage.removeItem("unsynced." + chart.id)) // mark as synced
                            }
                        />
                    }
                    <ActionButtonAndModal
                        buttonLabel='take down'
                        buttonClassName='bg-ctp-red'
                        prompt="take down this chart?"
                        successLabel='chart taken down!'
                        action={() => save().then(() => unpublishChart(chart)).then(() => updatePublishInfo({}))} // remove publish info afterwards
                    />
                </div>
            }
            
        </>
    )
}



enum ActionState { MODAL_CLOSED, CONFIRMING, LOADING, SUCCESS }

type ActionButtonAndModalProps = Readonly<{
    buttonLabel: React.ReactNode,
    buttonClassName: string,
    prompt: React.ReactNode
    successLabel: string,
    action: () => Promise<void>
}>
function ActionButtonAndModal({ buttonLabel, buttonClassName, prompt, successLabel, action }: ActionButtonAndModalProps) {
    
    const [actionState, setActionState] = useState<ActionState | Error>(ActionState.MODAL_CLOSED);
    
    function handleStartAction() {
        setActionState(ActionState.LOADING);
        
        action()
            .then(() => setActionState(ActionState.SUCCESS))
            .catch(reason => setActionState(reason))
    }
    
    function handleClickOutside() {
        if (actionState != ActionState.LOADING)
            setActionState(ActionState.MODAL_CLOSED)
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
                <Modal onClose={handleClickOutside}>
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
                            actionState == ActionState.SUCCESS ?
                            <>
                                { successLabel }
                                <MuseButton 
                                    className='bg-ctp-blue' 
                                    onClick={() => setActionState(ActionState.MODAL_CLOSED)}
                                > ok </MuseButton>
                            </>
                            :
                            <>
                                <h2 className='text-ctp-red! font-bold'> 
                                    <TriangleAlert /> &nbsp; Upload failed!
                                </h2>
                                <p className='text-ctp-red'> {actionState + ""} </p>
                                <MuseButton 
                                    className='bg-ctp-blue self-center' 
                                    onClick={() => setActionState(ActionState.MODAL_CLOSED)}
                                > ok </MuseButton>
                            </>
                        }  
                    </div>
                </Modal>
            }
        </>
    )
}