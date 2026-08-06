# Dummy Travel MCP API

An MCP server with mock flight search data, available over either standard input/output (for local MCP clients) or Streamable HTTP (for remote clients).

## Run locally

```sh
npm install
npm test
npm start
```

The default transport is HTTP at `http://localhost:3000/mcp`. To use standard input/output instead:

```sh
TRANSPORT=stdio npm start
```

## Call the HTTP endpoint

```sh
curl -i http://localhost:3000/health
```

MCP clients connect to `http://localhost:3000/mcp`.

Available tools: `search_flights`, `search_hotels`, `get_recommendations`, `start_trip`, `add_to_trip`, `get_trip`, and `create_mock_booking`.

`start_trip`, `add_to_trip`, and `get_trip` keep a trip draft in the running server process for multi-turn planning. `create_mock_booking` accepts only an explicit `CONFIRM` value and returns a fake booking; no purchase, reservation, or payment is ever made.

## Make it available to ChatGPT

ChatGPT requires a publicly reachable **HTTPS** MCP endpoint; `localhost` alone is not connectable. Deploy this app to a host such as Render, Railway, Fly.io, or Cloud Run, set `PORT` if the host provides it, and use `https://YOUR-DOMAIN/mcp` as the server URL when creating a ChatGPT connector/app. If the selected ChatGPT setup requires OAuth, add an OAuth provider in front of this server or use the platform's supported no-auth/developer connection flow for testing.

Do not expose this demo publicly with any real booking/payment actions or secrets. All data and bookings in this server are mock-only.
