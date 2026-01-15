// External Dependencies
import { useMutation } from "@tanstack/react-query";

// Internal Dependencies
import { reportError } from "@/libs/utils/errorReporting";
import { API_ENDPOINTS, getApiClient } from "@/libs/constants/api";

interface ReportRequest {
  feedback: string;
}

interface ReportResponse {
  success: boolean;
  message?: string;
}

/**
 * Submit a report/feedback to the server
 */
export const submitReport = async (
  reportData: ReportRequest,
): Promise<ReportResponse> => {
  try {
    const client = getApiClient();

    const result: ReportResponse = await client.post(
      API_ENDPOINTS.USER_FEEDBACK_V1,
      {
        feedback: reportData.feedback,
      },
    );

    return result;
  } catch (error) {
    reportError(error, {
      component: "ReportAPI",
      action: "Submit Report",
      extra: { feedback: reportData.feedback },
    });
    throw new Error("Failed to submit report");
  }
};

/**
 * React Query mutation hook for submitting reports
 */
export const useSubmitReportMutation = () => {
  return useMutation({
    mutationFn: (reportData: ReportRequest) => submitReport(reportData),
    onError: (error) => {
      reportError(error, {
        component: "ReportAPI",
        action: "Submit Report Mutation",
      });
    },
  });
};
