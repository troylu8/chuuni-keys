import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { ChartMetadata } from "../../providers/page";
import { openPath } from '@tauri-apps/plugin-opener';


type Props = Readonly<{
    songFolder: string,
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata) => void
    onClose: () => void
}>
export default function DetailsModal({ songFolder, metadata, setMetadata, onClose }: Props) {
    
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
        const filepath = await open({
            multiple: false,
            directory: false,
            title: "Select background image",
        });
    }
    
    async function handleOpenSongFolder() {
        await openPath(songFolder)
    }

    return (
        <Modal title="details" onClose={handleClose}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "fit-content(100%) 1fr",
            }} className="gap-3 min-w-[300px]">
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
                
                <button
                    style={{gridColumn: "1 / -1"}} 
                    onClick={handleOpenSongFolder}
                > open song folder </button>
            </div>
        </Modal>
    );
}
