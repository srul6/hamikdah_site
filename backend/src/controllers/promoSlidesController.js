/**
 * Promo slides CRUD + public mapping.
 * Schema: ensurePromoSlidesSchema(); queries use the shared pool.
 */

const databaseController = require('./databaseController');
const pool = databaseController.pool;
const {
    validatePromoSlideInput,
    validateReorderIds
} = require('../utils/promoSlideValidation');

let schemaReady = false;

async function ensurePromoSlidesSchema() {
    if (schemaReady) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS promo_slides (
            id SERIAL PRIMARY KEY,
            image TEXT NOT NULL,
            image_mobile TEXT NULL,
            alt_he TEXT,
            alt_en TEXT,
            link_type TEXT NOT NULL DEFAULT 'none'
                CHECK (link_type IN ('none', 'page', 'section', 'external')),
            link_target TEXT NULL,
            open_in_new_tab BOOLEAN NOT NULL DEFAULT FALSE,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
    try {
        await pool.query(`
            CREATE INDEX IF NOT EXISTS promo_slides_active_sort_idx
            ON promo_slides (is_active, sort_order, id);
        `);
    } catch (err) {
        console.warn('promo_slides index:', err.message);
    }
    schemaReady = true;
}

function mapPublicRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        image: row.image || '',
        imageMobile: row.image_mobile || null,
        alt_he: row.alt_he || '',
        alt_en: row.alt_en || '',
        linkType: row.link_type || 'none',
        linkTarget: row.link_target || null,
        openInNewTab: !!row.open_in_new_tab
    };
}

function mapAdminRow(row) {
    if (!row) return null;
    return {
        id: row.id,
        image: row.image || '',
        imageMobile: row.image_mobile || null,
        image_mobile: row.image_mobile || null,
        altHe: row.alt_he || '',
        altEn: row.alt_en || '',
        alt_he: row.alt_he || '',
        alt_en: row.alt_en || '',
        linkType: row.link_type || 'none',
        link_type: row.link_type || 'none',
        linkTarget: row.link_target || null,
        link_target: row.link_target || null,
        openInNewTab: !!row.open_in_new_tab,
        open_in_new_tab: !!row.open_in_new_tab,
        isActive: !!row.is_active,
        is_active: !!row.is_active,
        sortOrder: row.sort_order ?? 0,
        sort_order: row.sort_order ?? 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

async function getPublicSlides(req, res) {
    try {
        await ensurePromoSlidesSchema();
        const r = await pool.query(
            `SELECT * FROM promo_slides
             WHERE is_active = TRUE
             ORDER BY sort_order ASC, id ASC`
        );
        return res.json({
            success: true,
            slides: r.rows.map(mapPublicRow)
        });
    } catch (error) {
        console.error('❌ GET /promo-slides:', error);
        return res.status(500).json({ success: false, message: 'Unable to process your request.' });
    }
}

async function getAdminSlides(req, res) {
    try {
        await ensurePromoSlidesSchema();
        const r = await pool.query(
            `SELECT * FROM promo_slides ORDER BY sort_order ASC, id ASC`
        );
        return res.json({
            success: true,
            slides: r.rows.map(mapAdminRow)
        });
    } catch (error) {
        console.error('❌ GET /promo-slides/admin/all:', error);
        return res.status(500).json({ success: false, message: 'Unable to process your request.' });
    }
}

async function createSlide(req, res) {
    try {
        await ensurePromoSlidesSchema();
        const validated = validatePromoSlideInput(req.body || {}, { partial: false });
        if (!validated.ok) {
            return res.status(400).json({ success: false, message: validated.message });
        }
        const v = validated.value;
        const r = await pool.query(
            `INSERT INTO promo_slides (
                image, image_mobile, alt_he, alt_en,
                link_type, link_target, open_in_new_tab, is_active, sort_order
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                v.image,
                v.imageMobile,
                v.altHe,
                v.altEn,
                v.linkType,
                v.linkTarget,
                !!v.openInNewTab,
                v.isActive !== false,
                v.sortOrder ?? 0
            ]
        );
        return res.status(201).json({ success: true, slide: mapAdminRow(r.rows[0]) });
    } catch (error) {
        console.error('❌ POST /promo-slides:', error);
        return res.status(500).json({ success: false, message: 'Unable to process your request.' });
    }
}

async function updateSlide(req, res) {
    try {
        await ensurePromoSlidesSchema();
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ success: false, message: 'מזהה שקופית אינו תקין' });
        }
        const existing = await pool.query('SELECT * FROM promo_slides WHERE id = $1', [id]);
        if (!existing.rows[0]) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }
        const row = existing.rows[0];

        // Merge with existing so link_type + target stay consistent
        const merged = {
            image: req.body?.image !== undefined ? req.body.image : row.image,
            imageMobile:
                req.body?.imageMobile !== undefined || req.body?.image_mobile !== undefined
                    ? req.body.imageMobile ?? req.body.image_mobile
                    : row.image_mobile,
            altHe:
                req.body?.altHe !== undefined || req.body?.alt_he !== undefined
                    ? req.body.altHe ?? req.body.alt_he
                    : row.alt_he,
            altEn:
                req.body?.altEn !== undefined || req.body?.alt_en !== undefined
                    ? req.body.altEn ?? req.body.alt_en
                    : row.alt_en,
            linkType:
                req.body?.linkType !== undefined || req.body?.link_type !== undefined
                    ? req.body.linkType ?? req.body.link_type
                    : row.link_type,
            linkTarget:
                req.body?.linkTarget !== undefined || req.body?.link_target !== undefined
                    ? req.body.linkTarget ?? req.body.link_target
                    : row.link_target,
            openInNewTab:
                req.body?.openInNewTab !== undefined || req.body?.open_in_new_tab !== undefined
                    ? req.body.openInNewTab ?? req.body.open_in_new_tab
                    : row.open_in_new_tab,
            isActive:
                req.body?.isActive !== undefined || req.body?.is_active !== undefined
                    ? req.body.isActive ?? req.body.is_active
                    : row.is_active,
            sortOrder:
                req.body?.sortOrder !== undefined || req.body?.sort_order !== undefined
                    ? req.body.sortOrder ?? req.body.sort_order
                    : row.sort_order
        };

        const validated = validatePromoSlideInput(merged, { partial: false });
        if (!validated.ok) {
            return res.status(400).json({ success: false, message: validated.message });
        }
        const v = validated.value;

        const r = await pool.query(
            `UPDATE promo_slides SET
                image = $2,
                image_mobile = $3,
                alt_he = $4,
                alt_en = $5,
                link_type = $6,
                link_target = $7,
                open_in_new_tab = $8,
                is_active = $9,
                sort_order = $10,
                updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [
                id,
                v.image,
                v.imageMobile,
                v.altHe,
                v.altEn,
                v.linkType,
                v.linkTarget,
                !!v.openInNewTab,
                v.isActive !== false,
                v.sortOrder ?? 0
            ]
        );
        return res.json({ success: true, slide: mapAdminRow(r.rows[0]) });
    } catch (error) {
        console.error('❌ PUT /promo-slides/:id:', error);
        return res.status(500).json({ success: false, message: 'Unable to process your request.' });
    }
}

async function deleteSlide(req, res) {
    try {
        await ensurePromoSlidesSchema();
        const id = parseInt(req.params.id, 10);
        if (!Number.isFinite(id)) {
            return res.status(400).json({ success: false, message: 'מזהה שקופית אינו תקין' });
        }
        await pool.query('DELETE FROM promo_slides WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ DELETE /promo-slides/:id:', error);
        return res.status(500).json({ success: false, message: 'Unable to process your request.' });
    }
}

async function reorderSlides(req, res) {
    try {
        await ensurePromoSlidesSchema();
        const orderedIds = req.body?.ids ?? req.body?.orderedIds ?? req.body;
        const all = await pool.query('SELECT id FROM promo_slides ORDER BY id ASC');
        const existingIds = all.rows.map((r) => r.id);
        const validated = validateReorderIds(
            Array.isArray(orderedIds) ? orderedIds : orderedIds?.ids,
            existingIds
        );
        if (!validated.ok) {
            return res.status(400).json({ success: false, message: validated.message });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (let i = 0; i < validated.ids.length; i += 1) {
                await client.query(
                    `UPDATE promo_slides SET sort_order = $2, updated_at = NOW() WHERE id = $1`,
                    [validated.ids[i], i]
                );
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        const r = await pool.query(
            `SELECT * FROM promo_slides ORDER BY sort_order ASC, id ASC`
        );
        return res.json({ success: true, slides: r.rows.map(mapAdminRow) });
    } catch (error) {
        console.error('❌ PUT /promo-slides/admin/reorder:', error);
        return res.status(500).json({ success: false, message: 'Unable to process your request.' });
    }
}

module.exports = {
    ensurePromoSlidesSchema,
    getPublicSlides,
    getAdminSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    mapPublicRow,
    mapAdminRow
};
