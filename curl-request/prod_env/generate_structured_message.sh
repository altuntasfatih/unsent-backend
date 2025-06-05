curl -X POST "https://altuntasfatih.app.n8n.cloud/webhook/generate-structured-message" \
  -H "Content-Type: application/json" \
  -H "Authorization: 2f71a653-2d5c-4ce1-a231-f71e56c9bb77" \
  -H "device_id: 1234567890" \
  -d @- <<EOF
{
  "recipient" : "Allison",
  "messageType" : "Breakup",
  "additionalNotes" : "fuck you allison",
  "user_id": "1554d885-2eb0-4e39-8beb-79659d0682b7",
  "wordSize": 100,
  "answers" : [
    {
      "question" : "What first attracted you to this person?",
      "selectedOption" : "Their personality",
      "customInput" : ""
    },
    {
      "selectedOption" : "They hurt me / broke my trust",
      "question" : "What were the main reasons for the breakup?",
      "customInput" : ""
    },
    {
      "customInput" : "Happiness",
      "selectedOption" : "Other",
      "question" : "What do you still feel toward them?"
    },
    {
      "question" : "What do you want to say in your closure message?",
      "selectedOption" : "I forgive you",
      "customInput" : ""
    },
    {
      "customInput" : "",
      "question" : "What tone do you want your closure message to have?",
      "selectedOption" : ""
    }
  ]
}
EOF