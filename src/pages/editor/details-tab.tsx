import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { openPath } from '@tauri-apps/plugin-opener';
import { copyFile, readTextFile, readTextFileLines, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import { extname, pictureDir } from '@tauri-apps/api/path';
import { Bind, ChartMetadata, Difficulty, getChartFolder, SERVER_URL, USERDATA_DIR } from '../../lib/lib';
import MuseButton from '../../components/muse-button';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

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
            <option value="medium"> medium </option>
            <option value="hard"> hard </option>
            <option value="fated"> fated </option>
        </select>
    )
}


type PublishPopupProps = Readonly<{
    metadata: ChartMetadata
    save: () => Promise<void>
    setOnlineId: (key: string | null) => any
}>
function PublishButton({ metadata, save, setOnlineId }: PublishPopupProps) {
    
    const [ownershipKey, setOwnershipKey] = useState<string | null>(null);
    useEffect(() => {
        if (metadata.online_id) getOwnershipKey(metadata.online_id).then(setOwnershipKey);
        else                    setOwnershipKey(null);
    }, [metadata.online_id]);
    
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    function closeModal() { setConfirmModalVisible(false); }
    
    // no need for workingChartFolder bc we always save() before publish()
    const chartFolder = getChartFolder(metadata);
    
    async function publish() {
        console.log("zipping..");
        const zipBytes = await invoke<number[]>("zip_chart", { 
            chartFolder, 
            audioExt: metadata.audio_ext,
            imgExt: metadata.img_ext
        });
        const zipBuffer = new Uint8Array(zipBytes);
        
        console.log("making post req..");
        const resp = await fetch(`${SERVER_URL}/charts`, {method: "POST", body: zipBuffer});
        if (resp.ok) {
            const [onlineId, ownershipKey]: [string, string] = await resp.json();
            await addOwnershipKey(onlineId, ownershipKey);
            setOnlineId(onlineId);
            setOwnershipKey(ownershipKey);
        }
    }
    
    async function unpublish() {
        if (!metadata.online_id) return console.error("tried to unpublish without an online_id");
        
        const resp = await fetch(`${SERVER_URL}/charts/${metadata.online_id}`, {method: "DELETE", body: ownershipKey});
        if (resp.ok) {
            await deleteOwnershipKey(metadata.online_id);
            setOnlineId(null);
            setOwnershipKey(null);
        }
    }
    
    
    if (metadata.online_id != null && ownershipKey == null) {
        return <p> you don't have permission to publish this map </p>
    }
    
    return (
        <>
            <MuseButton
                className='self-center col-start-1 -col-end-1 mx-auto'
                onClick={() => setConfirmModalVisible(true)}
            > 
                { ownershipKey == null ? "publish to internet!" : "unpublish" }
            </MuseButton>
            
            { confirmModalVisible &&
                <Modal title='publish your chart?' onClose={closeModal}>
                    <div className='flex flex-col gap-2 p-2 max-w-[300px]'>
                        <p> 
                            { ownershipKey == null ? 
                                "it will be available for anyone to play at&nbsp;"
                                :
                                <span className='text-error'>it will be taken down from&nbsp;</span>
                            }
                            <a className='text-color2' href='https://chuuni-keys.troylu.com/charts' target='_blank'>
                                chuuni-keys.troylu.com/charts
                            </a>
                        </p>
                        <div className="flex gap-2">
                            <MuseButton onClick={closeModal}> cancel </MuseButton>
                            { ownershipKey == null ?
                                <MuseButton 
                                    className='bg-color1!'
                                    onClick={() => save().then(publish).then(closeModal)}
                                > 
                                    publish! 
                                </MuseButton>
                                :
                                <MuseButton 
                                    className='bg-error!'
                                    onClick={() => save().then(unpublish).then(closeModal)}
                                > 
                                    unpublish 
                                </MuseButton>
                            }
                        </div>
                    </div>
                </Modal>
            }
        </>
    )
}