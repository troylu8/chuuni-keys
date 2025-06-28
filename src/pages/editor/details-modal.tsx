import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { ChartMetadata } from "../../providers/page";
import { openPath } from '@tauri-apps/plugin-opener';
import { copyFile, remove } from '@tauri-apps/plugin-fs';
import { extname } from '@tauri-apps/api/path';
import { getChartFolder } from '../../lib/globals';
import MuseButton from '../../components/muse-button';



type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata, save?: boolean, imgCacheBust?: string) => void
    onClose: () => void
}>
export default function DetailsModal({ metadata, setMetadata, onClose }: Props) {
    const chartFolder = getChartFolder(metadata);
    
    function bindMetadataText(field: keyof ChartMetadata): [string, (txt: string) => any] {
        return [
            metadata[field] as string | undefined ?? "", 
            (input: string) => {
                // set field as undefined if input is empty
                setMetadata({...metadata, [field]: input.length == 0 ? undefined : input});
            }
        ];
    }
    
    function handleClose() {
        if (metadata.title != undefined) onClose();
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
    
    function handlePublish() {
        //TODO
    }
    

    return (
        <Modal title="details" onClose={handleClose}>
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
                    onClick={() => openPath(chartFolder)}> open chart folder 
                </MuseButton>
                
                <MuseButton 
                    className='self-center col-start-1 -col-end-1 mx-auto'
                    onClick={handlePublish}> publish to internet! 
                </MuseButton>
                
            </div>
        </Modal>
    );
}
