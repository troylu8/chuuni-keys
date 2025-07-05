import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { ChartMetadata } from "../../contexts/page";
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { copyFile, remove, writeFile } from '@tauri-apps/plugin-fs';
import { extname } from '@tauri-apps/api/path';
import { Bind, getChartFolder, SERVER_URL, USERDATA_DIR } from '../../lib/globals';
import MuseButton from '../../components/muse-button';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';


type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata, save?: boolean, imgCacheBust?: string) => void
    handleSave: () => Promise<void>
}>
export default function DetailsTab({ metadata, handleSave, setMetadata }: Props) {
    const chartFolder = getChartFolder(metadata);
    
    function bindMetadataText(field: keyof ChartMetadata): Bind<string> {
        return [
            metadata[field] as string | undefined ?? "", 
            (input: string) => {
                // set field as undefined if input is empty
                setMetadata({...metadata, [field]: input.length == 0 ? undefined : input});
            }
        ];
    }
    
    async function handleUploadImg() {
        const imgFilepath = await open({
            multiple: false,
            directory: false,
            title: "Select background image",
            filters: [{
                name: "Image",
                extensions: ["png", "jpg", "bmp", "webp", "avif"]
            }]
        });
        if (imgFilepath == null) return;
        
        
        const newImgExt = await extname(imgFilepath)
        const oldImgExt = metadata.img_ext;
        
        await copyFile(imgFilepath, `${chartFolder}\\img.${newImgExt}`);
        
        // delete old img if necessary (if same exts, then file will be overwritten so no need to delete)
        if (oldImgExt != newImgExt) {
            await remove(`${chartFolder}\\img.${oldImgExt}`);
        }
        
        setMetadata(
            { ...metadata, img_ext: newImgExt }, 
            true,                                   // save chart
            "" + Date.now()                         // image cache bust
        );
    }
    
    const [publishModalVisible, setPublishModalVisible] = useState(false);

    return (
        <div className="absolute cover flex justify-center items-center">
            <div className="w-fit bg-background p-3 rounded-md max-h-[70vh] overflow-auto">
                <div 
                    style={{
                        display: "grid",
                        gridTemplateColumns: "fit-content(100%) 1fr",
                    }} 
                    className="gap-3 px-3 pb-3 [&>label]:self-center"
                >
                    <label> title </label>
                    <TextInput 
                        bind={bindMetadataText("title")} 
                        valid={metadata.title != undefined} 
                        placeholder="title is required!"
                    />
                    
                    <label> image </label>
                    <button onClick={handleUploadImg}> [select] </button>
                    
                    <h2 style={{gridColumn: "1 / -1"}}> credits </h2>
                    <label> music </label>
                    <TextInput bind={bindMetadataText("credit_audio")} placeholder="who wrote the song?" />
                    <label> image </label>
                    <TextInput bind={bindMetadataText("credit_img")} placeholder="who made the background?" />
                    <label> chart </label>
                    <TextInput bind={bindMetadataText("credit_chart")}  placeholder="who mapped this chart?"/>
                    
                    <MuseButton 
                        className='self-center col-start-1 -col-end-1 mx-auto'
                        onClick={() => revealItemInDir(chartFolder)}> open chart folder 
                    </MuseButton>
                    
                    <MuseButton 
                        className='self-center col-start-1 -col-end-1 mx-auto'
                        onClick={() => setPublishModalVisible(true)}> publish to internet! 
                    </MuseButton>
                </div>
                
                { publishModalVisible && 
                    <PublishModal 
                        metadata={metadata} 
                        save={handleSave}
                        onClose={() => setPublishModalVisible(false)} 
                    /> 
                }
            </div>
        </div>
    );
}

type PublishPopupProps = Readonly<{
    metadata: ChartMetadata
    save: () => Promise<void>
    onClose: () => any
}>
function PublishModal({ metadata, save, onClose }: PublishPopupProps) {
    const chartFolder = getChartFolder(metadata);
    
    async function publish() {
        console.log("zipping..");
        const zipBytes = await invoke<number[]>("zip_chart", { 
            chartFolder, 
            audioExt: metadata.audio_ext,
            imgExt: metadata.img_ext
        });
        const zipBuffer = new Uint8Array(zipBytes);
        
        console.log("writing debug zip..");
        await writeFile(USERDATA_DIR + "\\test.zip", zipBuffer);
        
        console.log("making post req..");
        const resp = await fetch(`${SERVER_URL}/charts`, {method: "POST", body: zipBuffer});
        if (resp.ok) {
            const [id, deletion_key]: [string, string] = await resp.json();
            localStorage.setItem(id, deletion_key);
        }
    }
    
    return (
        <Modal title='publish your chart?' onClose={onClose}>
            <div className='flex flex-col gap-2 p-2 max-w-[300px]'>
                <p> 
                    it will be available for anyone to play at&nbsp;
                    <a className='text-color2' href='https://chuuni-keys.troylu.com/charts' target='_blank'>
                        chuuni-keys.troylu.com/charts
                    </a>
                </p>
                <div className="flex gap-2">
                    <MuseButton onClick={onClose}> cancel </MuseButton>
                    <MuseButton onClick={() => save().then(publish).then(onClose)}> publish! </MuseButton>
                </div>
            </div>
        </Modal>
    )
}