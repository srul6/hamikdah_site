import React from 'react';
import { useGifts } from './GiftContext';
import GiftSelectionPanel from './GiftSelectionPanel';

/** Inline gift panel for one cart line — wraps shared GiftSelectionPanel */
export default function GiftLineSelectors({ item, compact = false, hideOuterChrome = false }) {
    const { promotionForProduct, giftSelections, setSlotSelection } = useGifts();

    const promo = promotionForProduct(item.id);
    if (!promo) return null;

    const uniqueId = String(item.uniqueId != null ? item.uniqueId : item.id);
    const map = giftSelections[uniqueId] || {};

    return (
        <GiftSelectionPanel
            promo={promo}
            cartUniqueId={uniqueId}
            quantity={item.quantity}
            selectionsMap={map}
            onSelectBook={setSlotSelection}
            compact={compact}
            hideOuterChrome={hideOuterChrome}
        />
    );
}
