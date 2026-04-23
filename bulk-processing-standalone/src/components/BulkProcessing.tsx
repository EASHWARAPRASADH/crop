import { useState } from "react"
import JSZip from "jszip"
import { AIImageProcessor, PHOTO_SIZE_PRESETS, type PhotoSize } from "../services/aiImageProcessor"

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

    const handleUpload = (e: any) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
            setProcessedFiles([])
            setHasProcessed(false)
            setProgress(0)
        }
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

    const displayW = (size: PhotoSize) => unit === "mm" ? `${size.widthMm}mm` : `${size.widthInch}"`
    const displayH = (size: PhotoSize) => unit === "mm" ? `${size.heightMm}mm` : `${size.heightInch}"`

    return (
        <div className="p-10 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">
                Bulk Image Processor
            </h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <p className="text-gray-600 mb-4">
                    Upload multiple photos to automatically remove backgrounds, adjust lighting, and crop to your chosen size. Preview before downloading. Facial features are strictly preserved.
                </p>

                {/* ── Photo Size Selector ── */}
                <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">Photo Size</h4>
                        <div className="flex items-center border rounded-md overflow-hidden text-xs">
                            <button
                                onClick={() => setUnit("mm")}
                                className={`px-3 py-1 font-medium transition-colors ${unit === "mm" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                            >mm</button>
                            <button
                                onClick={() => setUnit("inch")}
                                className={`px-3 py-1 font-medium transition-colors ${unit === "inch" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                            >inch</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {PHOTO_SIZE_PRESETS.map((preset, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setSelectedPresetIdx(idx); setUseCustom(false); }}
                                className={`p-2 rounded-md border text-center text-xs transition-all
                                    ${!useCustom && selectedPresetIdx === idx
                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 font-semibold"
                                        : "hover:bg-gray-100 border-gray-200"}`}
                            >
                                <span className="block font-medium text-gray-800">{preset.label}</span>
                                <span className="text-gray-500">{displayW(preset)} × {displayH(preset)}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                        <button
                            onClick={() => setUseCustom(true)}
                            className={`text-xs font-medium mb-2 ${useCustom ? "text-blue-600" : "text-gray-500 hover:text-gray-800"}`}
                        >
                            ✏️ Custom Size
                        </button>
                        {useCustom && (
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase text-gray-400 tracking-wider">Width ({unit})</label>
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
                                <span className="text-gray-400 mt-4">×</span>
                                <div className="flex-1">
                                    <label className="text-[10px] uppercase text-gray-400 tracking-wider">Height ({unit})</label>
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

                {/* ── File input ── */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Images
                    </label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleUpload}
                        className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
                    />
                </div>

                {files.length > 0 && !hasProcessed && !isProcessing && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">{files.length} files selected.</p>
                        <button
                            onClick={processImages}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                        >
                            Process {files.length} Images
                        </button>
                    </div>
                )}

                {isProcessing && (
                    <div className="mt-6">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-blue-700">Processing...</span>
                            <span className="text-sm font-medium text-blue-700">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {hasProcessed && processedFiles.length > 0 && (
                    <div className="mt-8 space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">Preview Processed Images</h3>
                                <p className="text-xs text-gray-500">
                                    Size: {displayW(getPhotoSize())} × {displayH(getPhotoSize())} ({getPhotoSize().label})
                                </p>
                            </div>
                            <button
                                onClick={downloadZip}
                                className="px-6 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                            >
                                Download ZIP Archive
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2">
                            {processedFiles.map((pf, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3 shadow-sm">
                                    <p className="font-medium text-sm text-gray-700 truncate" title={pf.name}>{pf.name}</p>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs text-gray-500 text-center uppercase tracking-wider font-semibold">Before</p>
                                            <div className="aspect-[3/4] rounded bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={URL.createObjectURL(pf.original)}
                                                    alt={`Original ${pf.name}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <p className="text-xs text-blue-600 text-center uppercase tracking-wider font-semibold">After</p>
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
            </div>
        </div>
    )
}
