import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, QrCode } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import logo from '@/assets/logo-removed.png';

interface ListingQRCodeProps {
    listingId: string;
    productName: string;
}

export const ListingQRCode = ({ listingId, productName }: ListingQRCodeProps) => {
    const qrRef = useRef<HTMLCanvasElement>(null);
    const listingUrl = `${window.location.origin}/listings?id=${listingId}`; // Adjusted URL structure if needed

    const downloadQRCode = () => {
        if (!qrRef.current) return;

        const canvas = qrRef.current;
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `${productName.replace(/\s+/g, '_')}_QR.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-[#E5383B] border-[#E5383B] hover:bg-[#E5383B]/10">
                    <QrCode className="w-4 h-4" />
                    Get QR Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold text-[#161A1D]">
                        Scan to View Listing
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center space-y-6 py-6">
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                        <QRCodeCanvas
                            ref={qrRef}
                            value={listingUrl}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                            imageSettings={{
                                src: logo,
                                x: undefined,
                                y: undefined,
                                height: 40,
                                width: 40,
                                excavate: true,
                            }}
                        />
                    </div>
                    <p className="text-sm text-center text-gray-500 max-w-[250px]">
                        Scan this code to instantly view <strong>{productName}</strong> on your device.
                    </p>
                    <Button
                        onClick={downloadQRCode}
                        className="w-full bg-gradient-to-r from-[#E5383B] to-[#BA181B] hover:from-[#BA181B] hover:to-[#660708] text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
