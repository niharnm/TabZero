export function apiHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: apiHeaders(),
  });
}
