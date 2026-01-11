# Jira setup for NetLogs

Use this guide to fill in the Jira settings added to the Options page.

## Required settings

1. **Base URL**
   - **Jira Cloud:** `https://<your-domain>.atlassian.net`
   - **Jira Server/Data Center:** `https://jira.your-company.com` (include any
     context path if your Jira is hosted under one, e.g. `/jira`).

2. **User (email or username)**
   - **Jira Cloud:** your Atlassian account email address.
   - **Jira Server/Data Center:** your username or email, depending on how your
     instance is configured.

3. **API token / password**
   - **Jira Cloud:** create an API token at
     <https://id.atlassian.com/manage-profile/security/api-tokens>.
   - **Jira Server/Data Center:** use a personal access token.

4. **Project key**
   - Open the target project in Jira and check **Project settings → Details**.
     The key is listed as **Project key** (for example, `NET`).

5. **Issue type**
   - Use the exact issue type name configured for your project, such as
     `Task`, `Bug`, or `Story`.

6. **API version**
   - The integration defaults to REST API **v2** for maximum compatibility.
   - **Jira Cloud** also supports **v3**; set this field to `3` if preferred.
   - **Jira Server/Data Center** typically uses **v2**.
