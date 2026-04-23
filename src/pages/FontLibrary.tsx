import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Type, Search, Heart, Upload, Star, Grid3X3, List,
    Filter, X, Download, Eye, ChevronDown
} from 'lucide-react';

// ─── Font Data ───
const FONT_CATEGORIES = ['All', 'Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace'];

const GOOGLE_FONTS = [
    { name: 'Inter', family: 'Inter', category: 'Sans Serif', variants: ['400', '500', '600', '700'], popular: true },
    { name: 'Roboto', family: 'Roboto', category: 'Sans Serif', variants: ['300', '400', '500', '700'], popular: true },
    { name: 'Open Sans', family: 'Open Sans', category: 'Sans Serif', variants: ['300', '400', '600', '700', '800'], popular: true },
    { name: 'Poppins', family: 'Poppins', category: 'Sans Serif', variants: ['300', '400', '500', '600', '700'], popular: true },
    { name: 'Montserrat', family: 'Montserrat', category: 'Sans Serif', variants: ['300', '400', '500', '600', '700', '800', '900'], popular: true },
    { name: 'Lato', family: 'Lato', category: 'Sans Serif', variants: ['300', '400', '700', '900'], popular: true },
    { name: 'Nunito', family: 'Nunito', category: 'Sans Serif', variants: ['300', '400', '600', '700', '800'], popular: true },
    { name: 'Raleway', family: 'Raleway', category: 'Sans Serif', variants: ['300', '400', '500', '600', '700'], popular: false },
    { name: 'Outfit', family: 'Outfit', category: 'Sans Serif', variants: ['300', '400', '500', '600', '700'], popular: false },
    { name: 'Manrope', family: 'Manrope', category: 'Sans Serif', variants: ['400', '500', '600', '700', '800'], popular: false },
    { name: 'DM Sans', family: 'DM Sans', category: 'Sans Serif', variants: ['400', '500', '700'], popular: false },
    { name: 'Space Grotesk', family: 'Space Grotesk', category: 'Sans Serif', variants: ['400', '500', '600', '700'], popular: false },
    { name: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', category: 'Sans Serif', variants: ['400', '500', '600', '700', '800'], popular: false },
    { name: 'Playfair Display', family: 'Playfair Display', category: 'Serif', variants: ['400', '500', '600', '700', '800', '900'], popular: true },
    { name: 'Merriweather', family: 'Merriweather', category: 'Serif', variants: ['300', '400', '700', '900'], popular: false },
    { name: 'Lora', family: 'Lora', category: 'Serif', variants: ['400', '500', '600', '700'], popular: false },
    { name: 'PT Serif', family: 'PT Serif', category: 'Serif', variants: ['400', '700'], popular: false },
    { name: 'Libre Baskerville', family: 'Libre Baskerville', category: 'Serif', variants: ['400', '700'], popular: false },
    { name: 'Noto Serif', family: 'Noto Serif', category: 'Serif', variants: ['400', '700'], popular: false },
    { name: 'Source Serif Pro', family: 'Source Serif Pro', category: 'Serif', variants: ['400', '600', '700'], popular: false },
    { name: 'Cormorant Garamond', family: 'Cormorant Garamond', category: 'Serif', variants: ['300', '400', '500', '600', '700'], popular: false },
    { name: 'Pacifico', family: 'Pacifico', category: 'Handwriting', variants: ['400'], popular: true },
    { name: 'Dancing Script', family: 'Dancing Script', category: 'Handwriting', variants: ['400', '500', '600', '700'], popular: false },
    { name: 'Satisfy', family: 'Satisfy', category: 'Handwriting', variants: ['400'], popular: false },
    { name: 'Great Vibes', family: 'Great Vibes', category: 'Handwriting', variants: ['400'], popular: false },
    { name: 'Caveat', family: 'Caveat', category: 'Handwriting', variants: ['400', '500', '600', '700'], popular: false },
    { name: 'Kalam', family: 'Kalam', category: 'Handwriting', variants: ['300', '400', '700'], popular: false },
    { name: 'Permanent Marker', family: 'Permanent Marker', category: 'Display', variants: ['400'], popular: false },
    { name: 'Bebas Neue', family: 'Bebas Neue', category: 'Display', variants: ['400'], popular: true },
    { name: 'Righteous', family: 'Righteous', category: 'Display', variants: ['400'], popular: false },
    { name: 'Alfa Slab One', family: 'Alfa Slab One', category: 'Display', variants: ['400'], popular: false },
    { name: 'Lobster', family: 'Lobster', category: 'Display', variants: ['400'], popular: false },
    { name: 'Bungee', family: 'Bungee', category: 'Display', variants: ['400'], popular: false },
    { name: 'Black Ops One', family: 'Black Ops One', category: 'Display', variants: ['400'], popular: false },
    { name: 'Fira Code', family: 'Fira Code', category: 'Monospace', variants: ['300', '400', '500', '600', '700'], popular: true },
    { name: 'JetBrains Mono', family: 'JetBrains Mono', category: 'Monospace', variants: ['400', '500', '600', '700', '800'], popular: false },
    { name: 'Source Code Pro', family: 'Source Code Pro', category: 'Monospace', variants: ['300', '400', '500', '600', '700'], popular: false },
    { name: 'IBM Plex Mono', family: 'IBM Plex Mono', category: 'Monospace', variants: ['300', '400', '500', '600', '700'], popular: false },
].map((f, i) => ({ ...f, id: `gf-${i}`, isFavorite: Math.random() > 0.8, usageCount: Math.floor(Math.random() * 10000) + 50 }));

const PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog';

// ─── Font Card ───
const FontCard = ({ font, previewText, previewSize }: { font: any; previewText: string; previewSize: number }) => {
    const [fav, setFav] = useState(font.isFavorite);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${font.family.replace(/ /g, '+')}&display=swap`;
        link.rel = 'stylesheet';
        link.onload = () => setLoaded(true);
        document.head.appendChild(link);
        return () => { document.head.removeChild(link); };
    }, [font.family]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group"
        >
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">{font.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{font.category}</span>
                        <span className="text-xs text-gray-400">{font.variants.length} variants</span>
                        {font.popular && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Popular</span>}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setFav(!fav)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Heart className={`w-4 h-4 ${fav ? 'text-red-500 fill-red-500' : 'text-gray-300 hover:text-red-400'}`} />
                    </button>
                </div>
            </div>

            <div
                className="text-gray-800 transition-all overflow-hidden"
                style={{
                    fontFamily: loaded ? `"${font.family}", sans-serif` : 'sans-serif',
                    fontSize: `${previewSize}px`,
                    lineHeight: 1.4,
                    minHeight: '2.8em',
                    opacity: loaded ? 1 : 0.3,
                }}
            >
                {previewText}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </span>
                <span className="text-xs text-gray-400">{font.usageCount.toLocaleString()} uses</span>
            </div>
        </motion.div>
    );
};

// ─── Main Component ───
const FontLibrary = () => {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [previewText, setPreviewText] = useState(PREVIEW_TEXT);
    const [previewSize, setPreviewSize] = useState(24);
    const [sortBy, setSortBy] = useState<'popular' | 'name' | 'newest'>('popular');
    const [showFavOnly, setShowFavOnly] = useState(false);

    const filtered = useMemo(() => {
        let result = [...GOOGLE_FONTS];
        if (activeCategory !== 'All') result = result.filter(f => f.category === activeCategory);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(f => f.name.toLowerCase().includes(q) || f.family.toLowerCase().includes(q));
        }
        if (showFavOnly) result = result.filter(f => f.isFavorite);
        if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'popular') result.sort((a, b) => b.usageCount - a.usageCount);
        return result;
    }, [activeCategory, search, sortBy, showFavOnly]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Font Library</h1>
                    <p className="text-gray-500 mt-1">{GOOGLE_FONTS.length} fonts from Google Fonts + custom uploads</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Upload className="w-4 h-4" /> Upload Custom Font
                </button>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {FONT_CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search fonts..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="relative flex-1 max-w-sm">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={previewText}
                        onChange={e => setPreviewText(e.target.value || PREVIEW_TEXT)}
                        placeholder="Type to preview..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <select
                    value={previewSize}
                    onChange={e => setPreviewSize(Number(e.target.value))}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none"
                >
                    <option value={16}>16px</option>
                    <option value={20}>20px</option>
                    <option value={24}>24px</option>
                    <option value={32}>32px</option>
                    <option value={40}>40px</option>
                    <option value={48}>48px</option>
                </select>

                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none"
                >
                    <option value="popular">Most Popular</option>
                    <option value="name">Alphabetical</option>
                    <option value="newest">Newest</option>
                </select>

                <button
                    onClick={() => setShowFavOnly(!showFavOnly)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showFavOnly ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${showFavOnly ? 'fill-red-500' : ''}`} /> Favorites
                </button>
            </div>

            {/* Font grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(font => (
                    <FontCard key={font.id} font={font} previewText={previewText} previewSize={previewSize} />
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Type className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-lg font-semibold text-gray-900 mt-4">No fonts found</h3>
                    <p className="text-gray-500 mt-1">Try adjusting your search or category filter.</p>
                </div>
            )}
        </div>
    );
};

export default FontLibrary;
