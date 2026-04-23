import { useState } from "react"
import JSZip from "jszip"
import { AIImageProcessor, PHOTO_SIZE_PRESETS, type PhotoSize } from "@/services/aiImageProcessor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileArchive, XCircle } from "lucide-react"
import { toast } from "sonner"

const MM_PER_INCH = 25.4;

export default function BulkProcessing() {
    const [files, setFiles] = useState<File[]>([])
    const [processedFiles, setProcessedFiles] = useState<{ original: File, processed: Blob, name: string }[]>([])
    const [progress, setProgress] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [hasProcessed, setHasProcessed] = useState(false)

    // Photo size state
    const [selectedPresetIdx, setSelectedPresetIdx] = useState(0)
    const [customWidthMm, setCustomWidthMm] = useState(35)
    const [customHeightMm, setCustomHeightMm] = useState(45)
    const [useCustom, setUseCustom] = useState(false)
    const [unit, setUnit] = useState<"mm" | "inch">("mm")

    const getPhotoSize = (): PhotoSize => {
        if (useCustom) {
            return {
                label: "Custom",
                widthMm: customWidthMm,
                heightMm: customHeightMm,
                widthInch: parseFloat((customWidthMm / MM_PER_INCH).toFixed(2)),
                heightInch: parseFloat((customHeightMm / MM_PER_INCH).toFixed(2)),
            }
        }
        return PHOTO_SIZE_PRESETS[selectedPresetIdx]
    }

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
            // toast.success(`${newFiles.length} files added to queue`);
        }
    }

    const clearAll = () => {
        setFiles([])
        setProcessedFiles([])
        setHasProcessed(false)
        setProgress(0)
        toast.success("Cleared all files")
    }

    const processImages = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        const results = [];
        const photoSize = getPhotoSize();

        const processor = new AIImageProcessor();
        await processor.initialize();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                const processedBlob = await processor.processImage(file, photoSize);
                results.push({ original: file, processed: processedBlob, name: file.name });
            } catch (err) {
                console.error(`Failed to process ${file.name}:`, err);
                results.push({ original: file, processed: file, name: file.name });
            }

            setProgress(((i + 1) / files.length) * 100)
        }

        setProcessedFiles(results);
        setHasProcessed(true);
        setIsProcessing(false);
    }

    const downloadZip = async () => {
        const zip = new JSZip();

        processedFiles.forEach(({ name, processed }) => {
            zip.file(name, processed);
        });

        const content = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(content)

        const a = document.createElement("a")
        a.href = url
        a.download = "processed-images.zip"
        a.click()
    }

    // Helper to display value in current unit
    const displayW = (size: PhotoSize) => unit === "mm" ? `${size.widthMm}mm` : `${size.widthInch}"`
    const displayH = (size: PhotoSize) => unit === "mm" ? `${size.heightMm}mm` : `${size.heightInch}"`

    return (
        <Card className="h-fit">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <FileArchive className="w-5 h-5 text-blue-600" />
                            Batch Process Photos
                        </CardTitle>
                        <CardDescription>
                            Upload multiple photos to generate a ZIP of white-background images at your chosen size.
                        </CardDescription>
                    </div>
                    {files.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-500 hover:text-red-600 hover:bg-red-50 font-bold text-xs rounded-lg">
                            <XCircle size={14} className="mr-2" /> Clear All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* ── Photo Size Selector ── */}
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Photo Size</h4>
                        <div className="flex items-center border rounded-md overflow-hidden text-xs">
                            <button
                                onClick={() => setUnit("mm")}
                                className={`px-3 py-1 font-medium transition-colors ${unit === "mm" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                            >mm</button>
                            <button
                                onClick={() => setUnit("inch")}
                                className={`px-3 py-1 font-medium transition-colors ${unit === "inch" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                            >inch</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {PHOTO_SIZE_PRESETS.map((preset, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setSelectedPresetIdx(idx); setUseCustom(false); }}
                                className={`p-2 rounded-md border text-center text-xs transition-all
                                    ${!useCustom && selectedPresetIdx === idx
                                        ? "border-primary bg-primary/10 ring-1 ring-primary font-semibold"
                                        : "hover:bg-muted"}`}
                            >
                                <span className="block font-medium">{preset.label}</span>
                                <span className="text-muted-foreground">{displayW(preset)} × {displayH(preset)}</span>
                            </button>
                        ))}
                    </div>

                    {/* Custom size */}
                    <div className="pt-2 border-t">
                        <button
                            onClick={() => setUseCustom(true)}
                            className={`text-xs font-medium mb-2 ${useCustom ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            ✏️ Custom Size
                        </button>
                        {useCustom && (
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase text-muted-foreground tracking-wider">Width ({unit})</label>
                                    <input
                                        type="number"
                                        min={10}
                                        value={unit === "mm" ? customWidthMm : parseFloat((customWidthMm / MM_PER_INCH).toFixed(2))}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 10;
                                            setCustomWidthMm(unit === "mm" ? v : Math.round(v * MM_PER_INCH));
                                        }}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                </div>
                                <span className="text-muted-foreground mt-4">×</span>
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase text-muted-foreground tracking-wider">Height ({unit})</label>
                                    <input
                                        type="number"
                                        min={10}
                                        value={unit === "mm" ? customHeightMm : parseFloat((customHeightMm / MM_PER_INCH).toFixed(2))}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 10;
                                            setCustomHeightMm(unit === "mm" ? v : Math.round(v * MM_PER_INCH));
                                        }}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Upload Area ── */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <div className="space-y-2">
                        <label htmlFor="bulk-upload" className="cursor-pointer">
                            <span className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
                                Select Images
                            </span>
                            <input
                                id="bulk-upload"
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleUpload}
                                className="hidden"
                            />
                        </label>
                        {files.length > 0 && (
                            <p className="text-sm font-medium text-blue-600 mt-4 pt-2">
                                {files.length} files selected ready for processing
                            </p>
                        )}
                    </div>
                </div>

                {files.length > 0 && !hasProcessed && !isProcessing && (
                    <div className="flex justify-end">
                        <Button
                            onClick={processImages}
                            size="lg"
                            className="w-full sm:w-auto"
                        >
                            Process {files.length} Images
                        </Button>
                    </div>
                )}

                {isProcessing && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Processing...</span>
                            <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {hasProcessed && processedFiles.length > 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Preview Details</h3>
                                <p className="text-xs text-muted-foreground">
                                    Size: {displayW(getPhotoSize())} × {displayH(getPhotoSize())} ({getPhotoSize().label})
                                </p>
                            </div>
                            <Button onClick={downloadZip} size="lg" className="bg-green-600 hover:bg-green-700">
                                Download ZIP Archive
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {processedFiles.map((pf, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
                                    <p className="font-medium text-sm truncate" title={pf.name}>{pf.name}</p>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs text-muted-foreground text-center">Original (Before)</p>
                                            <div className="aspect-[3/4] rounded bg-white border shadow-sm flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={URL.createObjectURL(pf.original)}
                                                    alt={`Original ${pf.name}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs text-blue-600 font-medium text-center">Processed (After)</p>
                                            <div className="aspect-[3/4] rounded bg-white border-2 border-blue-100 shadow-sm flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={URL.createObjectURL(pf.processed)}
                                                    alt={`Processed ${pf.name}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
