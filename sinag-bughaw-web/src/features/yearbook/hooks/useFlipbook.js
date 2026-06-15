// sinag-bughaw-web/src/features/yearbook/hooks/useFlipbook.js
// Extends the existing yearbook feature fetches flipbook data from
// the /api/yearbook/flipbook/{batchId} endpoint.

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../api/client';
import { downloadYearbookPdf } from '../../../api/yearbook.api';

/**
 * Fetches structured yearbook data (school info, faculty, sections/students)
 * for the React PageFlip interactive flipbook.
 *
 * @param {number|string} batchId
 */
export function useFlipbook(batchId) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    const fetch = useCallback(async () => {
        if (!batchId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get(`/yearbook/flipbook/${batchId}`);
            setData(res.data);
        } catch (err) {
            setError(err?.response?.data?.message ?? 'Failed to load yearbook data.');
        } finally {
            setLoading(false);
        }
    }, [batchId]);

    useEffect(() => {
        queueMicrotask(() => fetch());
    }, [fetch]);

    return { data, loading, error, refetch: fetch };
}

/**
 * Triggers a PDF download for the given batch.
 * Uses the tokenized PDF route so the browser can download without CORS-heavy blob XHR.
 *
 * @param {number|string} batchId
 * @param {string} batchYear used for filename
 */
export function useYearbookPdfDownload() {
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress]       = useState(0);

    const download = useCallback(async (batchId, batchYear = '') => {
        setDownloading(true);
        setProgress(10);
        try {
            await downloadYearbookPdf(batchId, {}, `yearbook-${batchYear || batchId}.pdf`);
            setProgress(100);
        } catch (error) {
            throw new Error(error?.message || 'PDF generation failed. Please try again.', { cause: error });
        } finally {
            setTimeout(() => { setDownloading(false); setProgress(0); }, 1200);
        }
    }, []);

    return { download, downloading, progress };
}
