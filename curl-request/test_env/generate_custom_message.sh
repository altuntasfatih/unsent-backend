curl -X POST "https://altuntasfatih.app.n8n.cloud/webhook-test/generate-custom-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: 2f71a653-2d5c-4ce1-a231-f71e56c9bb77" \
  -H "device_id: 1234567890" \
  -d @- <<EOF
{
  "tone": "calm and respectful",
  "context": "Breaking up after a few months of dating",
  "rawMessage": "I don't think this is working. I'm not happy anymore.",
  "user_id": "1554d885-2eb0-4e39-8beb-79659d0682b7"
}
EOF