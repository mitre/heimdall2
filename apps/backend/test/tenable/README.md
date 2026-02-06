# 🔒 Tenable.sc Mock Server (Prism)

This project simulates a subset of the Tenable.sc REST API using [Prism](https://github.com/stoplightio/prism) to enable local development and testing without requiring access to a real Tenable.sc instance.

## ✨ Features

- Simulates Tenable.sc endpoints:
  - `GET /rest/currentUser`
  - `GET /rest/scanResult`
  - `POST /rest/scanResult/{scanId}/download?downloadType=v2`
- Enforces `x-apikey` header with `accesskey` and `secretkey`
- Mock responses include realistic structure and sample data

---

## 🚀 Getting Started

### 1. Install Prism

```bash
 > npm install -g @stoplight/prism-cli
```
### 2. Run the Mock Server
Navigate to the folder containing tenable-sc-mock.yaml and run this command:
```bash
  > prism mock tenable-sc-mock.yaml
```

Server starts on: `http://localhost:4010`

### 3. Example Requests (using curl)
✅ Get Current User
```bash
  > curl -X GET http://localhost:4010/rest/currentUser -H "x-apikey: accesskey=abc123; secretkey=def456"
  Note: The `accesskey` and `secretkey` in the curl command can be any string.
```
✅ Get Scan Results
```bash
  > curl -G http://localhost:4010/rest/scanResult --data-urlencode "fields=name,description" --data-urlencode "startTime=2024-01-01" --data-urlencode "endTime=2024-02-01" -H "x-apikey: accesskey=abc123; secretkey=def456"
```
✅ Download Scan Result (binary response)
```bash
  > curl -X POST "http://localhost:4010/rest/scanResult/1234/download?downloadType=v2" \
      -H "x-apikey: accesskey=abc123; secretkey=def456" \
      --output result.zip
```
Note: This will return mocked binary content (e.g. a placeholder).