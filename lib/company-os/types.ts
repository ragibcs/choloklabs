/**
 * Contract between this website and CholokLabs Company OS.
 *
 * The website only depends on this interface. Company OS is not built yet, so
 * the shapes below are a proposal to adjust once its API exists.
 */

export type InquiryInput = {
  name: string;
  email: string;
  company?: string;
  interest: string;
  message: string;
};

export type InquiryReceipt = {
  id: string;
};

export interface CompanyOSClient {
  submitInquiry(input: InquiryInput): Promise<InquiryReceipt>;
}
