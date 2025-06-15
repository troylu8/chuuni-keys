import { open } from '@tauri-apps/plugin-dialog';
import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { ChartMetadata } from "../../providers/page";


type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata) => void
    onClose: () => void
}>
export default function DetailsModal({ metadata, setMetadata, onClose }: Props) {
    
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

    return (
        <Modal title="details" onClose={handleClose}>
            <div className="min-w-[300px] flex flex-col gap-3">
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "fit-content(100%) 1fr",
                }} className="gap-3">
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
                </div>
                
            </div>
        </Modal>
    );
}
