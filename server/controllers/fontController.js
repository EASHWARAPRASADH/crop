import Font from '../models/Font.js';

// @desc    Get fonts
// @route   GET /api/fonts
export const getFonts = async (req, res) => {
    try {
        const { category, source, search, page = 1, limit = 50 } = req.query;
        const query = {};

        if (category) query.category = category;
        if (source) query.source = source;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { family: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Font.countDocuments(query);
        const fonts = await Font.find(query)
            .sort('name')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({
            fonts,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create / upload font
// @route   POST /api/fonts
export const createFont = async (req, res) => {
    try {
        const fontData = { ...req.body };
        if (req.file) {
            fontData.fileUrl = `/uploads/${req.file.filename}`;
            fontData.source = 'custom';
        }
        const font = await Font.create(fontData);
        res.status(201).json(font);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle font favorite
// @route   PUT /api/fonts/:id/favorite
export const toggleFavorite = async (req, res) => {
    try {
        const font = await Font.findById(req.params.id);
        if (!font) return res.status(404).json({ message: 'Font not found' });

        const userId = req.user._id;
        const index = font.favoriteBy.indexOf(userId);

        if (index > -1) {
            font.favoriteBy.splice(index, 1);
            font.favoriteCount = Math.max(0, font.favoriteCount - 1);
        } else {
            font.favoriteBy.push(userId);
            font.favoriteCount += 1;
        }

        await font.save();
        res.json(font);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Seed Google Fonts
// @route   POST /api/fonts/seed
export const seedGoogleFonts = async (req, res) => {
    try {
        const googleFonts = [
            { name: 'Poppins', family: 'Poppins', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Open Sans', 'Roboto'] },
            { name: 'Roboto', family: 'Roboto', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '700'], pairsWith: ['Roboto Slab', 'Open Sans'] },
            { name: 'Open Sans', family: 'Open Sans', category: 'sans-serif', source: 'google', variants: ['300', '400', '600', '700'], pairsWith: ['Montserrat', 'Lato'] },
            { name: 'Inter', family: 'Inter', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Playfair Display'] },
            { name: 'Montserrat', family: 'Montserrat', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Open Sans', 'Lato'] },
            { name: 'Lato', family: 'Lato', category: 'sans-serif', source: 'google', variants: ['300', '400', '700'], pairsWith: ['Playfair Display', 'Montserrat'] },
            { name: 'Nunito', family: 'Nunito', category: 'sans-serif', source: 'google', variants: ['300', '400', '600', '700'], pairsWith: ['Roboto'] },
            { name: 'Raleway', family: 'Raleway', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Source Sans Pro'] },
            { name: 'Playfair Display', family: 'Playfair Display', category: 'serif', source: 'google', variants: ['400', '500', '600', '700'], pairsWith: ['Lato', 'Open Sans'] },
            { name: 'Oswald', family: 'Oswald', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Open Sans'] },
            { name: 'Merriweather', family: 'Merriweather', category: 'serif', source: 'google', variants: ['300', '400', '700'], pairsWith: ['Open Sans'] },
            { name: 'Ubuntu', family: 'Ubuntu', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '700'], pairsWith: ['Open Sans'] },
            { name: 'Source Sans Pro', family: 'Source Sans 3', category: 'sans-serif', source: 'google', variants: ['300', '400', '600', '700'], pairsWith: ['Raleway'] },
            { name: 'Fira Sans', family: 'Fira Sans', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Playfair Display'] },
            { name: 'Work Sans', family: 'Work Sans', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Roboto'] },
            { name: 'Quicksand', family: 'Quicksand', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Roboto'] },
            { name: 'DM Sans', family: 'DM Sans', category: 'sans-serif', source: 'google', variants: ['400', '500', '700'], pairsWith: ['Inter'] },
            { name: 'Rubik', family: 'Rubik', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Roboto'] },
            { name: 'Bebas Neue', family: 'Bebas Neue', category: 'display', source: 'google', variants: ['400'], pairsWith: ['Open Sans', 'Roboto'] },
            { name: 'Pacifico', family: 'Pacifico', category: 'handwriting', source: 'google', variants: ['400'], pairsWith: ['Open Sans'] },
            { name: 'Dancing Script', family: 'Dancing Script', category: 'handwriting', source: 'google', variants: ['400', '500', '600', '700'], pairsWith: ['Lato'] },
            { name: 'Great Vibes', family: 'Great Vibes', category: 'handwriting', source: 'google', variants: ['400'], pairsWith: ['Raleway'] },
            { name: 'Caveat', family: 'Caveat', category: 'handwriting', source: 'google', variants: ['400', '500', '600', '700'], pairsWith: ['Montserrat'] },
            { name: 'Anton', family: 'Anton', category: 'display', source: 'google', variants: ['400'], pairsWith: ['Roboto'] },
            { name: 'Abril Fatface', family: 'Abril Fatface', category: 'display', source: 'google', variants: ['400'], pairsWith: ['Lato', 'Open Sans'] },
            { name: 'Josefin Sans', family: 'Josefin Sans', category: 'sans-serif', source: 'google', variants: ['300', '400', '600', '700'], pairsWith: ['Lato'] },
            { name: 'Barlow', family: 'Barlow', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Roboto'] },
            { name: 'Manrope', family: 'Manrope', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700', '800'], pairsWith: ['Inter'] },
            { name: 'Space Grotesk', family: 'Space Grotesk', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Inter'] },
            { name: 'Outfit', family: 'Outfit', category: 'sans-serif', source: 'google', variants: ['300', '400', '500', '600', '700'], pairsWith: ['Inter'] },
        ];

        // Upsert fonts
        for (const font of googleFonts) {
            await Font.findOneAndUpdate(
                { name: font.name, source: 'google' },
                font,
                { upsert: true, new: true }
            );
        }

        res.json({ message: `Seeded ${googleFonts.length} Google Fonts` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete font
// @route   DELETE /api/fonts/:id
export const deleteFont = async (req, res) => {
    try {
        const font = await Font.findById(req.params.id);
        if (!font) return res.status(404).json({ message: 'Font not found' });
        await font.deleteOne();
        res.json({ message: 'Font deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
