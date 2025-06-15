import Modal from "../../components/modal";
import TextInput from "../../components/text-input";
import { ChartMetadata } from "../../providers/page";


type Props = Readonly<{
    metadata: ChartMetadata
    setMetadata: (metadata: ChartMetadata) => void
    onClose: () => void
}>
export default function DetailsModal({ metadata, setMetadata, onClose }: Props) {

    return (
        <Modal title="details" onClose={onClose}>
            details
        </Modal>
    );
}