// External Dependencies
import type React from 'react';

// Internal Dependencies
import { useExtractionStatusPolling } from '@/api';

interface ExtractionStatusPollerProps {
  extractionId: string | null;
  progressItemId: string;
}

/**
 * Component that handles polling for extraction status updates
 * This component doesn't render anything - it just manages the polling logic
 */
export const ExtractionStatusPoller: React.FC<ExtractionStatusPollerProps> = ({
  extractionId,
  progressItemId
}) => {
  // Start polling when extractionId is provided
  useExtractionStatusPolling(extractionId, progressItemId);

  // This component doesn't render anything
  return null;
};
