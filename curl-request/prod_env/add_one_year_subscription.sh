curl -X POST "https://altuntasfatih.app.n8n.cloud/webhook/add-subscription" \
  -H "Content-Type: application/json" \
  -H "Authorization: 2f71a653-2d5c-4ce1-a231-f71e56c9bb77" \
  -H "device_id: 1234567890" \
  -d @- <<EOF
{
  "user_id": "another_user",
  "product": "one_year_subscription",
  "platform": "ios",
  "price": 19.99,
  "currency": "USD"
}
EOF
