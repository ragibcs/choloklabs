import type { CompanyOSClient, InquiryInput, InquiryReceipt } from "./types";

/** Used until Company OS exists: records that an inquiry arrived, nothing more. */
class LogOnlyClient implements CompanyOSClient {
  async submitInquiry(input: InquiryInput): Promise<InquiryReceipt> {
    const id = crypto.randomUUID();
    console.info(`[inquiry] ${id} interest="${input.interest}"`);
    return { id };
  }
}

/** Placeholder HTTP contract. Change the path and payload to match the real API. */
class HttpClient implements CompanyOSClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  async submitInquiry(input: InquiryInput): Promise<InquiryReceipt> {
    const res = await fetch(`${this.baseUrl}/v1/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({ ...input, source: "website" }),
    });
    if (!res.ok) throw new Error(`Company OS responded with ${res.status}`);
    return (await res.json()) as InquiryReceipt;
  }
}

export function createCompanyOSClient(): CompanyOSClient {
  const url = process.env.COMPANY_OS_URL;
  return url ? new HttpClient(url.replace(/\/$/, ""), process.env.COMPANY_OS_TOKEN) : new LogOnlyClient();
}
