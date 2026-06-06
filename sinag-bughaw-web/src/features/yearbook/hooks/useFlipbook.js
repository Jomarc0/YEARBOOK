// sinag-bughaw-web/src/features/yearbook/hooks/useFlipbook.js
// Extends the existing yearbook feature — fetches flipbook data from
// the new /api/yearbook/flipbook/{batchId} endpoint.

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../api/client';

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

    useEffect(() => { fetch(); }, [fetch]);

    return { data, loading, error, refetch: fetch };
}

/**
 * Triggers a PDF download for the given batch.
 * Reuses the existing axios client so auth headers are included.
 *
 * @param {number|string} batchId
 * @param {string}        batchYear  — used for filename
 */
export function useYearbookPdfDownload() {
    const [downloading, setDownloading] = useState(false);
    const [progress, setProgress]       = useState(0);

    const download = useCallback(async (batchId, batchYear = '') => {
        setDownloading(true);
        setProgress(10);
        try {
            const response = await apiClient.get(
                `/yearbook/export/pdf/${batchId}`,
                {
                    responseType: 'blob',
                    onDownloadProgress: (e) => {
                        if (e.total) {
                            setProgress(Math.round((e.loaded / e.total) * 90) + 10);
                        }
                    },
                }
            );

            // Build a temporary anchor to trigger browser download
            const url      = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const anchor   = document.createElement('a');
            anchor.href    = url;
            anchor.download = `yearbook-${batchYear || batchId}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            setProgress(100);
        } catch {
            throw new Error('PDF generation failed. Please try again.');
        } finally {
            setTimeout(() => { setDownloading(false); setProgress(0); }, 1200);
        }
    }, []);

    return { download, downloading, progress };
}