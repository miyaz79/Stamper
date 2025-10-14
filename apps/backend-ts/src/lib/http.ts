import type { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

const jsonHeaders = {
  "content-type": "application/json"
};

export function jsonResponse(
  statusCode: number,
  body: Record<string, unknown>
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body)
  };
}

export function noContentResponse(): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 204,
    headers: {}
  };
}
