curl -X POST "https://unsent-backend-lyart.vercel.app/api/generate-custom-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: 2f71a653-2d5c-4ce1-a231-f71e56c9bb77" \
  -d @- <<EOF
{
  "tone": "calm and respectful",
  "context": "Breaking up after a few months of dating",
  "rawMessage": "I don't think this is working. I'm not happy anymore.",
  "user_id": "test_user"
}
EOF