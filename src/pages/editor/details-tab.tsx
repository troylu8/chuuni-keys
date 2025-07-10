import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { openPath } from '@tauri-apps/plugin-opener';
import { copyFile, readTextFile, readTextFileLines, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { extname, pictureDir } from '@tauri-apps/api/path';
import { Bind, ChartMetadata, Difficulty,  OWNER_KEY,  SERVER_URL, USERDATA_DIR } from '../../lib/lib';
import MuseButton from '../../components/muse-button';
import { useEffect, useState } from 'react';
import { publish, unpublish } from '../../lib/publish';
import bcrypt from 'bcryptjs';

async function getOwnershipKey(onlineId: string) {
    if (onlineId) {
        const lines = await readTextFileLines(USERDATA_DIR + "\\ownership_keys.csv");
        for await (const line of lines) {
            if (line.startsWith(onlineId)) 
                return line.substring(line.indexOf(",") + 1);
        }
    }
    
    return null;
}

async function addOwnershipKey(onlineId: string, key: string) {
    await writeTextFile(USERDATA_DIR + "\\ownership_keys.csv", onlineId + "," + key, { append: true });
}

async function deleteOwnershipKey(onlineId: string) {
    const data = await readTextFile(USERDATA_DIR + "\\ownership_keys.csv");
    await writeTextFile(
        USERDATA_DIR + "\\ownership_keys.csv",
        data.split("\n").filter(line => !line.startsWith(onlineId)).join("\n")
    );
}

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
    
    async function handleUploadImg() {
        await handleSave();
        
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
        if (oldImgExt != null && oldImgExt != newImgExt) {
            await remove(`${workingChartFolderRef.current}\\img.${oldImgExt}`);
        }
        
        setMetadata(
            { ...metadata, img_ext: newImgExt }, 
            true,                                   // save chart
            "" + Date.now()                         // image cache bust
        );
    }
    
    return (
        <div className="absolute cover flex justify-center items-center">
            <div className="w-fit bg-background p-3 rounded-md max-h-[70vh] overflow-auto">
                <div 
                    style={{
                        display: "grid",
                        gridTemplateColumns: "fit-content(100%) 1fr",
                    }} 
                    className="gap-3 px-3 pb-3 [&>span]:self-center"
                >
                    <span> title </span>
                    <TextInput bind={bindMetadata("title")} placeholder="enter a title.."/>
                    
                    <span> difficulty </span>
                    <DifficultyDropdown bind={bindMetadata("difficulty")} />
                    
                    <span> image </span>
                    <button onClick={handleUploadImg}> [select] </button>
                    
                    <h2 style={{gridColumn: "1 / -1"}}> credits </h2>
                    <span> music </span>
                    <TextInput bind={bindMetadataOptional("credit_audio")} placeholder="who wrote the song?" />
                    <span> image </span>
                    <TextInput bind={bindMetadataOptional("credit_img")} placeholder="who made the background?" />
                    <span> chart </span>
                    <TextInput bind={bindMetadataOptional("credit_chart")}  placeholder="who mapped this chart?"/>
                    
                    <MuseButton 
                        className='self-center col-start-1 -col-end-1 mx-auto'
                        onClick={() => openPath(workingChartFolderRef.current)}
                    > 
                        open chart folder 
                    </MuseButton>
                    
                    <PublishButton 
                        metadata={metadata} 
                        save={handleSave}
                        setOnlineId={id => setMetadata({...metadata, online_id: id ?? undefined}, true)}
                    />
                </div>
            </div>
        </div>
    );
}

function DifficultyDropdown({ bind: [value, setter] }: { bind: Bind<Difficulty> }) {
    return (
        <select value={value} onChange={e => setter(e.target.value as Difficulty)}>
            <option value="easy"> easy </option>
            <option value="normal"> normal </option>
            <option value="hard"> hard </option>
            <option value="fated"> fated </option>
        </select>
    )
}

enum PublishState { LOCAL, PUBLISHED, NOT_OWNED, UNSURE };

type PublishPopupProps = Readonly<{
    metadata: ChartMetadata
    save: () => Promise<void>
    setOnlineId: (key: string | null) => any
}>
function PublishButton({ metadata, save, setOnlineId }: PublishPopupProps) {
    
    const [publishState, setPublishState] = useState(PublishState.UNSURE);
    useEffect(() => {
        if (!metadata.owner_hash) setPublishState(PublishState.LOCAL);
        else {
            bcrypt.compare(OWNER_KEY, metadata.owner_hash)
            .then(matches => 
                setPublishState(matches ? PublishState.PUBLISHED : PublishState.NOT_OWNED)
            );
        }
    }, [metadata.owner_hash]);
    
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    
    async function publishChart() {
        await save();
        const [status, onlineId] = await publish(metadata);
        if (status == 200) setOnlineId(onlineId!);
    }
    
    async function updateChart() {
        await save();
    }
    
    async function unpublishChart() {
        const status = await unpublish(metadata.online_id!);
        if (status == 200) setOnlineId(null);
        else {
            // TODO on err
        }
    }
    
    
    if (publishState == PublishState.UNSURE) {
        return <p> ... </p>
    }
    
    if (publishState == PublishState.NOT_OWNED) {
        return <p> you don't have permission to publish this map </p>
    }
    
    return (
        <>
            <MuseButton
                className='self-center col-start-1 -col-end-1 mx-auto'
                onClick={() => setConfirmModalVisible(true)}
            > 
                { publishState == PublishState.LOCAL ? "publish to internet!" : "unpublish" }
            </MuseButton>
            
            { publishState == PublishState.LOCAL &&
                <ConfirmModal 
                    action={publishChart}
                    onClose={() => setConfirmModalVisible(false)}
                    prompt='publish chart?'
                    loadingLabel='uploading your chart to the net..'
                    successLabel='chart published successfully!'
                />
            }
            
            { publishState == PublishState.PUBLISHED &&
                <ConfirmModal 
                    action={publishChart}
                    onClose={() => setConfirmModalVisible(false)}
                    prompt='publish chart?'
                    loadingLabel='uploading your chart to the net..'
                    successLabel='chart published successfully!'
                />
            }
        </>
    )
}



enum ActionState { NOT_STARTED, LOADING, SUCCESS }

type ConfirmModalProps = Readonly<{
    prompt: string
    loadingLabel: string
    successLabel: string,
    onClose: () => any
    action: () => Promise<void>
}>
function ConfirmModal({ prompt, loadingLabel, successLabel, onClose, action }: ConfirmModalProps) {
    
    const [actionState, setActionState] = useState<ActionState | string>(ActionState.NOT_STARTED);
    
    function handleStartAction() {
        setActionState(ActionState.LOADING);
        
        action()
            .then(() => setActionState(ActionState.SUCCESS))
            .catch(reason => setActionState(reason))
    }
    
    return (
        <Modal onClose={onClose}>
            <div className='flex flex-col gap-2 p-2 max-w-[300px]'>
                { 
                    actionState == ActionState.NOT_STARTED ?
                    <>
                        { prompt }
                        <div className="flex gap-2">
                            <MuseButton onClick={onClose}> cancel </MuseButton>
                            <MuseButton onClick={handleStartAction}> yes </MuseButton>
                        </div>
                    </>
                    :
                    actionState == ActionState.LOADING ?
                    <>
                        { loadingLabel } 
                        {/* TODO */}
                        <p> loading spinner here </p> 
                    </>
                    :
                    actionState == ActionState.SUCCESS ?
                    <>
                        { successLabel }
                        <MuseButton onClick={onClose}> ok </MuseButton>
                    </>
                    :
                    <>
                        <p className='text-error'> {actionState} </p>
                        <MuseButton onClick={onClose}> ok </MuseButton>
                    </>
                }  
            </div>
        </Modal>
    )
}