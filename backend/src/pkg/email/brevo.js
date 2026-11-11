const API = "https://api.brevo.com/v3";

// sends through Brevo's HTTP API: plain HTTPS, so it works on hosts that block SMTP ports.
// same methods as NodemailerProvider
export class BrevoProvider {
  constructor({ apiKey, fromEmail, fromName }) {
    this.apiKey = apiKey;
    // must be a sender verified in Brevo (Senders, domains & dedicated IPs)
    this.sender = { email: fromEmail, name: fromName };
  }

  async #request(path, init = {}) {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { "api-key": this.apiKey, "content-type": "application/json", accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      // Brevo's error body says what's wrong (bad key, unverified sender...); it stays in the logs
      throw new Error(`Brevo ${init.method ?? "GET"} ${path} failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
  }

  async sendmail(email, subject, html, text) {
    return this.#request("/smtp/email", {
      method: "POST",
      body: JSON.stringify({ sender: this.sender, to: [{ email }], subject, htmlContent: html, textContent: text }),
    });
  }

  // checks the key works, without sending anything
  async verify() {
    return this.#request("/account");
  }
}
